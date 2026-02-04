import { motion } from 'framer-motion';
import { Suspense } from 'react';
import CricketBall3D from './CricketBall3D';

export default function HeroSection() {
  return (
    <section className="min-h-screen relative overflow-hidden pt-20">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
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
              className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full text-sm font-medium text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              🏏 Season 2026 Live Now
            </motion.span>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Experience
              <br />
              <span className="relative">
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
              <motion.button
                className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Live
              </motion.button>
              <motion.button
                className="px-8 py-4 border-2 border-foreground/30 text-foreground rounded-full font-semibold text-lg backdrop-blur-sm hover:bg-foreground/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Schedule
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Right Content - 3D Ball */}
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
            
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-20 right-10 w-20 h-20 bg-foreground/10 rounded-full blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
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
        <div className="w-6 h-10 border-2 border-foreground/40 rounded-full flex justify-center pt-2">
          <motion.div 
            className="w-1.5 h-3 bg-foreground/60 rounded-full"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
