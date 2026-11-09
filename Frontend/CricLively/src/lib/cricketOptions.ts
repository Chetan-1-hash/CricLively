import type { BattingStyle, BowlingStyle, PlayingRole } from "../components/data/Player";

// The values must match the Java enums exactly (BattingStyle, BowlingStyle, PlayingRole).
export const BATTING_STYLES: { value: BattingStyle; label: string }[] = [
  { value: "Right_Hand", label: "Right Hand" },
  { value: "Left_Hand", label: "Left Hand" },
];

export const BOWLING_STYLES: { value: BowlingStyle; label: string }[] = [
  { value: "Right_ArmFast", label: "Right Arm Fast" },
  { value: "Right_ArmFastMedium", label: "Right Arm Fast Medium" },
  { value: "Right_ArmMediumFast", label: "Right Arm Medium Fast" },
  { value: "Right_ArmMedium", label: "Right Arm Medium" },
  { value: "Right_ArmSlow", label: "Right Arm Slow" },
  { value: "Right_ArmSlowMedium", label: "Right Arm Slow Medium" },
  { value: "Left_ArmFast", label: "Left Arm Fast" },
  { value: "Left_ArmFastMedium", label: "Left Arm Fast Medium" },
  { value: "Left_ArmMediumFast", label: "Left Arm Medium Fast" },
  { value: "Left_ArmMedium", label: "Left Arm Medium" },
  { value: "Left_ArmSlow", label: "Left Arm Slow" },
  { value: "Left_ArmSlowMedium", label: "Left Arm Slow Medium" },
  { value: "Right_ArmOffBreak", label: "Right Arm Off Break" },
  { value: "Right_ArmLegBreak", label: "Right Arm Leg Break" },
  { value: "Left_ArmOffBreak", label: "Left Arm Off Break" },
  { value: "Left_ArmLegBreak", label: "Left Arm Leg Break" },
  { value: "Googly", label: "Googly" },
  { value: "Orthodox", label: "Orthodox" },
  { value: "Unorthodox", label: "Unorthodox" },
];

export const PLAYING_ROLES: { value: PlayingRole; label: string }[] = [
  { value: "Batting", label: "Batsman" },
  { value: "Bowling", label: "Bowler" },
  { value: "Batting_Allrounder", label: "Batting All-Rounder" },
  { value: "Bowling_Allrounder", label: "Bowling All-Rounder" },
  { value: "Allrounder", label: "All-Rounder" },
  { value: "WicketKeeper_Batter", label: "Wicket Keeper Batter" },
];
