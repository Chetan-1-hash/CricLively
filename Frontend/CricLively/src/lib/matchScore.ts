import type { MatchResponse, InningsSummaryDTO } from "../components/data/MatchEntity";

const line = (i?: InningsSummaryDTO) => (i ? `${i.runs}/${i.wickets} (${i.overs})` : "");

/** "120/4 (15.2)" for each team, matched by the batting team name. Empty text = has not batted. */
export function minimalScores(m: MatchResponse): { teamA: string; teamB: string } {
  const all = [m.innings1, m.innings2].filter(Boolean) as InningsSummaryDTO[];
  const forTeam = (name: string) => line(all.find((i) => i.battingTeamName === name));
  return { teamA: forTeam(m.teamAName), teamB: forTeam(m.teamBName) };
}
