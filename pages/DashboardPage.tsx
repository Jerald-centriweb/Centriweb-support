import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardHeader } from '../components/Dashboard/DashboardHeader';
import { OnboardingWidget } from '../components/Dashboard/OnboardingWidget';
import { DashboardButtons } from '../components/Dashboard/DashboardButtons';
import { RecentlyViewed } from '../components/Dashboard/RecentlyViewed';
import { AccountInsights } from '../components/Dashboard/AccountInsights';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const DashboardPage: React.FC = () => {
  useEffect(() => {
    document.title = 'PreBuild Help Centre';
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      <motion.div variants={item}>
        <DashboardHeader />
      </motion.div>

      <motion.div variants={item}>
        <OnboardingWidget />
      </motion.div>

      <motion.div variants={item}>
        <DashboardButtons />
      </motion.div>

      <motion.div variants={item}>
        <RecentlyViewed />
      </motion.div>

      <motion.div variants={item} className="grid lg:grid-cols-1 gap-8">
        <AccountInsights />
      </motion.div>
    </motion.div>
  );
};
