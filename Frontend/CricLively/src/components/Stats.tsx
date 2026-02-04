import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";

// Define types
type BatStats = {
  id: number;
  player: string;
  team: string;
  matches: number;
  runs: number;
  average: number;
};
type BowlStats = {
  id: number;
  player: string;
  team: string;
  matches: number;
  wickets: number;
  economy: number;
};
type MVPStats = { id: number; player: string; team: string; points: number };

type Stats = BatStats | BowlStats | MVPStats;

// Sample Data
const battingLeaderboard: BatStats[] = [
  {
    id: 1,
    player: "Virat Kohli",
    team: "RCB",
    matches: 14,
    runs: 620,
    average: 44.2,
  },
  {
    id: 2,
    player: "KL Rahul",
    team: "LSG",
    matches: 14,
    runs: 540,
    average: 42.3,
  },
  {
    id: 3,
    player: "Rohit Sharma",
    team: "MI",
    matches: 14,
    runs: 500,
    average: 40.0,
  },
];

const bowlingLeaderboard: BowlStats[] = [
  {
    id: 1,
    player: "Rashid Khan",
    team: "SRH",
    matches: 14,
    wickets: 22,
    economy: 6.5,
  },
  {
    id: 2,
    player: "Jofra Archer",
    team: "RR",
    matches: 12,
    wickets: 18,
    economy: 7.0,
  },
  {
    id: 2,
    player: "Jofra Archer",
    team: "RR",
    matches: 12,
    wickets: 18,
    economy: 7.0,
  },
];

const mvpLeaderboard: MVPStats[] = [
  { id: 1, player: "Virat Kohli", team: "RCB", points: 200 },
  { id: 2, player: "Rashid Khan", team: "SRH", points: 180 },
  { id: 3, player: "KL Rahul", team: "LSG", points: 170 },
];

export default function Stats() {
  const [activeTab, setActiveTab] = useState<"bat" | "bowl" | "mvp">("bat");

  // Determine which data to show
  let dataToDisplay: Stats[] = [];
  if (activeTab === "bat") dataToDisplay = battingLeaderboard;
  if (activeTab === "bowl") dataToDisplay = bowlingLeaderboard;
  if (activeTab === "mvp") dataToDisplay = mvpLeaderboard;

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] py-12 bg-background/80">
        <div className="container my-12 mx-auto px-6">
          <div className="flex flex-col items-start mb-12">
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold text-foreground mb-8 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Leaderboard
            </motion.h1>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-8">
              {["bat", "bowl", "mvp"].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab as "bat" | "bowl" | "mvp")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-full font-semibold text-white transition-colors ${
                    activeTab === tab ? "bg-red-600" : "bg-red-400/70"
                  }`}
                >
                  {tab === "bat" ? "Bat" : tab === "bowl" ? "Bowl" : "MVP"}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="bg-card/80 backdrop-blur-md rounded-lg">
                  <th className="p-3 text-foreground font-semibold">#</th>
                  <th className="p-3 text-foreground font-semibold">Player</th>
                  <th className="p-3 text-foreground font-semibold">Team</th>

                  {activeTab === "bat" && (
                    <>
                      <th className="p-3 text-foreground font-semibold">
                        Matches
                      </th>
                      <th className="p-3 text-foreground font-semibold">
                        Runs
                      </th>
                      <th className="p-3 text-foreground font-semibold">
                        Average
                      </th>
                    </>
                  )}

                  {activeTab === "bowl" && (
                    <>
                      <th className="p-3 text-foreground font-semibold">
                        Matches
                      </th>
                      <th className="p-3 text-foreground font-semibold">
                        Wickets
                      </th>
                      <th className="p-3 text-foreground font-semibold">
                        Economy
                      </th>
                    </>
                  )}

                  {activeTab === "mvp" && (
                    <th className="p-3 text-foreground font-semibold">
                      Points
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {dataToDisplay.map((player, index) => (
                  <motion.tr
                    key={player.id}
                    className="bg-card/80 backdrop-blur-md rounded-lg mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{player.player}</td>
                    <td className="p-3">{player.team}</td>

                    {activeTab === "bat" && "runs" in player && (
                      <>
                        <td className="p-3">{player.matches}</td>
                        <td className="p-3">{player.runs}</td>
                        <td className="p-3">{player.average}</td>
                      </>
                    )}

                    {activeTab === "bowl" && "wickets" in player && (
                      <>
                        <td className="p-3">{player.matches}</td>
                        <td className="p-3">{player.wickets}</td>
                        <td className="p-3">{player.economy}</td>
                      </>
                    )}

                    {activeTab === "mvp" && "points" in player && (
                      <td className="p-3">{player.points}</td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
