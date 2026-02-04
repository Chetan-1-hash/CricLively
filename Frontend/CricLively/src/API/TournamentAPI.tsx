import type { TournamentResponse } from "../components/data/TournamentEntity";

export default async function TournamentAPI(): Promise<TournamentResponse[]> {
  const resp = await fetch("http://localhost:8080/tournaments");

  if (!resp.ok) {
    throw new Error("Failed to fetch tournaments");
  }

  // Parse the tournaments JSON
  const tournaments: TournamentResponse[] = await resp.json();

  // Map each tournament to include the full image URL
  const tournamentsWithImageUrl = tournaments.map(t => ({
    ...t,
    coverImage: `http://localhost:8080/images/${t.coverImage}`
  }));

  return tournamentsWithImageUrl;
}
