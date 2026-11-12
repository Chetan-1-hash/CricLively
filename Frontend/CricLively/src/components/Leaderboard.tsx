import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeaderboard, type LeaderboardData, type LeaderPlayer } from "../API/TournamentTablesAPI";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { SectionSpinner } from "./Spinner";

type Tab = "bat" | "bowl" | "mvp";

const th = "py-2 px-2 font-semibold text-right";
const td = "py-3 px-2 text-right text-foreground/80";

// Every player's numbers for the whole tournament (completed matches only).
export default function Leaderboard({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("bat");

  const load = useCallback(async () => {
    try {
      setData(await getLeaderboard(tournamentId));
      setError("");
    } catch (e) {
      setError((e as Error).message || "Could not load the leaderboard");
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);
  useLiveUpdates("*", load);

  const rows: LeaderPlayer[] = useMemo(() => {
    const all = data?.players ?? [];
    if (tab === "bat") return all.filter((p) => p.battingInnings > 0).sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate);
    if (tab === "bowl") return all.filter((p) => p.bowlingInnings > 0).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);
    return [...all].sort((a, b) => b.mvpPoints - a.mvpPoints);
  }, [data, tab]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <SectionSpinner label="Loading leaderboard…" />;

  return (
    <>
      <div className="flex gap-2 mb-5">
        {([["bat", "Batting"], ["bowl", "Bowling"], ["mvp", "MVP"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-full text-sm font-semibold ${tab === id ? "bg-red-600 text-white" : "bg-red-600/20 text-red-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-foreground/70">Nothing here yet. Numbers appear once a match of this tournament is finished.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-foreground/60 text-left border-b border-foreground/10">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-4 font-semibold">Player</th>
                {tab === "bat" && (
                  <>
                    <th className={th}>M</th><th className={th}>Inn</th><th className={th}>Runs</th><th className={th}>HS</th>
                    <th className={th}>Avg</th><th className={th}>SR</th><th className={th}>4s</th><th className={th}>6s</th>
                    <th className={th}>50/100</th>
                  </>
                )}
                {tab === "bowl" && (
                  <>
                    <th className={th}>M</th><th className={th}>Inn</th><th className={th}>Overs</th><th className={th}>Runs</th>
                    <th className={th}>Wkts</th><th className={th}>Best</th><th className={th}>Econ</th><th className={th}>Dots</th>
                  </>
                )}
                {tab === "mvp" && (
                  <>
                    <th className={th}>M</th><th className={th}>Bat</th><th className={th}>Bowl</th>
                    <th className={th}>Field</th><th className={th}>Catches</th><th className={th}>Run-outs</th>
                    <th className={th}>MVP</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.playerId} className="border-b border-foreground/5 last:border-0">
                  <td className="py-3 pr-2 font-semibold text-foreground">{i + 1}</td>
                  <td className="py-3 pr-4 font-semibold text-foreground">
                    {p.name}
                    {p.team && <p className="text-xs font-normal text-foreground/60">{p.team}</p>}
                  </td>
                  {tab === "bat" && (
                    <>
                      <td className={td}>{p.matches}</td><td className={td}>{p.battingInnings}</td>
                      <td className={`${td} font-extrabold !text-foreground`}>{p.runs}</td><td className={td}>{p.highestScore}</td>
                      <td className={td}>{p.average.toFixed(2)}</td><td className={td}>{p.strikeRate.toFixed(2)}</td>
                      <td className={td}>{p.fours}</td><td className={td}>{p.sixes}</td>
                      <td className={td}>{p.fifties}/{p.hundreds}</td>
                    </>
                  )}
                  {tab === "bowl" && (
                    <>
                      <td className={td}>{p.matches}</td><td className={td}>{p.bowlingInnings}</td>
                      <td className={td}>{p.overs}</td><td className={td}>{p.runsConceded}</td>
                      <td className={`${td} font-extrabold !text-foreground`}>{p.wickets}</td><td className={td}>{p.bestFigures}</td>
                      <td className={td}>{p.economy.toFixed(2)}</td><td className={td}>{p.dotBalls}</td>
                    </>
                  )}
                  {tab === "mvp" && (
                    <>
                      <td className={td}>{p.matches}</td><td className={td}>{p.battingPoints}</td>
                      <td className={td}>{p.bowlingPoints}</td><td className={td}>{p.fieldingPoints}</td>
                      <td className={td}>{p.catches + p.stumpings}</td><td className={td}>{p.runOuts}{p.runOutAssists ? ` (+${p.runOutAssists})` : ""}</td>
                      <td className={`${td} font-extrabold !text-foreground`}>{p.mvpPoints}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "mvp" && (
        <ul className="text-xs text-foreground/60 mt-4 space-y-1 list-disc pl-4">
          {data.mvpRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </>
  );
}
