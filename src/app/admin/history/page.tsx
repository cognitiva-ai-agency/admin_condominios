"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import MobileLayout from "@/components/MobileLayout";
import HistoryFiltersDrawer from "@/components/HistoryFiltersDrawer";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileText,
  Download,
  Printer,
  Loader2,
} from "lucide-react";

// Lazy load del componente de informe
const MonthlyReport = dynamic(() => import("@/components/MonthlyReport"), {
  loading: () => <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>,
  ssr: false,
});

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

  // Estilos globales para impresión del modal
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Ocultar overlay y fondo del modal */
        [data-radix-dialog-overlay],
        [data-radix-popper-content-wrapper] {
          display: none !important;
        }

        /* Hacer que el contenido del modal ocupe toda la página */
        [role="dialog"] {
          position: static !important;
          max-width: none !important;
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Asegurar que el body no tenga overflow oculto */
        body {
          overflow: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Filtros
  const [filterWorker, setFilterWorker] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("analysis");

  // Estados para informe mensual
  const currentDate = new Date();
  const [reportMonth, setReportMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, "0")
  );
  const [reportYear, setReportYear] = useState<string>(
    String(currentDate.getFullYear())
  );
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const generateMonthlyReport = async () => {
    setLoadingReport(true);
    try {
      const response = await fetch(
        `/api/reports/monthly?month=${reportMonth}&year=${reportYear}`
      );
      const data = await response.json();

      if (response.ok) {
        setMonthlyReport(data.report);
        setShowReportModal(true);
      } else {
        alert(data.error || "Error al generar el informe");
      }
    } catch (error) {
      console.error("Error al generar informe:", error);
      alert("Error al generar el informe. Intenta nuevamente.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    // Usar window.print() que permite guardar como PDF
    window.print();
  };

  // Obtener categorías únicas
  const categories = Array.from(
    new Set(tasks.map((task) => task.category).filter((c) => c !== null))
  ) as string[];

  // Handler para cambios de filtros
  const handleFilterChange = (filters: {
    worker: string;
    dateFrom: string;
    dateTo: string;
    category: string;
  }) => {
    setFilterWorker(filters.worker);
    setFilterDateFrom(filters.dateFrom);
    setFilterDateTo(filters.dateTo);
    setFilterCategory(filters.category);
    // Cambiar automáticamente al tab de "Tareas" para mostrar los resultados
    setActiveTab("tasks");
  };

  // Verificar si hay filtros activos
  const hasActiveFilters =
    filterWorker !== "all" ||
    filterDateFrom !== "" ||
    filterDateTo !== "" ||
    filterCategory !== "all";

  const activeFilterCount = [
    filterWorker !== "all",
    filterDateFrom !== "",
    filterDateTo !== "",
    filterCategory !== "all",
  ].filter(Boolean).length;

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

      {/* Botón de Filtros - Visible en todos los tabs */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(true)}
        className="w-full h-14 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all mb-4"
      >
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-lg ${hasActiveFilters ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            {hasActiveFilters && (
              <Badge className="bg-blue-600 text-white h-5 min-w-[20px] px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-900 mt-0.5">
            Filtrar ({filteredTasks.length})
          </span>
        </div>
      </Button>

      {/* Tarjeta de Resultados Filtrados */}
      {hasActiveFilters && (
        <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Resultados Filtrados</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterWorker("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterCategory("all");
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Tareas encontradas:</span>
                <Badge className="bg-blue-600 text-white text-base px-3">
                  {filteredTasks.length}
                </Badge>
              </div>

              {/* Filtros activos */}
              <div className="flex flex-wrap gap-2">
                {filterWorker !== "all" && (
                  <Badge variant="secondary" className="bg-white border border-blue-200">
                    👤 {workers.find((w) => w.id === filterWorker)?.name}
                  </Badge>
                )}
                {filterDateFrom !== "" && (
                  <Badge variant="secondary" className="bg-white border border-blue-200">
                    📅 Desde: {new Date(filterDateFrom).toLocaleDateString("es-CL")}
                  </Badge>
                )}
                {filterDateTo !== "" && (
                  <Badge variant="secondary" className="bg-white border border-blue-200">
                    📅 Hasta: {new Date(filterDateTo).toLocaleDateString("es-CL")}
                  </Badge>
                )}
                {filterCategory !== "all" && (
                  <Badge variant="secondary" className="bg-white border border-blue-200">
                    🏷️ {filterCategory}
                  </Badge>
                )}
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  No hay tareas que coincidan con los filtros seleccionados
                </p>
              </div>
            ) : (
              <Button
                onClick={() => setActiveTab("tasks")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver {filteredTasks.length} Tarea{filteredTasks.length !== 1 ? "s" : ""}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs para organizar contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-section-gap">
        <TabsList className="grid w-full grid-cols-3 mb-card-gap">
          <TabsTrigger value="analysis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Informes
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

        {/* Tab: Informes Mensuales */}
        <TabsContent value="reports" className="space-y-card-gap">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Generar Informe Mensual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700 mb-4">
                  Genera un informe completo de todas las tareas completadas
                  durante un mes específico. Este informe incluye estadísticas
                  detalladas, desempeño por trabajador, y puede ser descargado
                  como PDF para enviar a los propietarios del edificio.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-month">Mes</Label>
                    <Select value={reportMonth} onValueChange={setReportMonth}>
                      <SelectTrigger id="report-month">
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Enero</SelectItem>
                        <SelectItem value="02">Febrero</SelectItem>
                        <SelectItem value="03">Marzo</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Mayo</SelectItem>
                        <SelectItem value="06">Junio</SelectItem>
                        <SelectItem value="07">Julio</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Septiembre</SelectItem>
                        <SelectItem value="10">Octubre</SelectItem>
                        <SelectItem value="11">Noviembre</SelectItem>
                        <SelectItem value="12">Diciembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-year">Año</Label>
                    <Select value={reportYear} onValueChange={setReportYear}>
                      <SelectTrigger id="report-year">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = currentDate.getFullYear() - i;
                          return (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={generateMonthlyReport}
                  disabled={loadingReport}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {loadingReport ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generando informe...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mr-2" />
                      Generar Informe
                    </>
                  )}
                </Button>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  ¿Qué incluye el informe?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                  <li>Resumen ejecutivo del período</li>
                  <li>Estadísticas de tareas completadas y costos</li>
                  <li>Análisis de rendimiento de tiempo</li>
                  <li>Desempeño detallado por trabajador</li>
                  <li>Distribución por categorías</li>
                  <li>Listado completo de tareas realizadas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal del Informe Mensual */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:max-h-none print:overflow-visible print:h-auto">
          <DialogHeader className="p-6 pb-4 border-b no-print">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Informe Mensual - {monthlyReport?.period.monthName}{" "}
              {monthlyReport?.period.year}
            </DialogTitle>
            <DialogDescription>
              Informe completo de gestión del edificio
            </DialogDescription>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handlePrintReport}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleDownloadReport}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="p-6">
            {monthlyReport && <MonthlyReport report={monthlyReport} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Filters Drawer */}
      <HistoryFiltersDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        workers={workers}
        categories={categories}
        filterWorker={filterWorker}
        filterDateFrom={filterDateFrom}
        filterDateTo={filterDateTo}
        filterCategory={filterCategory}
        onFilterChange={handleFilterChange}
        totalFiltered={filteredTasks.length}
        totalTasks={tasks.length}
      />
    </MobileLayout>
  );
}
