import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { LoginRequest } from "./data/DTO";
import { playerLogin } from "../API/PlayerLoginApi";
import { toast } from "../hooks/use-toast";
import { useState } from "react";
import { organizerLogin } from "../API/OrganizerLoginApi";
import { adminLogin } from "../API/AdminLoginApi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // hook for navigation
  type UserRole = "PLAYER" | "ORGANIZER" | "ADMIN";

  const [role, setRole] = useState<UserRole>("PLAYER");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: LoginRequest = { email, password, role };

    try {
      if (role === "PLAYER") {
        const response = await playerLogin(payload);

        sessionStorage.setItem("playerId", response.playerId);

        toast({
          title: `Welcome ${response.firstName},`,
          description: response.message,
          duration: 3000,
        });

        localStorage.setItem("token", response.token);

        setTimeout(() => {
          if (response.isCricketDetailsCompleted) {
            navigate("/showtournaments");
          } else {
            navigate(`/player/${response.playerId}`);
          }
        }, 3000);
      } else if (role === "ORGANIZER") {
        const response = await organizerLogin(payload);

        sessionStorage.setItem("playerId", response.playerId);

        toast({
          title: `Welcome ${response.firstName},`,
          description: response.message,
          duration: 3000,
        });

        localStorage.setItem("token", response.token);

        setTimeout(() => {
          navigate("/showtournaments");
        }, 3000);
      } else if (role === "ADMIN") {
        const response = await adminLogin(payload);

        sessionStorage.setItem("playerId", response.playerId);

        toast({
          title: `Welcome ${response.firstName},`,
          description: response.message,
          duration: 3000,
        });

        localStorage.setItem("token", response.token);

        setTimeout(() => {
          navigate("/showtournaments");
        }, 3000);
      }
    } catch (error: any) {
      console.log(error);
      toast({
        title: "Login Failed!!",
        variant: "destructive",
        description: error.message || "Something went wrong",
        duration: 3000,
      });
    }
  };
  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] relative flex items-center justify-center overflow-hidden py-22">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />

        {/* Decorative orbs */}
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

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1.5 bg-primary/20 rounded-full text-xs font-medium text-foreground mb-3">
              🏏 Welcome Back
            </span>
            <h1 className="text-2xl font-extrabold text-foreground">
              Login to CricLively
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              Live matches and stats await
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4">
            {/* Role Slider */}
            <div className="flex justify-center mb-2">
              <div className="relative flex bg-background/70 border border-border rounded-full p-1 w-full max-w-xs">
                {(["PLAYER", "ORGANIZER", "ADMIN"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 z-10 text-xs font-semibold py-2 rounded-full transition-colors ${
                      role === r
                        ? "text-primary-foreground"
                        : "text-foreground/70"
                    }`}
                  >
                    {r}
                  </button>
                ))}

                {/* Sliding indicator */}
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-1 bottom-1 w-1/3 bg-primary rounded-full"
                  style={{
                    left:
                      role === "PLAYER"
                        ? "0%"
                        : role === "ORGANIZER"
                        ? "33.33%"
                        : "66.66%",
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@cricket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-foreground/80">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-accent font-medium hover:underline"
              >
                Forgot?
              </button>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              onClick={handleLogin}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-shadow"
            >
              Login
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground/60">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-2.5 border-2 border-foreground/30 rounded-full font-semibold text-sm text-foreground backdrop-blur-sm hover:bg-foreground/10 transition-colors"
          >
            Continue with Google
          </motion.button>

          {/* Footer */}
          <p className="text-center text-xs text-foreground/70 mt-5">
            New here?{" "}
            <span className="text-accent font-semibold cursor-pointer hover:underline">
              Create an account
            </span>
          </p>
        </motion.div>
      </section>
    </>
  );
}
