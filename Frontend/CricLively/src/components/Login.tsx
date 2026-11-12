import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "./Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import type { LoginRequest } from "./data/DTO";
import { login } from "../API/PlayerAPI";
import { saveSession } from "../lib/auth";
import { toast } from "../hooks/use-toast";
import { useState } from "react";

const inputCls = "input-glass";

// One login for everybody - players, organizers and admins.
// The server tells us the person's roles and the app shows the right things.
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const comingFrom = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const payload: LoginRequest = { email, password };

    try {
      const res = await login(payload);
      saveSession(res);

      toast({
        title: `Welcome ${res.firstName ?? res.email},`,
        description: res.message ?? "Login Successful",
        duration: 2000,
      });

      // A player who has not added cricket details yet goes there first
      const needsDetails = !!res.playerId && res.isCricketDetailsCompleted === false;

      setTimeout(() => {
        navigate(needsDetails ? `/player/${res.playerId}` : comingFrom ?? "/showTournaments");
      }, 800);
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
          className="card-glass relative z-10 w-full max-w-md rounded-3xl p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <span className="badge-glass text-xs mb-3 inline-block">
              🏏 Welcome Back
            </span>
            <h1 className="text-2xl font-extrabold text-foreground">Login to CricLively</h1>
            <p className="text-sm text-foreground/70 mt-1">Live matches and stats await</p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="you@cricket.com"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-foreground/80">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                Remember me
              </label>
              <button type="button" className="text-accent font-medium hover:underline">
                Forgot?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="btn-primary-glass"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Login"}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground/60">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost-glass"
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
        </motion.div>
      </section>
    </>
  );
}
