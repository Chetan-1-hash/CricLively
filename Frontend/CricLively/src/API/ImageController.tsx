
export default async function ImageController(playerId: string): Promise<string | null> {
  try {
    if (!playerId) return null;

    const playerRes = await fetch(`http://localhost:8080/player/${playerId}`, {
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

    return `http://localhost:8080/images/${player.image}`;
  } catch (error) {
    console.error("ImageController error:", error);
    return null;
  }
}
