import type {
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "./types";

import type { AdminEvent } from "./types";

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Something went wrong.";

    throw new Error(message);
  }

  return data as T;
}

export async function getAdminEventsRequest(): Promise<{
  success: boolean;
  events: AdminEvent[];
}> {
  const res = await fetch("/api/events", {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<{
    success: boolean;
    events: AdminEvent[];
  }>(res);
}

type CreateEventResponse = {
  success: boolean;
  createdLocation?: unknown;
  createdEvent?: unknown;
  message?: string;
};

export async function createEventRequest(
  payload: CreateEventWithLocationInput,
): Promise<CreateEventResponse> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<CreateEventResponse>(res);
}

export async function updateEventRequest(
  payload: UpdateEventWithLocationInput,
) {
  const res = await fetch("/api/events", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res);
}

type DeleteEventResponse = {
  success: boolean;
  action: "deleted" | "deactivated";
  event?: unknown;
};

export async function deleteEventRequest(
  eventId: number,
): Promise<DeleteEventResponse> {
  const res = await fetch(`/api/events?id=${eventId}`, {
    method: "DELETE",
  });

  return parseResponse<DeleteEventResponse>(res);
}

export async function reactivateEventRequest(
  eventId: number,
) {
  const res = await fetch("/api/events", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "reactivate",
      id: eventId,
    }),
  });

  return parseResponse(res);
}

