import { useState } from "react";
import { motion } from "framer-motion";
import { extendTournamentAPI } from "../API/TournamentAPI";
import type { TournamentResponse } from "./data/TournamentEntity";
import { toast } from "../hooks/use-toast";

/**
 * "Extend tournament": the organizer picks a new end date and says why.
 * Both are saved in the tournament history and shown to everybody.
 */
export default function ExtendTournamentDialog({
  tournament,
  onClose,
  onDone,
}: {
  tournament: TournamentResponse;
  onClose: () => void;
  onDone: (t: TournamentResponse) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [newEndDate, setNewEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // the date must be after the current end date and not in the past
  const minDate = tournament.endDate && tournament.endDate >= today ? tournament.endDate : today;

  const submit = async () => {
    setError("");
    if (!newEndDate) return setError("Choose the new end date.");
    if (newEndDate <= tournament.endDate) return setError(`The new end date must be after ${tournament.endDate}.`);
    if (newEndDate < today) return setError("The new end date cannot be in the past.");
    if (reason.trim().length < 5) return setError("Write the reason for the extension (at least 5 characters).");

    setBusy(true);
    try {
      const t = await extendTournamentAPI(tournament.id, { newEndDate, reason: reason.trim() });
      toast({ title: "Tournament extended", description: `New end date: ${t.endDate}` });
      onDone(t);
    } catch (e) {
      setError((e as Error).message || "Could not extend the tournament.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <motion.div
        className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xl font-bold text-foreground">Extend tournament</h3>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">✕</button>
        </div>
        <p className="text-xs text-foreground/60 mb-4">
          {tournament.name} · current end date <b>{tournament.endDate}</b>
        </p>

        <label className="block text-sm font-semibold text-foreground mb-1">New end date</label>
        <input
          type="date"
          min={minDate}
          value={newEndDate}
          onChange={(e) => setNewEndDate(e.target.value)}
          className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
        />

        <label className="block text-sm font-semibold text-foreground mb-1">Reason</label>
        <textarea
          value={reason}
          maxLength={300}
          rows={3}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Semi-finals were delayed by rain"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
        />
        <p className="text-xs text-foreground/50 text-right mb-3">{reason.length}/300</p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border-2 border-foreground/30 font-semibold text-foreground">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-full bg-red-600 text-white font-semibold disabled:opacity-60"
          >
            {busy ? "Saving…" : "Extend"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
