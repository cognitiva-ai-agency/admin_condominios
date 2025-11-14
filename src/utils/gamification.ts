/**
 * Gamification Service
 * Maneja puntos, badges, streaks y niveles para trabajadores
 */

import { prisma } from "@/lib/prisma";

// ========================================
// TIPOS Y CONSTANTES
// ========================================

export interface GamificationStats {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  badges: BadgeEarned[];
  nextLevelPoints: number;
  pointsToNextLevel: number;
}

export interface BadgeEarned {
  id: string;
  type: string;
  name: string;
  description: string;
  iconEmoji: string;
  earnedAt: Date;
}

// Puntos por acción
export const POINTS = {
  COMPLETE_TASK: 100,
  COMPLETE_SUBTASK: 10,
  EARLY_CHECK_IN: 20,
  DAILY_CHECK_IN: 50,
  PERFECT_WEEK: 500,
  QUALITY_BONUS: 200,
};

// Niveles por puntos
export const LEVELS = [
  { level: 1, minPoints: 0, name: "Novato" },
  { level: 2, minPoints: 500, name: "Aprendiz" },
  { level: 3, minPoints: 1500, name: "Competente" },
  { level: 4, minPoints: 3000, name: "Experto" },
  { level: 5, minPoints: 5000, name: "Maestro" },
  { level: 6, minPoints: 8000, name: "Veterano" },
  { level: 7, minPoints: 12000, name: "Élite" },
  { level: 8, minPoints: 17000, name: "Leyenda" },
  { level: 9, minPoints: 23000, name: "Mítico" },
  { level: 10, minPoints: 30000, name: "Legendario" },
];

// Definiciones de badges
export const BADGE_DEFINITIONS = [
  {
    type: "FIRST_TASK",
    name: "Primera Tarea",
    description: "Completaste tu primera tarea",
    iconEmoji: "🎯",
    points: 50,
  },
  {
    type: "TASK_MASTER_10",
    name: "Maestro 10",
    description: "Completaste 10 tareas",
    iconEmoji: "⭐",
    points: 100,
  },
  {
    type: "TASK_MASTER_50",
    name: "Maestro 50",
    description: "Completaste 50 tareas",
    iconEmoji: "🌟",
    points: 500,
  },
  {
    type: "TASK_MASTER_100",
    name: "Maestro 100",
    description: "Completaste 100 tareas",
    iconEmoji: "💎",
    points: 1000,
  },
  {
    type: "PERFECT_WEEK",
    name: "Semana Perfecta",
    description: "5 días consecutivos de asistencia",
    iconEmoji: "🔥",
    points: 300,
  },
  {
    type: "STREAK_7",
    name: "Racha de 7",
    description: "7 días consecutivos de check-in",
    iconEmoji: "⚡",
    points: 400,
  },
  {
    type: "STREAK_30",
    name: "Racha de 30",
    description: "30 días consecutivos de check-in",
    iconEmoji: "🏆",
    points: 1500,
  },
  {
    type: "EARLY_BIRD",
    name: "Madrugador",
    description: "10 check-ins antes de las 8 AM",
    iconEmoji: "🌅",
    points: 300,
  },
  {
    type: "QUALITY_CHAMPION",
    name: "Campeón de Calidad",
    description: "3 evaluaciones de calidad 5/5",
    iconEmoji: "✨",
    points: 500,
  },
  {
    type: "TEAM_PLAYER",
    name: "Jugador de Equipo",
    description: "3 evaluaciones de trabajo en equipo 5/5",
    iconEmoji: "🤝",
    points: 500,
  },
];

// ========================================
// FUNCIONES PRINCIPALES
// ========================================

/**
 * Inicializa la gamificación para un usuario (si no existe)
 */
export async function initializeGamification(userId: string) {
  const existing = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  return await prisma.userGamification.create({
    data: {
      userId,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      tasksCompleted: 0,
      earlyCheckIns: 0,
      level: 1,
    },
  });
}

/**
 * Otorga puntos a un usuario por una razón específica
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  relatedTaskId?: string
) {
  // Asegurar que existe gamificación
  await initializeGamification(userId);

  // Registrar en historial
  await prisma.pointHistory.create({
    data: {
      userId,
      points,
      reason,
      relatedTaskId,
    },
  });

  // Actualizar puntos totales
  const updated = await prisma.userGamification.update({
    where: { userId },
    data: {
      totalPoints: { increment: points },
    },
  });

  // Verificar si subió de nivel
  await checkAndUpdateLevel(userId, updated.totalPoints);

  return updated;
}

/**
 * Calcula y actualiza el nivel del usuario basado en puntos
 */
export async function checkAndUpdateLevel(userId: string, totalPoints: number) {
  const currentLevel = LEVELS.findLast((l) => totalPoints >= l.minPoints);

  if (!currentLevel) return;

  await prisma.userGamification.update({
    where: { userId },
    data: { level: currentLevel.level },
  });
}

/**
 * Obtiene el nivel actual y puntos para el siguiente nivel
 */
export function getLevelInfo(totalPoints: number) {
  const currentLevel = LEVELS.findLast((l) => totalPoints >= l.minPoints) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);

  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    minPoints: currentLevel.minPoints,
    nextLevelPoints: nextLevel?.minPoints || currentLevel.minPoints,
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - totalPoints : 0,
  };
}

/**
 * Maneja la recompensa al completar una tarea
 */
export async function handleTaskCompletion(userId: string, taskId: string) {
  // Otorgar puntos por tarea completada
  await awardPoints(
    userId,
    POINTS.COMPLETE_TASK,
    "Tarea completada",
    taskId
  );

  // Incrementar contador de tareas
  await prisma.userGamification.update({
    where: { userId },
    data: {
      tasksCompleted: { increment: 1 },
    },
  });

  // Verificar badges de tareas
  await checkTaskBadges(userId);
}

/**
 * Maneja la recompensa al completar una subtarea
 */
export async function handleSubtaskCompletion(userId: string, taskId: string) {
  await awardPoints(
    userId,
    POINTS.COMPLETE_SUBTASK,
    "Subtarea completada",
    taskId
  );
}

/**
 * Verifica y otorga badges relacionados con tareas completadas
 */
export async function checkTaskBadges(userId: string) {
  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: { badges: true },
  });

  if (!gamification) return;

  const tasksCompleted = gamification.tasksCompleted;
  const badges = [
    { type: "FIRST_TASK", threshold: 1 },
    { type: "TASK_MASTER_10", threshold: 10 },
    { type: "TASK_MASTER_50", threshold: 50 },
    { type: "TASK_MASTER_100", threshold: 100 },
  ];

  for (const badge of badges) {
    if (tasksCompleted >= badge.threshold) {
      await awardBadgeIfNotExists(userId, badge.type);
    }
  }
}

/**
 * Otorga un badge si el usuario no lo tiene
 */
export async function awardBadgeIfNotExists(userId: string, badgeType: string) {
  // Buscar o crear el badge
  let badge = await prisma.badge.findUnique({
    where: { type: badgeType as any },
  });

  if (!badge) {
    const definition = BADGE_DEFINITIONS.find((b) => b.type === badgeType);
    if (!definition) return;

    badge = await prisma.badge.create({
      data: {
        type: badgeType as any,
        name: definition.name,
        description: definition.description,
        iconEmoji: definition.iconEmoji,
        points: definition.points,
      },
    });
  }

  // Verificar si ya tiene el badge
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      },
    },
  });

  if (existing) return;

  // Otorgar badge
  await prisma.userBadge.create({
    data: {
      userId,
      badgeId: badge.id,
    },
  });

  // Otorgar puntos bonus por el badge
  await awardPoints(
    userId,
    badge.points,
    `Badge desbloqueado: ${badge.name}`
  );
}

/**
 * Actualiza el streak de check-in del usuario
 */
export async function updateCheckInStreak(userId: string, checkInDate: Date) {
  await initializeGamification(userId);

  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (!gamification) return;

  const today = new Date(checkInDate);
  today.setHours(0, 0, 0, 0);

  const lastCheckIn = gamification.lastCheckInDate
    ? new Date(gamification.lastCheckInDate)
    : null;

  if (lastCheckIn) {
    lastCheckIn.setHours(0, 0, 0, 0);
  }

  let newStreak = gamification.currentStreak;

  // Si es el primer check-in o el último fue ayer
  if (!lastCheckIn) {
    newStreak = 1;
  } else {
    const daysDiff = Math.floor(
      (today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Ya hizo check-in hoy, no cambiar streak
      return;
    } else if (daysDiff === 1) {
      // Check-in consecutivo
      newStreak = gamification.currentStreak + 1;
    } else {
      // Se rompió el streak
      newStreak = 1;
    }
  }

  // Actualizar streak
  await prisma.userGamification.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, gamification.longestStreak),
      lastCheckInDate: checkInDate,
    },
  });

  // Otorgar puntos por check-in diario
  await awardPoints(userId, POINTS.DAILY_CHECK_IN, "Check-in diario");

  // Verificar badges de streak
  await checkStreakBadges(userId, newStreak);
}

/**
 * Verifica si es un check-in temprano (antes de las 8 AM)
 */
export async function checkEarlyCheckIn(userId: string, checkInTime: Date) {
  const hour = checkInTime.getHours();

  if (hour < 8) {
    await prisma.userGamification.update({
      where: { userId },
      data: {
        earlyCheckIns: { increment: 1 },
      },
    });

    await awardPoints(
      userId,
      POINTS.EARLY_CHECK_IN,
      "Check-in temprano (antes de las 8 AM)"
    );

    // Verificar badge de madrugador
    const gamification = await prisma.userGamification.findUnique({
      where: { userId },
    });

    if (gamification && gamification.earlyCheckIns >= 10) {
      await awardBadgeIfNotExists(userId, "EARLY_BIRD");
    }
  }
}

/**
 * Verifica y otorga badges relacionados con streaks
 */
export async function checkStreakBadges(userId: string, currentStreak: number) {
  if (currentStreak >= 7) {
    await awardBadgeIfNotExists(userId, "STREAK_7");
  }

  if (currentStreak >= 30) {
    await awardBadgeIfNotExists(userId, "STREAK_30");
  }

  // Verificar semana perfecta (5 días consecutivos)
  if (currentStreak >= 5) {
    await awardBadgeIfNotExists(userId, "PERFECT_WEEK");
    await awardPoints(userId, POINTS.PERFECT_WEEK, "Semana perfecta");
  }
}

/**
 * Obtiene las estadísticas completas de gamificación de un usuario
 */
export async function getGamificationStats(
  userId: string
): Promise<GamificationStats> {
  await initializeGamification(userId);

  const gamification = await prisma.userGamification.findUnique({
    where: { userId },
    include: {
      badges: {
        include: {
          badge: true,
        },
        orderBy: {
          earnedAt: "desc",
        },
      },
    },
  });

  if (!gamification) {
    throw new Error("Gamification not found");
  }

  const levelInfo = getLevelInfo(gamification.totalPoints);

  return {
    totalPoints: gamification.totalPoints,
    level: gamification.level,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    tasksCompleted: gamification.tasksCompleted,
    badges: gamification.badges.map((ub) => ({
      id: ub.badge.id,
      type: ub.badge.type,
      name: ub.badge.name,
      description: ub.badge.description,
      iconEmoji: ub.badge.iconEmoji,
      earnedAt: ub.earnedAt,
    })),
    nextLevelPoints: levelInfo.nextLevelPoints,
    pointsToNextLevel: levelInfo.pointsToNextLevel,
  };
}

/**
 * Obtiene el leaderboard de trabajadores ordenados por puntos
 */
export async function getLeaderboard(limit: number = 10) {
  // Primero, obtener todos los trabajadores
  const allWorkers = await prisma.user.findMany({
    where: {
      role: "WORKER",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Inicializar gamificación para trabajadores que no la tienen
  for (const worker of allWorkers) {
    await initializeGamification(worker.id);
  }

  // Ahora obtener el leaderboard
  const leaderboard = await prisma.userGamification.findMany({
    take: limit,
    orderBy: {
      totalPoints: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      badges: {
        include: {
          badge: true,
        },
      },
    },
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    userName: entry.user.name,
    userEmail: entry.user.email,
    totalPoints: entry.totalPoints,
    level: entry.level,
    currentStreak: entry.currentStreak,
    tasksCompleted: entry.tasksCompleted,
    badgeCount: entry.badges.length,
  }));
}
