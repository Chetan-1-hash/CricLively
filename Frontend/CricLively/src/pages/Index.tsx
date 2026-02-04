import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import MatchesSection from '../components/MatchesSection';
import StatsSection from '../components/StatsSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <MatchesSection />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default Index;
