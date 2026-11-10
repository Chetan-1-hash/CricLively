import type { BattingStyle, BowlingStyle, PlayingRole } from "./Player";

export class LoginRequest {
  email!: string;
  password!: string;

  constructor(init?: Partial<LoginRequest>) {
    Object.assign(this, init);
  }
}

export interface PlayerRegisterRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string; // "yyyy-MM-dd" format as expected by backend
  email: string;
  mobileNumber: string;
  password: string; // this will be sent but never stored/displayed on frontend
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

export class ProfileList {
  id!: string;
  mobileNumber!: string;
  firstName!: string;
  middleName?: string;
  lastName!: string;
  role?: string[]; // PLAYER, ORGANIZER

  constructor(init?: Partial<ProfileList>) {
    Object.assign(this, init);
  }
}

export class TeamsList {
  id!: string;
  tournamentId!: string;
  teamName!: string;
  squadPlayerIds!:string[];

  constructor(init?: Partial<TeamsList>) {
    Object.assign(this, init);
  }
}

export class Team {
  id?: string;
  tournamentId!: string;
  teamName!: string;
  logoImage!: File;
  captainId!: string;
  squadPlayerIds! : string[];

  constructor(init?: Partial<Team>) {
    Object.assign(this, init);
  }
}

export class TournamentList {
  id!: string;
  name!: string;

  constructor(init?: Partial<TournamentList>) {
    Object.assign(this, init);
  }
}

export class AddTournamentRequest {
  name!: string;
  coverImage!: File;
  organizerIds!: string[];
  format!: string;
  startDate!: string;
  endDate!: string;
  venue!: string;

  constructor(init?: Partial<AddTournamentRequest>) {
    Object.assign(this, init);
  }
}

export class Gallery {
  imageId!: string;
  fileName!: string;
  year!: number;
}
