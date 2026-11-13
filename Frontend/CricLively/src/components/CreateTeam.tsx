import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import type { ProfileList, Team } from "./data/DTO";
import { ProfileListAPI } from "../API/ProfileAPI";
import { addTeamAPI, TeamsListAPI } from "../API/TeamsAPI";
import TournamentAPI from "../API/TournamentAPI";
import { toast } from "../hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import VerificationBadge from "./VerificationBadge";
import AddPlayerDialog from "./AddPlayerDialog";

type Tournament = {
  id: string;
  name: string;
};

export default function CreateTeam() {
  /* ---------------- TEAM NAME & CAPTAIN ---------------- */
  const [teamName, setTeamName] = useState("");
  const [captainQuery, setCaptainQuery] = useState("");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(
    null
  );
  const [hasSearchedCaptain, setHasSearchedCaptain] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  /* ---------------- TOURNAMENT ---------------- */
  const [tournamentQuery, setTournamentQuery] = useState("");
  const [allTournament, setAllTournament] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [hasSearchedTournament, setHasSearchedTournament] = useState(false);

  /* ---------------- PLAYERS ---------------- */
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]); // store only IDs
  const [allPlayers, setAllPlayers] = useState<ProfileList[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [occupiedPlayerIds, setOccupiedPlayerIds] = useState<string[]>([]);

  /* ---------------- LOGO ---------------- */
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const isPlayerBlocked = (p: ProfileList) => !p.emailVerified && (p.matchesPlayed ?? 0) >= 1;

  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = location.state?.tournamentId;

  useEffect(() => {
    tournamentList();
  }, [tournamentId]);

  /* ======================================================
     TEAM NAME CHECK
  ====================================================== */
  const checkTeamName = async () => {
    setNameChecked(false);
    setNameAvailable(null);
    try {
      console.log("IN");    
      const teams = await TeamsListAPI();
      if (!teamName?.trim()) {
        setNameAvailable(false);
        setNameChecked(true);
        return;
      }
      const currentTournamentId = selectedTournament?.id || tournamentId;
      const exists = teams.some(
        (t) =>
          typeof t.teamName === "string" &&
          (!currentTournamentId || String(t.tournamentId) === String(currentTournamentId)) &&
          t.teamName.trim().toLowerCase() === teamName.trim().toLowerCase()
      );

      setNameAvailable(!exists);
    } catch {
      setNameAvailable(false);
    } finally {
      setNameChecked(true);
    }
  };

  const searchCaptain = async () => {
    if (!captainQuery.trim()) return;

    setHasSearchedCaptain(true);

    if (allPlayers.length === 0) {
      try {
        const data = await ProfileListAPI();
        const playersWithId = data.map((p, idx) => ({
          ...p,
          id: p.id || p.mobileNumber || idx.toString(),
        }));
        setAllPlayers(playersWithId);
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    }
  };

  const filteredCaptain =
  hasSearchedCaptain && captainQuery.trim()
    ? allPlayers.filter(
        (p) =>
          `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`
            .toLowerCase()
            .includes(captainQuery.toLowerCase()) &&
          !occupiedPlayerIds.includes(p.id) &&
          !selectedPlayerIds.includes(p.id)
      )
    : [];

  const selectCaptain = (p: ProfileList) => {
    if (!p.id) return;
    if (isPlayerBlocked(p)) {
      toast({
        title: "Email verification required",
        description: `${p.firstName} has already played 1 match without email verification and cannot join a team until verifying their email.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedCaptainId(p.id);
    setCaptainQuery(`${p.firstName} ${p.lastName ?? ""}`.trim());
    setHasSearchedCaptain(false);
  };

  /* ======================================================
     TOURNAMENT SEARCH
  ====================================================== */

  const tournamentList = async () => {
    if(tournamentId==null){
      try {
        const data = await TournamentAPI();
        setAllTournament(data);
        setHasSearchedTournament(true);
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
      }
    }
    else{
      try{
        const data = await TournamentAPI();
        data.forEach((item) => {
          if (tournamentId === item.id) {
            setHasSearchedTournament(true);
            setSelectedTournament(item);
          }
        });
        
      }
      catch (err){
        console.error("Failed to get tournament name", err);
      }
    }
    
  };

  const filteredTournamentList =
    hasSearchedTournament && tournamentQuery.trim()
      ? allTournament.filter((t) =>
          t.name.toLowerCase().includes(tournamentQuery.toLowerCase())
        )
      : [];

  /* ======================================================
     PLAYER SEARCH
  ====================================================== */
  const searchPlayers = async () => {
    if (!playerQuery.trim()) {
      console.log("Player query empty");
      return;
    }

    setHasSearched(true);

    try {
      const [playersData, teamsData] = await Promise.all([
        ProfileListAPI(),
        TeamsListAPI(),
      ]);

      const playersWithId = playersData.map((p, idx) => ({
        ...p,
        id: p.id || p.mobileNumber || idx.toString(),
      }));

      setAllPlayers(playersWithId);

      const currentTournamentId = selectedTournament?.id || tournamentId;

      const occupiedIds = teamsData
        .filter((team) => team.tournamentId === currentTournamentId)
        .flatMap((team) => team.squadPlayerIds || []);

      setOccupiedPlayerIds(occupiedIds);
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const filteredPlayers =
    hasSearched && playerQuery.trim()
      ? allPlayers.filter(
          (p) =>
            `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`
              .toLowerCase()
              .includes(playerQuery.toLowerCase()) &&
            !selectedPlayerIds.includes(p.id) && 
            !occupiedPlayerIds.includes(p.id)
        )
      : [];

  const addPlayer = (p: ProfileList) => {
    if (!p.id) return;
    if (isPlayerBlocked(p)) {
      toast({
        title: "Email verification required",
        description: `${p.firstName} has already played 1 match without email verification and cannot play any more matches or tournaments until verifying their email.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedPlayerIds((prev) => [...prev, p.id!]);
    setPlayerQuery("");
    setHasSearched(false);
  };

  const submitTeam = async () => {
    if (!nameAvailable || !selectedTournament || !selectedCaptainId) {
      const missing = [
        !selectedTournament && "tournament",
        !nameAvailable && "a free team name",
        !selectedCaptainId && "captain",
      ].filter(Boolean);
      toast({
        title: "Failed to create team",
        description: `Please choose: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const payload: Team = {
      tournamentId: selectedTournament.id,
      teamName: teamName,
      logoImage: logo ?? undefined, // the logo is optional
      captainId: selectedCaptainId,
      squadPlayerIds: selectedPlayerIds,
    };

    try {
      await addTeamAPI(payload);
      toast({ title: "Team created successfully 🎉" });
      setTimeout(() => navigate("/matchesDashboard"), 1200);
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Failed to create team",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-28 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl bg-card/80 rounded-3xl p-5 sm:p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-center mb-8">Create Team</h1>

          {/* TEAM LOGO */}
          <div className="flex flex-col items-center mb-8">
            {preview ? (
              <img
                src={preview}
                className="w-32 h-32 rounded-full object-cover border"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-foreground/10 flex items-center justify-center text-4xl">
                🏏
              </div>
            )}

            <label className="mt-3 cursor-pointer text-primary text-sm">
              Upload Team Logo (optional)
              <input
                hidden
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogo(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>

          {/* TEAM NAME & CAPTAIN */}
          <div className="space-y-2">
            <input
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => {
                setTeamName(e.target.value);
                setNameChecked(false);
              }}
              className="w-full px-4 py-3 rounded-xl border"
            />

            <button
              onClick={checkTeamName}
              className="text-sm text-primary underline"
            >
              Check Availability
            </button>

            {nameChecked && (
              <span
                className={`text-sm ${
                  nameAvailable ? "text-sm" : "text-red-500"
                }`}
              >
                {nameAvailable
                  ? ": Team name available"
                  : ": Team name already exists"}
              </span>
            )}
          </div>

          {/* CAPTAIN */}
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Captain</label>

            <div className="flex gap-2">
              <input
                value={captainQuery}
                onChange={(e) => {
                  setCaptainQuery(e.target.value);
                  setHasSearchedCaptain(false);
                }}
                placeholder="Search captain"
                className="flex-1 px-4 py-3 rounded-xl border"
              />
              <button
                disabled={!captainQuery.trim()}
                onClick={searchCaptain}
                className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                Search
              </button>
            </div>

            <div className="space-y-1.5">
              {filteredCaptain.map((p) => {
                const blocked = isPlayerBlocked(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => selectCaptain(p)}
                    className={`px-3 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2 ${
                      blocked
                        ? "bg-red-500/10 opacity-70 cursor-not-allowed"
                        : "cursor-pointer bg-primary/10 hover:bg-primary/20"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {p.firstName} {p.middleName ?? ""} {p.lastName ?? ""}
                    </span>
                    <VerificationBadge
                      verified={p.emailVerified}
                      matchesPlayed={p.matchesPlayed ?? 0}
                    />
                  </div>
                );
              })}
            </div>

            {selectedCaptainId && (() => {
              const cap = allPlayers.find((pl) => pl.id === selectedCaptainId);
              return (
                <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm">
                  <span>
                    Captain: {cap ? `${cap.firstName} ${cap.lastName ?? ""}`.trim() : "Selected"}
                  </span>
                  {cap && (
                    <VerificationBadge
                      verified={cap.emailVerified}
                      matchesPlayed={cap.matchesPlayed ?? 0}
                      compact
                    />
                  )}
                </div>
              );
            })()}
          </div>

          {/* TOURNAMENT */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Tournament</label>

            <div className="flex gap-2">
              <input
                value={
                  tournamentId != null
                    ? selectedTournament?.name || tournamentQuery
                    : tournamentQuery
                }
                onChange={(e) => setTournamentQuery(e.target.value)}
                disabled={tournamentId != null}
                placeholder="Search tournament"
                className="flex-1 px-4 py-3 rounded-xl border"
              />
              <button
                disabled={tournamentId != null}
                className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
                onClick={tournamentList}
              >
                Search
              </button>
            </div>

            {filteredTournamentList.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTournament(t);
                  setTournamentQuery(t.name);
                  setHasSearchedTournament(false);
                }}
                className="cursor-pointer px-3 py-2 bg-primary/10 rounded-lg"
              >
                {t.name}
              </div>
            ))}

            {selectedTournament && tournamentId == null && (
              <span className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                {selectedTournament.name}
              </span>
            )}
          </div>

          {/* PLAYERS */}
          <div className="mt-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium">Add Players</label>
              <button
                type="button"
                onClick={() => setShowAddPlayer(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition"
              >
                + Add New Player & Profile
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={playerQuery}
                onChange={(e) => {
                  setPlayerQuery(e.target.value);
                  setHasSearched(false);
                }}
                placeholder="Search player"
                className="flex-1 px-4 py-3 rounded-xl border"
              />
              <button
                disabled={!playerQuery.trim()}
                onClick={searchPlayers}
                className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                Search
              </button>
            </div>

            {/* FILTERED PLAYERS */}
            <div className="space-y-1.5">
              {filteredPlayers.map((p) => {
                const blocked = isPlayerBlocked(p);
                return (
                  <div
                    key={p.id ?? Math.random()}
                    onClick={() => addPlayer(p)}
                    className={`px-3 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2 ${
                      blocked
                        ? "bg-red-500/10 opacity-70 cursor-not-allowed"
                        : "cursor-pointer bg-primary/10 hover:bg-primary/20"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {p.firstName} {p.middleName ?? ""} {p.lastName ?? ""}
                    </span>
                    <VerificationBadge
                      verified={p.emailVerified}
                      matchesPlayed={p.matchesPlayed ?? 0}
                    />
                  </div>
                );
              })}
            </div>

            {/* SELECTED PLAYERS */}
            {selectedPlayerIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPlayerIds.map((id, index) => {
                  const p = allPlayers.find((pl) => pl.id === id);
                  if (!p) return null;
                  return (
                    <span
                      key={p.id ?? index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm"
                    >
                      <span>
                        {p.firstName} {p.middleName ?? ""} {p.lastName ?? ""}
                      </span>
                      <VerificationBadge
                        verified={p.emailVerified}
                        matchesPlayed={p.matchesPlayed ?? 0}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPlayerIds((prev) => prev.filter((x) => x !== id))
                        }
                        className="text-xs font-bold text-foreground/60 hover:text-red-500"
                        title="Remove player"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            disabled={!nameAvailable || !selectedTournament}
            onClick={submitTeam}
            className="w-full mt-10 py-3 bg-primary text-primary-foreground font-semibold rounded-full"
          >
            Create Team
          </button>
        </motion.div>
      </section>
      {showAddPlayer && (
        <AddPlayerDialog
          onClose={() => setShowAddPlayer(false)}
          onCreated={(created) => {
            setAllPlayers((prev) =>
              prev.some((p) => p.id === created.id) ? prev : [...prev, created]
            );
            if (created.id && !selectedPlayerIds.includes(created.id)) {
              setSelectedPlayerIds((prev) => [...prev, created.id]);
            }
          }}
        />
      )}
    </>
  );
}
