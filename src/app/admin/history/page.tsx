"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateTimeStats,
  calculateEfficiencyRate,
  getTaskTimeStatus,
  getTimeStatusColor,
  getTimeStatusLabel,
  formatDuration,
  getTaskActualDuration,
} from "@/utils/timeUtils";
import {
  CheckCircle2,
  DollarSign,
  Target,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  Calendar,
  Users,
  Eye,
  Tag,
  AlertCircle,
  Timer,
  XCircle,
} from "lucide-react";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string | null;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  totalCost: number;
  completedSubtasks: number;
  totalSubtasks: number;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  }[];
  createdBy: {
    name: string;
    email: string;
  };
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const priorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterWorker, setFilterWorker] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchCompletedTasks();
    fetchWorkers();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const response = await fetch("/api/tasks?status=COMPLETED");
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error al obtener tareas completadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error("Error al obtener trabajadores:", error);
    }
  };

  // Obtener categorías únicas
  const categories = Array.from(
    new Set(tasks.map((task) => task.category).filter((c) => c !== null))
  ) as string[];

  // Filtrar tareas
  const filteredTasks = tasks.filter((task) => {
    // Filtro por trabajador
    if (filterWorker !== "all") {
      const hasWorker = task.assignedTo.some((w) => w.id === filterWorker);
      if (!hasWorker) return false;
    }

    // Filtro por fecha desde
    if (filterDateFrom && task.actualEndDate) {
      const taskDate = new Date(task.actualEndDate).setHours(0, 0, 0, 0);
      const fromDate = new Date(filterDateFrom).setHours(0, 0, 0, 0);
      if (taskDate < fromDate) return false;
    }

    // Filtro por fecha hasta
    if (filterDateTo && task.actualEndDate) {
      const taskDate = new Date(task.actualEndDate).setHours(0, 0, 0, 0);
      const toDate = new Date(filterDateTo).setHours(0, 0, 0, 0);
      if (taskDate > toDate) return false;
    }

    // Filtro por categoría
    if (filterCategory !== "all" && task.category !== filterCategory) {
      return false;
    }

    return true;
  });

  // Calcular estadísticas
  const timeStats = calculateTimeStats(filteredTasks);
  const efficiencyRate = calculateEfficiencyRate(filteredTasks);

  const stats = {
    total: filteredTasks.length,
    totalCost: filteredTasks.reduce((sum, t) => sum + t.totalCost, 0),
    efficiencyRate,
    onTime: timeStats.onTime,
    early: timeStats.early,
    late: timeStats.late,
    averageDuration: timeStats.averageDuration,
    averageDelay: timeStats.averageDelay,
  };

  if (loading) {
    return (
      <MobileLayout title="Historial" role="ADMIN">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Historial de Tareas" role="ADMIN">
      {/* Hero Section - Métricas Principales */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90 font-medium">Total Completadas</p>
              <p className="text-hero mt-1">{stats.total}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Eficiencia</p>
              <p className="text-hero mt-1">{stats.efficiencyRate}%</p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Costo Total</p>
              <p className="text-hero mt-1 truncate">
                ${(stats.totalCost / 1000).toFixed(0)}K
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90 font-medium">Tiempo Promedio</p>
              <p className="text-xl font-bold mt-1">
                {stats.averageDuration > 0
                  ? formatDuration(stats.averageDuration)
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar contenido */}
      <Tabs defaultValue="analysis" className="mb-section-gap">
        <TabsList className="grid w-full grid-cols-2 mb-card-gap">
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tareas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Análisis */}
        <TabsContent value="analysis" className="space-y-card-gap">
          {/* Análisis de Rendimiento de Tiempo */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-indigo-600" />
                  <span className="text-gray-900">Rendimiento de Tiempo</span>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  <Target className="h-3 w-3 mr-1" />
                  {stats.efficiencyRate}% eficiencia
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barra de progreso de eficiencia */}
                <div>
                  <div className="flex justify-between text-xs text-gray-700 mb-2 font-medium">
                    <span>Tasa de Cumplimiento</span>
                    <span>{stats.efficiencyRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        stats.efficiencyRate >= 80
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : stats.efficiencyRate >= 60
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}
                      style={{ width: `${stats.efficiencyRate}%` }}
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
                    <p className="text-2xl font-bold text-green-900">
                      {stats.early}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      {stats.total > 0
                        ? `${Math.round((stats.early / stats.total) * 100)}%`
                        : "0%"}
                    </p>
                  </div>

                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-700">
                        A tiempo
                      </span>
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.onTime}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {stats.total > 0
                        ? `${Math.round((stats.onTime / stats.total) * 100)}%`
                        : "0%"}
                    </p>
                  </div>

                  <div className="bg-red-100 rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-red-700">
                        Tarde
                      </span>
                      <TrendingUp className="h-3 w-3 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      {stats.late}
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      {stats.total > 0
                        ? `${Math.round((stats.late / stats.total) * 100)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>

                {/* Retraso promedio si hay tareas tardías */}
                {stats.late > 0 && stats.averageDelay > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                      ⏱️ Retraso promedio: {formatDuration(stats.averageDelay)}
                    </p>
                  </div>
                )}

                {/* Mensaje de rendimiento */}
                <div className="bg-white/80 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-gray-700 text-center">
                    {stats.efficiencyRate >= 80 ? (
                      <span className="text-green-700 font-medium">
                        🎉 Excelente rendimiento histórico
                      </span>
                    ) : stats.efficiencyRate >= 60 ? (
                      <span className="text-yellow-700 font-medium">
                        👍 Buen rendimiento, hay margen de mejora
                      </span>
                    ) : (
                      <span className="text-red-700 font-medium">
                        ⚠️ Rendimiento bajo, revisar procesos
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Filtro por Trabajador */}
                <div className="space-y-2">
                  <Label htmlFor="filter-worker">Trabajador</Label>
                  <Select value={filterWorker} onValueChange={setFilterWorker}>
                    <SelectTrigger id="filter-worker">
                      <SelectValue placeholder="Todos los trabajadores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los trabajadores</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtros de Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-from">Desde</Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-to">Hasta</Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtro por Categoría */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="filter-category">Categoría</Label>
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger id="filter-category">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Contador de resultados y botón limpiar */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant="secondary" className="text-sm">
                  {filteredTasks.length} de {tasks.length} tareas
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterWorker("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setFilterCategory("all");
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tasks" className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">
                  {tasks.length === 0
                    ? "No hay tareas completadas en el historial"
                    : "No hay tareas que coincidan con los filtros seleccionados"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Link
                key={task.id}
                href={`/admin/tasks/${task.id}`}
                className="block"
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 flex-1">
                          {task.title}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge
                            className={priorityColors[task.priority]}
                          >
                            {priorityLabels[task.priority]}
                          </Badge>
                          {task.actualStartDate && task.actualEndDate && (
                            <Badge
                              className={getTimeStatusColor(
                                getTaskTimeStatus(task)
                              )}
                            >
                              ⏱️ {getTimeStatusLabel(getTaskTimeStatus(task))}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {task.category && (
                          <div className="flex items-center text-gray-600">
                            <Tag className="h-4 w-4 mr-1.5" />
                            <span className="truncate">{task.category}</span>
                          </div>
                        )}

                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          <span className="truncate">
                            {new Date(task.actualEndDate!).toLocaleDateString(
                              "es-CL"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center text-green-600 font-medium">
                          <DollarSign className="h-4 w-4 mr-1.5" />
                          ${task.totalCost.toLocaleString("es-CL")}
                        </div>

                        <div className="flex items-center text-gray-600">
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          {task.completedSubtasks}/{task.totalSubtasks}
                        </div>

                        {task.actualStartDate && task.actualEndDate && (
                          <div className="col-span-2 flex items-center text-purple-700 font-medium">
                            <Clock className="h-4 w-4 mr-1.5" />
                            Duración: {formatDuration(getTaskActualDuration(task) || 0)}
                          </div>
                        )}
                      </div>

                      {/* Trabajadores asignados */}
                      {task.assignedTo.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                          {task.assignedTo.map((worker) => (
                            <Badge
                              key={worker.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {worker.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Ver detalles */}
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles Completos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
