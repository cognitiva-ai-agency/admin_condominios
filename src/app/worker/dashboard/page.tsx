"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useInfiniteQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  Eye,
  Target,
  BarChart3,
  Timer,
} from "lucide-react";

// OPTIMIZACIÓN: Lazy loading de componentes pesados
const WorkerTaskCalendar = dynamic(() => import("@/components/WorkerTaskCalendar"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const AttendanceCheckIn = dynamic(() => import("@/components/AttendanceCheckIn"), {
  loading: () => <Skeleton className="h-32 w-full" />,
  ssr: false,
});

const GamificationCard = dynamic(() => import("@/components/GamificationCard"), {
  loading: () => <Skeleton className="h-48 w-full" />,
  ssr: false,
});

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string | null;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  subtasks: Subtask[];
  totalCost: number;
  completedSubtasks: number;
  createdBy: {
    name: string;
    email: string;
  };
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const priorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export default function WorkerDashboard() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<"all" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("all");

  // OPTIMIZACIÓN: Usar React Query Infinite Query para scroll infinito
  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchTasks,
  } = useInfiniteQuery({
    queryKey: ["worker-tasks", filter !== "all" ? filter : null],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "20",
      });
      if (filter !== "all") {
        params.append("status", filter);
      }
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar tareas");
      return await response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // Si la última página tiene menos tareas que el límite, no hay más páginas
      if (lastPage.tasks.length < 20) return undefined;
      // Si hay más páginas, devolver el número de la siguiente página
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000,
    gcTime: 60000,
  });

  // Aplanar todas las páginas en un solo array de tareas
  const tasks = useMemo(
    () => data?.pages.flatMap((page) => page.tasks) || [],
    [data]
  );

  // Ref para el observer del infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // OPTIMIZACIÓN: Intersection Observer para infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Ya no necesitamos filtrar en cliente - el servidor devuelve las tareas filtradas
  const filteredTasks = tasks;

  // OPTIMIZACIÓN: Memoizar stats para evitar recálculos en cada render
  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
    }),
    [tasks]
  );

  // OPTIMIZACIÓN: Memoizar statsData para evitar recrear el array en cada render
  const statsData = useMemo(
    () => [
      {
        title: "Total Tareas",
        value: stats.total,
        icon: ClipboardList,
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      },
      {
        title: "Pendientes",
        value: stats.pending,
        icon: AlertCircle,
        gradient: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      },
      {
        title: "En Progreso",
        value: stats.inProgress,
        icon: Clock,
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      },
      {
        title: "Completadas",
        value: stats.completed,
        icon: CheckCircle2,
        gradient: "bg-gradient-to-br from-green-500 to-green-600",
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <MobileLayout title="Mi Dashboard" role="WORKER">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Mi Dashboard" role="WORKER">
      {/* Control de Asistencia */}
      <div className="mb-section-gap">
        <AttendanceCheckIn />
      </div>

      {/* Hero Section - Métricas Principales */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90 font-medium">Total Tareas</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats.total}</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Pendientes</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats.pending}</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">En Progreso</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats.inProgress}</p>
              )}
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Completadas</p>
              {loading ? (
                <Skeleton className="h-10 w-20 bg-white/20 mt-1" />
              ) : (
                <p className="text-hero mt-1">{stats.completed}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar contenido */}
      <Tabs defaultValue="overview" className="mb-section-gap">
        <TabsList className="grid w-full grid-cols-2 mb-card-gap">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-card-gap">
          {/* Gamification Card */}
          <GamificationCard />

          {/* Filtros y Lista de Tareas */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Mis Tareas
                </CardTitle>
                <Badge variant="secondary">{filteredTasks.length} tareas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
                  <TabsTrigger value="IN_PROGRESS">En Curso</TabsTrigger>
                  <TabsTrigger value="COMPLETED">Hechas</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Lista de Tareas */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    {tasks.length === 0
                      ? "No tienes tareas asignadas"
                      : filter !== "all"
                        ? `No hay tareas ${statusLabels[filter as keyof typeof statusLabels]?.toLowerCase() || ""}`
                        : "No hay tareas que coincidan con los filtros"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 flex-1">
                          {task.title}
                        </h3>
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Progreso
                          </span>
                          <span className="font-medium">
                            {task.completedSubtasks}/{task.subtasks.length}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                task.subtasks.length > 0
                                  ? (task.completedSubtasks / task.subtasks.length) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Fecha límite
                          </span>
                          <span className="font-medium">
                            {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                          </span>
                        </div>

                        {task.category && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Categoría</span>
                            <Badge variant="outline">{task.category}</Badge>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between pt-2">
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                        <Link href={`/worker/tasks/${task.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* OPTIMIZACIÓN: Infinite Scroll - Indicador de carga */}
            {!loading && filteredTasks.length > 0 && (
              <>
                <div ref={loadMoreRef} className="h-4" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                )}
                {!hasNextPage && filteredTasks.length >= 10 && (
                  <Card className="border-0 shadow-sm bg-gray-50">
                    <CardContent className="py-6 text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Has visto todas tus tareas ({filteredTasks.length} en total)
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab: Calendario */}
        <TabsContent value="calendar" className="space-y-card-gap">
          {session?.user?.id && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  Mi Calendario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkerTaskCalendar userId={session.user.id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
