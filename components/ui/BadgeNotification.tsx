import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { getBadgeById } from '../../data/badges';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export const BadgeNotification: React.FC = () => {
  const { unlockedBadges, markBadgeAsSeen } = useStore();

  // Get first unseen badge
  const unseenBadge = unlockedBadges.find((b) => !b.seen);
  const badge = unseenBadge ? getBadgeById(unseenBadge.badgeId) : null;

  useEffect(() => {
    if (unseenBadge) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        markBadgeAsSeen(unseenBadge.badgeId);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [unseenBadge, markBadgeAsSeen]);

  if (!badge || !unseenBadge) return null;

  const Icon = (Icons as any)[badge.icon] || Icons.Award;

  const rarityColors = {
    common: 'from-slate-500/90 to-slate-600/90',
    rare: 'from-blue-500/90 to-blue-600/90',
    epic: 'from-purple-500/90 to-purple-600/90',
    legendary: 'from-yellow-500/90 via-amber-500/90 to-orange-500/90',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed bottom-24 right-6 z-50 w-80"
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl shadow-2xl border-2 border-white/20',
            `bg-gradient-to-br ${rarityColors[badge.rarity]}`
          )}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="badge-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="white" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#badge-pattern)" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Badge Icon */}
              <div className="flex-shrink-0">
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: 'easeInOut',
                  }}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
              </div>

              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                  Badge Unlocked!
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{badge.name}</h3>
                <p className="text-sm text-white/90 mb-2">{badge.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
                    {badge.rarity}
                  </span>
                  <span className="text-xs text-white/70">{badge.category}</span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => markBadgeAsSeen(unseenBadge.badgeId)}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Icons.X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Shine animation for legendary */}
          {badge.rarity === 'legendary' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Sparkles for epic and legendary */}
          {(badge.rarity === 'epic' || badge.rarity === 'legendary') && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                >
                  <Icons.Sparkle className="w-3 h-3 text-white" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
