import type { CreateEventWithLocationInput } from "./types";

export async function createEventRequest(
  payload: CreateEventWithLocationInput,
) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    //console.error("Non-JSON response:", text);
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(data?.message || "Failed to create event");
  }

  return data;
}
