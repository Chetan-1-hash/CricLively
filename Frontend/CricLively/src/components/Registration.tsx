import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { toast } from "../components/ui/use-toast";
import { useState } from "react";
import {
  parseFullName,
  type PlayerRegisterRequest,
  type PlayerRegisterResponse,
} from "./data/DTO";
import { registerPlayer } from "../API/RegistrationController";
import { useNavigate } from "react-router-dom";
import { login } from "../API/PlayerAPI";
import { saveSession } from "../lib/auth";

export default function Registration() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const { firstName, middleName, lastName } = parseFullName(fullName);

    const payload: PlayerRegisterRequest = {
      firstName,
      middleName,
      lastName,
      dob,
      mobileNumber,
      email,
      password,
    };

    
    try {
      const playerresponse: PlayerRegisterResponse = await registerPlayer(
      payload
    );
      toast({
        title: `Welcome ${playerresponse.firstName},`,
        description: playerresponse.message,
        duration: 3000,
      });
      // log the new person in, so the next page (cricket details) is allowed to save
      const me = await login({ email, password });
      saveSession(me);
      setTimeout(() => {
        navigate(`/player/${playerresponse.playerId}`);
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Resgitration Failed!!",
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
          className="absolute top-18 left-16 w-32 h-32 bg-accent/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-16 right-16 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        {/* Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="card-glass relative z-10 w-full max-w-md rounded-3xl p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <span className="badge-glass text-xs mb-3 inline-block">
              🏏 Join CricLively
            </span>
            <h1 className="text-2xl font-extrabold text-foreground">
              Create Your Account
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              Sign up and stay updated with live cricket matches
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" placeholder="Your Name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} className="input-glass" />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Date of Birth</label>
              <input type="date" value={dob}
                onChange={(e) => setDob(e.target.value)} className="input-glass" />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Mobile Number</label>
              <input type="tel" placeholder="1234567890" value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)} className="input-glass" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Email Address</label>
              <input type="email" placeholder="you@cricket.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="input-glass" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} className="input-glass" />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Confirm Password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} className="input-glass" />
            </div>

            {/* Register Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRegister}
              className="btn-primary-glass"
            >
              Register
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground/60">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Register */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-ghost-glass"
          >
            Continue with Google
          </motion.button>

          {/* Footer */}
          <p className="text-center text-xs text-foreground/70 mt-5">
            Already have an account?{" "}
            <span className="text-accent font-semibold cursor-pointer hover:underline">
              Login
            </span>
          </p>
        </motion.div>
      </section>
    </>
  );
}
