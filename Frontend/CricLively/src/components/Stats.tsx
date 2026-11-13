import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { SectionSpinner } from "./Spinner";
import { getMyStats, type PersonalStats, type StatLine } from "../API/StatsAPI";

function Card({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
      <h3 className="text-lg font-bold text-foreground mb-3">{title}</h3>
      <div className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm border-b border-border/40 last:border-0 py-1.5">
            <span className="text-foreground/60">{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Numbers({ s }: { s: StatLine }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card
        title="Batting"
        rows={[
          ["Matches", s.matches],
          ["Innings", s.battingInnings],
          ["Runs", s.runs],
          ["Highest score", s.highestScore],
          ["Average", s.average.toFixed(2)],
          ["Strike rate", s.strikeRate.toFixed(2)],
          ["Balls faced", s.balls],
          ["4s / 6s", `${s.fours} / ${s.sixes}`],
          ["50s / 100s", `${s.fifties} / ${s.hundreds}`],
          ["Not outs", s.notOuts],
        ]}
      />
      <Card
        title="Bowling"
        rows={[
          ["Innings", s.bowlingInnings],
          ["Overs", s.overs],
          ["Runs given", s.runsConceded],
          ["Wickets", s.wickets],
          ["Best figures", s.bestFigures],
          ["Economy", s.economy.toFixed(2)],
        ]}
      />
      <div className="md:col-span-2">
        <Card
          title="Fielding"
          rows={[
            ["Catches", s.catches],
            ["Stumpings", s.stumpings],
            ["Run-outs", s.runOuts],
            ["Run-out assists", s.runOutAssists],
          ]}
        />
      </div>
    </div>
  );
}

// Personal statistics only: your own numbers, overall and tournament by tournament.
export default function Stats() {
  const [data, setData] = useState<PersonalStats | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string>("ALL"); // "ALL", a tournament id, or "SINGLE"

  useEffect(() => {
    getMyStats()
      .then(setData)
      .catch((e: Error) => setError(e.message || "Could not load your statistics"));
  }, []);

  const keyOf = (t: { tournamentId: string | null }) => t.tournamentId ?? "SINGLE";
  const picked = data?.tournaments.find((t) => keyOf(t) === active);
  const shown = active === "ALL" ? data?.overall : picked?.stats;

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] py-12 bg-background/80">
        <div className="container my-12 mx-auto px-6 max-w-4xl">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            My Stats
          </motion.h1>
          <p className="text-foreground/70 mb-8">
            {data?.playerName ? `${data.playerName} · ` : ""}Only your own numbers, from matches you played.
          </p>

          {error && <p className="text-red-600">{error}</p>}
          {!error && !data && <SectionSpinner label="Loading your stats…" />}

          {data && data.overall.matches === 0 && (
            <div className="bg-card/80 rounded-3xl p-5 sm:p-8 text-center shadow-2xl">
              <p className="font-semibold text-foreground mb-1">No matches yet</p>
              <p className="text-sm text-foreground/70">
                Your stats appear here once you are in a team's playing XI and the match is scored.
              </p>
            </div>
          )}

          {data && data.overall.matches > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-6">
                {[{ id: "ALL", label: "Overall" }, ...data.tournaments.map((t) => ({ id: keyOf(t), label: t.tournamentName }))].map(
                  (tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActive(tab.id)}
                      className={`px-5 py-2 rounded-full text-sm font-semibold ${
                        active === tab.id ? "bg-red-600 text-white" : "bg-red-600/20 text-red-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                )}
              </div>
              {shown && <Numbers s={shown} />}
            </>
          )}
        </div>
      </section>
    </>
  );
}
