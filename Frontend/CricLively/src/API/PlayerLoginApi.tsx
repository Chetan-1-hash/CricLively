import type { LoginRequest } from "../components/data/DTO";


export async function playerLogin(request : LoginRequest): Promise<any>{
    const response = await fetch("http://localhost:8080/profile/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(request),
        credentials: "include",
    });

    if(!response.ok){
        const text = await response.json();
        throw new Error(text.message || "Login Failed!");
    }

    return await response.json();
}