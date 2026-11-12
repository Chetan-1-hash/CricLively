import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TeamGenerationSection from '../components/TeamGenerationSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <TeamGenerationSection />
      <Footer />
    </div>
  );
};

export default Index;
