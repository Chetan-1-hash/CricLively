import { API_URL } from "./client";
import type { AddMatchDTO, MatchResponse } from "../components/data/MatchEntity";

export async function getAllMatches(): Promise<MatchResponse[]> {
    const response = await fetch(`${API_URL}/matches`, {
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
    const response = await fetch(`${API_URL}/matches/${tournamentId}`, {
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
    const response = await fetch(`${API_URL}/matches`,{
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(addMatch)
    })

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "Failed to create match");
    }
    return response.json();
}
