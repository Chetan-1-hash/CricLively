import { API_URL } from "./client";

export default async function ImageController(playerId: string): Promise<string | null> {
  try {
    if (!playerId) return null;

    const playerRes = await fetch(`${API_URL}/player/${playerId}`, {
      method: "GET",
      // IMPORTANT: This must be present in EVERY request to protected routes
      credentials: "include", 
      headers: {
        "Accept": "application/json",
      },
    });
    if (!playerRes.ok) return null;

    const player = await playerRes.json();

    if (!player.image) return null;

    return `${API_URL}/images/${player.image}`;
  } catch (error) {
    console.error("ImageController error:", error);
    return null;
  }
}
