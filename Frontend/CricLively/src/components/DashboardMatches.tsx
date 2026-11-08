import { canOrganize } from "../lib/auth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import MatchCard from "../components/MatchCard";
import { useLocation, useNavigate } from "react-router-dom";
import { MatchResponse } from "./data/MatchEntity";
import { getTournamentMatches } from "../API/MatchApi";


export default function DashboardMatches() {
  const location = useLocation();
  const tournamentDetails = location.state?.tournament;

  const navigate = useNavigate();
  const organizer = canOrganize(); // only organizers/admins see the create menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [activeTab, setActiveTab] = useState<
    "matches" | "points" | "leaderboard"
  >("matches");

  const [matchFilter, setMatchFilter] = useState<
    "LIVE" | "UPCOMING" | "FINISHED" | "ABANDONED"
  >("LIVE");

  useEffect(() => {
    if (!tournamentDetails) return;
    loadAllMatches();
  }, [tournamentDetails]);

  const loadAllMatches = async () => {
    try {
      const data = await getTournamentMatches(tournamentDetails.id);
      setMatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMatches = matches.filter(
    (m) => m.tournamentId === tournamentDetails.id && m.matchStatus === matchFilter
);

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (action === "New Match") {
      navigate(`/matchesDashboard/createMatch`, {
        state: {
          tournamentId: tournamentDetails.id,
        },
      });
    } else if (action === "New Team") {
      navigate(`/matchesDashboard/createTeam`, {
        state: {
          tournamentId: tournamentDetails.id,
        },
      });
    }
  };
  

  return (
    <>
      <Navbar />

      <section className="min-h-[100vh] relative py-20 bg-background/80">
        {/* COVER SECTION */}
        <section className="h-[30vh] relative">
          <img
            src={tournamentDetails.coverImage}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {tournamentDetails.name}
            </h1>
          </div>
          {/* + Button */}
          {organizer && (
          <div className="absolute top-4 right-8 z-50">
            <motion.button
              onClick={handleDropdownToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white text-2xl font-bold shadow-lg hover:bg-red-700 transition-colors"
            >
              +
            </motion.button>

            {/* Dropdown */}
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-40 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
              >
                {["New Match", "New Team"].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleActionClick(item)}
                    className="w-full text-left px-4 py-3 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          )}
        </section>

        {/* DASHBOARD */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          {/* TOP TABS */}
          <div className="flex gap-3 mb-8">
            {["matches", "points", "leaderboard"].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground"
                }`}
              >
                {tab === "matches"
                  ? "Matches"
                  : tab === "points"
                  ? "Points Table"
                  : "Leaderboard"}
              </motion.button>
            ))}
          </div>

          {/* CONTENT */}
          <AnimatePresence mode="wait">
            {/* MATCHES */}
            {activeTab === "matches" && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* MATCH FILTER */}
                <div className="flex gap-3 mb-8">
                  {["LIVE" , "FINISHED" , "ABANDONED" , "UPCOMING"].map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMatchFilter(status as any)}
                      className={`px-5 py-2 rounded-full text-sm font-semibold ${
                        matchFilter === status
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/60 text-foreground"
                      }`}
                    >
                      {status.toUpperCase()}
                    </motion.button>
                  ))}
                </div>

                {/* MATCH CARDS */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match, index) => (
                     <MatchCard
                        key={match.matchId}
                        index={index}
                        team1={match.teamAName}
                        team2={match.teamBName}
                        team1Score={
                            match.firstInnings
                                ? `${match.firstInnings.runs}/${match.firstInnings.wickets} (${match.firstInnings.overs})`
                                : ""
                        }
                        team2Score={
                            match.secondInnings
                                ? `${match.secondInnings.runs}/${match.secondInnings.wickets} (${match.secondInnings.overs})`
                                : ""
                        }
                        status={match.matchStatus}
                        time={`${match.date} ${match.time}`}
                        venue={match.venue}
                    />
                    ))
                  ) : (
                    <div className="col-span-full flex justify-center items-center py-20">
                      <div className="text-center bg-card/70 backdrop-blur-xl px-8 py-10 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-2">
                          Matches will appear here
                        </h3>
                        <p className="text-foreground/60">Very soon.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* POINTS TABLE */}
            {activeTab === "points" && (
              <motion.div
                key="points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/80 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold mb-4">Points Table</h2>
                <p className="text-foreground/70">
                  Points table will appear here.
                </p>
              </motion.div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/80 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
                <p className="text-foreground/70">
                  Player stats & rankings will appear here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </section>
    </>
  );
}
