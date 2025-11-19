import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  MessageSquare,
  LifeBuoy,
  TrendingUp,
  Clock,
  Star,
  Zap,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { GUIDE_DATA } from '../data/guides';
import { Card } from '../components/ui/Card';
import { BadgeCard } from '../components/ui/BadgeCard';
import { getBadgeById } from '../data/badges';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { analytics } from '../lib/analytics';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const DashboardPage: React.FC = () => {
  const { viewedGuides, userStats, unlockedBadges, checkAndUnlockBadges } = useStore();

  // Check for newly unlocked badges on mount
  useEffect(() => {
    checkAndUnlockBadges();
  }, [checkAndUnlockBadges]);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('dashboard', 'Dashboard');
  }, []);

  const handleQuickActionClick = (label: string, path: string) => {
    analytics.trackEvent('quick_action_click', { action: label, path });
  };

  const handleGuideClick = (guideId: string, guideTitle: string, section: string) => {
    analytics.trackEvent('dashboard_guide_click', { guideId, guideTitle, section });
  };

  // Get recently viewed guides
  const recentlyViewed = viewedGuides
    .slice(0, 3)
    .map((id) => {
      for (const area of GUIDE_DATA) {
        const guide = area.guides.find((g) => g.id === id);
        if (guide) return { guide, area };
      }
      return null;
    })
    .filter(Boolean);

  // Get popular guides (first few from each category)
  const popularGuides = GUIDE_DATA.slice(0, 3).flatMap((area) =>
    area.guides.slice(0, 1).map((guide) => ({ guide, area }))
  );

  const quickActions = [
    {
      icon: BookOpen,
      label: 'Browse Guides',
      description: '200+ articles',
      to: '/guides',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageSquare,
      label: 'Ask AI Assistant',
      description: 'Get instant answers',
      to: '/chat',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: LifeBuoy,
      label: 'Submit Ticket',
      description: 'Direct support',
      to: '/support',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const stats = [
    { label: 'Guides Read', value: userStats.guidesRead, icon: BookOpen, color: 'text-blue-500' },
    { label: 'Learning Streak', value: `${userStats.consecutiveDays} ${userStats.consecutiveDays === 1 ? 'day' : 'days'}`, icon: Zap, color: 'text-amber-500' },
    { label: 'Badges Earned', value: unlockedBadges.length, icon: Award, color: 'text-purple-500' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-centri-500/10 to-purple-500/10 border border-centri-500/20 dark:border-centri-500/30">
          <Sparkles className="w-4 h-4 text-centri-500" />
          <span className="text-sm font-medium text-centri-700 dark:text-centri-300">
            Welcome to CentriWeb Support
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
          How can we help you today?
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Your all-in-one hub for guides, AI assistance, and expert support
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            onClick={() => handleQuickActionClick(action.label, action.to)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              action.color
            )} />

            <div className="relative p-6 flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-xl bg-gradient-to-br transition-all duration-300',
                action.color,
                'group-hover:scale-110'
              )}>
                <action.icon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-white transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors">
                  {action.description}
                </p>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-all group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={cn('p-3 rounded-xl bg-slate-100 dark:bg-slate-800', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-centri-500" />
                Recently Viewed
              </h2>
              <Link
                to="/guides"
                className="text-sm text-centri-600 dark:text-centri-400 hover:underline flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentlyViewed.map(({ guide, area }: any) => (
                <Link
                  key={guide.id}
                  to={`/guides/${area.id}/${guide.id}`}
                  onClick={() => handleGuideClick(guide.id, guide.title, 'recently_viewed')}
                  className="block group"
                >
                  <Card className="p-4 hover:border-centri-500/50 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-centri-100 dark:bg-centri-900/20 text-centri-600 dark:text-centri-400 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-centri-600 dark:group-hover:text-centri-400 transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {area.title}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-centri-500 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Popular Guides */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              Popular This Week
            </h2>
            <Link
              to="/guides"
              className="text-sm text-centri-600 dark:text-centri-400 hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {popularGuides.map(({ guide, area }: any) => (
              <Link
                key={guide.id}
                to={`/guides/${area.id}/${guide.id}`}
                onClick={() => handleGuideClick(guide.id, guide.title, 'popular')}
                className="block group"
              >
                <Card className="p-4 hover:border-purple-500/50 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {guide.timeToRead} • {area.title}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Badges Section */}
      {unlockedBadges.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Your Achievements
            </h2>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {unlockedBadges.length} badge{unlockedBadges.length !== 1 ? 's' : ''} earned
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unlockedBadges.slice(0, 4).map((unlockedBadge) => {
              const badge = getBadgeById(unlockedBadge.badgeId);
              if (!badge) return null;
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={true}
                  unlockedAt={unlockedBadge.unlockedAt}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden bg-gradient-to-br from-centri-500 to-purple-600 border-0 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCwyIDQgNHYyYzAgMi0yIDQtNCA0cy00LTItNC00di0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />

          <div className="relative p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Need personalized help?</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Our AI assistant is trained on 200+ guides and can answer your specific questions instantly.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-centri-600 font-semibold rounded-lg hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
            >
              Start Chatting
              <MessageSquare className="w-5 h-5" />
            </Link>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
