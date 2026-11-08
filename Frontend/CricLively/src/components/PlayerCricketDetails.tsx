import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { toast } from "../components/ui/use-toast";
import type { BattingStyle, BowlingStyle, PlayingRole } from "./data/Player";
import {
  PlayerCricketDetailsRequest,
  type PlayerRegisterResponse,
} from "./data/DTO";
import { addCricketDetails } from "../API/CricketDetailsController";
import { useNavigate } from "react-router-dom";

export default function PlayerCricketDetails() {
  const playerId: string | null = sessionStorage.getItem("playerId");

  const [battingStyle, setBattingStyle] = useState<BattingStyle | "">("");
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | "">("");
  const [playingRole, setPlayingRole] = useState<PlayingRole | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    toast({
      title: "Add some cricket details here!",
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!playerId) {
      toast({
        title: "ERROR",
        variant: "destructive",
        description: "Player id is null",
        duration: 3000,
      });
      return;
    }

    const payload = new PlayerCricketDetailsRequest({
      battingStyle: battingStyle || undefined,
      bowlingStyle: bowlingStyle || undefined,
      playingRole: playingRole || undefined,
      image: imageFile || undefined, // later replace with backend image URL
    });

    try {
      const playerresponse: PlayerRegisterResponse = await addCricketDetails(
        playerId,
        payload
      );

      toast({
        title: `Welcome to CricLively, ${playerresponse.firstName}`,
        description: playerresponse.message,
        duration: 3000,
      });

      setTimeout(() => {
        navigate("/showtournaments");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Adding details failed",
        variant: "destructive",
        description: error.message || "Something went wrong",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-[100vh] flex items-center justify-center py-22">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
        >
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
            Add Your Cricket Details
          </h1>

          <div className="space-y-4">

            {/* IMAGE UPLOAD (TOP) */}
            <div className="flex flex-col items-center gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover border-2 border-primary shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-foreground/10 flex items-center justify-center text-3xl">
                  👤
                </div>
              )}

              <label className="cursor-pointer text-sm font-medium text-primary">
                Upload Profile Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Batting Style */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Batting Style
              </label>
              <select
                value={battingStyle}
                onChange={(e) =>
                  setBattingStyle(e.target.value as BattingStyle)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="" disabled>
                  Select Batting Style
                </option>
                <option value="Right_Hand">Right Hand</option>
                <option value="Left_Hand">Left Hand</option>
              </select>
            </div>

            {/* Bowling Style */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Bowling Style
              </label>
              <select
                value={bowlingStyle}
                onChange={(e) =>
                  setBowlingStyle(e.target.value as BowlingStyle)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="" disabled>
                  Select Bowling Style
                </option>

                <option value="Right_ArmFast">Right Arm Fast</option>
                <option value="Right_ArmFastMedium">Right Arm Fast Medium</option>
                <option value="Right_ArmMediumFast">Right Arm Medium Fast</option>
                <option value="Right_ArmMedium">Right Arm Medium</option>
                <option value="Left_ArmFast">Left Arm Fast</option>
                <option value="Left_ArmMedium">Left Arm Medium</option>
                <option value="Right_ArmOffBreak">Right Arm Off Break</option>
                <option value="Right_ArmLegBreak">Right Arm Leg Break</option>
                <option value="Left_ArmOrthodox">Left Arm Orthodox</option>
              </select>
            </div>

            {/* Playing Role */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Playing Role
              </label>
              <select
                value={playingRole}
                onChange={(e) =>
                  setPlayingRole(e.target.value as PlayingRole)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-background/70 border border-border text-sm"
              >
                <option value="" disabled>
                  Select Playing Role
                </option>

                <option value="Batting">Batsman</option>
                <option value="Bowling">Bowler</option>
                <option value="Batting_Allrounder">
                  Batting All-Rounder
                </option>
                <option value="Bowling_Allrounder">
                  Bowling All-Rounder
                </option>
                <option value="Allrounder">All-Rounder</option>
                <option value="WicketKeeper_Batter">
                  Wicket Keeper Batter
                </option>
              </select>
            </div>

            {/* SUBMIT */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg"
            >
              Save Details
            </motion.button>
          </div>
        </motion.div>
      </section>
    </>
  );
}
