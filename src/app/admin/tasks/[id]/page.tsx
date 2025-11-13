"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  completedById: string | null;
  completedAt: string | null;
  completedBy: {
    name: string;
  } | null;
}

interface TaskCost {
  id: string;
  description: string;
  amount: number;
  type: "MATERIALS" | "LABOR" | "OTHER";
  date: string;
}

interface Worker {
  id: string;
  name: string;
  email: string;
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
  assignedTo: Worker[];
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
  MATERIALS: "Materiales",
  LABOR: "Mano de Obra",
  OTHER: "Otro",
};

export default function AdminTaskDetail() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

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
      setTimeout(() => router.push("/admin/tasks"), 2000);
    } finally {
      setLoading(false);
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

  const completedSubtasks = task.subtasks.filter((st: { isCompleted: boolean }) => st.isCompleted).length;
  const progress =
    task.subtasks.length > 0
      ? Math.round((completedSubtasks / task.subtasks.length) * 100)
      : 0;
  const totalCost = task.costs.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0);

  // Agrupar costos por tipo
  const costsByType = {
    MATERIALS: task.costs.filter((c) => c.type === "MATERIALS"),
    LABOR: task.costs.filter((c) => c.type === "LABOR"),
    OTHER: task.costs.filter((c) => c.type === "OTHER"),
  };

  const totalByType = {
    MATERIALS: costsByType.MATERIALS.reduce((sum, c) => sum + Number(c.amount), 0),
    LABOR: costsByType.LABOR.reduce((sum, c) => sum + Number(c.amount), 0),
    OTHER: costsByType.OTHER.reduce((sum, c) => sum + Number(c.amount), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/admin/tasks"
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
            Volver a Tareas
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
              {task.category && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    {task.category}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  priorityColors[task.priority]
                }`}
              >
                {priorityLabels[task.priority]}
              </span>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColors[task.status]
                }`}
              >
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
            {/* Progress Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progreso General
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completado</span>
                  <span>
                    {completedSubtasks}/{task.subtasks.length} subtareas ({progress}%)
                  </span>
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
                      <div className="flex items-start">
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
                          <p
                            className={`font-medium ${
                              subtask.isCompleted
                                ? "text-gray-600 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {subtask.title}
                          </p>
                          {subtask.isCompleted && subtask.completedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completada por {subtask.completedBy.name}
                              {subtask.completedAt &&
                                ` el ${new Date(
                                  subtask.completedAt
                                ).toLocaleDateString("es-CL")}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Costos Detallados */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Costos
              </h2>
              {task.costs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay costos registrados
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Resumen por tipo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        MATERIALES
                      </p>
                      <p className="text-xl font-bold text-blue-900">
                        ${totalByType.MATERIALS.toLocaleString("es-CL")}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {costsByType.MATERIALS.length} item(s)
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        MANO DE OBRA
                      </p>
                      <p className="text-xl font-bold text-green-900">
                        ${totalByType.LABOR.toLocaleString("es-CL")}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {costsByType.LABOR.length} item(s)
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        OTROS
                      </p>
                      <p className="text-xl font-bold text-purple-900">
                        ${totalByType.OTHER.toLocaleString("es-CL")}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {costsByType.OTHER.length} item(s)
                      </p>
                    </div>
                  </div>

                  {/* Listado detallado de costos */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Listado Completo
                    </h3>
                    <div className="space-y-2">
                      {task.costs.map((cost) => (
                        <div
                          key={cost.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {cost.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {costTypeLabels[cost.type]} •{" "}
                              {new Date(cost.date).toLocaleDateString("es-CL")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              ${Number(cost.amount).toLocaleString("es-CL")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información General
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Costo Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalCost.toLocaleString("es-CL")}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Fecha Programada</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(task.scheduledStartDate).toLocaleDateString("es-CL")} -{" "}
                    {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                  </p>
                </div>

                {task.actualStartDate && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Fecha Real de Inicio</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(task.actualStartDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}

                {task.actualEndDate && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      Fecha Real de Finalización
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(task.actualEndDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Creada por</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {task.createdBy.name}
                  </p>
                  <p className="text-xs text-gray-500">{task.createdBy.email}</p>
                </div>
              </div>
            </div>

            {/* Trabajadores Asignados */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Trabajadores Asignados
              </h2>
              <div className="space-y-3">
                {task.assignedTo.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No hay trabajadores asignados
                  </p>
                ) : (
                  task.assignedTo.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {worker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {worker.name}
                        </p>
                        <p className="text-xs text-gray-500">{worker.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
