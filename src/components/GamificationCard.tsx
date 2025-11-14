"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Star,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";

interface GamificationStats {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  badges: BadgeEarned[];
  nextLevelPoints: number;
  pointsToNextLevel: number;
}

interface BadgeEarned {
  id: string;
  type: string;
  name: string;
  description: string;
  iconEmoji: string;
  earnedAt: Date;
}

export default function GamificationCard() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/gamification/stats");
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error al obtener estadísticas de gamificación:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const progressPercentage = stats.nextLevelPoints > 0
    ? ((stats.totalPoints - (stats.nextLevelPoints - stats.pointsToNextLevel)) /
       (stats.nextLevelPoints - (stats.nextLevelPoints - stats.pointsToNextLevel))) * 100
    : 0;

  const recentBadges = stats.badges.slice(0, 3);

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Tu Progreso
            </h2>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
            Nivel {stats.level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nivel y Puntos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-gray-700">
                {stats.totalPoints.toLocaleString()} puntos
              </span>
            </div>
            {stats.pointsToNextLevel > 0 && (
              <span className="text-gray-500 text-xs">
                {stats.pointsToNextLevel} para nivel {stats.level + 1}
              </span>
            )}
          </div>
          {stats.pointsToNextLevel > 0 && (
            <Progress
              value={progressPercentage}
              className="h-2 bg-gray-200"
            />
          )}
        </div>

        {/* Estadísticas Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Streak */}
          <div className="bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-600">Racha</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-orange-600">
                {stats.currentStreak}
              </span>
              <span className="text-xs text-gray-500">días</span>
            </div>
          </div>

          {/* Tareas Completadas */}
          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-gray-600">Tareas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-600">
                {stats.tasksCompleted}
              </span>
              <span className="text-xs text-gray-500">hechas</span>
            </div>
          </div>
        </div>

        {/* Badges Recientes */}
        {recentBadges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-700">
                Logros Recientes
              </span>
              <Badge variant="secondary" className="text-xs">
                {stats.badges.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg text-2xl">
                    {badge.iconEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {badge.description}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mejor Racha */}
        {stats.longestStreak > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Mejor Racha
                </span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {stats.longestStreak} días
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
