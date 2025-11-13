"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/Toast";

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  completedById: string | null;
  completedAt: string | null;
  reportBefore: string | null;
  reportAfter: string | null;
  photosBefore: string[];
  photosAfter: string[];
  completedBy: {
    name: string;
    email: string;
  } | null;
}

interface TaskCost {
  id: string;
  description: string;
  amount: number;
  type: "MATERIAL" | "LABOR" | "OTHER";
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
  costs: TaskCost[];
  assignedTo: Array<{ id: string; name: string; email: string }>;
  createdBy: { name: string; email: string };
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
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

const costTypeLabels = {
  MATERIAL: "Material",
  LABOR: "Mano de Obra",
  OTHER: "Otro",
};

export default function WorkerTaskDetail() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [reportBefore, setReportBefore] = useState("");
  const [reportAfter, setReportAfter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (!response.ok) throw new Error("Error al cargar tarea");
      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error("Error:", error);
      setToast({
        message: "No se pudo cargar la tarea",
        type: "error",
      });
      setTimeout(() => router.push("/worker/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!task || task.status !== "PENDING") return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al iniciar tarea");
      }

      setToast({
        message: "Tarea iniciada exitosamente",
        type: "success",
      });
      fetchTask();
    } catch (error: any) {
      console.error("Error:", error);
      setToast({
        message: error.message || "No se pudo iniciar la tarea",
        type: "error",
      });
    }
  };

  const openCompleteModal = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setReportBefore("");
    setReportAfter("");
    setError("");
    setShowCompleteModal(true);
  };

  const handleCompleteSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubtask) return;

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/subtasks/${selectedSubtask.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportBefore: reportBefore || undefined,
          reportAfter,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al completar subtarea");
        return;
      }

      setShowCompleteModal(false);
      setSelectedSubtask(null);
      fetchTask();
    } catch (error) {
      setError("Ocurrió un error al completar la subtarea");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tarea...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
  const progress = task.subtasks.length > 0
    ? Math.round((completedSubtasks / task.subtasks.length) * 100)
    : 0;
  const totalCost = task.costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/worker/dashboard"
            className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver a Mis Tareas
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Subtasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Task Button */}
            {task.status === "PENDING" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tarea no iniciada
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  Haz clic en el botón para comenzar a trabajar en esta tarea.
                </p>
                <button
                  onClick={handleStartTask}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Iniciar Tarea
                </button>
              </div>
            )}

            {/* Progress Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progreso General
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completado</span>
                  <span>{completedSubtasks}/{task.subtasks.length} subtareas ({progress}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Subtareas ({completedSubtasks}/{task.subtasks.length})
              </h2>
              <div className="space-y-3">
                {task.subtasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay subtareas definidas
                  </p>
                ) : (
                  task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`p-4 border rounded-lg ${
                        subtask.isCompleted
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <div className="mt-1 mr-3">
                            {subtask.isCompleted ? (
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${subtask.isCompleted ? "text-gray-600 line-through" : "text-gray-900"}`}>
                              {subtask.title}
                            </p>
                            {subtask.isCompleted && subtask.completedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completada por {subtask.completedBy.name} el{" "}
                                {new Date(subtask.completedAt!).toLocaleDateString("es-CL")}
                              </p>
                            )}
                            {subtask.isCompleted && subtask.reportAfter && (
                              <div className="mt-2 p-3 bg-white border border-gray-200 rounded">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  Reporte final:
                                </p>
                                <p className="text-sm text-gray-600">{subtask.reportAfter}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {!subtask.isCompleted && task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => openCompleteModal(subtask)}
                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Task Info */}
          <div className="space-y-6">
            {/* Task Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles de la Tarea
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Categoría</p>
                  <p className="text-sm text-gray-900">{task.category || "Sin categoría"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Fecha Programada</p>
                  <p className="text-sm text-gray-900">
                    {new Date(task.scheduledStartDate).toLocaleDateString("es-CL")} -{" "}
                    {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                  </p>
                </div>
                {task.actualStartDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Fecha Real de Inicio</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.actualStartDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}
                {task.actualEndDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Fecha Real de Finalización</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.actualEndDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Asignada por</p>
                  <p className="text-sm text-gray-900">{task.createdBy.name}</p>
                  <p className="text-xs text-gray-500">{task.createdBy.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Trabajadores Asignados</p>
                  <div className="space-y-1 mt-1">
                    {task.assignedTo.map((worker) => (
                      <p key={worker.id} className="text-sm text-gray-900">
                        {worker.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Costs */}
            {task.costs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Costos Estimados
                </h2>
                <div className="space-y-2">
                  {task.costs.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cost.description}</p>
                        <p className="text-xs text-gray-500">{costTypeLabels[cost.type]}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        ${Number(cost.amount).toLocaleString("es-CL")}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-semibold text-gray-900">Total</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${totalCost.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Complete Subtask Modal */}
      {showCompleteModal && selectedSubtask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Completar Subtarea
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedSubtask.title}
            </p>

            <form onSubmit={handleCompleteSubtask}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reporte inicial (opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                  placeholder="Describe el estado inicial de la tarea..."
                  value={reportBefore}
                  onChange={(e) => setReportBefore(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reporte final <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                  placeholder="Describe el trabajo realizado y el resultado..."
                  value={reportAfter}
                  onChange={(e) => setReportAfter(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Marcar como Completada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
