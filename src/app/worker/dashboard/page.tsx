"use client";

import { useMemo, useState, useCallback, useRef, useEffect, memo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSyncInvalidation } from "@/hooks/useSyncInvalidation";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Search,
  Play,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

// OPTIMIZACIÓN: Lazy loading de componentes pesados
const WorkerTaskCalendar = dynamic(() => import("@/components/WorkerTaskCalendar"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

const AttendanceChip = dynamic(() => import("@/components/AttendanceChip"), {
  loading: () => <Skeleton className="h-16 w-full" />,
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

// OPTIMIZACIÓN: Componente TaskCard memoizado con acciones rápidas
const TaskCard = memo(
  ({
    task,
    onStartTask,
    showQuickActions = false,
  }: {
    task: Task;
    onStartTask?: (taskId: string) => void;
    showQuickActions?: boolean;
  }) => {
    const isOverdue = useMemo(() => {
      const endDate = new Date(task.scheduledEndDate);
      return endDate < new Date() && task.status !== "COMPLETED";
    }, [task.scheduledEndDate, task.status]);

    return (
      <Card
        className={`border-0 shadow-md hover:shadow-lg transition-all ${
          isOverdue ? "border-l-4 border-red-500" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
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
                  {isOverdue ? "Vencida" : "Fecha límite"}
                </span>
                <span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
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

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 gap-2">
              <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                {statusLabels[task.status as keyof typeof statusLabels]}
              </Badge>

              <div className="flex gap-2">
                {showQuickActions && task.status === "PENDING" && onStartTask && (
                  <Button
                    size="sm"
                    onClick={() => onStartTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                )}
                <Link href={`/worker/tasks/${task.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {task.status === "IN_PROGRESS" ? "Continuar" : "Ver"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TaskCard.displayName = "TaskCard";

// Componente de Stat Card interactivo
const StatCard = memo(
  ({
    title,
    value,
    icon: Icon,
    gradient,
    onClick,
    isActive,
  }: {
    title: string;
    value: number;
    icon: any;
    gradient: string;
    onClick: () => void;
    isActive: boolean;
  }) => {
    return (
      <Card
        className={`border-0 shadow-md hover:shadow-xl transition-all cursor-pointer ${
          isActive ? "ring-2 ring-blue-500 ring-offset-2" : ""
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className={`rounded-lg p-3 ${gradient} text-white`}>
            <div className="flex items-center justify-between mb-2">
              <Icon className="h-5 w-5" />
              {isActive && <CheckCircle2 className="h-4 w-4" />}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-90 mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

export default function WorkerDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { invalidateGroup, forceRefetch, queryKeys } = useSyncInvalidation();
  const [filter, setFilter] = useState<"all" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // OPTIMIZACIÓN: Cargar TODAS las tareas con sincronización en tiempo real
  // El filtrado se hace en cliente para evitar destellos
  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchTasks,
  } = useInfiniteQuery({
    queryKey: ["worker-tasks"], // Query key fija - no cambia con el filtro
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "50", // Aumentado a 50 para cargar más tareas de una vez
      });
      // NO enviamos filtro al servidor - cargamos todas las tareas
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar tareas");
      return await response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // Si la última página tiene menos tareas que el límite, no hay más páginas
      if (lastPage.tasks.length < 50) return undefined;
      // Si hay más páginas, devolver el número de la siguiente página
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 10000, // MEJORADO: 10 segundos para datos más frescos
    gcTime: 300000, // 5 minutos de caché
    refetchInterval: 10000, // OPTIMIZADO: Polling cada 10 segundos para actualizaciones más rápidas
    refetchOnWindowFocus: true, // HABILITADO: Actualizar al volver a la ventana
    refetchOnReconnect: true, // Mantener: útil cuando se recupera conexión
    refetchOnMount: true, // HABILITADO: Refetch al montar componente
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

  // OPTIMIZACIÓN: Memoizar el cambio de filtro para evitar recrear la función
  const handleFilterChange = useCallback((value: string) => {
    setFilter(value as "all" | "PENDING" | "IN_PROGRESS" | "COMPLETED");
  }, []);

  // Mutation para iniciar tarea
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar tarea");
      }

      return await response.json();
    },
    onSuccess: async () => {
      // SINCRONIZACIÓN ROBUSTA: Invalidar grupo de tareas y forzar refetch
      await invalidateGroup("taskUpdate");
      await forceRefetch([queryKeys.tasks.worker]);
      toast.success("Tarea iniciada", "La tarea se ha marcado como 'En Progreso'");
    },
    onError: (error: Error) => {
      toast.error("Error", error.message);
    },
  });

  // OPTIMIZACIÓN CRÍTICA: Filtrado en CLIENTE para evitar destellos
  // Aplicar filtro de estado Y búsqueda
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filtro por estado
    if (filter !== "all") {
      result = result.filter((task) => task.status === filter);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.category?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, filter, searchQuery]);

  // Filtrar tareas de hoy (que vencen hoy o tienen fecha de inicio hoy)
  const todayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((task) => {
      const endDate = new Date(task.scheduledEndDate);
      endDate.setHours(0, 0, 0, 0);

      const startDate = new Date(task.scheduledStartDate);
      startDate.setHours(0, 0, 0, 0);

      return (
        (endDate.getTime() === today.getTime() || startDate.getTime() === today.getTime()) &&
        task.status !== "COMPLETED" &&
        task.status !== "CANCELLED"
      );
    });
  }, [tasks]);

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
      {/* Control de Asistencia - Componente Inteligente y Colapsable */}
      <div className="mb-4">
        <AttendanceChip />
      </div>

      {/* Búsqueda de Tareas */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar tareas por título, descripción o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 border-0 shadow-md"
          />
        </div>
      </div>

      {/* Stats Interactivos - Clicables para filtrar */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Tareas"
            value={stats.total}
            icon={ClipboardList}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => handleFilterChange("all")}
            isActive={filter === "all"}
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertCircle}
            gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            onClick={() => handleFilterChange("PENDING")}
            isActive={filter === "PENDING"}
          />
          <StatCard
            title="En Progreso"
            value={stats.inProgress}
            icon={Timer}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            onClick={() => handleFilterChange("IN_PROGRESS")}
            isActive={filter === "IN_PROGRESS"}
          />
          <StatCard
            title="Completadas"
            value={stats.completed}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            onClick={() => handleFilterChange("COMPLETED")}
            isActive={filter === "COMPLETED"}
          />
        </div>
      </div>

      {/* Tareas de Hoy - Sección destacada */}
      {todayTasks.length > 0 && (
        <Card className="mb-4 border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Tareas de Hoy</CardTitle>
              </div>
              <Badge className="bg-orange-600 text-white">{todayTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStartTask={(taskId) => startTaskMutation.mutate(taskId)}
                showQuickActions
              />
            ))}
            {todayTasks.length > 3 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleFilterChange("all")}
              >
                Ver todas las tareas de hoy ({todayTasks.length})
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header de resultados */}
      <div className="flex items-center justify-between px-1 mb-4">
        <p className="text-sm text-gray-600 font-medium">
          {searchQuery
            ? `${filteredTasks.length} resultado${filteredTasks.length !== 1 ? "s" : ""} encontrado${filteredTasks.length !== 1 ? "s" : ""}`
            : `Mostrando ${filteredTasks.length} tarea${filteredTasks.length !== 1 ? "s" : ""}`}
        </p>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-blue-600 hover:text-blue-700"
          >
            Limpiar búsqueda
          </Button>
        )}
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium mb-2">
                {searchQuery
                  ? "No se encontraron tareas"
                  : tasks.length === 0
                    ? "No tienes tareas asignadas"
                    : filter !== "all"
                      ? `No hay tareas ${statusLabels[filter as keyof typeof statusLabels]?.toLowerCase() || ""}`
                      : "No hay tareas"}
              </p>
              {searchQuery && (
                <p className="text-sm text-gray-400">
                  Intenta con otros términos de búsqueda
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStartTask={(taskId) => startTaskMutation.mutate(taskId)}
              showQuickActions
            />
          ))
        )}

        {/* Infinite Scroll - Indicador de carga */}
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
    </MobileLayout>
  );
}
