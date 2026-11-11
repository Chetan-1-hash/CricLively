import { canOrganize } from "../lib/auth";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TournamentResponse } from "./data/TournamentEntity";
import { toast } from "../hooks/use-toast";
import TournamentAPI from "../API/TournamentAPI";


export default function DashboardTournament() {
  const navigate = useNavigate();
  const organizer = canOrganize(); // only organizers/admins see the create menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    handleTournament();
  }, []);

  const handleTournament = async() => {
    try{
      const resp = await TournamentAPI();
      setTournaments(resp);

    }
    catch(error : any){
      toast({
        title: "Tournament Dashboard Error!",
        variant: "destructive",
        description: "Error while fetching data."
      });
    }
  }

  const handleActionClick = (action: string) => {
    setDropdownOpen(false);
    if (action === "New Tournament") {
      navigate("/showTournaments/createTournament");
    } else if (action === "New Match") {
      navigate("/matchesDashboard/createMatch");
    }
  };

  return (
    <>
      <section className="min-h-[100vh] relative py-12 bg-background/80">
        <div className="container my-18 mx-auto px-6 relative">
          {/* Header with + button */}
          <div className="flex justify-between items-center mb-12 gap-4">
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold text-foreground"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Available Tournaments
            </motion.h1>

            {/* + Button */}
            {organizer && (
            <div className="relative">
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
                  className="absolute right-0 mt-2 w-40 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {["New Tournament", "New Match"].map((item) => (
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
          </div>

          {/* Tournament Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:scale-105 transition-transform cursor-pointer"
              >
                {/* Tournament image */}
                <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 bg-foreground/10 flex items-center justify-center text-5xl">
                  {tournament.coverImage ? (
                    <img
                      src={tournament.coverImage}
                      alt={tournament.name}
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    "🏆"
                  )}
                </div>

                {/* Tournament info */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {tournament.name}
                </h2>
                <p className="text-sm text-foreground/70 mb-1">
                  {tournament.startDate} – {tournament.endDate}
                </p>
                {tournament.finished && (
                  <span className="inline-block mb-1 px-3 py-0.5 rounded-full text-xs font-bold bg-foreground/20 text-foreground">
                    ENDED
                  </span>
                )}
                {(tournament.extensions ?? []).length > 0 && (
                  <span className="inline-block mb-1 ml-1 px-3 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-black">
                    EXTENDED
                  </span>
                )}
                {/* <p className="text-sm text-foreground/70">
                  {tournament.teamIds.length} Teams
                </p> */}

                {/* Enter button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 w-full py-2.5 bg-accent text-accent-foreground rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/matchesDashboard`,{
                    state: {
                      tournament: tournament,
                    },
                  })}
                >
                  View Tournament
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      

    </>
  );
}
