import { useEffect, useState } from "react";
import { SectionSpinner } from "./Spinner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { fetchMe } from "../API/PlayerAPI";
import { API_URL } from "../API/client";
import { saveSession, type MyProfile, type Role } from "../lib/auth";
import {
  requestOrganizer,
  cancelOrganizerRequest,
  sendVerificationEmail,
  verifyMyEmail,
} from "../API/ProfileEditAPI";
import { toast } from "../hooks/use-toast";
import VerificationBadge from "./VerificationBadge";

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
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const sendCode = async () => {
    setVerifying(true);
    setSendError("");
    try {
      const res = await sendVerificationEmail();
      if (res.alreadyVerified) {
        const fresh = await fetchMe();
        setMe(fresh);
        saveSession(fresh);
        toast({ title: "Email already verified" });
        return;
      }
      setCodeSent(true);
      toast({ title: "Verification email sent", description: res.message });
    } catch (e) {
      const msg = (e as Error).message || "Could not send verification email";
      setSendError(msg);
      toast({ title: "Could not send code", description: msg, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const confirmVerify = async () => {
    if (!verifyCode.trim()) {
      toast({ title: "Enter the 6-digit verification code", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const updated = await verifyMyEmail(verifyCode.trim());
      setMe(updated);
      saveSession(updated);
      setVerifyCode("");
      setCodeSent(false);
      setSendError("");
      toast({ title: "Email verified!", description: "You can now play unlimited matches and tournaments." });
    } catch (e) {
      toast({ title: "Verification failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const isOrganizer = !!me && (me.roles.includes("ORGANIZER") || me.roles.includes("ADMIN"));

  const sendRequest = async () => {
    if (reason.trim().length < 5) {
      toast({ title: "Add a reason", description: "Tell the admin why you need organizer access.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const updated = await requestOrganizer(reason.trim());
      setMe(updated);
      saveSession(updated);
      setReason("");
      toast({ title: "Request sent", description: "An admin will review it." });
    } catch (e) {
      toast({ title: "Could not send the request", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async () => {
    setBusy(true);
    try {
      const updated = await cancelOrganizerRequest();
      setMe(updated);
      saveSession(updated);
    } catch (e) {
      toast({ title: "Could not cancel", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

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
          {!error && !me && <SectionSpinner label="Loading your profile…" />}

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
                  <VerificationBadge verified={me.emailVerified} matchesPlayed={me.matchesPlayed ?? 0} />
                </div>
              </div>

              {/* Contact */}
              <h2 className="text-sm font-semibold text-foreground mb-1">Contact</h2>
              <div className="mb-5">
                <Row label="Email" value={me.email} />
                <Row label="Mobile" value={me.mobileNumber} />
                <Row label="Date of birth" value={me.dob} />
                <Row label="Matches played" value={String(me.matchesPlayed ?? 0)} />
              </div>

              {/* Email Verification */}
              {!me.emailVerified && (
                <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2.5">
                  <h2 className="text-sm font-semibold text-foreground">Email Verification</h2>
                  <p className="text-xs text-foreground/75">
                    {(me.matchesPlayed ?? 0) >= 1
                      ? "You have already played 1 match without verifying your email. Verify your email now to play more matches and tournaments."
                      : "You can play 1 match without email verification. Verify your email anytime to unlock unlimited matches and tournaments."}
                  </p>

                  {sendError && (
                    <p className="text-xs rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-red-300">
                      {sendError}
                    </p>
                  )}

                  {!codeSent ? (
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={verifying}
                      className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
                    >
                      {verifying ? "Sending…" : "Send Verification Code"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-foreground/80">
                        Check your inbox ({me.email}) for the 6-digit verification code or verification link.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="flex-1 px-3 py-2 rounded-xl bg-background/80 border border-border text-sm tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={confirmVerify}
                          disabled={verifying}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
                        >
                          {verifying ? "Checking…" : "Verify"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={sendCode}
                        disabled={verifying}
                        className="text-xs underline text-foreground/70 hover:text-foreground"
                      >
                        Resend code
                      </button>
                    </div>
                  )}
                </div>
              )}

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

              {/* Organizer access: players ask, an admin approves */}
              {!isOrganizer && (
                <div className="mt-6 rounded-2xl bg-background/60 p-4">
                  <h2 className="text-sm font-semibold text-foreground mb-1">Organizer access</h2>
                  {me.organizerRequestStatus === "PENDING" ? (
                    <>
                      <p className="text-xs text-foreground/70 mb-2">
                        Your request is waiting for an admin: "{me.organizerRequestReason}"
                      </p>
                      <button onClick={cancelRequest} disabled={busy} className="text-xs font-semibold underline text-foreground/70">
                        Cancel request
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-foreground/70 mb-2">
                        {me.organizerRequestStatus === "REJECTED"
                          ? "Your last request was not approved. You can ask again."
                          : "Organizers can create tournaments, teams and matches and score them. Ask an admin for access."}
                      </p>
                      <textarea
                        value={reason}
                        maxLength={300}
                        rows={2}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why do you need organizer access?"
                        className="w-full mb-2 px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
                      />
                      <button
                        onClick={sendRequest}
                        disabled={busy}
                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold disabled:opacity-60"
                      >
                        {busy ? "Sending…" : "Request organizer access"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* You can edit YOUR OWN profile. (Admins edit other people in Manage Users.) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/profile/edit")}
                className="w-full mt-6 py-3 border-2 border-primary text-foreground rounded-full font-semibold"
              >
                Edit profile
              </motion.button>
            </>
          )}
        </motion.div>
      </section>
    </>
  );
}
