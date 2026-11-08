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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/showTournaments" element={<TournamentLayout />}>
            <Route index element={<DashboardTournament />} />
            <Route path="createTournament" element={<CreateTournament />} />
          </Route>
          <Route path="/matchesDashboard" element={<MatchLayout />}>
            <Route index element={<DashboardMatches />} />
            <Route path="createMatch" element={<CreateMatch />} />
            <Route path="createTeam" element={<CreateTeam />} />
          </Route>
          <Route path="/matches" element={<Matches />} />
          <Route path="/gallery" element={<GallerySection/>} />
          <Route path="/scorer" element={<Scorer/>} />
          <Route path="/viewer" element={<ViewerPage/>} />
          <Route path="/player/:playerId" element={<PlayerCricketDetails />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
