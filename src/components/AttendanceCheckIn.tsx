"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/ToastProvider";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export default function AttendanceCheckIn() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showFixButton, setShowFixButton] = useState(false);

  // Query para obtener la asistencia de hoy
  const { data: todayAttendance, isLoading: loading } = useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/today");
      if (!response.ok) {
        throw new Error("Error al obtener asistencia");
      }
      const data = await response.json();
      return data.attendance;
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch cada minuto
    refetchOnWindowFocus: true,
  });

  // Mutation para check-in
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar entrada");
      }

      const data = await response.json();
      return data.attendance;
    },
    onMutate: async () => {
      // OPTIMISTIC UPDATE: Cancelar refetches en progreso
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });

      // Guardar el valor anterior por si hay que revertir
      const previousAttendance = queryClient.getQueryData(["attendance", "today"]);

      // Crear nuevo registro optimista (checkIn sin checkOut)
      const optimisticAttendance = {
        id: "temp-" + Date.now(),
        date: new Date().toISOString(),
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: "PRESENT",
      };

      // Actualizar optimistamente
      queryClient.setQueryData(["attendance", "today"], optimisticAttendance);

      return { previousAttendance };
    },
    onSuccess: async (newAttendance) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(["attendance", "today"], newAttendance);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      // Mostrar mensaje de éxito
      toast.success(
        "Entrada registrada",
        "Tu entrada se ha registrado exitosamente. ¡Buen día de trabajo!"
      );
    },
    onError: (error: Error, _variables, context) => {
      // Revertir el optimistic update si hay error
      if (context?.previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], context.previousAttendance);
      }

      // Si el error es de sesión activa, mostrar botón de solución
      if (error.message.includes("sesión activa")) {
        setShowFixButton(true);
        toast.error(
          "Sesión activa detectada",
          "Tienes una sesión anterior sin cerrar. Usa el botón 'Cerrar Sesiones Activas' para resolverlo."
        );
      } else {
        toast.error(
          "Error al registrar entrada",
          error.message || "No se pudo registrar tu entrada. Por favor, intenta de nuevo."
        );
      }
    },
    onSettled: () => {
      // Siempre refetch al final para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
  });

  // Mutation para cerrar sesiones activas huérfanas
  const closeActiveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance/close-active", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cerrar sesiones");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: async (data) => {
      // Invalidar la query para refrescar
      await queryClient.invalidateQueries({
        queryKey: ["attendance", "today"],
        refetchType: "active",
      });

      setShowFixButton(false);

      toast.success(
        "Sesiones cerradas",
        data.message || "Ahora puedes registrar una nueva entrada."
      );
    },
    onError: (error: Error) => {
      toast.error(
        "Error al cerrar sesiones",
        error.message
      );
    },
  });

  // Mutation para check-out
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar salida");
      }

      const data = await response.json();
      return data.attendance;
    },
    onMutate: async () => {
      // OPTIMISTIC UPDATE: Cancelar refetches en progreso
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });

      // Guardar el valor anterior por si hay que revertir
      const previousAttendance = queryClient.getQueryData(["attendance", "today"]);

      // Actualizar optimistamente con checkOut = now
      if (previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], {
          ...previousAttendance,
          checkOut: new Date().toISOString(),
        });
      }

      return { previousAttendance };
    },
    onSuccess: async (newAttendance) => {
      // Actualizar con datos reales del servidor
      queryClient.setQueryData(["attendance", "today"], newAttendance);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      // Mostrar mensaje de éxito
      toast.success(
        "Salida registrada",
        "Tu salida se ha registrado exitosamente. ¡Buen descanso!"
      );
    },
    onError: (error: Error, _variables, context) => {
      // Revertir el optimistic update si hay error
      if (context?.previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], context.previousAttendance);
      }

      toast.error(
        "Error al registrar salida",
        error.message || "No se pudo registrar tu salida. Por favor, intenta de nuevo."
      );
    },
    onSettled: () => {
      // Siempre refetch al final para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ["attendance", "today"] });
    },
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  const handleCloseActive = () => {
    closeActiveMutation.mutate();
  };

  const checking = checkInMutation.isPending || checkOutMutation.isPending || closeActiveMutation.isPending;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Control de Asistencia</h2>

      <div className="space-y-4">
        {/* Estado actual */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800 font-semibold mb-1">Hoy</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date().toLocaleDateString("es-CL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {todayAttendance?.checkIn && (
              <div className="text-right">
                <p className="text-sm text-gray-800 font-semibold">Entrada registrada</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(todayAttendance.checkIn)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-4">
          {!todayAttendance?.checkIn ? (
            <div className="col-span-2 space-y-2">
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {checking ? "Registrando..." : "🟢 Registrar Entrada"}
              </button>

              {/* Botón de emergencia para cerrar sesiones activas */}
              {showFixButton && (
                <button
                  onClick={handleCloseActive}
                  disabled={checking}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {closeActiveMutation.isPending ? "Cerrando..." : "⚠️ Cerrar Sesiones Activas"}
                </button>
              )}
            </div>
          ) : !todayAttendance?.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={checking}
              className="col-span-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {checking ? "Registrando..." : "🔴 Registrar Salida"}
            </button>
          ) : (
            <div className="col-span-2 space-y-3">
              {/* Última sesión completada */}
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-gray-800 font-medium mb-2">Última sesión completada</p>
                <div className="flex justify-center gap-8 text-sm">
                  <div>
                    <p className="text-gray-800 font-semibold">Entrada</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatTime(todayAttendance.checkIn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold">Salida</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatTime(todayAttendance.checkOut)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón para registrar nueva entrada */}
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {checking ? "Registrando..." : "🟢 Registrar Nueva Entrada"}
              </button>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-800 font-medium">
            💡 Puedes registrar múltiples entradas y salidas en el día (ej: salida a almorzar). Registra tu entrada al llegar y tu salida al irte.
          </p>
        </div>
      </div>
    </div>
  );
}
