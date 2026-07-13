import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, className, colorClass = 'bg-centri-500' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn('h-full rounded-full', colorClass)}
      />
    </div>
  );
};
