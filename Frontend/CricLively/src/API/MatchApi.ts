import type { AddMatchDTO, MatchResponse } from "../components/data/MatchEntity";

export async function getAllMatches(): Promise<MatchResponse[]> {
    const response = await fetch(`http://localhost:8080/matches`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch matches");
    }

    const data = await response.json();
    return data;
}

export async function getTournamentMatches(tournamentId: string): Promise<MatchResponse[]> {
    const response = await fetch(`http://localhost:8080/matches/${tournamentId}`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch matches");
    }

    const data = await response.json();
    return data;
}

export async function addMatch(addMatch: AddMatchDTO):Promise<boolean>{
    const response = await fetch("http://localhost:8080/matches",{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(addMatch)
    })

    if (!response.ok) {
        throw new Error("Failed to create matches");
    }
    return response.json();
}
