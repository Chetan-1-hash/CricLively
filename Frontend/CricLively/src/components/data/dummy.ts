import type { Match } from "../types";

export const matches: Match[] = [
  {
    id: 1,
    tournamentId: 101,
    team1: "India",
    team2: "Australia",
    status: "completed",
    venue: "Wankhede Stadium, Mumbai",
    scoreboard: {
      team1Runs: 278,
      team1Wickets: 6,
      team1Overs: 50,
      team2Runs: 255,
      team2Wickets: 10,
      team2Overs: 48.3,
    },
    scorecard: {
      matchResult: "India won by 23 runs",
      manOfTheMatch: "Virat Kohli",
      innings: [
        {
          teamName: "India",
          totalRuns: 278,
          wickets: 6,
          overs: 50,
          batting: [
            {
              playerName: "Rohit Sharma",
              runs: 45,
              balls: 52,
              fours: 5,
              sixes: 1,
              strikeRate: 86.5,
              dismissal: "Caught",
            },
            {
              playerName: "Virat Kohli",
              runs: 112,
              balls: 98,
              fours: 9,
              sixes: 2,
              strikeRate: 114.2,
              dismissal: "Not Out",
            },
          ],
          bowling: [
            {
              playerName: "Mitchell Starc",
              overs: 10,
              runs: 55,
              wickets: 2,
              economy: 5.5,
            },
          ],
        },
        {
          teamName: "Australia",
          totalRuns: 255,
          wickets: 10,
          overs: 48.3,
          batting: [
            {
              playerName: "David Warner",
              runs: 74,
              balls: 68,
              fours: 8,
              sixes: 1,
              strikeRate: 108.8,
              dismissal: "Bowled",
            },
          ],
          bowling: [
            {
              playerName: "Jasprit Bumrah",
              overs: 9.3,
              runs: 42,
              wickets: 4,
              economy: 4.4,
            },
          ],
        },
      ],
    },
  },

  {
    id: 2,
    tournamentId: 101,
    team1: "England",
    team2: "Pakistan",
    status: "live",
    venue: "Lords, London",
    scoreboard: {
      team1Runs: 182,
      team1Wickets: 3,
      team1Overs: 32.4,
      team2Runs: 0,
      team2Wickets: 0,
      team2Overs: 0,
    },
  },
];


// export const tournaments = [
//   {
//     id: 1,
//     name: "IPL 2026",
//     date: "Mar 15 - May 30",
//     teams: 10,
//     image: "ipl.png",
//   },
//   {
//     id: 2,
//     name: "Big Bash League",
//     date: "Dec 2025 - Jan 2026",
//     teams: 8,
//     image: "bbl.png",
//   },
//   {
//     id: 3,
//     name: "The Ashes",
//     date: "Jul 2026",
//     teams: 2,
//     image: "ashes.png",
//   },
//   {
//     id: 4,
//     name: "World Cup 2026",
//     date: "Feb 2026 - Mar 2026",
//     teams: 16,
//     image: "worldcup26.png",
//   },
// ];