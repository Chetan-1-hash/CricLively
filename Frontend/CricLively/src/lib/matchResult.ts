import type { MatchScoreState } from "../components/data/MatchScoringTypes";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "India won by 5 runs": once the 2nd innings is over (or the match is finished). */
export function describeResult(state: MatchScoreState): string | null {
  const [first, second] = state.innings;
  if (!first || !second) return null;
  if (state.status !== "FINISHED" && !second.isComplete) return null;

  if (second.totalRuns > first.totalRuns) {
    const left = Math.max((second.maxWickets ?? 10) - second.totalWickets, 0);
    return `${second.battingTeam} won by ${plural(left, "wicket")}`;
  }
  if (second.totalRuns < first.totalRuns) {
    return `${first.battingTeam} won by ${plural(first.totalRuns - second.totalRuns, "run")}`;
  }
  return "Match tied";
}
