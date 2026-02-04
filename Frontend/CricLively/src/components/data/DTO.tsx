import type { BattingStyle, BowlingStyle, PlayingRole } from "./Player";

export interface PlayerRegisterRequest {
  firstName: string;
  middleName?: string;    
  lastName: string;
  dob: string;            // "yyyy-MM-dd" format as expected by backend
  email: string;
  mobileNumber: string;
  password: string;       // this will be sent but never stored/displayed on frontend
}

export function parseFullName(fullName: string) {
  const parts = fullName.trim().split(" ");

  if (parts.length === 0) {
    return { firstName: "", middleName: undefined, lastName: "" };
  }

  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  const middleName =
    parts.length > 2 ? parts.slice(1, parts.length - 1).join(" ") : undefined;

  return { firstName, middleName, lastName };
}

export interface PlayerRegisterResponse {
  playerId: string;
  firstName: string;
  message: string;
}

export class PlayerCricketDetailsRequest {
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  playingRole?: PlayingRole;
  image?: File; // URL or base64 string for now

  constructor(init?: Partial<PlayerCricketDetailsRequest>) {
    Object.assign(this, init);
  }
}
