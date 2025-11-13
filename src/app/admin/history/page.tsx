"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
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
  const stats = {
    total: filteredTasks.length,
    totalCost: filteredTasks.reduce((sum, t) => sum + t.totalCost, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
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
              Historial de Tareas Completadas
            </h1>
            <p className="text-sm text-gray-600">
              {stats.total} tareas completadas
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
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Tareas Completadas</p>
            <p className="text-3xl font-bold text-green-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Costo Total</p>
            <p className="text-3xl font-bold text-blue-600">
              ${stats.totalCost.toLocaleString("es-CL")}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trabajador
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
              >
                <option value="all">Todos los trabajadores</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilterWorker("all");
                setFilterDateFrom("");
                setFilterDateTo("");
                setFilterCategory("all");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Tareas */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {tasks.length === 0
              ? "No hay tareas completadas en el historial."
              : "No hay tareas que coincidan con los filtros seleccionados."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Link
                key={task.id}
                href={`/admin/tasks/${task.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {task.category && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-4 h-4 mr-2"
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
                        </div>
                      )}

                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Completada: {new Date(task.actualEndDate!).toLocaleDateString("es-CL")}
                      </div>

                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Costo: ${task.totalCost.toLocaleString("es-CL")}
                      </div>

                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Subtareas: {task.completedSubtasks}/{task.totalSubtasks}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.assignedTo.map((worker) => (
                        <span
                          key={worker.id}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {worker.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
