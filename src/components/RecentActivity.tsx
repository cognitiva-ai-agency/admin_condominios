"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  User,
  ClipboardCheck,
  LogIn,
  LogOut as LogOutIcon,
  Filter,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  id: string;
  type: "TASK_COMPLETED" | "SUBTASK_COMPLETED" | "CHECK_IN" | "CHECK_OUT";
  user: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  } | null;
  subtask?: {
    id: string;
    title: string;
  } | null;
  timestamp: string;
}

interface Worker {
  id: string;
  name: string;
}

export default function RecentActivity() {
  const [selectedWorker, setSelectedWorker] = useState<string>("all");

  // OPTIMIZACIÓN: React Query para workers
  const { data: workersData } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      return data.workers as Worker[];
    },
    staleTime: 60000, // 1 minuto
  });

  const workers = workersData || [];

  // OPTIMIZACIÓN: React Query para actividades con polling automático cada 5 segundos
  const {
    data: activitiesData,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["recent-activity", selectedWorker],
    queryFn: async () => {
      // Obtener tareas completadas recientes
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      const tasks = tasksData.tasks || [];

      // Obtener todas las asistencias del día de todos los trabajadores
      const attendanceRes = await fetch("/api/attendance/recent");
      const attendanceData = await attendanceRes.json();
      const attendances = attendanceData.attendances || [];

      const recentActivities: Activity[] = [];

      // Procesar tareas completadas (últimas 20)
      const completedTasks = tasks
        .filter((t: any) => t.status === "COMPLETED" && t.actualEndDate)
        .sort(
          (a: any, b: any) =>
            new Date(b.actualEndDate).getTime() -
            new Date(a.actualEndDate).getTime()
        )
        .slice(0, 20);

      completedTasks.forEach((task: any) => {
        // Actividad de tarea completada
        const firstAssignee = task.assignedTo[0];
        if (firstAssignee) {
          recentActivities.push({
            id: `task-${task.id}`,
            type: "TASK_COMPLETED",
            user: {
              id: firstAssignee.id,
              name: firstAssignee.name,
            },
            task: {
              id: task.id,
              title: task.title,
            },
            timestamp: task.actualEndDate,
          });
        }

        // Actividades de subtareas completadas
        task.subtasks
          .filter((st: any) => st.isCompleted && st.completedAt && st.completedBy)
          .forEach((subtask: any) => {
            recentActivities.push({
              id: `subtask-${subtask.id}`,
              type: "SUBTASK_COMPLETED",
              user: {
                id: subtask.completedBy.id,
                name: subtask.completedBy.name,
              },
              task: {
                id: task.id,
                title: task.title,
              },
              subtask: {
                id: subtask.id,
                title: subtask.title,
              },
              timestamp: subtask.completedAt,
            });
          });
      });

      // Procesar asistencias de todos los trabajadores
      attendances.forEach((attendance: any) => {
        if (attendance.checkIn) {
          recentActivities.push({
            id: `checkin-${attendance.id}`,
            type: "CHECK_IN",
            user: {
              id: attendance.user.id,
              name: attendance.user.name,
            },
            timestamp: attendance.checkIn,
          });
        }

        if (attendance.checkOut) {
          recentActivities.push({
            id: `checkout-${attendance.id}`,
            type: "CHECK_OUT",
            user: {
              id: attendance.user.id,
              name: attendance.user.name,
            },
            timestamp: attendance.checkOut,
          });
        }
      });

      // Ordenar por fecha (más reciente primero)
      let sortedActivities = recentActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Filtrar por trabajador si está seleccionado
      if (selectedWorker !== "all") {
        sortedActivities = sortedActivities.filter(
          (activity) => activity.user.id === selectedWorker
        );
      }

      // Limitar a 15 actividades
      sortedActivities = sortedActivities.slice(0, 15);

      return sortedActivities;
    },
    refetchInterval: 5000, // POLLING: Actualizar cada 5 segundos
    staleTime: 3000, // Considerar datos frescos por 3 segundos
    gcTime: 30000, // Mantener en caché por 30 segundos
  });

  const activities = activitiesData || [];

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "TASK_COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "SUBTASK_COMPLETED":
        return <ClipboardCheck className="h-5 w-5 text-blue-600" />;
      case "CHECK_IN":
        return <LogIn className="h-5 w-5 text-purple-600" />;
      case "CHECK_OUT":
        return <LogOutIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: Activity["type"]) => {
    switch (type) {
      case "TASK_COMPLETED":
        return "bg-green-50 border-green-200";
      case "SUBTASK_COMPLETED":
        return "bg-blue-50 border-blue-200";
      case "CHECK_IN":
        return "bg-purple-50 border-purple-200";
      case "CHECK_OUT":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case "TASK_COMPLETED":
        return (
          <>
            <span className="font-semibold text-gray-900">
              {activity.user.name}
            </span>{" "}
            completó la tarea{" "}
            <Link
              href={`/admin/tasks/${activity.task?.id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {activity.task?.title}
            </Link>
          </>
        );
      case "SUBTASK_COMPLETED":
        return (
          <>
            <span className="font-semibold text-gray-900">
              {activity.user.name}
            </span>{" "}
            completó subtarea "{activity.subtask?.title}" en{" "}
            <Link
              href={`/admin/tasks/${activity.task?.id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {activity.task?.title}
            </Link>
          </>
        );
      case "CHECK_IN":
        return (
          <>
            <span className="font-semibold text-gray-900">
              {activity.user.name}
            </span>{" "}
            registró entrada
          </>
        );
      case "CHECK_OUT":
        return (
          <>
            <span className="font-semibold text-gray-900">
              {activity.user.name}
            </span>{" "}
            registró salida
          </>
        );
      default:
        return <span>Actividad desconocida</span>;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <LoadingState message="Cargando actividad..." size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Actividad Reciente en Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Filtros y Controles */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los trabajadores</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Lista de Actividades */}
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {selectedWorker === "all"
                  ? "No hay actividad reciente para mostrar"
                  : "Este trabajador no tiene actividad reciente"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 items-start p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 hover:shadow-md transition-all"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                      {getUserInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 mb-1">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg border ${getActivityBgColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Indicador de actualización automática */}
          <div className="text-center pt-2 border-t mt-3">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Se actualiza automáticamente cada 5 segundos
              {isRefetching && <span className="text-blue-600 font-medium">(actualizando...)</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
