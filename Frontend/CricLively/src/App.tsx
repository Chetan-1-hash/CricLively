import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Matches from "./components/Matches";
import Stats from "./components/Stats";
import TeamGeneration from "./components/TeamGeneration";
import PlayerCricketDetails from "./components/PlayerCricketDetails";
import DashboardTournament from "./components/DashboardTournament";
import CreateTeam from "./components/CreateTeam";
import CreateTournament from "./components/CreateTournament";
import TournamentLayout from "./pages/Tournamentlayout";
import MatchLayout from "./pages/Matchlayout";
import CreateMatch from "./components/CreateMatch";
import GallerySection from "./components/GallerySection";
import DashboardMatches from "./components/DashboardMatches";
import ViewerPage from "./components/viewer";
import Scorer from "./components/Scorer";
import ProfilePage from "./components/ProfilePage";
import RequireRole from "./components/RequireRole";
import ProfileEditForm from "./components/ProfileEditForm";
import AdminProfiles from "./components/AdminProfiles";
import type { Role } from "./lib/auth";

const queryClient = new QueryClient();

// who may create tournaments / teams / matches and score
const ORGANIZERS: Role[] = ["ORGANIZER", "ADMIN"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ---------- Anyone ---------- */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/team-generation" element={<TeamGeneration />} />

          {/* ---------- Any logged-in person: player, organizer or admin ---------- */}
          <Route element={<RequireRole />}>
            <Route path="/showTournaments" element={<TournamentLayout />}>
              <Route index element={<DashboardTournament />} />
              {/* organizer + admin only */}
              <Route element={<RequireRole roles={ORGANIZERS} />}>
                <Route path="createTournament" element={<CreateTournament />} />
              </Route>
            </Route>

            <Route path="/matchesDashboard" element={<MatchLayout />}>
              <Route index element={<DashboardMatches />} />
              {/* organizer + admin only */}
              <Route element={<RequireRole roles={ORGANIZERS} />}>
                <Route path="createMatch" element={<CreateMatch />} />
                <Route path="createTeam" element={<CreateTeam />} />
              </Route>
            </Route>

            <Route path="/matches" element={<Matches />} />
            <Route path="/gallery" element={<GallerySection />} />
            {/* SCOREBOARD: every logged-in person */}
            <Route path="/viewer/:matchId" element={<ViewerPage />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditForm mode="self" />} />
            <Route path="/player/:playerId" element={<PlayerCricketDetails />} />

            {/* admin only: manage everybody's profile */}
            <Route element={<RequireRole roles={["ADMIN"]} />}>
              <Route path="/admin/users" element={<AdminProfiles />} />
              <Route path="/admin/users/:profileId" element={<ProfileEditForm mode="admin" />} />
            </Route>

            {/* organizer + admin only */}
            <Route element={<RequireRole roles={ORGANIZERS} />}>
              <Route path="/scorer/:matchId" element={<Scorer />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
