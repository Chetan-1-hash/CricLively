import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import ImageController from "../API/ImageController";
import { logout } from "../API/PlayerAPI";
import { clearSession, getSession } from "../lib/auth";

const authNavItems = [
  { name: "Home", to: "/" },
  { name: "Login", to: "/login" },
  { name: "Register", to: "/register" },
];

const appNavItems = [
  { name: "Matches", to: "/matches" },
  { name: "Tournament", to: "/showtournaments" },
  { name: "Stats", to: "/stats" },
  { name: "Gallery", to: "/gallery" },
];

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const playerId = sessionStorage.getItem("playerId");
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setIsAuthenticated(!!getSession());
  }, [location.pathname]);

  useEffect(() => {
    if (!playerId) {
      setProfileImage(null);
      return;
    }

    ImageController(playerId).then(setProfileImage);
  }, [playerId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // end the session on the server too
    } catch {
      // even if the server cannot be reached, clear this browser
    }
    clearSession();
    setProfileOpen(false);
    setIsAuthenticated(false);
    navigate("/login");
  };

  const navItems = isAuthenticated ? appNavItems : authNavItems;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 py-3 bg-background/70 backdrop-blur-sm shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <motion.div
          className="text-2xl md:text-3xl font-bold bg-secondary/60 rounded-full px-4 py-1 text-foreground cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/")}
        >
          CricLively
        </motion.div>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/60 rounded-full px-2 py-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/90 hover:text-foreground"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative">
          {/* Live Button */}
          <motion.button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            Live Scores
          </motion.button>

          {/* Profile Dropdown */}
          {isAuthenticated && (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-md overflow-hidden"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-48 bg-card/90 backdrop-blur-xl rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-2 text-xs text-foreground/60 border-b border-border/40">
                      {getSession()?.roles.join(" · ")}
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-600 hover:text-white transition"
                    >
                      Manage Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-600 hover:text-white transition"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
