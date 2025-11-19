import { Badge } from '../types/badges';

export const BADGES: Badge[] = [
  // Learning Badges
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Read your first guide',
    icon: 'Footprints',
    category: 'learning',
    rarity: 'common',
    requirement: 'Read 1 guide',
    condition: (stats) => stats.guidesRead >= 1,
    color: 'blue',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Read 10 guides',
    icon: 'BookOpen',
    category: 'learning',
    rarity: 'common',
    requirement: 'Read 10 guides',
    condition: (stats) => stats.guidesRead >= 10,
    color: 'blue',
  },
  {
    id: 'library-explorer',
    name: 'Library Explorer',
    description: 'Read 25 guides',
    icon: 'Library',
    category: 'learning',
    rarity: 'rare',
    requirement: 'Read 25 guides',
    condition: (stats) => stats.guidesRead >= 25,
    color: 'indigo',
  },
  {
    id: 'master-student',
    name: 'Master Student',
    description: 'Read 50 guides',
    icon: 'GraduationCap',
    category: 'learning',
    rarity: 'epic',
    requirement: 'Read 50 guides',
    condition: (stats) => stats.guidesRead >= 50,
    color: 'purple',
  },
  {
    id: 'documentation-legend',
    name: 'Documentation Legend',
    description: 'Read 100 guides',
    icon: 'Crown',
    category: 'learning',
    rarity: 'legendary',
    requirement: 'Read 100 guides',
    condition: (stats) => stats.guidesRead >= 100,
    color: 'yellow',
  },

  // Engagement Badges
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Explore 3 different categories',
    icon: 'Compass',
    category: 'engagement',
    rarity: 'common',
    requirement: 'Explore 3 categories',
    condition: (stats) => stats.categoriesExplored.size >= 3,
    color: 'emerald',
  },
  {
    id: 'category-hopper',
    name: 'Category Hopper',
    description: 'Explore 6 different categories',
    icon: 'Grid3x3',
    category: 'engagement',
    rarity: 'rare',
    requirement: 'Explore 6 categories',
    condition: (stats) => stats.categoriesExplored.size >= 6,
    color: 'teal',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Explore all 12 categories',
    icon: 'CheckCircle2',
    category: 'engagement',
    rarity: 'epic',
    requirement: 'Explore all 12 categories',
    condition: (stats) => stats.categoriesExplored.size >= 12,
    color: 'purple',
  },
  {
    id: 'chat-enthusiast',
    name: 'Chat Enthusiast',
    description: 'Send 50 messages to AI assistant',
    icon: 'MessageCircle',
    category: 'engagement',
    rarity: 'rare',
    requirement: 'Send 50 chat messages',
    condition: (stats) => stats.chatMessagesCount >= 50,
    color: 'cyan',
  },
  {
    id: 'search-master',
    name: 'Search Master',
    description: 'Perform 25 searches',
    icon: 'Search',
    category: 'engagement',
    rarity: 'common',
    requirement: 'Perform 25 searches',
    condition: (stats) => stats.searchesPerformed >= 25,
    color: 'slate',
  },

  // Mastery Badges
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Active for 7 days',
    icon: 'Calendar',
    category: 'mastery',
    rarity: 'rare',
    requirement: '7 days active',
    condition: (stats) => stats.daysActive >= 7,
    color: 'orange',
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: '7-day learning streak',
    icon: 'Flame',
    category: 'mastery',
    rarity: 'epic',
    requirement: '7 consecutive days',
    condition: (stats) => stats.consecutiveDays >= 7,
    color: 'red',
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '30-day learning streak',
    icon: 'Zap',
    category: 'mastery',
    rarity: 'legendary',
    requirement: '30 consecutive days',
    condition: (stats) => stats.consecutiveDays >= 30,
    color: 'yellow',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Active for 30 days',
    icon: 'Award',
    category: 'mastery',
    rarity: 'epic',
    requirement: '30 days active',
    condition: (stats) => stats.daysActive >= 30,
    color: 'amber',
  },

  // Special Badges
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'One of the first users',
    icon: 'Sparkles',
    category: 'special',
    rarity: 'legendary',
    requirement: 'Join in the first week',
    condition: (stats) => {
      const firstActive = new Date(stats.firstActiveDate);
      const launchDate = new Date('2024-01-01'); // Adjust this date
      const weekAfterLaunch = new Date(launchDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return firstActive <= weekAfterLaunch;
    },
    color: 'violet',
  },
  {
    id: 'support-champion',
    name: 'Support Champion',
    description: 'Submit 5 support tickets',
    icon: 'LifeBuoy',
    category: 'special',
    rarity: 'rare',
    requirement: 'Submit 5 tickets',
    condition: (stats) => stats.ticketsSubmitted >= 5,
    color: 'rose',
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Master all aspects of the platform',
    icon: 'Rocket',
    category: 'special',
    rarity: 'legendary',
    requirement: 'Complete 50 guides, explore all categories, 7-day streak',
    condition: (stats) =>
      stats.guidesRead >= 50 &&
      stats.categoriesExplored.size >= 12 &&
      stats.consecutiveDays >= 7,
    color: 'fuchsia',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Active between midnight and 5 AM',
    icon: 'Moon',
    category: 'special',
    rarity: 'rare',
    requirement: 'Use platform late at night',
    condition: (stats) => {
      const hour = new Date().getHours();
      return hour >= 0 && hour < 5;
    },
    color: 'indigo',
  },
];

// Helper function to get badge by ID
export const getBadgeById = (id: string): Badge | undefined => {
  return BADGES.find(badge => badge.id === id);
};

// Helper function to get all unlocked badges for user stats
export const getUnlockedBadges = (stats: any): Badge[] => {
  return BADGES.filter(badge => {
    try {
      return badge.condition(stats);
    } catch (e) {
      return false;
    }
  });
};

// Helper to get rarity color
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return 'text-slate-400 border-slate-400/30 bg-slate-500/10';
    case 'rare':
      return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
    case 'epic':
      return 'text-purple-400 border-purple-400/30 bg-purple-500/10';
    case 'legendary':
      return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
    default:
      return 'text-slate-400 border-slate-400/30 bg-slate-500/10';
  }
};
