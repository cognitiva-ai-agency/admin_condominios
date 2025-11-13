"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalWorkers: number;
  activeTasks: number;
  completedToday: number;
  pendingNotifications: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkers: 0,
    activeTasks: 0,
    completedToday: 0,
    pendingNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Obtener trabajadores
      const workersRes = await fetch("/api/users");
      const workersData = await workersRes.json();

      // Obtener tareas
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();

      const activeTasks = tasksData.tasks?.filter(
        (t: any) => t.status === "PENDING" || t.status === "IN_PROGRESS"
      ).length || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = tasksData.tasks?.filter((t: any) => {
        if (t.status !== "COMPLETED" || !t.actualEndDate) return false;
        const endDate = new Date(t.actualEndDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate.getTime() === today.getTime();
      }).length || 0;

      setStats({
        totalWorkers: workersData.total || 0,
        activeTasks,
        completedToday,
        pendingNotifications: 0, // Por ahora 0, puedes implementar notificaciones después
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/"); // Redirigir a la página principal con opciones de Admin/Trabajador
  };

  const handleGenerateRecurring = async () => {
    setGeneratingRecurring(true);
    try {
      const response = await fetch("/api/tasks/generate-recurring", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        alert(
          `${data.generatedCount} tareas recurrentes generadas exitosamente`
        );
        fetchDashboardStats(); // Actualizar estadísticas
      } else {
        alert(data.error || "Error al generar tareas recurrentes");
      }
    } catch (error) {
      alert("Error al generar tareas recurrentes");
    } finally {
      setGeneratingRecurring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Condominios
            </h1>
            <p className="text-sm text-gray-600">
              Bienvenido, {session?.user?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card - Trabajadores */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trabajadores</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalWorkers}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Card - Tareas Activas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tareas Activas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stats.activeTasks}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Card - Completadas Hoy */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas Hoy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stats.completedToday}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              </div>
            </div>
          </div>

          {/* Card - Notificaciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Notificaciones</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stats.pendingNotifications}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left block"
            >
              <h3 className="font-semibold text-blue-700 mb-1">
                Gestionar Trabajadores
              </h3>
              <p className="text-sm text-gray-600">
                Crear, editar o eliminar trabajadores
              </p>
            </Link>
            <Link
              href="/admin/tasks"
              className="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left block"
            >
              <h3 className="font-semibold text-green-700 mb-1">
                Gestionar Tareas
              </h3>
              <p className="text-sm text-gray-600">
                Crear y asignar tareas a trabajadores
              </p>
            </Link>
            <button
              onClick={handleGenerateRecurring}
              disabled={generatingRecurring}
              className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h3 className="font-semibold text-orange-700 mb-1">
                {generatingRecurring ? "Generando..." : "Generar Tareas Recurrentes"}
              </h3>
              <p className="text-sm text-gray-600">
                Crear instancias de tareas recurrentes
              </p>
            </button>
            <Link
              href="/admin/history"
              className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left block"
            >
              <h3 className="font-semibold text-purple-700 mb-1">
                Ver Historial
              </h3>
              <p className="text-sm text-gray-600">
                Tareas completadas con filtros
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Actividad Reciente
          </h2>
          <p className="text-gray-500 text-center py-8">
            No hay actividad reciente para mostrar
          </p>
        </div>
      </main>
    </div>
  );
}
