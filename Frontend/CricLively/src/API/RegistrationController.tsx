import type { PlayerRegisterRequest, PlayerRegisterResponse } from "../components/data/DTO";

export async function registerPlayer(payload: PlayerRegisterRequest): Promise<PlayerRegisterResponse> {
  const response = await fetch("http://localhost:8080/player/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include"
  });

  if (!response.ok) {
    let errorMessage = "Registration failed";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // fallback if response is not JSON
      const text = await response.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  
  return await response.json();
}

