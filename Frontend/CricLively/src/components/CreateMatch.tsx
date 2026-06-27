import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import TournamentListAPI from "../API/TournamentAPI";
import { toast } from "../hooks/use-toast";
import type { TournamentResponse } from "./data/TournamentEntity";
import { TeamsListAPI } from "../API/TeamsAPI";
import type { TeamsList } from "./data/DTO";
import { addMatch } from "../API/MatchApi";
import { AddMatchDTO, type MatchType } from "./data/MatchEntity";

export default function CreateMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const tournamentId = location.state;
  const [tournamentName, setTournamentName] = useState("");
  const [matchDTO, setMatchDTO] = useState<AddMatchDTO>({
    teamAId: "",
    teamBId: "",
    matchId: "",
    tournamentId: tournamentId.tournamentId ?? "",
    venue: "",
    date: "",
    time: "",
    matchtype: undefined as unknown as MatchType,
  });
  const [teamList, setTeamList] = useState<TeamsList[]>([]);

  const matchTypes = [
    "LEAGUE",
    "GROUP",
    "ROUND_ROBIN",

    "PRE_QUARTER_FINAL",
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "ELIMINATOR",
    "QUALIFIER",
    "PLAYOFF",

    "THIRD_PLACE",
    "FINAL",
    "GRAND_FINAL",

    "DECIDER",
    "SUPER_OVER",
    "REPLAY",

    "FRIENDLY",
    "EXHIBITION",
    "PRACTICE",
    "WARM_UP",
  ];

  const formatLabel = (value: string) => {
    return value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    fetchTournamentName();
    checkTeamAvailiability();
  }, []);

  const fetchTournamentName = async () => {
    try {
      const resp: TournamentResponse[] = await TournamentListAPI();
      const filteredTournament = resp.find(
        (t) => String(t.id) === tournamentId.tournamentId
      );
      if (filteredTournament) {
        setTournamentName(filteredTournament.name);
        setMatchDTO((t) => ({ ...t, venue: filteredTournament.venue }));
      } else {
        toast({
          title: "Tournament Not Found!",
          variant: "destructive",
          description: "Invalid tournament data",
        });
      }
    } catch (error: any) {
      toast({
        title: "Tournament Name Error!",
        variant: "destructive",
        description: "Error while fetching name.",
      });
    }
  };

  const checkTeamAvailiability = async () => {
    const response = await TeamsListAPI();
    const id = tournamentId?.tournamentId;
    const filterTeams = response.filter((t) => t.tournamentId === id);
    setTeamList(filterTeams);
  };

  const addNewMatch = async () => {
    try {
      const response = await addMatch(matchDTO);

      toast({
        title: "Match created successfully",
        description: "The match has been added.",
      });
      setTimeout(() => {
        navigate("/matchesDashboard");
      }, 2000);
      return response;
    } catch (e: unknown) {
      const err = e as any;

      console.error("Add match failed:", err?.response?.data || err);

      toast({
        title: "Failed to create match",
        description: err?.response?.data || "Failed",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-28 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-center mb-10">Create Match</h1>

          {/* FORM */}
          <div className="space-y-6">
            {/* TOURNAMENT */}
            <input
              disabled={tournamentName.trim() !== ""}
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
            />

            {/* TEAMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={matchDTO?.teamAId}
                onChange={(e) =>
                  setMatchDTO((t) => ({ ...t, teamAId: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="">Select Team 1</option>

                {teamList.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                    disabled={team.id === matchDTO?.teamBId}
                  >
                    {team.teamName}
                  </option>
                ))}
              </select>
              <select
                value={matchDTO?.teamBId}
                onChange={(e) =>
                  setMatchDTO((t) => ({ ...t, teamBId: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="">Select Team 2</option>

                {teamList.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                    disabled={team.id === matchDTO?.teamAId}
                  >
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE & TIME */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={matchDTO?.date}
                onChange={(e) =>
                  setMatchDTO((t) => ({ ...t, date: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />

              <input
                type="time"
                value={matchDTO?.time}
                onChange={(e) =>
                  setMatchDTO((t) => ({ ...t, time: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />
            </div>

            {/* VENUE & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                disabled
                placeholder="Venue"
                value={matchDTO?.venue}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />

              <select
                value={matchDTO.matchtype ?? ""}
                onChange={(e) =>
                  setMatchDTO((t) => ({
                    ...t,
                    matchtype: e.target.value as MatchType,
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="" disabled>
                  Match Type
                </option>

                {matchTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SUBMIT */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full mt-10 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg"
            onClick={addNewMatch}
          >
            Create Match
          </motion.button>
        </motion.div>
      </section>
    </>
  );
}
