import type { LoginRequest } from "../components/data/LoginRequest";

export async function login(request : LoginRequest): Promise<any>{
    const response = await fetch("http://localhost:8080/profile/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(request),
        credentials: "include",
    });

    if(!response.ok){
        const text = await response.text();
        throw new Error(text || "Login Failed!");
    }

    return await response.json();
}