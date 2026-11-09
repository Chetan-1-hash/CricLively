import { API_URL } from "./client";
import type { ProfileList } from "../components/data/DTO";


export async function ProfileListAPI(): Promise<ProfileList[]> {
    const resp = await fetch(`${API_URL}/profile/getProfileList`,{
        credentials:"include",
        method:"GET"
    });


    if(!resp.ok){
        const text = await resp.text();

        throw new Error(text || "Failed to fetch!");    
    }

    return await resp.json();
}   