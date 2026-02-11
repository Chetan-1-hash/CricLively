import type { AddTournamentRequest } from "../components/data/DTO";

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
