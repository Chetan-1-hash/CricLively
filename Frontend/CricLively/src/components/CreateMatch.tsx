import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import TournamentListAPI from "../API/TournamentAPI";
import { toast } from "../hooks/use-toast";
import type { TournamentResponse } from "./data/TournamentEntity";
import { TeamsListAPI } from "../API/TeamsAPI";
import type { TeamsList } from "./data/DTO";
import { addMatch } from "../API/MatchApi";
import type { AddMatchDTO, MatchType } from "./data/MatchEntity";

const MATCH_TYPES: MatchType[] = [
  "LEAGUE", "GROUP", "ROUND_ROBIN",
  "PRE_QUARTER_FINAL", "QUARTER_FINAL", "SEMI_FINAL", "ELIMINATOR", "QUALIFIER", "PLAYOFF",
  "THIRD_PLACE", "FINAL", "GRAND_FINAL",
  "DECIDER", "SUPER_OVER", "REPLAY",
  "FRIENDLY", "EXHIBITION", "PRACTICE", "WARM_UP",
];

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const inputCls = "w-full px-4 py-3 rounded-xl bg-background/70 border border-border text-sm";

/**
 * Create a match.
 *  - Opened from a tournament  -> that tournament is already selected.
 *  - Opened from anywhere else -> "No tournament" is selected, so it is a standalone match.
 */
export default function CreateMatch() {
  const location = useLocation();
  const navigate = useNavigate();

  // location.state is null when we did not come from a tournament - that is fine now.
  const presetTournamentId =
    (location.state as { tournamentId?: string } | null)?.tournamentId ?? "";

  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [allTeams, setAllTeams] = useState<TeamsList[]>([]);
  const [saving, setSaving] = useState(false);
  const [matchDTO, setMatchDTO] = useState<AddMatchDTO>({
    tournamentId: presetTournamentId,
    teamAId: "",
    teamBId: "",
    venue: "",
    date: "",
    time: "",
    oversPerInnings: 20,
    matchType: presetTournamentId ? "LEAGUE" : "FRIENDLY",
  });

  useEffect(() => {
    TournamentListAPI()
      .then((list) => {
        setTournaments(list);
        const preset = list.find((t) => String(t.id) === presetTournamentId);
        if (preset) setMatchDTO((m) => ({ ...m, venue: m.venue || preset.venue }));
      })
      .catch(() =>
        toast({ title: "Could not load tournaments", variant: "destructive" })
      );

    TeamsListAPI()
      .then(setAllTeams)
      .catch(() => toast({ title: "Could not load teams", variant: "destructive" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tournamentName = (id: string) => tournaments.find((t) => String(t.id) === id)?.name;

  // With a tournament: only its teams. Standalone: every team.
  const teamList = matchDTO.tournamentId
    ? allTeams.filter((t) => t.tournamentId === matchDTO.tournamentId)
    : allTeams;

  const onTournamentChange = (id: string) => {
    const picked = tournaments.find((t) => String(t.id) === id);
    setMatchDTO((m) => ({
      ...m,
      tournamentId: id,
      teamAId: "", // old team choices may not belong to the new tournament
      teamBId: "",
      venue: picked ? picked.venue : m.venue,
      matchType: id ? m.matchType : "FRIENDLY",
    }));
  };

  const validate = (): string | null => {
    if (!matchDTO.teamAId || !matchDTO.teamBId) return "Select both teams.";
    if (matchDTO.teamAId === matchDTO.teamBId) return "Team 1 and Team 2 must be different.";
    if (!matchDTO.date) return "Select the match date.";
    if (!matchDTO.venue.trim()) return "Enter the venue.";
    const overs = Number(matchDTO.oversPerInnings);
    if (!Number.isInteger(overs) || overs < 1 || overs > 50) {
      return "Overs per innings must be a whole number from 1 to 50.";
    }
    return null;
  };

  const addNewMatch = async () => {
    if (saving) return;
    const problem = validate();
    if (problem) {
      toast({ title: "Check the form", description: problem, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await addMatch({
        ...matchDTO,
        tournamentId: matchDTO.tournamentId || undefined, // empty = standalone match
        venue: matchDTO.venue.trim(),
        time: matchDTO.time || undefined,
        oversPerInnings: Number(matchDTO.oversPerInnings),
      });

      toast({ title: "Match created successfully", description: "The match has been added." });
      setTimeout(() => navigate("/matchesDashboard"), 1500);
    } catch (e) {
      toast({
        title: "Failed to create match",
        description: (e as Error).message || "Failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-28 pb-12 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-center mb-10">Create Match</h1>

          <div className="space-y-6">
            {/* TOURNAMENT (optional) */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Tournament (optional)</label>
              <select
                value={matchDTO.tournamentId ?? ""}
                onChange={(e) => onTournamentChange(e.target.value)}
                className={inputCls}
              >
                <option value="">No tournament - single match</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TEAMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["teamAId", "teamBId"] as const).map((key, i) => {
                const other = key === "teamAId" ? matchDTO.teamBId : matchDTO.teamAId;
                return (
                  <select
                    key={key}
                    value={matchDTO[key]}
                    onChange={(e) => setMatchDTO((m) => ({ ...m, [key]: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Select Team {i + 1}</option>
                    {teamList.map((team) => {
                      const from = !matchDTO.tournamentId ? tournamentName(team.tournamentId) : undefined;
                      return (
                        <option key={team.id} value={team.id} disabled={team.id === other}>
                          {team.teamName}
                          {from ? ` (${from})` : ""}
                        </option>
                      );
                    })}
                  </select>
                );
              })}
            </div>
            {teamList.length === 0 && (
              <p className="text-xs text-foreground/60">
                No teams found{matchDTO.tournamentId ? " for this tournament" : ""}. Create teams first.
              </p>
            )}

            {/* DATE & TIME */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={matchDTO.date}
                onChange={(e) => setMatchDTO((m) => ({ ...m, date: e.target.value }))}
                className={inputCls}
              />
              <input
                type="time"
                value={matchDTO.time}
                onChange={(e) => setMatchDTO((m) => ({ ...m, time: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* VENUE & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Venue"
                value={matchDTO.venue}
                onChange={(e) => setMatchDTO((m) => ({ ...m, venue: e.target.value }))}
                className={inputCls}
              />

              <select
                value={matchDTO.matchType ?? ""}
                onChange={(e) =>
                  setMatchDTO((m) => ({ ...m, matchType: e.target.value as MatchType }))
                }
                className={inputCls}
              >
                {MATCH_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* OVERS */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Overs per innings</label>
              <input
                type="number"
                min={1}
                max={50}
                value={matchDTO.oversPerInnings}
                onChange={(e) =>
                  setMatchDTO((m) => ({ ...m, oversPerInnings: Number(e.target.value) }))
                }
                className={inputCls}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.03 }}
            whileTap={{ scale: saving ? 1 : 0.97 }}
            disabled={saving}
            className="w-full mt-10 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg disabled:opacity-70"
            onClick={addNewMatch}
          >
            {saving ? "Creating..." : "Create Match"}
          </motion.button>
        </motion.div>
      </section>
    </>
  );
}
