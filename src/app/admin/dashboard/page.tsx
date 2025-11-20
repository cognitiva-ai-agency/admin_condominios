"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  AlertCircle,
  ListTodo,
  Timer,
} from "lucide-react";

interface DashboardStats {
  totalWorkers: number;
  activeTasks: number;
  completedToday: number;
  pendingNotifications: number;
  efficiencyRate: number;
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
}

interface CriticalTasksData {
  urgentTasks: any[];
  overdueTasks: any[];
  dueTodayTasks: any[];
  unassignedUrgent: any[];
  summary: {
    totalUrgent: number;
    totalOverdue: number;
    totalDueToday: number;
    totalUnassignedUrgent: number;
    priorityBreakdown: {
      URGENT: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
    categoryBreakdown: Record<string, number>;
  };
}

export default function AdminDashboard() {
  const router = useRouter();

  // Query: Estadísticas generales
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Error al cargar estadísticas");
      const data = await response.json();
      return data.stats as DashboardStats;
    },
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Query: Tareas críticas
  const { data: criticalData, isLoading: loadingCritical } = useQuery({
    queryKey: ["dashboard-critical"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/critical-tasks");
      if (!response.ok) throw new Error("Error al cargar tareas críticas");
      const data = await response.json();
      return data as CriticalTasksData;
    },
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  return (
    <MobileLayout title="Panel de Control" role="ADMIN">
      {/* SECCIÓN 1: KPIs PRINCIPALES - Todos clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Trabajadores Activos */}
        <Card
          className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600 cursor-pointer hover:scale-105"
          onClick={() => router.push("/admin/users")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-blue-900">{stats?.totalWorkers || 0}</p>
            )}
            <p className="text-xs text-blue-700 font-medium mt-1">Trabajadores</p>
            <p className="text-[10px] text-blue-600 mt-1 opacity-75">Click para gestionar →</p>
          </CardContent>
        </Card>

        {/* Tareas en Progreso */}
        <Card
          className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600 cursor-pointer hover:scale-105"
          onClick={() => router.push("/admin/tasks?active=true")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-600 text-white text-xs">
                {criticalData?.summary.totalUrgent || 0} urgentes
              </Badge>
            </div>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-green-900">{stats?.activeTasks || 0}</p>
            )}
            <p className="text-xs text-green-700 font-medium mt-1">En operación</p>
            <p className="text-[10px] text-green-600 mt-1 opacity-75">Click para ver →</p>
          </CardContent>
        </Card>

        {/* Tareas Atrasadas - NAVEGACIÓN INTELIGENTE */}
        <Card
          className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-600 cursor-pointer hover:scale-105"
          onClick={() => router.push("/admin/tasks?overdue=true")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Badge className="bg-red-600 text-white text-xs">
                {criticalData?.summary.totalDueToday || 0} hoy
              </Badge>
            </div>
            {loadingCritical ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-red-900">
                {criticalData?.summary.totalOverdue || 0}
              </p>
            )}
            <p className="text-xs text-red-700 font-medium mt-1">Atrasadas</p>
            <p className="text-[10px] text-red-600 mt-1 opacity-75">Click para revisar →</p>
          </CardContent>
        </Card>

        {/* Completadas Hoy - NAVEGACIÓN INTELIGENTE */}
        <Card
          className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-600 cursor-pointer hover:scale-105"
          onClick={() => router.push("/admin/tasks?completedToday=true")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <Badge className="bg-purple-600 text-white text-xs">
                Hoy
              </Badge>
            </div>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-purple-900">{stats?.completedToday || 0}</p>
            )}
            <p className="text-xs text-purple-700 font-medium mt-1">Completadas Hoy</p>
            <p className="text-[10px] text-purple-600 mt-1 opacity-75">Click para ver →</p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 2: ALERTAS Y TAREAS CRÍTICAS */}
      {criticalData && (criticalData.summary.totalOverdue > 0 || criticalData.summary.totalUnassignedUrgent > 0) && (
        <Card className="mb-6 border-0 shadow-lg border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Atención Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {criticalData.summary.totalOverdue > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-red-200 hover:border-red-400 transition-all cursor-pointer" onClick={() => router.push("/admin/tasks")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Tareas Atrasadas</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    {criticalData.summary.totalOverdue}
                  </p>
                  <p className="text-xs text-gray-600 mb-3">Requieren atención inmediata</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/admin/tasks");
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Revisar Ahora
                  </Button>
                </div>
              )}

              {criticalData.summary.totalUnassignedUrgent > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-orange-200 hover:border-orange-400 transition-all cursor-pointer" onClick={() => router.push("/admin/tasks")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-900">Sin Asignar</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    {criticalData.summary.totalUnassignedUrgent}
                  </p>
                  <p className="text-xs text-gray-600 mb-3">Tareas urgentes sin trabajador</p>
                  <Button
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/admin/tasks");
                    }}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Asignar Trabajador
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECCIÓN 3: RESUMEN DE RENDIMIENTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Distribución por Prioridad */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-gray-700" />
              Tareas por Prioridad
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Click en cualquier prioridad para filtrar</p>
          </CardHeader>
          <CardContent>
            {loadingCritical ? (
              <Skeleton className="h-32 w-full" />
            ) : criticalData ? (
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors group"
                  onClick={() => router.push("/admin/tasks?priority=URGENT")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full group-hover:scale-125 transition-transform"></div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">Urgentes</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {criticalData.summary.priorityBreakdown.URGENT}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors group"
                  onClick={() => router.push("/admin/tasks?priority=HIGH")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full group-hover:scale-125 transition-transform"></div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Altas</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {criticalData.summary.priorityBreakdown.HIGH}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors group"
                  onClick={() => router.push("/admin/tasks?priority=MEDIUM")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full group-hover:scale-125 transition-transform"></div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700">Medias</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">
                    {criticalData.summary.priorityBreakdown.MEDIUM}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => router.push("/admin/tasks?priority=LOW")}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full group-hover:scale-125 transition-transform"></div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-700">Bajas</span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">
                    {criticalData.summary.priorityBreakdown.LOW}
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Rendimiento de Tiempo */}
        <Card
          className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all"
          onClick={() => router.push("/admin/history")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-gray-700" />
              Rendimiento de Tiempo
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Click para ver análisis completo →</p>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-32 w-full" />
            ) : stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Antes de tiempo</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.earlyCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">A tiempo</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.onTimeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Tarde</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{stats.lateCount}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-700 mb-2">
                    <span>Eficiencia Global</span>
                    <span className="font-semibold">{stats.efficiencyRate}%</span>
                  </div>
                  <Progress value={stats.efficiencyRate} className="h-2" />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
