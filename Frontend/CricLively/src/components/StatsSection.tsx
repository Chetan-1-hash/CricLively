import { motion } from 'framer-motion';

const stats = [
  { label: 'Matches Played', value: '2,847', icon: '🏏' },
  { label: 'Total Runs', value: '1.2M', icon: '⚡' },
  { label: 'Wickets Taken', value: '89,543', icon: '🎯' },
  { label: 'Active Players', value: '1,456', icon: '👥' },
];

const topPlayers = [
  { name: 'Virat Kohli', country: 'India', runs: '27,256', rank: 1 },
  { name: 'Joe Root', country: 'England', runs: '24,890', rank: 2 },
  { name: 'Steve Smith', country: 'Australia', runs: '23,456', rank: 3 },
];

export default function StatsSection() {
  return (
    <section id="stats" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-foreground/10 rounded-full text-sm font-medium text-foreground mb-4">
            Cricket Stats
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            By The Numbers
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card-match text-center"
            >
              <span className="text-4xl mb-3 block">{stat.icon}</span>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </h3>
              <p className="text-foreground/70 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Top Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            Top Run Scorers
          </h3>
        </motion.div>
        
        <div className="max-w-2xl mx-auto space-y-4">
          {topPlayers.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="card-match flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  player.rank === 1 
                    ? 'bg-yellow-500/20 text-yellow-300' 
                    : player.rank === 2 
                    ? 'bg-gray-300/20 text-gray-300'
                    : 'bg-orange-500/20 text-orange-300'
                }`}>
                  #{player.rank}
                </span>
                <div>
                  <h4 className="font-semibold text-foreground">{player.name}</h4>
                  <p className="text-sm text-foreground/60">{player.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-foreground">{player.runs}</p>
                <p className="text-xs text-foreground/60">Runs</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
