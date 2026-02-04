import type { PlayerCricketDetailsRequest, PlayerRegisterResponse } from "../components/data/DTO";

export async function addCricketDetails(playerId: string, payload: PlayerCricketDetailsRequest) : Promise<PlayerRegisterResponse>{
    const formData = new FormData();
    formData.append(
        "data",
        new Blob(
            [JSON.stringify({
                battingStyle: payload.battingStyle,
                bowlingStyle: payload.bowlingStyle,
                playingRole: payload.playingRole,
            })],
            { type: "application/json"}
        )
    );

    console.log(payload.image);

    if(payload.image){
        formData.append("image", payload.image);
    }


    const response = await fetch(`http://localhost:8080/player/${playerId}/playerInfo`, {
        method: "PUT",
        body: formData,
        credentials: "include"
    });

    if(!response.ok){
        const text = await response.text();
        throw new Error(text || "Registration failed.");
    }

    const data : PlayerRegisterResponse = await response.json();
    return data;
}