import type { TeamsList, Team } from "../components/data/DTO";

export async function TeamsListAPI(): Promise<TeamsList[]> {
    const resp = await fetch("http://localhost:8080/team/getTeamsList",{
        credentials:"include",
        method:"GET"
    });

    if(!resp.ok){
        const text = await resp.text();
        throw new Error(text || "Failed to fetch!");
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

    const resp = await fetch("http://localhost:8080/team/addTeam", {
        credentials:"include",
        method:"POST",
        body:formData
    });

    if(!resp.ok){
        const text = await resp.text();
        throw new Error(text || "Failed to fetch!");
    }

    return await resp.json();
} 
    