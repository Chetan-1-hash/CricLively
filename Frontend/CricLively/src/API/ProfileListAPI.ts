import type { ProfileList } from "../components/data/DTO";


export async function ProfileListAPI(): Promise<ProfileList[]> {
    const resp = await fetch("http://localhost:8080/profile/getProfileList",{
        credentials:"include",
        method:"GET"
    });

    if(!resp.ok){
        const text = await resp.text();
        throw new Error(text || "Failed to fetch!");
    }

    return await resp.json();
}
