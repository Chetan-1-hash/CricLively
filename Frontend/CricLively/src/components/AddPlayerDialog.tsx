import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserPlus, X } from "lucide-react";
import { addPlayerProfile } from "../API/PlayerAPI";
import { BATTING_STYLES, BOWLING_STYLES, PLAYING_ROLES } from "../lib/cricketOptions";
import { parseFullName, type ProfileList } from "./data/DTO";
import type { BattingStyle, BowlingStyle, PlayingRole } from "./data/Player";
import { toast } from "../hooks/use-toast";

interface AddPlayerDialogProps {
  onClose: () => void;
  onCreated?: (player: ProfileList) => void;
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

/**
 * Modal for ORGANIZER or ADMIN to add a player + profile in one step.
 */
export default function AddPlayerDialog({ onClose, onCreated }: AddPlayerDialogProps) {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [battingStyle, setBattingStyle] = useState<BattingStyle | "">("");
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | "">("");
  const [playingRole, setPlayingRole] = useState<PlayingRole | "">("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const { firstName, middleName, lastName } = parseFullName(fullName);
    if (!firstName) {
      toast({ title: "Player name is required", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Email address is required", variant: "destructive" });
      return;
    }
    if (!mobileNumber.trim()) {
      toast({ title: "Mobile number is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const created = await addPlayerProfile({
        firstName,
        middleName,
        lastName: lastName || undefined,
        dob: dob || undefined,
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password || undefined,
        battingStyle: battingStyle || undefined,
        bowlingStyle: bowlingStyle || undefined,
        playingRole: playingRole || undefined,
      });

      toast({
        title: "Player & Profile added",
        description: `${created.firstName} can play 1 match before verifying email (${created.email}).`,
      });
      onCreated?.(created);
      onClose();
    } catch (err) {
      toast({
        title: "Could not add player",
        description: (err as Error).message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Add Player & Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/70"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-foreground/70 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2">
          Players added without email verification can play <b>1 match</b>. After playing 1 match, they must verify their email before playing any more matches or tournaments.
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Virat Kohli"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date of Birth</label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Password (optional)
              </label>
              <input
                type="password"
                placeholder="Auto-generated if blank"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Batting Style</label>
              <select
                className={inputCls}
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value as BattingStyle)}
              >
                <option value="">Optional</option>
                {BATTING_STYLES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Bowling Style</label>
              <select
                className={inputCls}
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value as BowlingStyle)}
              >
                <option value="">Optional</option>
                {BOWLING_STYLES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Playing Role</label>
              <select
                className={inputCls}
                value={playingRole}
                onChange={(e) => setPlayingRole(e.target.value as PlayingRole)}
              >
                <option value="">Optional</option>
                {PLAYING_ROLES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-border text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

