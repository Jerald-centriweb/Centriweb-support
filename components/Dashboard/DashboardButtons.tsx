import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, BookOpen, Video, Wrench, MessageSquare, LifeBuoy } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';

const gridContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const gridItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

/**
 * Quick-jump tiles into the real SOP model — replaces the demo's
 * agency-configured external integration buttons (which pointed at GHL
 * settings pages by name) with the actual four destinations this portal has.
 */
const BUTTONS = [
  { label: 'Start here', icon: Rocket, to: '/guides/start_here' },
  { label: 'Day-to-day guides', icon: BookOpen, to: '/guides/day_to_day' },
  { label: 'Videos', icon: Video, to: '/guides/videos' },
  { label: 'Troubleshooting', icon: Wrench, to: '/guides/troubleshooting' },
  { label: 'Ask a question', icon: MessageSquare, to: '/chat' },
  { label: 'Raise a ticket', icon: LifeBuoy, to: '/support' },
];

export const DashboardButtons: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={gridContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
    >
      {BUTTONS.map((button) => (
        <motion.div key={button.to} variants={gridItem}>
          <SpotlightCard
            className="group bg-white dark:bg-dark-card border-slate-200 dark:border-white/5 hover:border-centri-500/50"
            onClick={() => navigate(button.to)}
          >
            <div className="p-5 flex items-center gap-3">
              <div className="p-2.5 bg-centri-500/10 dark:bg-centri-500/20 rounded-xl group-hover:bg-centri-500/20 dark:group-hover:bg-centri-500/30 transition-colors flex-shrink-0">
                <button.icon className="w-5 h-5 text-centri-600 dark:text-centri-400" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                {button.label}
              </h3>
            </div>
          </SpotlightCard>
        </motion.div>
      ))}
    </motion.div>
  );
};
