import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import { verifyEmailPublic } from "../API/ProfileEditAPI";
import { fetchMe } from "../API/PlayerAPI";
import { getSession, saveSession } from "../lib/auth";
import { toast } from "../hooks/use-toast";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState(params.get("code") ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (targetEmail = email, targetCode = code) => {
    if (!targetEmail.trim() || !targetCode.trim()) {
      setError("Enter both your email and 6-digit verification code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await verifyEmailPublic(targetEmail.trim(), targetCode.trim());
      setDone(true);
      if (getSession()) {
        try {
          saveSession(await fetchMe());
        } catch {
          // ignore if session expired
        }
      }
      toast({ title: "Email Verified!", description: res.message });
    } catch (e) {
      setError((e as Error).message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const qEmail = params.get("email");
    const qCode = params.get("code");
    if (qEmail && qCode) {
      submit(qEmail, qCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] flex items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/85 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-3">
              <MailCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email Verification</h1>
            <p className="text-xs text-foreground/70 mt-1">
              Verify your email to unlock unlimited matches and tournaments.
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <p className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 text-sm font-semibold">
                Your email ({email}) is now verified!
              </p>
              <button
                onClick={() => navigate(getSession() ? "/profile" : "/login")}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                {getSession() ? "Back to Profile" : "Go to Login"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <p className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-2 text-xs">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground tracking-widest"
                />
              </div>
              <button
                onClick={() => submit()}
                disabled={busy}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {busy ? "Verifying..." : "Verify Email"}
              </button>
            </div>
          )}
        </motion.div>
      </section>
    </>
  );
}

