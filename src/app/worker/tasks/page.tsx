"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  Calendar as CalendarIcon,
  Target,
} from "lucide-react";

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

export default function WorkerTasksPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<"all" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // REACT QUERY: Sincronización automática con el resto de la aplicación
  // Usa queryKey workerList (diferente al dashboard que usa useInfiniteQuery)
  // Ambos se invalidan juntos en invalidationGroups.taskUpdate
  const { data: tasksData, isLoading: loading } = useQuery({
    queryKey: queryKeys.tasks.workerList,
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Error al obtener tareas");
      const data = await response.json();
      return data.tasks || [];
    },
    staleTime: 10000, // 10 segundos - datos frescos
    refetchOnWindowFocus: true, // Actualizar al volver a la ventana
    refetchOnMount: true, // Refetch al montar componente
  });

  const tasks: Task[] = tasksData || [];

  // OPTIMIZACIÓN: Filtrado memoizado para evitar recálculos innecesarios
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = filter === "all" || task.status === filter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tasks, filter, priorityFilter]);

  // OPTIMIZACIÓN: Stats memoizados para evitar recálculos en cada render
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    urgent: tasks.filter((t) => t.priority === "URGENT" && t.status !== "COMPLETED").length,
  }), [tasks]);

  if (loading) {
    return (
      <MobileLayout title="Mis Tareas" role="WORKER">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Mis Tareas" role="WORKER">
      {/* Hero Section - Resumen de Tareas */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90 font-medium">Pendientes</p>
              <p className="text-hero mt-1">{stats.pending}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">En Progreso</p>
              <p className="text-hero mt-1">{stats.inProgress}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Completadas</p>
              <p className="text-hero mt-1">{stats.completed}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Urgentes</p>
              <p className="text-hero mt-1">{stats.urgent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-card-gap border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filtro por Estado */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Estado</p>
            <Tabs
              defaultValue="all"
              className="w-full"
              onValueChange={(v) => setFilter(v as any)}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS">En Curso</TabsTrigger>
                <TabsTrigger value="COMPLETED">Hechas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filtro por Prioridad */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Prioridad</p>
            <div className="grid grid-cols-5 gap-2">
              <Button
                variant={priorityFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("all")}
                className="text-xs"
              >
                Todas
              </Button>
              <Button
                variant={priorityFilter === "LOW" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("LOW")}
                className="text-xs"
              >
                Baja
              </Button>
              <Button
                variant={priorityFilter === "MEDIUM" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("MEDIUM")}
                className="text-xs"
              >
                Media
              </Button>
              <Button
                variant={priorityFilter === "HIGH" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("HIGH")}
                className="text-xs"
              >
                Alta
              </Button>
              <Button
                variant={priorityFilter === "URGENT" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("URGENT")}
                className="text-xs"
              >
                Urgente
              </Button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">Mostrando</span>
            <Badge variant="secondary" className="text-sm">
              {filteredTasks.length} de {tasks.length} tareas
            </Badge>
          </div>
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
                    <Badge className={priorityColors[task.priority]}>
                      {priorityLabels[task.priority]}
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
                        className={`h-2 rounded-full transition-all ${
                          task.status === "COMPLETED"
                            ? "bg-green-600"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-600"
                            : "bg-yellow-600"
                        }`}
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
                    <Badge className={statusColors[task.status]}>
                      {statusLabels[task.status]}
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
      </div>
    </MobileLayout>
  );
}
