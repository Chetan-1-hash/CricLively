import { motion } from 'framer-motion';
import { Suspense } from 'react';
import CricketBall3D from './CricketBall3D';

export default function HeroSection() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-20">
      {/* ── Glassmorphic mesh orbs ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* top-right lime orb */}
        <motion.div
          className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(180,224,80,0.28) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        {/* bottom-left dark-green orb */}
        <motion.div
          className="absolute -bottom-16 -left-16 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,80,0,0.55) 0%, transparent 70%)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
        {/* center accent orb — red cricket glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,43,43,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-5rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <motion.span
              className="badge-glass mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              🏏 Season 2026 Live Now
            </motion.span>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6"
              style={{ fontFamily: "'Syne', 'Poppins', sans-serif" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Experience
              <br />
              <span className="relative inline-block">
                Cricket
                <motion.div
                  className="absolute bottom-2 left-0 h-2 bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
              <br />
              Like Never Before
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Get live scores, match updates, player stats, and exclusive insights from the world of cricket.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {/* Primary — white pill */}
              <motion.button
                className="px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: 'white',
                  color: 'hsl(100, 55%, 22%)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Live
              </motion.button>

              {/* Ghost — glass border */}
              <motion.button
                className="px-8 py-4 rounded-full font-semibold text-lg text-foreground transition-all"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.32)',
                  backdropFilter: 'blur(8px)',
                }}
                whileHover={{
                  scale: 1.05,
                  background: 'rgba(255,255,255,0.2)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                View Schedule
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Ball (untouched) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <Suspense fallback={
              <div className="w-full h-[500px] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              </div>
            }>
              <CricketBall3D />
            </Suspense>

            {/* Decorative glow blobs */}
            <motion.div
              className="absolute top-20 right-10 w-20 h-20 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(24px)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-32 h-32 rounded-full"
              style={{ background: 'rgba(212,43,43,0.15)', filter: 'blur(32px)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full flex justify-center pt-2"
          style={{ border: '2px solid rgba(255,255,255,0.4)' }}
        >
          <motion.div
            className="w-1.5 h-3 rounded-full"
            style={{ background: 'rgba(255,255,255,0.6)' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
