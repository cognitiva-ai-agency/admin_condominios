"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Subtask {
  id?: string;
  title: string;
  order: number;
  isCompleted?: boolean;
}

interface Cost {
  id?: string;
  description: string;
  amount: number;
  costType: "MATERIALS" | "LABOR" | "OTHER";
}

interface TaskCost {
  id: string;
  description: string;
  amount: number;
  type: "MATERIALS" | "LABOR" | "OTHER";
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
  assignedTo: Worker[];
  subtasks: any[];
  costs: any[];
  totalCost: number;
  completedSubtasks: number;
  createdAt: string;
}

// Componente para subtarea ordenable con drag & drop
function SortableSubtask({
  subtask,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  subtask: Subtask;
  index: number;
  onUpdate: (index: number, title: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const id = `subtask-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      <button
        type="button"
        className="px-2 py-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>
      <input
        type="text"
        placeholder={`Subtarea ${index + 1}`}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
        value={subtask.title}
        onChange={(e) => onUpdate(index, e.target.value)}
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    category: "",
    scheduledStartDate: "",
    scheduledEndDate: "",
    assignedWorkerIds: [] as string[],
    isRecurring: false,
    recurrencePattern: "WEEKLY" as "DAILY" | "WEEKLY" | "MONTHLY",
    recurrenceEndDate: "",
  });

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const [costs, setCosts] = useState<Cost[]>([]);

  // Configurar sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manejar el evento de drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex(
        (_, idx) => `subtask-${idx}` === active.id
      );
      const newIndex = subtasks.findIndex(
        (_, idx) => `subtask-${idx}` === over.id
      );

      setSubtasks((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

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
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      category: task.category || "",
      scheduledStartDate: task.scheduledStartDate.split("T")[0],
      scheduledEndDate: task.scheduledEndDate.split("T")[0],
      assignedWorkerIds: task.assignedTo.map((w) => w.id),
      isRecurring: (task as any).isRecurring || false,
      recurrencePattern: (task as any).recurrencePattern || "WEEKLY",
      recurrenceEndDate: (task as any).recurrenceEndDate ? (task as any).recurrenceEndDate.split("T")[0] : "",
    });
    setSubtasks(
      task.subtasks.length > 0
        ? task.subtasks.map((st: any) => ({
            id: st.id,
            title: st.title,
            order: st.order
          }))
        : [{ title: "", order: 0 }]
    );
    setCosts(
      task.costs
        .filter((c: any) => c.costType) // Solo cargar costos que tengan tipo
        .map((c: any) => ({
          id: c.id,
          description: c.description || "",
          amount: Number(c.amount) || 0,
          costType: c.costType as "MATERIALS" | "LABOR" | "OTHER",
        }))
    );
    setShowModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Si estamos editando
      if (editingTask) {
        // Validar subtareas
        const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");
        if (validSubtasks.length === 0) {
          setError("Debe agregar al menos una subtarea");
          setSubmitting(false);
          return;
        }

        // Filtrar y mapear costos válidos
        const validCosts = costs.filter(
          (c) =>
            c.description &&
            c.description.trim() !== "" &&
            c.amount > 0 &&
            c.costType &&
            (c.costType === "MATERIALS" || c.costType === "LABOR" || c.costType === "OTHER")
        );

        const requestBody: any = {
          title: formData.title,
          priority: formData.priority,
          scheduledStartDate: formData.scheduledStartDate,
          scheduledEndDate: formData.scheduledEndDate,
          assignedWorkerIds: formData.assignedWorkerIds,
          isRecurring: formData.isRecurring,
          recurrencePattern: formData.isRecurring ? formData.recurrencePattern : null,
          recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null,
          subtasks: validSubtasks.map((st, index) => {
            const subtask: any = {
              title: st.title,
              order: index,
            };
            // Solo incluir id si existe
            if (st.id) {
              subtask.id = st.id;
            }
            return subtask;
          }),
        };

        // Solo agregar description si no está vacío
        if (formData.description && formData.description.trim() !== "") {
          requestBody.description = formData.description;
        }

        // Solo agregar category si no está vacío
        if (formData.category && formData.category.trim() !== "") {
          requestBody.category = formData.category;
        }

        // Solo agregar costs si hay costos válidos
        if (validCosts.length > 0) {
          requestBody.costs = validCosts.map((c) => {
            const amount = typeof c.amount === 'number' ? c.amount : parseFloat(c.amount);
            const cost: any = {
              description: c.description,
              amount: isNaN(amount) ? 0 : amount, // Asegurar que sea un número válido
              costType: c.costType,
            };
            // Solo incluir id si existe
            if (c.id) {
              cost.id = c.id;
            }
            return cost;
          });
        }

        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
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
              : data.error || "Error al actualizar tarea"
          );
          return;
        }

        setShowModal(false);
        resetForm();
        setEditingTask(null);
        fetchTasks();
      } else {
        // Validar subtareas solo al crear
        const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");
        if (validSubtasks.length === 0) {
          setError("Debe agregar al menos una subtarea");
          setSubmitting(false);
          return;
        }

        // Filtrar costos válidos (misma validación que en edición)
        const validCostsCreate = costs.filter(
          (c) =>
            c.description &&
            c.description.trim() !== "" &&
            c.amount > 0 &&
            c.costType &&
            (c.costType === "MATERIALS" || c.costType === "LABOR" || c.costType === "OTHER")
        );

        const response = await fetch("/api/tasks/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            subtasks: validSubtasks.map((st, index) => ({
              title: st.title,
              order: index,
            })),
            costs: validCostsCreate.length > 0 ? validCostsCreate : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Error al crear tarea");
          return;
        }

        setShowModal(false);
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      setError(
        editingTask
          ? "Ocurrió un error al actualizar la tarea"
          : "Ocurrió un error al crear la tarea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "",
      scheduledStartDate: "",
      scheduledEndDate: "",
      assignedWorkerIds: [],
      isRecurring: false,
      recurrencePattern: "WEEKLY",
      recurrenceEndDate: "",
    });
    setSubtasks([]);
    setCosts([]);
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
        alert("Error al eliminar tarea");
        return;
      }

      fetchTasks();
    } catch (error) {
      alert("Ocurrió un error al eliminar la tarea");
    }
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { title: "", order: subtasks.length }]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, title: string) => {
    const updated = [...subtasks];
    updated[index].title = title;
    setSubtasks(updated);
  };

  const addCost = () => {
    setCosts([
      ...costs,
      { description: "", amount: 0, costType: "MATERIALS" },
    ]);
  };

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const updateCost = (index: number, field: keyof Cost, value: any) => {
    const updated = [...costs];
    // Si el campo es amount, asegurar que sea un número
    if (field === "amount") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCosts(updated);
  };

  const toggleWorker = (workerId: string) => {
    if (formData.assignedWorkerIds.includes(workerId)) {
      setFormData({
        ...formData,
        assignedWorkerIds: formData.assignedWorkerIds.filter((id) => id !== workerId),
      });
    } else {
      setFormData({
        ...formData,
        assignedWorkerIds: [...formData.assignedWorkerIds, workerId],
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Traducciones de estados
  const statusLabels = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En Progreso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  // Traducciones de prioridades
  const priorityLabels = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  // Filtrar tareas
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus;
    const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Tareas
            </h1>
            <p className="text-sm text-gray-600">
              Total: {tasks.length} tareas
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Estado
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterStatus("PENDING")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === "PENDING"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setFilterStatus("IN_PROGRESS")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === "IN_PROGRESS"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  En Progreso
                </button>
                <button
                  onClick={() => setFilterStatus("COMPLETED")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === "COMPLETED"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Completadas
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Prioridad
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterPriority("all")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterPriority === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterPriority("URGENT")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterPriority === "URGENT"
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  Urgente
                </button>
                <button
                  onClick={() => setFilterPriority("HIGH")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterPriority === "HIGH"
                      ? "bg-orange-600 text-white"
                      : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  }`}
                >
                  Alta
                </button>
                <button
                  onClick={() => setFilterPriority("MEDIUM")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterPriority === "MEDIUM"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  Media
                </button>
                <button
                  onClick={() => setFilterPriority("LOW")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterPriority === "LOW"
                      ? "bg-gray-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Baja
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {filteredTasks.length} de {tasks.length} tareas
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Nueva Tarea
          </button>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {tasks.length === 0
              ? "No hay tareas creadas. Crea tu primera tarea."
              : "No hay tareas que coincidan con los filtros seleccionados."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {task.title}
                  </h3>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Editar tarea"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Eliminar tarea"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(task.status)}`}>
                      {statusLabels[task.status as keyof typeof statusLabels] || task.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                      {priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progreso:</span>
                    <span className="font-medium">
                      {task.completedSubtasks}/{task.subtasks.length} subtareas
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo Total:</span>
                    <span className="font-medium text-green-600">
                      ${task.totalCost.toLocaleString("es-CL")}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Asignado a:</span>
                    <span className="font-medium">
                      {task.assignedTo.length} trabajador(es)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha límite:</span>
                    <span className="font-medium">
                      {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/admin/tasks/${task.id}`}
                  className="mt-4 block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Ver Detalles
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingTask ? "Editar Tarea" : "Nueva Tarea"}
            </h2>

            <form onSubmit={handleCreateTask} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de la tarea *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Ej: Mantención Piscina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    value={formData.scheduledStartDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledStartDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de término *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                    value={formData.scheduledEndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledEndDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Tarea Recurrente */}
              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center space-x-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecurring: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Tarea Recurrente
                  </span>
                </label>

                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frecuencia *
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                        value={formData.recurrencePattern}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrencePattern: e.target.value as "DAILY" | "WEEKLY" | "MONTHLY",
                          })
                        }
                      >
                        <option value="DAILY">Diaria</option>
                        <option value="WEEKLY">Semanal</option>
                        <option value="MONTHLY">Mensual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de fin de recurrencia
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                        value={formData.recurrenceEndDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrenceEndDate: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dejar vacío para que sea indefinida
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Asignar trabajadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar trabajadores *
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {workers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay trabajadores disponibles. Crea trabajadores primero.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {workers.map((worker) => (
                        <label
                          key={worker.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedWorkerIds.includes(worker.id)}
                            onChange={() => toggleWorker(worker.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 font-medium">{worker.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subtareas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtareas (Checklist) *
                  <span className="text-gray-500 font-normal text-xs ml-2">
                    (Arrastra para reordenar)
                  </span>
                </label>
                {subtasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    + Agregar primera subtarea
                  </button>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={subtasks.map((_, idx) => `subtask-${idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {subtasks.map((subtask, index) => (
                          <SortableSubtask
                            key={`subtask-${index}`}
                            subtask={subtask}
                            index={index}
                            onUpdate={updateSubtask}
                            onRemove={removeSubtask}
                            canRemove={subtasks.length > 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                {subtasks.length > 0 && (
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Agregar subtarea
                  </button>
                )}
              </div>

              {/* Costos (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costos (Opcional)
                </label>
                {costs.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {costs.map((cost, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Descripción"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400"
                          value={cost.description}
                          onChange={(e) =>
                            updateCost(index, "description", e.target.value)
                          }
                        />
                        <input
                          type="number"
                          placeholder="Monto"
                          min="0"
                          step="any"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400"
                          value={cost.amount || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                            updateCost(index, "amount", value);
                          }}
                        />
                        <select
                          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium"
                          value={cost.costType}
                          onChange={(e) =>
                            updateCost(index, "costType", e.target.value)
                          }
                        >
                          <option value="MATERIALS">Materiales</option>
                          <option value="LABOR">Mano de obra</option>
                          <option value="OTHER">Otro</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCost(index)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addCost}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar costo
                </button>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submitting || formData.assignedWorkerIds.length === 0}
                >
                  {submitting
                    ? editingTask
                      ? "Actualizando..."
                      : "Creando..."
                    : editingTask
                    ? "Actualizar Tarea"
                    : "Crear Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
