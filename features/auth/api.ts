import type { SignupRequest, SignupResponse } from "./types";

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(request),
  });

  const data: SignupResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to create account");
  }

  return data;
}
