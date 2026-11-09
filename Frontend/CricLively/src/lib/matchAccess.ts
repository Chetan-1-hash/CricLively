import type { NavigateFunction } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import { canOrganize } from "./auth";
import type { MatchStatus } from "../components/data/MatchEntity";

// The buttons are ALWAYS clickable. When the answer is "no", a toast tells the person WHY.
// (The server still checks every request, this is only the friendly message.)

interface MatchRef {
  matchId: string;
  matchStatus: MatchStatus;
}

export function openScoreboard(match: MatchRef, navigate: NavigateFunction) {
  if (match.matchStatus === "UPCOMING") {
    toast({
      title: "Scoreboard not available yet",
      description: "This match has not started. The scoreboard opens once scoring begins.",
    });
    return;
  }
  navigate(`/viewer/${match.matchId}`);
}

export function openScorer(match: MatchRef, navigate: NavigateFunction) {
  if (!canOrganize()) {
    toast({
      title: "You can't score this match",
      description: "Only organizers and admins can score matches.",
      variant: "destructive",
    });
    return;
  }
  if (match.matchStatus === "FINISHED" || match.matchStatus === "ABANDONED") {
    toast({
      title: "Scoring is closed",
      description: `This match is ${match.matchStatus.toLowerCase()}.`,
    });
    return;
  }
  navigate(`/scorer/${match.matchId}`);
}
