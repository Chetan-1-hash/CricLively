import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Sample match data with status

export interface Match {
  id: number;
  team1: string;
  team2: string;
  team1Score?: string;
  team2Score?: string;
  status: "live" | "upcoming" | "completed";
  time?: string;
  venue: string;
}


const matches = [
  {
    id: 1,
    teams: "Mumbai Indians vs Chennai Super Kings",
    date: "Mar 18, 2026",
    time: "7:30 PM",
    venue: "Wankhede Stadium",
    status: "LIVE",
  },
  {
    id: 2,
    teams: "Royal Challengers Bangalore vs Delhi Capitals",
    date: "Mar 19, 2026",
    time: "7:30 PM",
    venue: "M. Chinnaswamy Stadium",
    status: "UPCOMING",
  },
  {
    id: 3,
    teams: "Kolkata Knight Riders vs Sunrisers Hyderabad",
    date: "Mar 20, 2026",
    time: "7:30 PM",
    venue: "Eden Gardens",
    status: "COMPLETED",
  },
];

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";

export default function Matches() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<MatchStatus>("UPCOMING");

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (action === "New Tournament") navigate("/tournament/new");
    if (action === "New Match") navigate("/match/new");
  };

  // Filter matches based on selected button
  const filteredMatches = matches.filter(
    (match) => match.status === selectedStatus
  );

  return (
    <>
      <Navbar />
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
          </div>

          {/* Status Buttons */}
          <div className="flex gap-4 mb-10">
            {(["LIVE", "UPCOMING", "COMPLETED"] as MatchStatus[]).map(
              (status) => (
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
              )
            )}
          </div>

          {/* Match Cards */}
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:scale-105 transition-transform"
              >
                <span
                  className={`inline-block mb-3 px-3 py-1 text-xs font-bold rounded-full ${
                    match.status === "LIVE"
                      ? "bg-red-600 text-white"
                      : match.status === "UPCOMING"
                      ? "bg-yellow-500 text-black"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {match.status}
                </span>

                <h2 className="text-xl font-bold text-foreground mb-2">
                  {match.teams}
                </h2>
                <p className="text-sm text-foreground/70">
                  Date: {match.date}
                </p>
                <p className="text-sm text-foreground/70">
                  Time: {match.time}
                </p>
                <p className="text-sm text-foreground/70">
                  Venue: {match.venue}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 w-full py-2.5 bg-accent text-accent-foreground rounded-full font-semibold"
                >
                  View Match
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
