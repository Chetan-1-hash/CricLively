import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAccess, setScorers, type MatchAccess } from "../API/ScoringAPI";
import { ProfileListAPI } from "../API/ProfileAPI";
import type { ProfileList } from "./data/DTO";
import { toast } from "../hooks/use-toast";

const nameOf = (p: ProfileList) => [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") || "Organizer";

/**
 * "Who can score this match?"
 * The main organizer (or an admin) gives scoring access to other organizers, e.g. when
 * they cannot score themselves. Each click is saved straight away.
 */
export default function ScorerAccessDialog({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [access, setAccess] = useState<MatchAccess | null>(null);
  const [people, setPeople] = useState<ProfileList[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAccess(matchId), ProfileListAPI()])
      .then(([acc, list]) => {
        setAccess(acc);
        setPeople(list);
      })
      .catch((e: Error) => setError(e.message || "Could not load"));
  }, [matchId]);

  const givenIds = new Set((access?.scorers ?? []).map((s) => s.profileId));
  const q = search.trim().toLowerCase();

  // only organizers can be given access, and not the main organizer (already allowed)
  const organizers = people.filter(
    (p) =>
      (p.role ?? []).some((r) => r === "ORGANIZER" || r === "ADMIN") &&
      p.id !== access?.ownerId &&
      (!q || nameOf(p).toLowerCase().includes(q) || (p.mobileNumber ?? "").includes(q))
  );

  const toggle = async (p: ProfileList) => {
    if (!access || busyId) return;
    const next = new Set(givenIds);
    if (next.has(p.id)) next.delete(p.id);
    else next.add(p.id);
    setBusyId(p.id);
    try {
      setAccess(await setScorers(matchId, Array.from(next)));
      toast({
        title: next.has(p.id) ? "Scoring access given" : "Scoring access removed",
        description: nameOf(p),
        duration: 2000,
      });
    } catch (e) {
      toast({ title: "Could not change access", variant: "destructive", description: (e as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <motion.div
        className="bg-card rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xl font-bold text-foreground">Who can score this match?</h3>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">✕</button>
        </div>
        <p className="text-xs text-foreground/60 mb-4">
          Use this when you cannot score yourself. Only organizers can be given access.
        </p>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!error && !access && <p className="text-foreground/70 text-sm">Loading…</p>}

        {access && (
          <>
            <div className="rounded-xl bg-background/60 px-4 py-3 mb-3 text-sm">
              <p className="text-xs text-foreground/60">Main organizer</p>
              <p className="font-semibold text-foreground">{access.ownerName ?? "Not set yet (the first organizer to start scoring)"}</p>
              {access.tournamentOrganizers.length > 0 && (
                <p className="text-xs text-foreground/60 mt-2">
                  Tournament organizers (can always score and give access): {access.tournamentOrganizers.map((o) => o.name).join(", ")}
                </p>
              )}
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizers"
              className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
            />

            <div className="space-y-2">
              {organizers.length === 0 && (
                <p className="text-sm text-foreground/60">
                  No organizers found. An admin can make someone an organizer in Manage Users.
                </p>
              )}
              {organizers.map((p) => {
                const has = givenIds.has(p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-background/60 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{nameOf(p)}</p>
                      <p className="text-xs text-foreground/60">{has ? "Can score this match" : "No scoring access"}</p>
                    </div>
                    <button
                      onClick={() => toggle(p)}
                      disabled={busyId !== null}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60 ${
                        has ? "border-2 border-red-600 text-red-600" : "bg-red-600 text-white"
                      }`}
                    >
                      {has ? "Remove" : "Give access"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
