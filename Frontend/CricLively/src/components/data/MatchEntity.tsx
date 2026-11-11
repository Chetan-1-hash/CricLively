export type MatchStatus = "LIVE" | "FINISHED" | "ABANDONED" | "UPCOMING";

export type MatchType =
    // League / Group Stage
    "LEAGUE"|
    "GROUP"|
    "ROUND_ROBIN"|

    // Knockout / Playoffs
    "PRE_QUARTER_FINAL"|
    "QUARTER_FINAL"|
    "SEMI_FINAL"|
    "ELIMINATOR"|
    "QUALIFIER"|
    "PLAYOFF"|

    // Final Stages
    "THIRD_PLACE"|
    "FINAL"|
    "GRAND_FINAL"|

    // Special / Deciding Matches
    "DECIDER"|
    "SUPER_OVER"|
    "REPLAY"|

    // Non-competitive
    "FRIENDLY"|
    "EXHIBITION"|
    "PRACTICE"|
    "WARM_UP"
;

export class InningsSummaryDTO {
    battingTeamName!: string;
    runs!: number;
    wickets!: number;
    overs!: number;
    isCompleted!: boolean;
}



export class MatchResponse {
    matchId!: string;
    tournamentId?: string | null; // empty for a single match
    venue!: string;
    date!: string;
    time!: string;
    teamAName!: string;
    teamBName!: string;
    matchStatus!: MatchStatus;
    canScore?: boolean;  // may I score this match?
    canManage?: boolean; // may I give others scoring access?

    tournamentFinished?: boolean; // its tournament ended: no new scoring until extended
    resultText?: string | null;   // "X won by 5 runs"

    innings1?: InningsSummaryDTO;
    innings2?: InningsSummaryDTO;
}

export class AddMatchDTO {
    matchId?: string;
    tournamentId?: string; // optional: leave empty for a single match
    venue!: string;
    date!: string;
    time?: string;
    teamAId!: string;
    teamBId!: string;
    oversPerInnings!: number;
    matchType?: MatchType;
}
