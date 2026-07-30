// src/services/gamification.ts
// Sistema inicial de gamificação do ASA Connect.

export type RankId =
  | "viajante"
  | "comerciante"
  | "rei"
  | "semideus"
  | "tita"
  | "alvarista";

export type XpAction =
  | "DAILY_LOGIN"
  | "FEED_PARTICIPATION"
  | "EVENT_ATTENDANCE"
  | "COURSE_ENROLLMENT"
  | "FRIEND_ADDED"
  | "PROFILE_COMPLETED";

export interface RankDefinition {
  id: RankId;
  order: number;
  name: string;
  symbol: string;
  rarity: string;
  minXp: number;
  maxXp: number;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  rankId: RankId;
  streak: number;
  lastLoginDate?: string;
  claimedRewardIds: string[];
}

export interface XpGrant {
  action: XpAction;
  baseXp: number;
  bonusXp: number;
  totalXp: number;
  reason: string;
}

export const MAX_XP = 20_000;
export const MAX_LEVEL = 60;

/**
 * Progressão calibrada para que um usuário mediano, entrando cerca de
 * três vezes por semana e participando ocasionalmente de eventos/cursos,
 * leve aproximadamente dois anos para chegar ao nível máximo.
 */
export const RANKS: RankDefinition[] = [
  {
    id: "viajante",
    order: 1,
    name: "Viajante",
    symbol: "Mochila",
    rarity: "Bronze",
    minXp: 0,
    maxXp: 2_999,
  },
  {
    id: "comerciante",
    order: 2,
    name: "Comerciante",
    symbol: "Moeda",
    rarity: "Ouro",
    minXp: 3_000,
    maxXp: 5_999,
  },
  {
    id: "rei",
    order: 3,
    name: "Rei",
    symbol: "Coroa",
    rarity: "Platina",
    minXp: 6_000,
    maxXp: 8_999,
  },
  {
    id: "semideus",
    order: 4,
    name: "Semideus",
    symbol: "Hércules",
    rarity: "Rubi",
    minXp: 9_000,
    maxXp: 12_999,
  },
  {
    id: "tita",
    order: 5,
    name: "Titã",
    symbol: "Atlas",
    rarity: "Safira",
    minXp: 13_000,
    maxXp: 16_999,
  },
  {
    id: "alvarista",
    order: 6,
    name: "Alvarista",
    symbol: "Hermes",
    rarity: "Esmeralda",
    minXp: 17_000,
    maxXp: MAX_XP,
  },
];

export const XP_RULES: Record<
  XpAction,
  {
    xp: number;
    dailyLimit?: number;
    weeklyLimit?: number;
    description: string;
  }
> = {
  DAILY_LOGIN: {
    xp: 20,
    dailyLimit: 1,
    description: "Realizar o primeiro login do dia",
  },
  FEED_PARTICIPATION: {
    xp: 10,
    dailyLimit: 3,
    description: "Interagir de forma válida com o feed",
  },
  EVENT_ATTENDANCE: {
    xp: 250,
    weeklyLimit: 2,
    description: "Confirmar presença em uma palestra ou evento",
  },
  COURSE_ENROLLMENT: {
    xp: 400,
    weeklyLimit: 1,
    description: "Inscrever-se em um curso pela plataforma",
  },
  FRIEND_ADDED: {
    xp: 40,
    dailyLimit: 5,
    description: "Adicionar uma conexão real à rede",
  },
  PROFILE_COMPLETED: {
    xp: 300,
    description: "Completar os campos essenciais do perfil",
  },
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const differenceInCalendarDays = (from: string, to: string): number => {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
};

export function getRankByXp(xp: number): RankDefinition {
  const safeXp = Math.max(0, Math.min(MAX_XP, xp));

  return (
    RANKS.find((rank) => safeXp >= rank.minXp && safeXp <= rank.maxXp) ??
    RANKS[RANKS.length - 1]
  );
}

export function getLevelByXp(xp: number): number {
  const safeXp = Math.max(0, Math.min(MAX_XP, xp));
  return Math.min(
    MAX_LEVEL,
    Math.max(1, Math.floor((safeXp / MAX_XP) * MAX_LEVEL) + 1),
  );
}

export function getXpForNextLevel(level: number): number {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, level));
  return Math.ceil((safeLevel / MAX_LEVEL) * MAX_XP);
}

export function getProgress(xp: number) {
  const level = getLevelByXp(xp);
  const rank = getRankByXp(xp);
  const currentLevelStart =
    level <= 1 ? 0 : getXpForNextLevel(level - 1);
  const nextLevelXp =
    level >= MAX_LEVEL ? MAX_XP : getXpForNextLevel(level);
  const interval = Math.max(1, nextLevelXp - currentLevelStart);

  return {
    xp: Math.min(MAX_XP, Math.max(0, xp)),
    level,
    rank,
    nextLevelXp,
    levelProgress: Math.min(
      1,
      Math.max(0, (xp - currentLevelStart) / interval),
    ),
    isMaxLevel: level >= MAX_LEVEL && xp >= MAX_XP,
  };
}

export function calculateLoginGrant(
  profile: GamificationProfile,
  now = new Date(),
): { profile: GamificationProfile; grant: XpGrant | null } {
  const today = toIsoDate(now);

  if (profile.lastLoginDate === today) {
    return { profile, grant: null };
  }

  const daysSinceLastLogin = profile.lastLoginDate
    ? differenceInCalendarDays(profile.lastLoginDate, today)
    : null;

  const continuedStreak = daysSinceLastLogin === 1;
  const streak = continuedStreak ? profile.streak + 1 : 1;

  // Bônus pequeno, limitado, para não transformar streak em fonte abusiva.
  const bonusXp = streak >= 30 ? 20 : streak >= 7 ? 10 : 0;
  const baseXp = XP_RULES.DAILY_LOGIN.xp;
  const totalXp = baseXp + bonusXp;
  const xp = Math.min(MAX_XP, profile.xp + totalXp);

  return {
    profile: {
      ...profile,
      xp,
      level: getLevelByXp(xp),
      rankId: getRankByXp(xp).id,
      streak,
      lastLoginDate: today,
    },
    grant: {
      action: "DAILY_LOGIN",
      baseXp,
      bonusXp,
      totalXp,
      reason:
        bonusXp > 0
          ? `Login diário e bônus de sequência de ${streak} dias`
          : "Primeiro login do dia",
    },
  };
}

export function grantXp(
  profile: GamificationProfile,
  action: Exclude<XpAction, "DAILY_LOGIN">,
): { profile: GamificationProfile; grant: XpGrant } {
  const baseXp = XP_RULES[action].xp;
  const xp = Math.min(MAX_XP, profile.xp + baseXp);

  return {
    profile: {
      ...profile,
      xp,
      level: getLevelByXp(xp),
      rankId: getRankByXp(xp).id,
    },
    grant: {
      action,
      baseXp,
      bonusXp: 0,
      totalXp: baseXp,
      reason: XP_RULES[action].description,
    },
  };
}

export function createGamificationProfile(
  xp = 0,
  streak = 0,
): GamificationProfile {
  const safeXp = Math.max(0, Math.min(MAX_XP, xp));

  return {
    xp: safeXp,
    level: getLevelByXp(safeXp),
    rankId: getRankByXp(safeXp).id,
    streak,
    claimedRewardIds: [],
  };
}
