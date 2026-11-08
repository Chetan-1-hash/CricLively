import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Loader2 } from "lucide-react";
import Navbar from "./Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import type { LoginRequest } from "./data/DTO";
import { adminLogin, playerLogin } from "../API/PlayerAPI";
import { toast } from "../hooks/use-toast";
import { useState } from "react";

type Mode = "PLAYER" | "ADMIN";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

export default function Login() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(pathname.startsWith("/admin") ? "ADMIN" : "PLAYER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = mode === "ADMIN";

  const switchMode = (m: Mode) => {
    if (m === mode || loading) return;
    setMode(m);
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const payload: LoginRequest = { email, password };

    try {
      if (isAdmin) {
        const res = await adminLogin(payload);
        sessionStorage.setItem("playerId", res.playerId);
        toast({ title: `Welcome ${res.firstName}`, description: res.message, duration: 2000 });
        setTimeout(() => navigate("/showTournaments"), 800);
      } else {
        const res = await playerLogin(payload);
        sessionStorage.setItem("playerId", res.playerId);
        toast({ title: `Welcome ${res.firstName},`, description: res.message, duration: 2000 });
        setTimeout(() => {
          navigate(res.isCricketDetailsCompleted ? "/showTournaments" : `/player/${res.playerId}`);
        }, 800);
      }
    } catch (error: any) {
      toast({
        title: "Login Failed!!",
        variant: "destructive",
        description: error.message || "Something went wrong",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] relative flex items-center justify-center overflow-hidden py-22">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />

        <motion.div
          className="absolute top-16 left-16 w-32 h-32 bg-accent/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-16 right-16 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10"
        >
          {/* Role switch */}
          <div className="relative grid grid-cols-2 p-1 mb-6 rounded-full bg-background/50 border border-border">
            {(["PLAYER", "ADMIN"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="relative z-10 py-2 text-xs font-semibold tracking-wide"
              >
                {mode === m && (
                  <motion.span
                    layoutId="role-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-primary shadow-md"
                  />
                )}
                <span
                  className={`relative flex items-center justify-center gap-1.5 ${
                    mode === m ? "text-primary-foreground" : "text-foreground/60"
                  }`}
                >
                  {m === "PLAYER" ? <User size={14} /> : <ShieldCheck size={14} />}
                  {m === "PLAYER" ? "Player" : "Admin"}
                </span>
              </button>
            ))}
          </div>

          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-6"
            >
              <span className="inline-block px-3 py-1.5 bg-primary/20 rounded-full text-xs font-medium text-foreground mb-3">
                {isAdmin ? "🛡️ Restricted Access" : "🏏 Welcome Back"}
              </span>
              <h1 className="text-2xl font-extrabold text-foreground">
                {isAdmin ? "Admin Console" : "Login to CricLively"}
              </h1>
              <p className="text-sm text-foreground/70 mt-1">
                {isAdmin ? "Manage tournaments, teams and players" : "Live matches and stats await"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {isAdmin ? "Admin Email" : "Email Address"}
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder={isAdmin ? "admin@criclively.com" : "you@cricket.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            {!isAdmin && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-foreground/80">
                  <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                  Remember me
                </label>
                <button type="button" className="text-accent font-medium hover:underline">
                  Forgot?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-shadow disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : isAdmin ? "Sign in as Admin" : "Login"}
            </motion.button>
          </form>

          {!isAdmin ? (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-foreground/60">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-2.5 border-2 border-foreground/30 rounded-full font-semibold text-sm text-foreground backdrop-blur-sm hover:bg-foreground/10 transition-colors"
              >
                Continue with Google
              </motion.button>

              <p className="text-center text-xs text-foreground/70 mt-5">
                New here?{" "}
                <span
                  onClick={() => navigate("/register")}
                  className="text-accent font-semibold cursor-pointer hover:underline"
                >
                  Create an account
                </span>
              </p>
            </>
          ) : (
            <p className="text-center text-[11px] text-foreground/50 mt-5">
              Authorized personnel only. Access is logged.
            </p>
          )}
        </motion.div>
      </section>
    </>
  );
}