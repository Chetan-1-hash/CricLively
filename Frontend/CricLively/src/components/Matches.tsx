import { canOrganize } from "../lib/auth";
import { openScoreboard, openScorer } from "../lib/matchAccess";
import ScorerAccessDialog from "./ScorerAccessDialog";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MatchResponse } from "./data/MatchEntity";
import { getAllMatches } from "../API/MatchApi";

// Sample match data with status

type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED" | "ABANDONED";

export default function Matches() {
  const navigate = useNavigate();
  const organizer = canOrganize(); // only organizers/admins see the create menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accessMatchId, setAccessMatchId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus>("UPCOMING");

  useEffect(() => {
    loadAllMatches();
  },[]);

  const loadAllMatches = async () => {
    try {
      const data = await getAllMatches();
      setMatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (action === "New Tournament") navigate("/showTournaments/createTournament");
    if (action === "New Match") navigate("/matchesDashboard/createMatch");
  };

  // Filter matches based on selected button
  const filteredMatches = matches.filter(
    (match) => match.matchStatus === selectedStatus
  );

  return (
    <>
      <Navbar />
      {accessMatchId && (
        <ScorerAccessDialog
          matchId={accessMatchId}
          onClose={() => {
            setAccessMatchId(null);
            loadAllMatches();
          }}
        />
      )}
      <section className="min-h-[100vh] py-12 bg-background/80">
        <div className="container my-12 mx-auto px-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold text-foreground"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Matches
            </motion.h1>

            {/* + Button */}
            {organizer && (
            <div className="relative">
              <motion.button
                onClick={handleDropdownToggle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white text-2xl font-bold shadow-lg hover:bg-red-700"
              >
                +
              </motion.button>

              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-40 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl z-50"
                >
                  {["New Tournament", "New Match"].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleActionClick(item)}
                      className="w-full text-left px-4 py-3 hover:bg-red-600 hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            )}
          </div>

          {/* Status Buttons */}
          <div className="flex gap-4 mb-10">
            {(
              ["LIVE", "UPCOMING", "FINISHED", "ABANDONED"] as MatchStatus[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedStatus === status
                    ? "bg-red-600 text-white"
                    : "bg-red-600/20 text-red-600 hover:bg-red-600 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Match Cards */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatches.map((match) => (
              <motion.div
                key={match.matchId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:scale-105 transition-transform"
              >
                <span
                  className={`inline-block mb-3 px-3 py-1 text-xs font-bold rounded-full ${
                    match.matchStatus === "LIVE"
                      ? "bg-red-600 text-white"
                      : match.matchStatus === "UPCOMING"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {match.matchStatus}
                </span>

                <h2 className="text-xl font-bold text-foreground mb-2">
                  {match.teamAName} Vs {match.teamBName}
                </h2>
                <p className="text-sm text-foreground/70">Date: {match.date}</p>
                <p className="text-sm text-foreground/70">Time: {match.time}</p>
                <p className="text-sm text-foreground/70">
                  Venue: {match.venue}
                </p>

                <div className="mt-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openScoreboard(match, navigate)}
                    className="flex-1 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold"
                  >
                    Scoreboard
                  </motion.button>

                  {/* only people who may score THIS match see it */}
                  {match.canScore && (match.matchStatus === "LIVE" || match.matchStatus === "UPCOMING") && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openScorer(match, navigate)}
                      className="flex-1 py-2.5 border-2 border-foreground/30 text-foreground rounded-full font-semibold"
                    >
                      {match.matchStatus === "UPCOMING" ? "Start Scoring" : "Score"}
                    </motion.button>
                  )}
                </div>

                {match.canManage && (match.matchStatus === "LIVE" || match.matchStatus === "UPCOMING") && (
                  <button
                    onClick={() => setAccessMatchId(match.matchId)}
                    className="mt-3 w-full text-xs font-semibold text-foreground/70 hover:text-foreground underline"
                  >
                    Scoring access
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
