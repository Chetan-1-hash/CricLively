import { motion } from 'framer-motion';
import MatchCard from './MatchCard';

const matches = [
  {
    team1: 'India',
    team2: 'Australia',
    team1Score: '287/4',
    team2Score: '156/3',
    status: 'live' as const,
    venue: 'Melbourne Cricket Ground',
  },
  {
    team1: 'England',
    team2: 'South Africa',
    status: 'upcoming' as const,
    time: 'Today, 7:00 PM',
    venue: 'Lords Cricket Ground',
  },
  {
    team1: 'Pakistan',
    team2: 'New Zealand',
    team1Score: '312/8',
    team2Score: '298/10',
    status: 'completed' as const,
    venue: 'Eden Gardens, Kolkata',
  },
];

export default function MatchesSection() {
  return (
    <section id="matches" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-foreground/10 rounded-full text-sm font-medium text-foreground mb-4">
            Latest Matches
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Today's Fixtures
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, index) => (
            <MatchCard key={index} {...match} index={index} />
          ))}
        </div>
        
        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.button
            className="px-8 py-3 border-2 border-foreground/30 text-foreground rounded-full font-semibold hover:bg-foreground/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All Matches
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
