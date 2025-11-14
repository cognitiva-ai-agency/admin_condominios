"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTaskActualDuration,
  formatDuration,
  getTaskTimeStatus,
  getTimeStatusColor,
  getTimeStatusLabel,
} from "@/utils/timeUtils";
import {
  Plus,
  Filter,
  Calendar,
  Users as UsersIcon,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import AdminTaskCalendar from "@/components/AdminTaskCalendar";
import TaskWizard from "@/components/TaskWizard/TaskWizard";
import TaskFiltersDrawer from "@/components/TaskFiltersDrawer";
import QuickTaskCreate from "@/components/QuickTaskCreate";
import { useToast } from "@/components/providers/ToastProvider";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  assignedTo: Worker[];
  subtasks: any[];
  costs: any[];
  totalCost: number;
  completedSubtasks: number;
  createdAt: string;
}

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterWorker, setFilterWorker] = useState<string>("all");

  useEffect(() => {
    fetchTasks();
    fetchWorkers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error al obtener tareas:", error);
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowSheet(true);
  };

  const handleCreateTask = async (requestBody: any) => {
    setError("");
    setSubmitting(true);

    try {
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : "/api/tasks/create";
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.details
            ? `Datos inválidos: ${JSON.stringify(data.details)}`
            : data.error || "Error al procesar tarea"
        );
        return;
      }

      setShowSheet(false);
      resetForm();
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      setError("Ocurrió un error al procesar la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setError("");
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Error al eliminar", "No se pudo eliminar la tarea");
        return;
      }

      toast.success("Tarea eliminada", "La tarea se eliminó exitosamente");
      fetchTasks();
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al eliminar la tarea");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      LOW: "bg-gray-100 text-gray-800 border-gray-200",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      URGENT: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[priority as keyof typeof variants] || "bg-gray-100 text-gray-800";
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

  const handleFilterChange = (filters: {
    status: string;
    priority: string;
    worker: string;
  }) => {
    setFilterStatus(filters.status);
    setFilterPriority(filters.priority);
    setFilterWorker(filters.worker);
  };

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus;
    const priorityMatch =
      filterPriority === "all" || task.priority === filterPriority;
    const workerMatch =
      filterWorker === "all" ||
      task.assignedTo.some((w) => w.id === filterWorker);
    return statusMatch && priorityMatch && workerMatch;
  });

  const hasActiveFilters =
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterWorker !== "all";

  const activeFilterCount = [
    filterStatus !== "all",
    filterPriority !== "all",
    filterWorker !== "all",
  ].filter(Boolean).length;

  if (loading) {
    return (
      <MobileLayout title="Tareas" role="ADMIN">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Gestión de Tareas" role="ADMIN">
      {/* Botones de Acción Rápida */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Crear Tarea Rápida */}
        <Button
          onClick={() => setShowQuickCreate(true)}
          className="h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
        >
          <div className="flex flex-col items-center">
            <Plus className="h-5 w-5 mb-0.5" />
            <span className="text-xs font-semibold">Crear Rápido</span>
          </div>
        </Button>

        {/* Filtros */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(true)}
          className="h-14 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
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
      </div>

      {/* Calendario */}
      <Card className="mb-4 border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Calendario</h2>
          </div>
        </CardHeader>
        <CardContent>
          <AdminTaskCalendar
            selectedWorkerId={filterWorker === "all" ? undefined : filterWorker}
          />
        </CardContent>
      </Card>

      {/* Lista de Tareas */}
      <div className="space-y-4 mb-4">
        {filteredTasks.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">
                {tasks.length === 0
                  ? "No hay tareas creadas"
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusBadge(task.status)}>
                      {statusLabels[task.status as keyof typeof statusLabels]}
                    </Badge>
                    <Badge className={getPriorityBadge(task.priority)}>
                      {priorityLabels[task.priority as keyof typeof priorityLabels]}
                    </Badge>
                    {task.status === "COMPLETED" && task.actualStartDate && task.actualEndDate && (
                      <Badge className={getTimeStatusColor(getTaskTimeStatus(task))}>
                        ⏱️ {getTimeStatusLabel(getTaskTimeStatus(task))}
                      </Badge>
                    )}
                  </div>

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
                    {task.status === "COMPLETED" && task.actualStartDate && task.actualEndDate && (
                      <div className="flex items-center justify-between bg-blue-50 -mx-2 px-2 py-1.5 rounded-lg">
                        <span className="text-blue-700 flex items-center gap-1 font-medium">
                          <Clock className="h-4 w-4" />
                          Tiempo Real
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatDuration(getTaskActualDuration(task) || 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Costo
                      </span>
                      <span className="font-medium text-green-600">
                        ${task.totalCost.toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        Asignados
                      </span>
                      <span className="font-medium">
                        {task.assignedTo.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Fecha límite
                      </span>
                      <span className="font-medium">
                        {new Date(task.scheduledEndDate).toLocaleDateString(
                          "es-CL"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Ver Detalles */}
                  <Link href={`/admin/tasks/${task.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botón Flotante Nueva Tarea Completa */}
      <Button
        className="fixed right-4 bottom-20 h-14 w-14 rounded-full shadow-2xl z-40 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        size="icon"
        onClick={() => {
          resetForm();
          setShowSheet(true);
        }}
        title="Crear tarea completa (con todos los detalles)"
      >
        <Edit className="h-6 w-6" />
      </Button>

      {/* Task Wizard - Formulario multi-step */}
      <TaskWizard
        open={showSheet}
        onOpenChange={setShowSheet}
        workers={workers}
        editingTask={editingTask}
        onSubmit={handleCreateTask}
        submitting={submitting}
        error={error}
      />

      {/* Filters Drawer */}
      <TaskFiltersDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        workers={workers}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        filterWorker={filterWorker}
        onFilterChange={handleFilterChange}
        totalFiltered={filteredTasks.length}
        totalTasks={tasks.length}
      />

      {/* Quick Task Create */}
      <QuickTaskCreate
        open={showQuickCreate}
        onOpenChange={setShowQuickCreate}
        workers={workers}
        onSuccess={fetchTasks}
      />
    </MobileLayout>
  );
}
