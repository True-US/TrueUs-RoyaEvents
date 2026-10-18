import { Prisma, type Location } from "@/generated/prisma/client";
import { prisma } from "@/lib/supabase/prisma";
import type { LocationInput } from "@/types/models";

//---------- Validation -------------

type ParseResult =
  | { data: LocationInput; error?: never }
  | { data?: never; error: string };

// Max lengths match the @db.VarChar sizes in prisma/schema.prisma.
const REQUIRED_FIELDS = {
  name: 200,
  city: 100,
  province: 100,
  country: 100,
} as const;

const OPTIONAL_FIELDS = {
  address: 255,
  postalCode: 20,
} as const;

/**
 * Validates a request body for creating or updating a location.
 * @param body The parsed JSON request body.
 * @param options.partial When true (PATCH), required fields may be omitted.
 * @returns The cleaned input data, or an error message.
 */
export function parseLocationInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const input = body as Record<string, unknown>;
  const data: LocationInput = {};

  for (const [field, maxLength] of Object.entries(REQUIRED_FIELDS)) {
    const value = input[field];
    if (value === undefined) {
      if (partial) continue;
      return { error: `${field} is required.` };
    }
    if (typeof value !== "string" || value.trim() === "") {
      return { error: `${field} must be a non-empty string.` };
    }
    if (value.trim().length > maxLength) {
      return { error: `${field} must be at most ${maxLength} characters.` };
    }
    data[field as keyof typeof REQUIRED_FIELDS] = value.trim();
  }

  for (const [field, maxLength] of Object.entries(OPTIONAL_FIELDS)) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null || (typeof value === "string" && value.trim() === "")) {
      data[field as keyof typeof OPTIONAL_FIELDS] = null;
      continue;
    }
    if (typeof value !== "string") {
      return { error: `${field} must be a string or null.` };
    }
    if (value.trim().length > maxLength) {
      return { error: `${field} must be at most ${maxLength} characters.` };
    }
    data[field as keyof typeof OPTIONAL_FIELDS] = value.trim();
  }

  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") {
      return { error: "isActive must be a boolean." };
    }
    data.isActive = input.isActive;
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: "No valid fields to update." };
  }

  return { data };
}

//---------- Queries -------------

/**
 * Lists locations ordered by name.
 * @param options.includeInactive When true, soft-deleted locations are included.
 */
export function listLocations({
  includeInactive = false,
}: { includeInactive?: boolean } = {}): Promise<Location[]> {
  return prisma.location.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Gets a single location by id.
 * @returns The location, or null if it does not exist.
 */
export function getLocation(id: number): Promise<Location | null> {
  return prisma.location.findUnique({ where: { id } });
}

/**
 * Creates a location. Expects input already validated by parseLocationInput.
 */
export function createLocation(
  data: Prisma.LocationCreateInput,
): Promise<Location> {
  return prisma.location.create({ data });
}

/**
 * Updates a location.
 * @returns The updated location, or null if it does not exist.
 */
export async function updateLocation(
  id: number,
  data: Prisma.LocationUpdateInput,
): Promise<Location | null> {
  try {
    return await prisma.location.update({ where: { id }, data });
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

/**
 * Soft-deletes a location by setting isActive to false.
 * Hard delete is avoided because EventAdventure rows reference locations.
 * @returns The deactivated location, or null if it does not exist.
 */
export function deactivateLocation(id: number): Promise<Location | null> {
  return updateLocation(id, { isActive: false });
}

// P2025: the record targeted by update/delete does not exist.
function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}
