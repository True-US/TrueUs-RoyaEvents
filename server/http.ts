import { NextResponse } from "next/server";

/**
 * Helper function to parse a route [id] param.
 * @param raw The raw string to parse.
 * @returns The parsed number if it is a positive integer, otherwise null.
 */
export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id: number = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Helper function to parse a route [id] param as a UUID.
 * @param raw The raw string to parse.
 * @returns The parsed UUID string if it is valid, otherwise null.
 */
export function parseUuid(raw: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(raw) ? raw : null;
}

//---------- Http response helpers-------------

/**
 * Helper function to return a 400 Bad Request response with a JSON error message.
 * @param message The error message to include in the response.
 * @returns A NextResponse object with a 400 status and the error message in JSON format.
 */
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Helper function to return a 404 Not Found response with a JSON error message.
 * @param message The error message to include in the response. Defaults to "Not found."
 * @returns A NextResponse object with a 404 status and the error message in JSON format.
 */
export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Helper function to return a 409 Conflict response with a JSON error message.
 * @param message The error message to include in the response.
 * @returns A NextResponse object with a 409 status and the error message in JSON format.
 */
export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

/**
 * Helper function to return a 500 Internal Server Error response with a JSON error message.
 * @param message The error message to include in the response. Defaults to "Internal server error."
 * @returns A NextResponse object with a 500 status and the error message in JSON format.
 */
export function internalServerError(message = "Internal server error.") {
  return NextResponse.json({ error: message }, { status: 500 });
}