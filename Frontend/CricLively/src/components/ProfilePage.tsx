import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { fetchMe } from "../API/PlayerAPI";
import { API_URL } from "../API/client";
import { saveSession, type MyProfile, type Role } from "../lib/auth";

const ROLE_INFO: Record<Role, string> = {
  ADMIN: "Admin: full access to everything",
  ORGANIZER: "Organizer: manage tournaments, teams, matches and scoring",
  PLAYER: "Player: view matches and stats, manage own profile",
};

// "Right_Hand" -> "Right Hand"
const pretty = (value?: string | null) => (value ? value.replace(/_/g, " ") : "—");

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/40 last:border-0 text-sm">
      <span className="text-foreground/60">{label}</span>
      <span className="font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MyProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMe()
      .then((data) => {
        setMe(data);
        saveSession(data); // keep the saved copy fresh
      })
      .catch((e: Error) => setError(e.message || "Could not load your profile"));
  }, []);

  const fullName =
    [me?.firstName, me?.middleName, me?.lastName].filter(Boolean).join(" ") || me?.email || "";

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] flex items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
        >
          {error && <p className="text-center text-red-600">{error}</p>}
          {!error && !me && <p className="text-center text-foreground/70">Loading your profile…</p>}

          {me && (
            <>
              {/* Photo + name */}
              <div className="flex flex-col items-center gap-3 mb-6">
                {me.image ? (
                  <img
                    src={`${API_URL}/images/${me.image}`}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-2 border-primary shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-foreground/10 flex items-center justify-center text-4xl">
                    👤
                  </div>
                )}
                <h1 className="text-2xl font-bold text-foreground text-center">{fullName}</h1>
                <div className="flex flex-wrap justify-center gap-2">
                  {me.roles.map((role) => (
                    <span
                      key={role}
                      title={ROLE_INFO[role]}
                      className="px-3 py-1 rounded-full bg-primary/20 text-xs font-semibold text-foreground"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <h2 className="text-sm font-semibold text-foreground mb-1">Contact</h2>
              <div className="mb-5">
                <Row label="Email" value={me.email} />
                <Row label="Mobile" value={me.mobileNumber} />
                <Row label="Date of birth" value={me.dob} />
              </div>

              {/* Cricket details (only for people who are also players) */}
              {me.playerId && (
                <>
                  <h2 className="text-sm font-semibold text-foreground mb-1">Cricket details</h2>
                  {me.isCricketDetailsCompleted ? (
                    <div>
                      <Row label="Batting style" value={pretty(me.battingStyle)} />
                      <Row label="Bowling style" value={pretty(me.bowlingStyle)} />
                      <Row label="Playing role" value={pretty(me.playingRole)} />
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/player/${me.playerId}`)}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg"
                    >
                      Add your cricket details
                    </motion.button>
                  )}
                </>
              )}
            </>
          )}
        </motion.div>
      </section>
    </>
  );
}
