import { motion } from 'framer-motion';
import type { MatchCardProps } from './types';

export default function MatchCard({ 
  team1, 
  team2, 
  team1Score, 
  team2Score, 
  status, 
  time, 
  venue,
  index,
  onViewScoreboard,
  onScore,
  scoreLabel,
  onManageAccess
}
: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="card-match"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'LIVE' 
            ? 'bg-accent text-accent-foreground' 
            : status === 'UPCOMING'
            ? 'bg-foreground/20 text-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {status === 'LIVE' && (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              LIVE
            </span>
          )}
          {status === 'LIVE'}
          {status === 'UPCOMING'}
          {status === 'FINISHED'}
          {status === 'ABANDONED'}
        </span>
        {time && (
          <span className="text-sm text-foreground/70">{time}</span>
        )}
      </div>
      
      {/* Teams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground/20 rounded-full flex items-center justify-center text-lg">
              🏏
            </div>
            <span className="font-semibold text-foreground">{team1}</span>
          </div>
          {team1Score && (
            <span className="font-bold text-lg text-foreground">{team1Score}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground/20 rounded-full flex items-center justify-center text-lg">
              🏏
            </div>
            <span className="font-semibold text-foreground">{team2}</span>
          </div>
          {team2Score && (
            <span className="font-bold text-lg text-foreground">{team2Score}</span>
          )}
        </div>
      </div>
      
      {/* Venue */}
      <div className="mt-4 pt-4 border-t border-foreground/10">
        <p className="text-sm text-foreground/60 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {venue}
        </p>
      </div>

      {/* Buttons: Scoreboard for everyone, Score only when the parent passes onScore */}
      {(onViewScoreboard || onScore) && (
        <div className="mt-4 flex gap-2">
          {onViewScoreboard && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewScoreboard}
              className="flex-1 py-2 bg-accent text-accent-foreground rounded-full text-sm font-semibold"
            >
              Scoreboard
            </motion.button>
          )}
          {onScore && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onScore}
              className="flex-1 py-2 border-2 border-foreground/30 rounded-full text-sm font-semibold text-foreground"
            >
              {scoreLabel ?? "Score"}
            </motion.button>
          )}
        </div>
      )}

      {onManageAccess && (
        <button
          onClick={onManageAccess}
          className="mt-3 w-full text-xs font-semibold text-foreground/70 hover:text-foreground underline"
        >
          Scoring access
        </button>
      )}
    </motion.div>
  );
}
