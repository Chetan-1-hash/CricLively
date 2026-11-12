import { useEffect, useState } from "react";
import { SectionSpinner } from "./Spinner";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import { fetchMe } from "../API/PlayerAPI";
import { API_URL } from "../API/client";
import { addCricketDetails } from "../API/CricketDetailsController";
import {
  adminGetProfile,
  adminUpdateInfo,
  adminUpdateRoles,
  updateMyInfo,
  type PersonalInfo,
} from "../API/ProfileEditAPI";
import { PlayerCricketDetailsRequest } from "./data/DTO";
import type { BattingStyle, BowlingStyle, PlayingRole } from "./data/Player";
import { saveSession, type MyProfile, type Role } from "../lib/auth";
import { toast } from "../hooks/use-toast";
import { BATTING_STYLES, BOWLING_STYLES, PLAYING_ROLES } from "../lib/cricketOptions";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-background/70 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/**
 * One form, two uses:
 *   mode="self"  -> /profile/edit            : a person edits THEIR OWN profile
 *   mode="admin" -> /admin/users/:profileId  : an admin edits SOMEONE ELSE (route is admin-only)
 * The server enforces the same rule again, so hiding buttons is only for looks.
 */
export default function ProfileEditForm({ mode }: { mode: "self" | "admin" }) {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const admin = mode === "admin";
  const backTo = admin ? "/admin/users" : "/profile";

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [info, setInfo] = useState<PersonalInfo>({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    mobileNumber: "",
  });
  const [batting, setBatting] = useState("");
  const [bowling, setBowling] = useState("");
  const [role, setRole] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isAdminRole, setIsAdminRole] = useState(false);

  useEffect(() => {
    const load = admin && profileId ? adminGetProfile(profileId) : fetchMe();
    load
      .then((p) => {
        setProfile(p);
        setInfo({
          firstName: p.firstName ?? "",
          middleName: p.middleName ?? "",
          lastName: p.lastName ?? "",
          dob: p.dob ?? "",
          mobileNumber: p.mobileNumber ?? "",
        });
        setBatting(p.battingStyle ?? "");
        setBowling(p.bowlingStyle ?? "");
        setRole(p.playingRole ?? "");
        setIsOrganizer(p.roles.includes("ORGANIZER"));
        setIsAdminRole(p.roles.includes("ADMIN"));
      })
      .catch((e: Error) => setError(e.message || "Could not load the profile"));
  }, [admin, profileId]);

  const set = (key: keyof PersonalInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((prev) => ({ ...prev, [key]: e.target.value }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const hasPlayer = !!profile?.playerId;

  const save = async () => {
    if (!profile || saving) return;

    if (hasPlayer && !info.firstName.trim()) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    if (!info.mobileNumber.trim()) {
      toast({ title: "Mobile number is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. personal info
      if (admin) await adminUpdateInfo(profile.profileId, info);
      else await updateMyInfo(info);

      // 2. cricket details + photo (only when this person is a player and something was chosen)
      if (hasPlayer && (batting || bowling || role || imageFile)) {
        await addCricketDetails(
          profile.playerId as string,
          new PlayerCricketDetailsRequest({
            battingStyle: (batting || undefined) as BattingStyle | undefined,
            bowlingStyle: (bowling || undefined) as BowlingStyle | undefined,
            playingRole: (role || undefined) as PlayingRole | undefined,
            image: imageFile || undefined,
          })
        );
      }

      // 3. roles (admin only)
      if (admin) {
        const roles: Role[] = ["PLAYER"];
        if (isOrganizer) roles.push("ORGANIZER");
        if (isAdminRole) roles.push("ADMIN");
        await adminUpdateRoles(profile.profileId, roles);
      }

      // keep the saved copy of "who am I" fresh when you edited yourself
      if (!admin) saveSession(await fetchMe());

      toast({ title: "Saved", description: "Profile updated successfully.", duration: 2000 });
      navigate(backTo);
    } catch (e) {
      toast({
        title: "Could not save",
        variant: "destructive",
        description: (e as Error).message || "Something went wrong",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const photo = imagePreview || (profile?.image ? `${API_URL}/images/${profile.image}` : "");

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
          <h1 className="text-2xl font-bold text-foreground text-center mb-1">
            {admin ? "Edit user" : "Edit my profile"}
          </h1>
          {profile && <p className="text-center text-xs text-foreground/60 mb-6">{profile.email}</p>}

          {error && <p className="text-center text-red-600">{error}</p>}
          {!error && !profile && <SectionSpinner label="Loading profile…" />}

          {profile && (
            <div className="space-y-4">
              {hasPlayer && (
                <>
                  <div className="flex flex-col items-center gap-3">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-2 border-primary shadow-md"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-foreground/10 flex items-center justify-center text-3xl">
                        👤
                      </div>
                    )}
                    <label className="cursor-pointer text-sm font-medium text-primary">
                      {photo ? "Change photo" : "Upload photo"}
                      <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                    </label>
                  </div>

                  <Field label="First name">
                    <input className={inputCls} value={info.firstName} onChange={set("firstName")} />
                  </Field>
                  <Field label="Middle name (optional)">
                    <input className={inputCls} value={info.middleName} onChange={set("middleName")} />
                  </Field>
                  <Field label="Last name">
                    <input className={inputCls} value={info.lastName} onChange={set("lastName")} />
                  </Field>
                  <Field label="Date of birth">
                    <input
                      type="date"
                      className={inputCls}
                      value={info.dob}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={set("dob")}
                    />
                  </Field>
                </>
              )}

              <Field label="Mobile number">
                <input className={inputCls} value={info.mobileNumber} onChange={set("mobileNumber")} />
              </Field>

              {hasPlayer && (
                <>
                  <Field label="Batting style">
                    <select className={inputCls} value={batting} onChange={(e) => setBatting(e.target.value)}>
                      <option value="">— not set —</option>
                      {BATTING_STYLES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bowling style">
                    <select className={inputCls} value={bowling} onChange={(e) => setBowling(e.target.value)}>
                      <option value="">— not set —</option>
                      {BOWLING_STYLES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Playing role">
                    <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="">— not set —</option>
                      {PLAYING_ROLES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {/* Roles: ADMIN ONLY. Everybody always stays a PLAYER. */}
              {admin && (
                <div className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Roles</p>
                  <label className="flex items-center gap-2 text-sm text-foreground/60">
                    <input type="checkbox" checked disabled /> Player (always)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={isOrganizer}
                      onChange={(e) => setIsOrganizer(e.target.checked)}
                    />
                    Organizer (create tournaments, teams, matches, scoring)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={isAdminRole}
                      onChange={(e) => setIsAdminRole(e.target.checked)}
                    />
                    Admin (full access)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className="flex-1 py-3 border-2 border-foreground/30 rounded-full font-semibold text-foreground"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  whileHover={{ scale: saving ? 1 : 1.03 }}
                  whileTap={{ scale: saving ? 1 : 0.97 }}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving..." : "Save"}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </>
  );
}
