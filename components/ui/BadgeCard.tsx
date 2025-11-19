import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Badge } from '../../types/badges';
import { getRarityColor } from '../../data/badges';
import { cn } from '../../lib/utils';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
  unlockedAt?: string;
  onClick?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, unlocked, unlockedAt, onClick }) => {
  const Icon = (Icons as any)[badge.icon] || Icons.Award;

  const rarityColors = {
    common: 'from-slate-500/20 to-slate-600/20 border-slate-400/30',
    rare: 'from-blue-500/20 to-blue-600/20 border-blue-400/30',
    epic: 'from-purple-500/20 to-purple-600/20 border-purple-400/30',
    legendary: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-yellow-400/30',
  };

  const iconColors = {
    common: 'text-slate-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05, y: -4 } : {}}
      whileTap={unlocked ? { scale: 0.98 } : {}}
      onClick={unlocked ? onClick : undefined}
      className={cn(
        'relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden',
        unlocked
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} shadow-lg`
          : 'bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-50 grayscale'
      )}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            unlocked ? getRarityColor(badge.rarity) : 'text-slate-400 bg-slate-200 dark:bg-slate-800'
          )}
        >
          {badge.rarity}
        </span>
      </div>

      {/* Badge Icon */}
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-3',
            unlocked
              ? `bg-${badge.color}-500/10 ${iconColors[badge.rarity]}`
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
          )}
        >
          <Icon className="w-8 h-8" />
        </div>

        {/* Badge Name */}
        <h3
          className={cn(
            'font-bold text-sm mb-1',
            unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'
          )}
        >
          {badge.name}
        </h3>

        {/* Badge Description */}
        <p
          className={cn(
            'text-xs leading-relaxed',
            unlocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-700'
          )}
        >
          {badge.description}
        </p>

        {/* Unlocked date */}
        {unlocked && unlockedAt && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}

        {/* Locked status */}
        {!unlocked && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-600">
            <Icons.Lock className="w-3 h-3" />
            <span>{badge.requirement}</span>
          </div>
        )}
      </div>

      {/* Shine effect for unlocked legendary badges */}
      {unlocked && badge.rarity === 'legendary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
};
