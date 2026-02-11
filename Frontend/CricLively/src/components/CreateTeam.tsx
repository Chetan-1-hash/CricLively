import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import type { ProfileList } from "./data/DTO";
import { ProfileListAPI } from "../API/ProfileListAPI";
import { TeamsListAPI } from "../API/TeamsAPI";

type Tournament = {
  id: string;
  name: string;
};

export default function CreateTeam() {
  /* ---------------- TEAM NAME & CAPTAIN ---------------- */
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState(""); // New field
  const [nameChecked, setNameChecked] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  /* ---------------- TOURNAMENT ---------------- */
  const [tournamentQuery, setTournamentQuery] = useState("");
  const [tournamentResults, setTournamentResults] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  /* ---------------- PLAYERS ---------------- */
  const [playerQuery, setPlayerQuery] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]); // store only IDs
  const [allPlayers, setAllPlayers] = useState<ProfileList[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  /* ---------------- LOGO ---------------- */
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  /* ======================================================
     TEAM NAME CHECK
  ====================================================== */
  const checkTeamName = async () => {
    setNameChecked(false);
    setNameAvailable(null);

    try {
      const teams = await TeamsListAPI();
      const exists = teams.some(
        (t) => t.name.toLowerCase() === teamName.trim().toLowerCase()
      );
      setNameAvailable(!exists);
    } catch {
      setNameAvailable(false);
    } finally {
      setNameChecked(true);
    }
  };

  /* ======================================================
     PLAYER SEARCH
  ====================================================== */
  const searchPlayers = async () => {
    if (!playerQuery.trim()) return;

    setHasSearched(true);

    if (allPlayers.length === 0) {
      try {
        const data = await ProfileListAPI();
        const playersWithId = data.map((p, idx) => ({
          ...p,
          id: p.id || p.mobileNumber|| idx.toString(),
        }));
        setAllPlayers(playersWithId);
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    }
  };

  const filteredPlayers =
    hasSearched && playerQuery.trim()
      ? allPlayers.filter(
          (p) =>
            `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`
              .toLowerCase()
              .includes(playerQuery.toLowerCase()) &&
            !selectedPlayerIds.includes(p.id)
        )
      : [];

  const addPlayer = (p: ProfileList) => {
    if (!p.id) return;
    setSelectedPlayerIds((prev) => [...prev, p.id!]);
    setPlayerQuery("");
    setHasSearched(false);
  };

  const submitTeam = async () => {
    if (!nameAvailable || !selectedTournament) return;

    const payload = {
      teamName,
      captainName, // send captain
      tournamentId: selectedTournament.id,
      squadPlayerIds: selectedPlayerIds,
      logo,
    };

    console.log("Payload to submit:", payload);
    alert("Team created successfully!");
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-28 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl bg-card/80 rounded-3xl p-8 shadow-2xl"
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
              Upload Team Logo
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
              <p
                className={`text-sm ${
                  nameAvailable ? "text-green-500" : "text-red-500"
                }`}
              >
                {nameAvailable
                  ? "Team name available"
                  : "Team name already exists"}
              </p>
            )}
            <input
              placeholder="Captain Name"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
            />
          </div>

          {/* TOURNAMENT */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Tournament</label>

            <div className="flex gap-2">
              <input
                value={tournamentQuery}
                onChange={(e) => setTournamentQuery(e.target.value)}
                placeholder="Search tournament"
                className="flex-1 px-4 py-3 rounded-xl border"
              />
              <button className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold">
                Search
              </button>
            </div>

            {tournamentResults.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTournament(t);
                  setTournamentResults([]);
                }}
                className="cursor-pointer px-3 py-2 bg-primary/10 rounded-lg"
              >
                {t.name}
              </div>
            ))}

            {selectedTournament && (
              <p className="text-sm text-green-600">
                Selected: {selectedTournament.name}
              </p>
            )}
          </div>

          {/* PLAYERS */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Add Players</label>

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
            <div>
              {filteredPlayers.map((p) => (
                <div
                  key={p.id ?? Math.random()}
                  onClick={() => addPlayer(p)}
                  className="cursor-pointer px-3 py-2 bg-primary/10 rounded-lg"
                >
                  {p.firstName} {p.middleName ?? ""} {p.lastName}
                </div>
              ))}
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
                      className="px-3 py-1 bg-primary/20 rounded-full text-sm"
                    >
                      {p.firstName} {p.middleName ?? ""} {p.lastName}
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
    </>
  );
}
