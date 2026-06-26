import type { AddTournamentRequest } from "../components/data/DTO";
import type { TournamentResponse } from "../components/data/TournamentEntity";

export async function AddTournamentAPI(tournament: AddTournamentRequest) {
  const formData = new FormData();

  // Wrap the tournament data (except coverImage) in a JSON Blob
  formData.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          name: tournament.name,
          format: tournament.format,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          venue: tournament.venue,
          organizerIds: tournament.organizerIds,
        }),
      ],
      { type: "application/json" }
    )
  );

  // Append coverImage if it exists
  if (tournament.coverImage) {
    formData.append("coverImage", tournament.coverImage);
  }

  const resp = await fetch("http://localhost:8080/tournaments", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || "Failed to create tournament");
  }

  return resp.json(); // ✅ assumes backend returns valid JSON
}


export default async function TournamentListAPI(): Promise<TournamentResponse[]> {
  const resp = await fetch("http://localhost:8080/tournaments",{
    method:"GET",
    credentials:"include",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!resp.ok) {
    throw new Error("Failed to fetch tournaments");
  }

  // Parse the tournaments JSON
  const tournaments: TournamentResponse[] = JSON.parse(await resp.text());

  // Map each tournament to include the full image URL
  const tournamentsWithImageUrl = tournaments.map(t => ({
    ...t,
    coverImage: `http://localhost:8080/images/${t.coverImage}`
  }));

  return tournamentsWithImageUrl;
}

export async function ExistByVenueAPI(): Promise<string[]>{
  const response = await fetch(`http://localhost:8080/tournaments/venue-exists`,{
    method: "GET",
    credentials: "include"
  })

  if(!response.ok){
    throw new Error("Failed to verify venue");
  }

  return await response.json();
}