import { useEffect, useState } from "react";
import { SectionSpinner } from "./Spinner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { adminListProfiles, adminApproveOrganizer, adminRejectOrganizer } from "../API/ProfileEditAPI";
import { toast } from "../hooks/use-toast";
import type { MyProfile } from "../lib/auth";
import VerificationBadge from "./VerificationBadge";
import AddPlayerDialog from "./AddPlayerDialog";

// ADMIN ONLY page (guarded in App.tsx and again by the server).
export default function AdminProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<MyProfile[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const loadProfiles = () => {
    setLoading(true);
    adminListProfiles()
      .then(setProfiles)
      .catch((e: Error) => setError(e.message || "Could not load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const decide = async (p: MyProfile, approve: boolean) => {
    try {
      const updated = approve ? await adminApproveOrganizer(p.profileId) : await adminRejectOrganizer(p.profileId);
      setProfiles((list) => list.map((x) => (x.profileId === updated.profileId ? updated : x)));
      toast({ title: approve ? "Organizer access approved" : "Request rejected", description: p.email });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    }
  };

  const pending = profiles.filter((p) => p.organizerRequestStatus === "PENDING");

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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-3xl font-bold text-foreground">Manage users</h1>
            <button
              type="button"
              onClick={() => setShowAddPlayer(true)}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              + Add Player & Profile
            </button>
          </div>

          {pending.length > 0 && (
            <div className="mb-6 rounded-2xl border border-yellow-500/60 bg-yellow-500/10 p-4">
              <h2 className="font-semibold text-foreground mb-3">Organizer requests ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.profileId} className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{nameOf(p)}</p>
                      <p className="text-xs text-foreground/60">{p.email}</p>
                      <p className="text-xs text-foreground/80 mt-1">"{p.organizerRequestReason}"</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => decide(p, true)} className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        Approve
                      </button>
                      <button onClick={() => decide(p, false)} className="px-4 py-1.5 rounded-full border-2 border-red-600 text-red-600 text-xs font-semibold">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile"
            className="w-full mb-5 px-4 py-3 rounded-xl bg-background/70 border border-border text-sm"
          />

          {loading && <SectionSpinner label="Loading people…" />}
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    <VerificationBadge
                      verified={p.emailVerified}
                      matchesPlayed={p.matchesPlayed ?? 0}
                    />
                    <span className="px-2.5 py-0.5 rounded-full bg-foreground/10 text-xs font-medium">
                      Matches: {p.matchesPlayed ?? 0}
                    </span>
                    {p.organizerRequestStatus === "PENDING" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-semibold">
                        Wants organizer access
                      </span>
                    )}
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
      {showAddPlayer && (
        <AddPlayerDialog
          onClose={() => setShowAddPlayer(false)}
          onCreated={() => loadProfiles()}
        />
      )}
    </>
  );
}
