export type BattingStyle = "Right_Hand" | "Left_Hand";
export type BowlingStyle =
    "Right_ArmFast"
  |  "Right_ArmFastMedium"
  |  "Right_ArmMediumFast"
  |  "Right_ArmMedium"
  |  "Right_ArmSlow"
  |  "Right_ArmSlowMedium"
  |  "Left_ArmFast"
  |  "Left_ArmFastMedium"
  |  "Left_ArmMediumFast"
  |  "Left_ArmMedium"
  |  "Left_ArmSlow"
  |  "Left_ArmSlowMedium"
  |  "Right_ArmOffBreak"
  |  "Right_ArmLegBreak"
  |  "Left_ArmOffBreak"
  |  "Left_ArmLegBreak"
  |  "Googly"
  |  "Orthodox"
  |  "Unorthodox";
export type PlayingRole = 
    "Batting"
    | "Bowling"
    | "Batting_Allrounder"
    | "Bowling_Allrounder"
    | "WicketKeeper_Batter"
    | "Allrounder";


export class CareerStats {
  matchesPlayed: number = 0;
  runsScored: number = 0;
  wicketsTaken: number = 0;

  constructor(init?: Partial<CareerStats>) {
    Object.assign(this, init);
  }
}

export class Player {
  id?: string;
  firstName: string = "";
  middleName?: string;
  lastName: string = "";
  dob: string = ""; // yyyy-MM-dd
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  playingRole?: PlayingRole;
  image?: string;
  careerStats: CareerStats = new CareerStats();
  cricketDetailsCompleted: boolean = false;

  constructor(init?: Partial<Player>) {
    Object.assign(this, init);
  }
}
