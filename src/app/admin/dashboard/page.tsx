"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Bell,
  Calendar,
  Clock,
  RefreshCw,
  Timer,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

// Lazy loading de componentes pesados
const AdminTaskCalendar = dynamic(() => import("@/components/AdminTaskCalendar"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const RecentActivity = dynamic(() => import("@/components/RecentActivity"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

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

export default function AdminDashboard() {
  const router = useRouter();
  const toast = useToast();

  // OPTIMIZACIÓN: Usar React Query para caché y gestión de estado
  const {
    data: stats,
    isLoading: loading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Error al cargar estadísticas");
      const data = await response.json();
      return data.stats as DashboardStats;
    },
    staleTime: 30000, // 30 segundos
    gcTime: 60000, // 1 minuto de caché
  });

  // OPTIMIZACIÓN: Usar useCallback para memoizar la función
  const handleGenerateRecurring = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks/generate-recurring", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(
          "¡Tareas generadas!",
          `${data.generatedCount} tareas recurrentes creadas exitosamente`
        );
        refetchStats(); // Actualizar stats después de generar tareas
      } else {
        toast.error(
          "Error al generar tareas",
          data.error || "No se pudieron generar las tareas recurrentes"
        );
      }
    } catch (error) {
      toast.error(
        "Error de conexión",
        "No se pudo conectar con el servidor. Intenta nuevamente."
      );
    }
  }, [toast, refetchStats]);

  // OPTIMIZACIÓN: Memoizar statsData para evitar re-renders innecesarios
  const statsData = useMemo(
    () => [
      {
        title: "Trabajadores",
        value: stats?.totalWorkers || 0,
        icon: Users,
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
        trend: "+2 este mes",
      },
      {
        title: "Tareas Activas",
        value: stats?.activeTasks || 0,
        icon: ClipboardList,
        gradient: "bg-gradient-to-br from-green-500 to-green-600",
        trend: "5 urgentes",
      },
      {
        title: "Completadas Hoy",
        value: stats?.completedToday || 0,
        icon: CheckCircle2,
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
        trend: "80% cumplimiento",
      },
      {
        title: "Notificaciones",
        value: stats?.pendingNotifications || 0,
        icon: Bell,
        gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      },
    ],
    [stats]
  );

  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    onClick,
    gradient,
    disabled = false,
  }: {
    title: string;
    description: string;
    icon: any;
    onClick: () => void;
    gradient: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-105 hover:shadow-lg active:scale-95"
      } ${gradient}`}
    >
      <div className="flex items-start gap-3">
        <div className="bg-white/90 p-2 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );

  return (
    <MobileLayout title="Dashboard" role="ADMIN">
      {/* Hero Section - Métricas Principales */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90 font-medium">Tareas Activas</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats?.activeTasks || 0}</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Eficiencia</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats?.efficiencyRate || 0}%</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Completadas Hoy</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats?.completedToday || 0}</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Trabajadores</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats?.totalWorkers || 0}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar contenido secundario */}
      <Tabs defaultValue="overview" className="mb-section-gap">
        <TabsList className="grid w-full grid-cols-3 mb-card-gap">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-card-gap">
          {/* Rendimiento de Tiempo */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-indigo-600" />
              <span className="text-gray-900">Rendimiento de Tiempo</span>
            </div>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
              <Target className="h-3 w-3 mr-1" />
              {stats?.efficiencyRate || 0}% eficiencia
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de progreso de eficiencia */}
            <div>
              <div className="flex justify-between text-xs text-gray-700 mb-2 font-medium">
                <span>Tasa de Cumplimiento</span>
                <span>{stats?.efficiencyRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (stats?.efficiencyRate || 0) >= 80
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : (stats?.efficiencyRate || 0) >= 60
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}
                  style={{ width: `${stats?.efficiencyRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Estadísticas desglosadas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-100 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-green-700">
                    Antes
                  </span>
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-green-900">
                    {stats?.earlyCount || 0}
                  </p>
                )}
                <p className="text-xs text-green-700 mt-0.5">tareas</p>
              </div>

              <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700">
                    A tiempo
                  </span>
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.onTimeCount || 0}
                  </p>
                )}
                <p className="text-xs text-blue-700 mt-0.5">tareas</p>
              </div>

              <div className="bg-red-100 rounded-lg p-3 border border-red-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-red-700">
                    Tarde
                  </span>
                  <TrendingUp className="h-3 w-3 text-red-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-red-900">
                    {stats?.lateCount || 0}
                  </p>
                )}
                <p className="text-xs text-red-700 mt-0.5">tareas</p>
              </div>
            </div>

            {/* Mensaje de rendimiento */}
            <div className="bg-white/80 rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-gray-700 text-center">
                {(stats?.efficiencyRate || 0) >= 80 ? (
                  <span className="text-green-700 font-medium">
                    Excelente rendimiento del equipo
                  </span>
                ) : (stats?.efficiencyRate || 0) >= 60 ? (
                  <span className="text-yellow-700 font-medium">
                    Buen rendimiento, hay margen de mejora
                  </span>
                ) : (
                  <span className="text-red-700 font-medium">
                    Rendimiento bajo, revisar procesos
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Acciones Rápidas */}
          <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3">
          <QuickActionCard
            title="Gestionar Trabajadores"
            description="Crear, editar o eliminar trabajadores"
            icon={Users}
            onClick={() => router.push("/admin/users")}
            gradient="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
          />
          <QuickActionCard
            title="Gestionar Tareas"
            description="Crear y asignar tareas a trabajadores"
            icon={ClipboardList}
            onClick={() => router.push("/admin/tasks")}
            gradient="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
          />
          <QuickActionCard
            title="Generar Tareas Recurrentes"
            description="Crear instancias de tareas recurrentes"
            icon={RefreshCw}
            onClick={handleGenerateRecurring}
            gradient="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
          />
          <QuickActionCard
            title="Ver Historial"
            description="Tareas completadas con filtros"
            icon={Calendar}
            onClick={() => router.push("/admin/history")}
            gradient="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
          />
        </CardContent>
      </Card>
        </TabsContent>

        {/* Tab: Calendario */}
        <TabsContent value="calendar" className="space-y-card-gap">
          <AdminTaskCalendar />
        </TabsContent>

        {/* Tab: Actividad */}
        <TabsContent value="activity" className="space-y-card-gap">
          <RecentActivity />
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
