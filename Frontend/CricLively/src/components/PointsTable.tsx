import { useCallback, useEffect, useState } from "react";
import { getPointsTable, type PointsRow } from "../API/TournamentTablesAPI";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { SectionSpinner } from "./Spinner";

const FORM_STYLE: Record<string, string> = {
  W: "bg-green-700 text-white",
  L: "bg-red-600 text-white",
  T: "bg-yellow-500 text-black",
  N: "bg-foreground/30 text-foreground",
};

// Team-wise points table. It is worked out by the server from the finished matches,
// and this page reloads by itself whenever a match changes.
export default function PointsTable({ tournamentId }: { tournamentId: string }) {
  const [rows, setRows] = useState<PointsRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await getPointsTable(tournamentId));
      setError("");
    } catch (e) {
      setError((e as Error).message || "Could not load the points table");
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);
  useLiveUpdates("*", load);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!rows) return <SectionSpinner label="Loading points table…" />;
  if (rows.length === 0) return <p className="text-foreground/70">No teams in this tournament yet.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-foreground/60 text-left border-b border-foreground/10">
              <th className="py-2 pr-2 font-semibold">#</th>
              <th className="py-2 pr-4 font-semibold">Team</th>
              <th className="py-2 px-2 font-semibold text-right">P</th>
              <th className="py-2 px-2 font-semibold text-right">W</th>
              <th className="py-2 px-2 font-semibold text-right">L</th>
              <th className="py-2 px-2 font-semibold text-right">T</th>
              <th className="py-2 px-2 font-semibold text-right">NR</th>
              <th className="py-2 px-2 font-semibold text-right">Pts</th>
              <th className="py-2 px-2 font-semibold text-right">NRR</th>
              <th className="py-2 pl-4 font-semibold">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.teamId} className="border-b border-foreground/5 last:border-0">
                <td className="py-3 pr-2 font-semibold text-foreground">{r.position}</td>
                <td className="py-3 pr-4 font-semibold text-foreground">{r.teamName}</td>
                <td className="py-3 px-2 text-right text-foreground/80">{r.played}</td>
                <td className="py-3 px-2 text-right text-foreground/80">{r.won}</td>
                <td className="py-3 px-2 text-right text-foreground/80">{r.lost}</td>
                <td className="py-3 px-2 text-right text-foreground/80">{r.tied}</td>
                <td className="py-3 px-2 text-right text-foreground/80">{r.noResult}</td>
                <td className="py-3 px-2 text-right font-extrabold text-foreground">{r.points}</td>
                <td className="py-3 px-2 text-right text-foreground/80">
                  {r.nrr > 0 ? "+" : ""}
                  {r.nrr.toFixed(3)}
                </td>
                <td className="py-3 pl-4">
                  <div className="flex gap-1">
                    {r.form.map((f, i) => (
                      <span key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${FORM_STYLE[f] ?? ""}`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-foreground/60 mt-4">
        Win 2 points · Tie 1 · No result or abandoned 1 · Loss 0. Teams on equal points are ordered by net run rate (NRR),
        then by wins. NRR = runs scored per over − runs conceded per over; a team that is all out counts its full overs.
      </p>
    </>
  );
}
