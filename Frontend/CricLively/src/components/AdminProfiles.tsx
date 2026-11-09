import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { adminListProfiles } from "../API/ProfileEditAPI";
import type { MyProfile } from "../lib/auth";

// ADMIN ONLY page (guarded in App.tsx and again by the server).
export default function AdminProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<MyProfile[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListProfiles()
      .then(setProfiles)
      .catch((e: Error) => setError(e.message || "Could not load users"))
      .finally(() => setLoading(false));
  }, []);

  const nameOf = (p: MyProfile) =>
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") || "(no player profile)";

  const q = search.trim().toLowerCase();
  const shown = profiles.filter(
    (p) =>
      !q ||
      nameOf(p).toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.mobileNumber ?? "").includes(q)
  );

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] pt-28 pb-12 px-4 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-foreground text-center mb-6">Manage users</h1>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile"
            className="w-full mb-5 px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
          />

          {loading && <p className="text-center text-foreground/70">Loading…</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {!loading && !error && shown.length === 0 && (
            <p className="text-center text-foreground/70">No users found.</p>
          )}

          <div className="space-y-3">
            {shown.map((p) => (
              <div
                key={p.profileId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{nameOf(p)}</p>
                  <p className="text-xs text-foreground/60">
                    {p.email} · {p.mobileNumber ?? "no mobile"}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {p.roles.map((r) => (
                      <span key={r} className="px-2.5 py-0.5 rounded-full bg-primary/20 text-xs font-semibold">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/users/${p.profileId}`)}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
