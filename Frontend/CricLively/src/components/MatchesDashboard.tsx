import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import MatchCard from "../components/MatchCard";
import { useNavigate, useParams } from "react-router-dom";

/* ------------------ DUMMY DATA ------------------ */

const tournament = {
  name: "CricLively Premier League",
  coverImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
};

const matches = [
  {
    id: 1,
    team1: "Mumbai Indians",
    team2: "Chennai Super Kings",
    team1Score: "182/6 (20)",
    team2Score: "95/3 (10.2)",
    status: "live",
    venue: "Wankhede Stadium",
  },
  {
    id: 2,
    team1: "RCB",
    team2: "KKR",
    team1Score: "",
    team2Score: "",
    status: "upcoming",
    time: "Today • 7:30 PM",
    venue: "Chinnaswamy Stadium",
  },
  {
    id: 3,
    team1: "GT",
    team2: "LSG",
    team1Score: "168/8 (20)",
    team2Score: "170/4 (18.5)",
    status: "completed",
    venue: "Narendra Modi Stadium",
  },
];

/* ------------------------------------------------ */

export default function MatchDashboard() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "matches" | "points" | "leaderboard"
  >("matches");

  const [matchFilter, setMatchFilter] = useState<
    "live" | "upcoming" | "completed"
  >("live");

   useEffect(() => {
    if (!tournamentId) return;

    // Call API using tournamentId
    // fetchMatchesByTournament(tournamentId);
  }, [tournamentId]);


  const filteredMatches = matches.filter((m) => m.status === matchFilter);

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (action === "New Match") {
      navigate(`/matchesDashboard/${tournamentId}/createMatch`);
    } else if (action === "New Team") {
      navigate(`/matchesDashboard/${tournamentId}/createTeam`);
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-[100vh] relative py-20 bg-background/80">
        {/* COVER SECTION */}
        <section className="h-[30vh] relative">
          <img
            src={tournament.coverImage}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {tournament.name}
            </h1>
          </div>
          {/* + Button */}
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
                className="absolute right-0 mt-2 w-40 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
              >
                {[ "New Match", "New Team"].map((item) => (
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
                  {["live", "upcoming", "completed"].map((status) => (
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
                  {filteredMatches.map((match, index) => (
                    <MatchCard
                      key={match.id}
                      index={index}
                      team1={match.team1}
                      team2={match.team2}
                      team1Score={match.team1Score}
                      team2Score={match.team2Score}
                      status={match.status as any}
                      time={match.time}
                      venue={match.venue}
                    />
                  ))}
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
