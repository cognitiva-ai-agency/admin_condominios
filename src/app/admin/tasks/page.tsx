"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSyncInvalidation } from "@/hooks/useSyncInvalidation";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function TasksPageContent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { invalidateGroup, queryKeys } = useSyncInvalidation();
  const searchParams = useSearchParams();
  const [showSheet, setShowSheet] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterWorker, setFilterWorker] = useState<string>("all");
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);
  const [filterCompletedToday, setFilterCompletedToday] = useState<boolean>(false);
  const [filterActive, setFilterActive] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Aplicar filtros desde URL cuando el componente se monta o cambian los searchParams
  useEffect(() => {
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const worker = searchParams.get("worker");
    const overdue = searchParams.get("overdue");
    const completedToday = searchParams.get("completedToday");
    const active = searchParams.get("active");

    if (status) setFilterStatus(status);
    if (priority) setFilterPriority(priority);
    if (worker) setFilterWorker(worker);
    if (overdue === "true") setFilterOverdue(true);
    if (completedToday === "true") setFilterCompletedToday(true);
    if (active === "true") setFilterActive(true);
  }, [searchParams]);

  // REACT QUERY: Gestión de tareas con caché y sincronización automática
  const {
    data: tasks = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Error al cargar tareas");
      const data = await response.json();
      return data.tasks || [];
    },
    staleTime: 5000, // 5 segundos - datos frescos para admin
    refetchInterval: 30000, // Polling cada 30 segundos para ver actualizaciones
  });

  // REACT QUERY: Gestión de trabajadores
  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Error al cargar trabajadores");
      const data = await response.json();
      return data.workers || [];
    },
    staleTime: 60000, // 1 minuto - los trabajadores cambian poco
  });

  // MUTATION: Crear o editar tarea con optimistic update
  const createOrUpdateTaskMutation = useMutation({
    mutationFn: async (requestBody: any) => {
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : "/api/tasks/create";
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.details
            ? `Datos inválidos: ${JSON.stringify(data.details)}`
            : data.error || "Error al procesar tarea"
        );
      }
      return data.task;
    },
    onMutate: async (newTaskData) => {
      // OPTIMISTIC UPDATE: Actualizar UI inmediatamente
      await queryClient.cancelQueries({ queryKey: ["admin-tasks"] });
      const previousTasks = queryClient.getQueryData(["admin-tasks"]);

      if (editingTask) {
        // Editando tarea existente
        queryClient.setQueryData(["admin-tasks"], (old: Task[] = []) =>
          old.map((task) =>
            task.id === editingTask.id
              ? { ...task, ...newTaskData, id: editingTask.id }
              : task
          )
        );
      } else {
        // Creando nueva tarea - transformar assignedWorkerIds a assignedTo
        const assignedWorkers = workers.filter((w: Worker) =>
          newTaskData.assignedWorkerIds?.includes(w.id)
        );

        const optimisticTask = {
          ...newTaskData,
          id: "temp-" + Date.now(),
          createdAt: new Date().toISOString(),
          completedSubtasks: 0,
          subtasks: newTaskData.subtasks || [],
          costs: newTaskData.costs || [],
          totalCost: Array.isArray(newTaskData.costs)
            ? newTaskData.costs.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
            : 0,
          assignedTo: assignedWorkers,
        };
        queryClient.setQueryData(["admin-tasks"], (old: Task[] = []) => [
          optimisticTask,
          ...old,
        ]);
      }

      return { previousTasks };
    },
    onError: (error: Error, _variables, context) => {
      // Revertir optimistic update si hay error
      if (context?.previousTasks) {
        queryClient.setQueryData(["admin-tasks"], context.previousTasks);
      }
      setError(error.message);
      toast.error("Error", error.message);
    },
    onSuccess: async (newTask) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(["admin-tasks"], (old: Task[] = []) => {
        if (editingTask) {
          return old.map((task) => (task.id === editingTask.id ? newTask : task));
        } else {
          // Reemplazar tarea temporal con la real
          return [newTask, ...old.filter((task) => !task.id.startsWith("temp-"))];
        }
      });

      // SINCRONIZACIÓN ROBUSTA: Invalidar grupo de mutación de tareas
      await invalidateGroup("taskMutation");

      toast.success(
        editingTask ? "Tarea actualizada" : "Tarea creada",
        editingTask
          ? "La tarea se actualizó exitosamente"
          : "La tarea se creó exitosamente"
      );

      setShowSheet(false);
      resetForm();
      setEditingTask(null);
    },
  });

  // MUTATION: Eliminar tarea con optimistic update
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("No se pudo eliminar la tarea");
      return taskId;
    },
    onMutate: async (taskId) => {
      // OPTIMISTIC UPDATE: Eliminar de la UI inmediatamente
      await queryClient.cancelQueries({ queryKey: ["admin-tasks"] });
      const previousTasks = queryClient.getQueryData(["admin-tasks"]);

      queryClient.setQueryData(["admin-tasks"], (old: Task[] = []) =>
        old.filter((task) => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (_error, _taskId, context) => {
      // Revertir si hay error
      if (context?.previousTasks) {
        queryClient.setQueryData(["admin-tasks"], context.previousTasks);
      }
      toast.error("Error al eliminar", "No se pudo eliminar la tarea");
    },
    onSuccess: async () => {
      // SINCRONIZACIÓN ROBUSTA: Invalidar grupo de mutación de tareas
      await invalidateGroup("taskMutation");

      toast.success("Tarea eliminada", "La tarea se eliminó exitosamente");
    },
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowSheet(true);
  };

  const handleCreateTask = async (requestBody: any) => {
    setError("");
    createOrUpdateTaskMutation.mutate(requestBody);
  };

  const resetForm = () => {
    setError("");
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
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

  const filteredTasks = tasks.filter((task: Task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus;
    const priorityMatch =
      filterPriority === "all" || task.priority === filterPriority;
    const workerMatch =
      filterWorker === "all" ||
      task.assignedTo?.some((w: Worker) => w.id === filterWorker);

    // Filtro de tareas activas (en progreso o pendientes)
    const activeMatch = !filterActive || (
      task.status === "PENDING" || task.status === "IN_PROGRESS"
    );

    // Filtro de tareas atrasadas
    const overdueMatch = !filterOverdue || (
      (task.status === "PENDING" || task.status === "IN_PROGRESS") &&
      new Date(task.scheduledEndDate) < new Date()
    );

    // Filtro de tareas completadas hoy
    const completedTodayMatch = !filterCompletedToday || (
      task.status === "COMPLETED" &&
      task.actualEndDate &&
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endDate = new Date(task.actualEndDate);
        return endDate >= today && endDate < tomorrow;
      })()
    );

    return statusMatch && priorityMatch && workerMatch && activeMatch && overdueMatch && completedTodayMatch;
  });

  const hasActiveFilters =
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterWorker !== "all" ||
    filterActive ||
    filterOverdue ||
    filterCompletedToday;

  const activeFilterCount = [
    filterStatus !== "all",
    filterPriority !== "all",
    filterWorker !== "all",
    filterActive,
    filterOverdue,
    filterCompletedToday,
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

      {/* Secciones Colapsables */}
      <Accordion type="multiple" defaultValue={["tasks"]} className="space-y-4">
        {/* Calendario */}
        <AccordionItem value="calendar" className="border-0 shadow-md rounded-lg overflow-hidden bg-white">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Calendario de Tareas</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <AdminTaskCalendar
              selectedWorkerId={filterWorker === "all" ? undefined : filterWorker}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Lista de Tareas */}
        <AccordionItem value="tasks" className="border-0 shadow-md rounded-lg overflow-hidden bg-white">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Listado de Tareas</h2>
              </div>
              <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                {filteredTasks.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4">
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
          filteredTasks.map((task: Task) => (
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
                        {task.completedSubtasks || 0}/{task.subtasks?.length || 0}
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
                        ${(task.totalCost || 0).toLocaleString("es-CL")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        Asignado a
                      </span>
                      <span className="font-medium text-right">
                        {task.assignedTo?.length > 0
                          ? task.assignedTo.map(w => w.name).join(", ")
                          : "Sin asignar"}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
        submitting={createOrUpdateTaskMutation.isPending}
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
        onSuccess={() => {
          // Invalidar query para refrescar lista
          queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea y todos sus datos asociados
              (subtareas, costos, reportes) serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout title="Tareas" role="ADMIN">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </MobileLayout>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
