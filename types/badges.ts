export type BadgeCategory = 'learning' | 'engagement' | 'mastery' | 'special';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirement: string; // Human-readable requirement
  condition: (stats: UserStats) => boolean; // Programmatic check
  color: string; // Tailwind color class prefix (e.g., 'blue', 'purple', 'emerald')
}

export interface UserStats {
  guidesRead: number;
  guidesCompleted: number;
  daysActive: number;
  consecutiveDays: number;
  categoriesExplored: Set<string>;
  searchesPerformed: number;
  chatMessagesCount: number;
  ticketsSubmitted: number;
  lastActiveDate: string;
  firstActiveDate: string;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  seen: boolean;
}
