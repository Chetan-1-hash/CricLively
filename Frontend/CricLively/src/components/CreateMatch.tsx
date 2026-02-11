import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useParams } from "react-router-dom";
import TournamentAPI from "../API/TournamentDashboardAPI";
import { toast } from "../hooks/use-toast";
import type { TournamentResponse } from "./data/TournamentEntity";

export default function CreateMatch() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournamentName, setTournamentName] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [venue, setVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchType, setMatchType] = useState("");

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

  const formatLabel = (value:string) => {
    return value
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  }
  


  useEffect(() => {
    fetchTournamentName();
  }, []);

  const fetchTournamentName = async () => {
    try {
      const resp: TournamentResponse[] = await TournamentAPI();
      const filteredTournament = resp.find(
        (t) => String(t.id) === tournamentId
      );
      if (filteredTournament) {
        setTournamentName(filteredTournament.name);
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
              disabled
              value={tournamentName}
              className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
            />

            {/* TEAMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Team 1"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />

              <input
                placeholder="Team 2"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />
            </div>

            {/* DATE & TIME */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />

              <input
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />
            </div>

            {/* VENUE & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
              />

              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
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
          >
            Create Match
          </motion.button>
        </motion.div>
      </section>
    </>
  );
}
