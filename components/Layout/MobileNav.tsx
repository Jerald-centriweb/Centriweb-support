import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Rocket, BookOpen, Receipt, Video, Wrench, MessageSquare, LifeBuoy, X, Search, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

const menuVariants = {
  closed: { opacity: 0, y: -20, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  open: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  closed: { opacity: 0, x: -20 },
  open: { opacity: 1, x: 0 },
};

const MobileNavItem = ({ to, icon: Icon, label, description, onClick, end }: any) => (
  <motion.div variants={itemVariants}>
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-4 p-4 rounded-2xl transition-all',
          isActive ? 'bg-centri-600/20 border border-centri-500/30 shadow-lg' : 'bg-slate-900/50 border border-white/5'
        )
      }
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-centri-600 to-centri-800 flex items-center justify-center text-white shadow-inner flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-base truncate">{label}</div>
        <div className="text-slate-400 text-xs truncate">{description}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
    </NavLink>
  </motion.div>
);

export const MobileNav: React.FC = () => {
  const { mobileMenuOpen, toggleMobileMenu, setSearchOpen } = useStore();

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-dark-bg/98 backdrop-blur-xl flex flex-col"
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <span className="font-bold text-lg text-white tracking-tight">Menu</span>
            <button
              onClick={toggleMobileMenu}
              aria-label="Close menu"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <motion.div variants={menuVariants} initial="closed" animate="open" exit="closed" className="space-y-6">
              <motion.button
                variants={itemVariants}
                onClick={() => {
                  toggleMobileMenu();
                  setSearchOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 text-slate-400 border border-transparent"
              >
                <Search className="w-5 h-5" />
                <span className="text-base font-medium">Search guides & help...</span>
              </motion.button>

              <div className="space-y-3">
                <MobileNavItem to="/" end icon={Home} label="Home" description="Your dashboard" onClick={toggleMobileMenu} />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Onboarding path</div>
                <MobileNavItem to="/guides/start_here" icon={Rocket} label="Start here" description="First week setup" onClick={toggleMobileMenu} />
                <MobileNavItem to="/guides/day_to_day" icon={BookOpen} label="Day-to-day guides" description="Running your pipeline" onClick={toggleMobileMenu} />
                <MobileNavItem to="/guides/money_and_documents" icon={Receipt} label="Money and documents" description="Invoices, payments, signing" onClick={toggleMobileMenu} />
                <MobileNavItem to="/guides/videos" icon={Video} label="Videos" description="Watch instead of read" onClick={toggleMobileMenu} />
                <MobileNavItem to="/guides/troubleshooting" icon={Wrench} label="Troubleshooting" description="Fix common problems" onClick={toggleMobileMenu} />
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Get help</div>
                <MobileNavItem to="/chat" icon={MessageSquare} label="Ask a question" description="Instant answers from the guides" onClick={toggleMobileMenu} />
                <MobileNavItem to="/support" icon={LifeBuoy} label="Raise a ticket" description="Reach the CentriWeb team" onClick={toggleMobileMenu} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
