import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import { AddTournamentRequest, type ProfileList } from "./data/DTO";
import { ProfileListAPI } from "../API/ProfileAPI";
import { toast } from "../hooks/use-toast";
import { AddTournamentAPI, ExistByVenueAPI } from "../API/TournamentAPI";

export default function CreateTournament() {
  /* ================= TOURNAMENT ================= */
  const [tournament, setTournament] = useState(
    new AddTournamentRequest({
      name: "",
      coverImage: undefined,
      format: "",
      startDate: "",
      endDate: "",
      venue: "",
      organizerIds: [],
    })
  );

  const [preview, setPreview] = useState("");

  /* ================= ORGANIZERS ================= */
  const [organizers, setOrganizers] = useState<ProfileList[]>([]);
  const [organizerQuery, setOrganizerQuery] = useState("");
  const [selectedOrganizers, setSelectedOrganizers] = useState<ProfileList[]>(
    []
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [venues, setVenues] = useState<string[]>([]);

  /* ================= LOAD ORGANIZERS ================= */
  useEffect(() => {
    fetchOrganizerList();
    venueList();
  }, []);

  const fetchOrganizerList = async () => {
    try {
      const resp = await ProfileListAPI();
      setOrganizers(resp.filter((o) => (o.role ?? []).includes("ORGANIZER"))); // players cannot be tournament organizers
    } catch (err: any) {
      toast({
        title: "Failed to load organizers",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ================= CREATE TOURNAMENT ================= */
  const addTournament = async () => {
    try {
      await AddTournamentAPI(tournament);
      toast({ title: "Tournament created successfully 🎉" });
    } catch (err: any) {
      console.log(err);
      toast({
        title: "Failed to create tournament",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ================= COVER IMAGE ================= */
  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTournament({ ...tournament, coverImage: file });
    setPreview(URL.createObjectURL(file));
  };

  /* ================= SEARCH ================= */
  const searchOrganizer = () => {
    if (!organizerQuery.trim()) return;
    setHasSearched(true);
  };

  const filteredOrganizers =
    hasSearched && organizerQuery.trim()
      ? organizers.filter((o) => {
          const fullName = `${o.firstName} ${o.middleName ?? ""} ${
            o.lastName
          }`.toLowerCase();
          const mobile = o.mobileNumber ?? "";

          return (
            (fullName.includes(organizerQuery.toLowerCase()) ||
              mobile.includes(organizerQuery)) &&
            !selectedOrganizers.some((sel) => sel.id === o.id)
          );
        })
      : [];

  /* ================= SELECT / REMOVE ================= */
  const addOrganizer = (org: ProfileList) => {
    setSelectedOrganizers((prev) => [...prev, org]);
    setTournament((prev) => ({
      ...prev,
      organizerIds: [...prev.organizerIds, org.id],
    }));

    setOrganizerQuery("");
    setHasSearched(false);
  };

  const removeOrganizer = (id: string) => {
    setSelectedOrganizers((prev) => prev.filter((o) => o.id !== id));
    setTournament((prev) => ({
      ...prev,
      organizerIds: prev.organizerIds.filter((oid) => oid !== id),
    }));
  };

  const venueList = async () => {
    try {
      const data = await ExistByVenueAPI();
      setVenues(data);
    } catch (e) {
      console.log(e);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Navbar />

      <section className="min-h-screen pt-28 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-3xl font-bold text-center mb-8">
            Create Tournament
          </h1>

          {/* COVER IMAGE */}
          <div className="flex flex-col items-center mb-10">
            {preview ? (
              <img
                src={preview}
                className="w-full max-w-md h-44 rounded-2xl object-cover border"
              />
            ) : (
              <div className="w-full max-w-md h-44 rounded-2xl bg-foreground/10 flex items-center justify-center text-4xl">
                🏆
              </div>
            )}

            <label className="text-primary cursor-pointer mt-3 text-sm font-medium">
              Upload Cover Image
              <input type="file" hidden onChange={handleCover} />
            </label>
          </div>

          {/* FORM */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Tournament Name"
                value={tournament.name}
                onChange={(e) =>
                  setTournament({ ...tournament, name: e.target.value })
                }
              />

              <select
                value={tournament.format}
                onChange={(e) =>
                  setTournament({ ...tournament, format: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Format
                </option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="TEST">Test</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={tournament.startDate}
                onChange={(e) =>
                  setTournament({ ...tournament, startDate: e.target.value })
                }
              />
              <input
                type="date"
                value={tournament.endDate}
                onChange={(e) =>
                  setTournament({ ...tournament, endDate: e.target.value })
                }
              />
            </div>

            <select
              value={tournament.venue}
              onChange={(e) =>
                setTournament({
                  ...tournament,
                  venue: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border"
            >
              <option value="" className="bg-[#87cd37] text-white border rounded px-3 py-2">Select Venue</option>

              {venues.map((venue) => (
                <option key={venue} value={venue} className="bg-[#87cd37] text-white border rounded px-3 py-2">
                  {venue}
                </option>
              ))}
            </select>

            {/* ORGANIZERS */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Organizer(s)
              </label>

              <div className="flex gap-2">
                <input
                  placeholder="Enter name or mobile number"
                  value={organizerQuery}
                  onChange={(e) => {
                    setOrganizerQuery(e.target.value);
                    setHasSearched(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border"
                />

                <button
                  onClick={searchOrganizer}
                  disabled={!organizerQuery.trim()}
                  className="px-5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {/* SEARCH RESULTS */}
              {filteredOrganizers.length > 0 && (
                <div className="mt-3 border rounded-xl overflow-hidden">
                  {filteredOrganizers.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => addOrganizer(org)}
                      className="px-4 py-2 cursor-pointer hover:bg-primary/10 text-sm"
                    >
                      {org.firstName}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({org.mobileNumber ?? "No mobile"})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SELECTED */}
              {selectedOrganizers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedOrganizers.map((org) => (
                    <span
                      key={org.id}
                      className="px-3 py-1 rounded-full bg-primary/15 text-sm flex items-center gap-2"
                    >
                      {org.firstName}
                      <button
                        onClick={() => removeOrganizer(org.id)}
                        className="text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={addTournament}
            className="w-full mt-10 py-3 bg-primary text-primary-foreground rounded-full font-semibold"
          >
            Create Tournament
          </motion.button>
        </motion.div>
      </section>
    </>
  );
}
