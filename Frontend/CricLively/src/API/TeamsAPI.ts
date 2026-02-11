import type { TeamsList } from "../components/data/DTO";

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
