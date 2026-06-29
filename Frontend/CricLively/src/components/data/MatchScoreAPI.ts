// MatchScoreAPI.ts
// Dummy stubs — same call shape as your TournamentAPI.ts.
// Replace the bodies with real axios/fetch calls to your Spring Boot endpoints.

import type { MatchScoreState } from "./MatchScoringTypes";


export async function fetchMatchScore(matchId: string): Promise<MatchScoreState> {
  // TODO: replace with real GET /api/matches/{matchId}/score
  console.log("[dummy] fetchMatchScore called for", matchId);
  return Promise.resolve(getMockInitialState(matchId));
}

export async function pushBallEvent(matchId: string, state: MatchScoreState): Promise<void> {
  // TODO: replace with real POST /api/matches/{matchId}/score
  console.log("[dummy] pushBallEvent — would sync this state to backend:", matchId, state);
  return Promise.resolve();
}

export async function fetchPlayersForTeam(teamName: string): Promise<{ id: string; name: string }[]> {
  // TODO: replace with real GET /api/teams/{teamName}/players
  console.log("[dummy] fetchPlayersForTeam called for", teamName);
  const mock: Record<string, { id: string; name: string }[]> = {
    "Australia-A": [
      { id: "a1", name: "Travis Head" },
      { id: "a2", name: "Marcus Harris" },
      { id: "a3", name: "Cameron Green" },
      { id: "a4", name: "Mitchell Marsh" },
      { id: "a5", name: "Josh Inglis" },
    ],
    "England-A": [
      { id: "b1", name: "Ben Duckett" },
      { id: "b2", name: "Zak Crawley" },
      { id: "b3", name: "Ollie Pope" },
      { id: "b4", name: "Harry Brook" },
      { id: "b5", name: "Josh Tongue" },
    ],
  };
  return Promise.resolve(mock[teamName] ?? []);
}

export function getMockInitialState(matchId: string): MatchScoreState {
  return {
    matchId,
    teamAName: "Australia-A",
    teamBName: "England-A",
    maxOvers: 20,
    status: "LIVE",
    currentInningsIndex: 0,
    innings: [
      {
        battingTeam: "Australia-A",
        bowlingTeam: "England-A",
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        ballsInCurrentOver: 0,
        currentOverNumber: 1,
        batsmen: {
          a1: { playerId: "a1", name: "Travis Head", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true },
          a2: { playerId: "a2", name: "Marcus Harris", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false },
        },
        bowlers: {
          b5: { playerId: "b5", name: "Josh Tongue", overs: 0, ballsThisOver: 0, maidens: 0, runsConceded: 0, wickets: 0 },
        },
        battingOrder: ["a1", "a2"],
        strikerId: "a1",
        nonStrikerId: "a2",
        currentBowlerId: "b5",
        balls: [],
        isComplete: false,
      },
    ],
  };
}