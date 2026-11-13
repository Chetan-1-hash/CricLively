import { API_URL } from "./client";
import type { TeamsList, Team } from "../components/data/DTO";

export async function TeamsListAPI(): Promise<TeamsList[]> {
    const resp = await fetch(`${API_URL}/team/getTeamsList`,{
        credentials:"include",
        method:"GET"
    });

    if(!resp.ok){
        const text = await resp.text();
        let message = text || "Failed to create team!";
        try {
            const parsed = JSON.parse(text);
            if (parsed?.message) message = parsed.message;
        } catch {
            // keep text fallback
        }
        throw new Error(message);
    }

    return await resp.json();
}

export async function addTeamAPI(team:Team) {
    const formData = new FormData;

    formData.append(
        "data",
        JSON.stringify({
            tournamentId: team.tournamentId,
            teamName:team.teamName,
            captainId: team.captainId,
            squadPlayerIds: team.squadPlayerIds
        })
    );

    if(team.logoImage){
        formData.append("logoImage", team.logoImage)
    }

    const resp = await fetch(`${API_URL}/team/addTeam`, {
        credentials:"include",
        method:"POST",
        body:formData
    });

    if(!resp.ok){
        const text = await resp.text();
        let message = text || "Failed to create team!";
        try {
            const parsed = JSON.parse(text);
            if (parsed?.message) message = parsed.message;
        } catch {
            // keep text fallback
        }
        throw new Error(message);
    }

    return await resp.json();
} 
    