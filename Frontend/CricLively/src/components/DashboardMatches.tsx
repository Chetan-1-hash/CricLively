import { canOrganize } from "../lib/auth";
import { openScoreboard, openScorer } from "../lib/matchAccess";
import ScorerAccessDialog from "./ScorerAccessDialog";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { getSelectedTournament, saveSelectedTournament } from "../lib/selectedTournament";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import MatchCard from "../components/MatchCard";
import { useLocation, useNavigate } from "react-router-dom";
import { MatchResponse } from "./data/MatchEntity";
import { getTournamentMatches } from "../API/MatchApi";
import { minimalScores } from "../lib/matchScore";
import TournamentListAPI from "../API/TournamentAPI";
import { toast } from "../hooks/use-toast";
import ExtendTournamentDialog from "./ExtendTournamentDialog";
import type { TournamentResponse } from "./data/TournamentEntity";


export default function DashboardMatches() {
  const location = useLocation();
  // The router state is lost after a refresh or after creating a team / match, so fall back to the saved one
  const initialTournament = useMemo(
    () => location.state?.tournament ?? getSelectedTournament(),
    [location.state]
  );
  // always show the latest dates / finished / extension info from the server
  const [fresh, setFresh] = useState<TournamentResponse | null>(null);
  const tournamentDetails: (TournamentResponse & { coverImage?: string }) | null =
    fresh && initialTournament && fresh.id === initialTournament.id ? fresh : initialTournament;
  const [extendOpen, setExtendOpen] = useState(false);

  const navigate = useNavigate();
  const organizer = canOrganize(); // only organizers/admins see the create menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accessMatchId, setAccessMatchId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [activeTab, setActiveTab] = useState<
    "matches" | "points" | "leaderboard"
  >("matches");

  const [matchFilter, setMatchFilter] = useState<
    "LIVE" | "UPCOMING" | "FINISHED" | "ABANDONED"
  >("LIVE");

  const loadTournament = async () => {
    if (!initialTournament) return;
    try {
      const list = await TournamentListAPI();
      const mine = list.find((t) => t.id === initialTournament.id);
      if (mine) setFresh(mine);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!tournamentDetails) return;
    saveSelectedTournament(tournamentDetails);
    loadAllMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentDetails]);

  useEffect(() => {
    loadTournament();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTournament?.id]);

  // scores and statuses update by themselves
  useLiveUpdates("*", () => {
    loadAllMatches();
    loadTournament();
  });

  const loadAllMatches = async () => {
    if (!tournamentDetails) return;
    try {
      const data = await getTournamentMatches(tournamentDetails.id);
      setMatches(data);
    } catch (err) {
      if ((err as { status?: number }).status === 403) {
        // not following this tournament: back to the list with the reason
        toast({ title: "You can't open this tournament", description: (err as Error).message, variant: "destructive" });
        navigate("/showTournaments");
        return;
      }
      console.error(err);
    }
  };

  const filteredMatches = matches.filter(
    (m) => m.tournamentId === tournamentDetails?.id && m.matchStatus === matchFilter
);

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (!tournamentDetails) return;
    if (tournamentDetails.finished && (action === "New Match")) {
      toast({
        title: "Tournament has ended",
        description: `It ended on ${tournamentDetails.endDate}. Extend the tournament to add new matches.`,
        variant: "destructive",
      });
      return;
    }
    if (action === "New Match") {
      navigate(`/matchesDashboard/createMatch`, {
        state: {
          tournamentId: tournamentDetails.id,
        },
      });
    } else if (action === "New Team") {
      navigate(`/matchesDashboard/createTeam`, {
        state: {
          tournamentId: tournamentDetails.id,
        },
      });
    }
  };
  

  if (!tournamentDetails) {
    return (
      <>
        <Navbar />
        <section className="min-h-[100vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">No tournament selected</h1>
          <p className="text-foreground/70">Open a tournament from the list first.</p>
          <button
            onClick={() => navigate("/showTournaments")}
            className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold"
          >
            Go to tournaments
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {accessMatchId && (
        <ScorerAccessDialog
          matchId={accessMatchId}
          onClose={() => {
            setAccessMatchId(null);
            loadAllMatches();
          }}
        />
      )}

      {extendOpen && tournamentDetails && (
        <ExtendTournamentDialog
          tournament={tournamentDetails}
          onClose={() => setExtendOpen(false)}
          onDone={(t) => {
            setFresh(t);
            setExtendOpen(false);
          }}
        />
      )}

      <section className="min-h-[100vh] relative py-20 bg-background/80">
        {/* COVER SECTION */}
        <section className="h-[30vh] relative bg-gradient-to-r from-green-700 to-green-500">
          {tournamentDetails.coverImage && (
            <img
              src={tournamentDetails.coverImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {tournamentDetails.name}
            </h1>
          </div>
          {/* + Button */}
          {organizer && (
          <div className="absolute top-4 right-8 z-50">
            <motion.button
              onClick={handleDropdownToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white text-2xl font-bold shadow-lg hover:bg-red-700 transition-colors"
            >
              +
            </motion.button>

            {/* Dropdown */}
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-40 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
              >
                {["New Match", "New Team"].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleActionClick(item)}
                    className="w-full text-left px-4 py-3 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          )}
        </section>

        {/* DASHBOARD */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          {tournamentDetails.finished && (
            <div className="mb-6 rounded-2xl border border-red-600/40 bg-red-600/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">This tournament ended on {tournamentDetails.endDate}</p>
                <p className="text-sm text-foreground/70">
                  New matches and new scoring are locked. Running matches can still be closed.
                </p>
              </div>
              {tournamentDetails.canExtend && (
                <button
                  onClick={() => setExtendOpen(true)}
                  className="px-5 py-2 rounded-full bg-red-600 text-white text-sm font-semibold"
                >
                  Extend tournament
                </button>
              )}
            </div>
          )}
          {!tournamentDetails.finished && tournamentDetails.canExtend && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setExtendOpen(true)}
                className="text-xs font-semibold text-foreground/70 hover:text-foreground underline"
              >
                Extend end date
              </button>
            </div>
          )}
          {(tournamentDetails.extensions ?? []).length > 0 && (
            <div className="mb-6 rounded-2xl bg-card/70 px-5 py-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Extended timeline</p>
              <ul className="space-y-1.5 text-foreground/80">
                {(tournamentDetails.extensions ?? []).map((x, i) => (
                  <li key={i}>
                    {x.previousEndDate} → <b>{x.newEndDate}</b> · {x.reason}
                    {x.extendedByName ? ` (by ${x.extendedByName})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* TOP TABS */}
          <div className="flex gap-3 mb-8">
            {["matches", "points", "leaderboard"].map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground"
                }`}
              >
                {tab === "matches"
                  ? "Matches"
                  : tab === "points"
                  ? "Points Table"
                  : "Leaderboard"}
              </motion.button>
            ))}
          </div>

          {/* CONTENT */}
          <AnimatePresence mode="wait">
            {/* MATCHES */}
            {activeTab === "matches" && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* MATCH FILTER */}
                <div className="flex gap-3 mb-8">
                  {["LIVE" , "FINISHED" , "ABANDONED" , "UPCOMING"].map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMatchFilter(status as any)}
                      className={`px-5 py-2 rounded-full text-sm font-semibold ${
                        matchFilter === status
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/60 text-foreground"
                      }`}
                    >
                      {status.toUpperCase()}
                    </motion.button>
                  ))}
                </div>

                {/* MATCH CARDS */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match, index) => (
                     <MatchCard
                        key={match.matchId}
                        index={index}
                        team1={match.teamAName}
                        team2={match.teamBName}
                        team1Score={minimalScores(match).teamA}
                        team2Score={minimalScores(match).teamB}
                        resultText={match.resultText}
                        note={match.tournamentFinished && match.matchStatus === "UPCOMING" ? "Tournament ended - scoring is locked" : undefined}
                        status={match.matchStatus}
                        time={`${match.date} ${match.time}`}
                        venue={match.venue}
                        onViewScoreboard={() => openScoreboard(match, navigate)}
                        onScore={
                          match.canScore && (match.matchStatus === "LIVE" || match.matchStatus === "UPCOMING")
                            ? () => openScorer(match, navigate)
                            : undefined
                        }
                        onManageAccess={
                          match.canManage && (match.matchStatus === "LIVE" || match.matchStatus === "UPCOMING")
                            ? () => setAccessMatchId(match.matchId)
                            : undefined
                        }
                        scoreLabel={match.matchStatus === "UPCOMING" ? "Start Scoring" : "Score"}
                    />
                    ))
                  ) : (
                    <div className="col-span-full flex justify-center items-center py-20">
                      <div className="text-center bg-card/70 backdrop-blur-xl px-8 py-10 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-2">
                          Matches will appear here
                        </h3>
                        <p className="text-foreground/60">Very soon.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* POINTS TABLE */}
            {activeTab === "points" && (
              <motion.div
                key="points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/80 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold mb-4">Points Table</h2>
                <p className="text-foreground/70">
                  Points table will appear here.
                </p>
              </motion.div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/80 rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
                <p className="text-foreground/70">
                  Player stats & rankings will appear here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </section>
    </>
  );
}
