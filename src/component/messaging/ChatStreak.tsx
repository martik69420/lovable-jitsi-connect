import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatStreakProps {
  streakCount: number;
  isActive: boolean; // true if streak is still active, false if broken
  size?: 'sm' | 'md' | 'lg';
}

const ChatStreak: React.FC<ChatStreakProps> = ({ 
  streakCount, 
  isActive,
  size = 'md' 
}) => {
  const [showDust, setShowDust] = useState(false);
  const [wasActive, setWasActive] = useState(isActive);

  // Detect when streak breaks
  useEffect(() => {
    if (wasActive && !isActive) {
      setShowDust(true);
      const timer = setTimeout(() => setShowDust(false), 2000);
      return () => clearTimeout(timer);
    }
    setWasActive(isActive);
  }, [isActive, wasActive]);

  if (streakCount === 0 && !showDust) return null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  // Generate dust particles for Thanos effect
  const dustParticles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 100,
    y: (Math.random() - 0.5) * 100,
    delay: Math.random() * 0.5,
    size: Math.random() * 4 + 2
  }));

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="flame"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`relative ${sizeClasses[size]} flex items-center justify-center`}
          >
            {/* Flame SVG with animation */}
            <motion.svg
              viewBox="0 0 24 24"
              className="absolute inset-0 w-full h-full"
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.05, 1, 1.03, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Outer flame glow */}
              <motion.path
                d="M12 23c-4.97 0-9-3.58-9-8 0-3.17 2.36-6.04 4-7.5 0 2 1.5 3.5 3 4.5.5-3.5 3-6 5-8 .5 1.5 1 3 1.5 4.5 1-1 2-2.5 2-4.5 2.5 3 3.5 6 3.5 8.5 0 4.42-4.03 8-9 8z"
                fill="url(#flameGradientOuter)"
                animate={{
                  d: [
                    "M12 23c-4.97 0-9-3.58-9-8 0-3.17 2.36-6.04 4-7.5 0 2 1.5 3.5 3 4.5.5-3.5 3-6 5-8 .5 1.5 1 3 1.5 4.5 1-1 2-2.5 2-4.5 2.5 3 3.5 6 3.5 8.5 0 4.42-4.03 8-9 8z",
                    "M12 23c-4.97 0-9-3.58-9-8 0-3.17 2.36-6.04 4-7.5 0 2.5 1 3 2.5 4 .5-3 3.5-6.5 5.5-8.5 .5 2 .8 3.5 1.2 5 1.2-1.2 2.3-3 2.3-5 2.5 3.5 3 6.5 3 9 0 4.42-4.03 8-9 8z",
                    "M12 23c-4.97 0-9-3.58-9-8 0-3.17 2.36-6.04 4-7.5 0 2 1.5 3.5 3 4.5.5-3.5 3-6 5-8 .5 1.5 1 3 1.5 4.5 1-1 2-2.5 2-4.5 2.5 3 3.5 6 3.5 8.5 0 4.42-4.03 8-9 8z"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Inner flame */}
              <motion.path
                d="M12 21c-2.76 0-5-1.79-5-4 0-1.58 1.18-3.02 2-3.75 0 1 .75 1.75 1.5 2.25.25-1.75 1.5-3 2.5-4 .25.75.5 1.5.75 2.25.5-.5 1-1.25 1-2.25 1.25 1.5 1.75 3 1.75 4.25 0 2.21-2.24 4-4.5 4z"
                fill="url(#flameGradientInner)"
                animate={{
                  d: [
                    "M12 21c-2.76 0-5-1.79-5-4 0-1.58 1.18-3.02 2-3.75 0 1 .75 1.75 1.5 2.25.25-1.75 1.5-3 2.5-4 .25.75.5 1.5.75 2.25.5-.5 1-1.25 1-2.25 1.25 1.5 1.75 3 1.75 4.25 0 2.21-2.24 4-4.5 4z",
                    "M12 21c-2.76 0-5-1.79-5-4 0-1.58 1.18-3.02 2-3.75 0 1.2 .6 1.5 1.3 2 .3-1.5 1.7-3.2 2.7-4.2 .2.9.4 1.7.6 2.5.6-.6 1.1-1.4 1.1-2.4 1.3 1.7 1.5 3.2 1.5 4.5 0 2.21-2.24 4-4.5 4z",
                    "M12 21c-2.76 0-5-1.79-5-4 0-1.58 1.18-3.02 2-3.75 0 1 .75 1.75 1.5 2.25.25-1.75 1.5-3 2.5-4 .25.75.5 1.5.75 2.25.5-.5 1-1.25 1-2.25 1.25 1.5 1.75 3 1.75 4.25 0 2.21-2.24 4-4.5 4z"
                  ]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.1
                }}
              />
              <defs>
                <linearGradient id="flameGradientOuter" x1="12" y1="24" x2="12" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF6B35" />
                  <stop offset="50%" stopColor="#FF8C42" />
                  <stop offset="100%" stopColor="#FFD93D" />
                </linearGradient>
                <linearGradient id="flameGradientInner" x1="12" y1="22" x2="12" y2="8" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD93D" />
                  <stop offset="100%" stopColor="#FFFACD" />
                </linearGradient>
              </defs>
            </motion.svg>
            
            {/* Streak number */}
            <span className="relative z-10 font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {streakCount}
            </span>
            
            {/* Ambient glow */}
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-400/30 blur-md -z-10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        ) : showDust ? (
          <motion.div
            key="dust"
            className={`relative ${sizeClasses[size]} flex items-center justify-center`}
          >
            {/* Fading flame */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <svg viewBox="0 0 24 24" className="w-full h-full opacity-50">
                <path
                  d="M12 23c-4.97 0-9-3.58-9-8 0-3.17 2.36-6.04 4-7.5 0 2 1.5 3.5 3 4.5.5-3.5 3-6 5-8 .5 1.5 1 3 1.5 4.5 1-1 2-2.5 2-4.5 2.5 3 3.5 6 3.5 8.5 0 4.42-4.03 8-9 8z"
                  fill="#9CA3AF"
                />
              </svg>
            </motion.div>
            
            {/* Dust particles - Thanos snap effect */}
            {dustParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  background: `linear-gradient(135deg, #9CA3AF, #6B7280)`,
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 1
                }}
                animate={{ 
                  x: particle.x,
                  y: particle.y,
                  opacity: 0,
                  scale: 0
                }}
                transition={{
                  duration: 1.5,
                  delay: particle.delay,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ChatStreak;
