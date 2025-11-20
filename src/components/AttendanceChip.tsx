"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Clock, LogIn, LogOut } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export default function AttendanceChip() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
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
    staleTime: 30000,
    refetchInterval: 60000,
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
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });
      const previousAttendance = queryClient.getQueryData(["attendance", "today"]);

      const optimisticAttendance = {
        id: "temp-" + Date.now(),
        date: new Date().toISOString(),
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: "PRESENT",
      };

      queryClient.setQueryData(["attendance", "today"], optimisticAttendance);
      return { previousAttendance };
    },
    onSuccess: async (newAttendance) => {
      queryClient.setQueryData(["attendance", "today"], newAttendance);
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      toast.success(
        "Entrada registrada",
        "Tu entrada se ha registrado exitosamente. ¡Buen día de trabajo!"
      );

      // Colapsar automáticamente después del check-in
      setIsExpanded(false);
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], context.previousAttendance);
      }

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
      toast.error("Error al cerrar sesiones", error.message);
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
      await queryClient.cancelQueries({ queryKey: ["attendance", "today"] });
      const previousAttendance = queryClient.getQueryData(["attendance", "today"]);

      if (previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], {
          ...previousAttendance,
          checkOut: new Date().toISOString(),
        });
      }

      return { previousAttendance };
    },
    onSuccess: async (newAttendance) => {
      queryClient.setQueryData(["attendance", "today"], newAttendance);
      queryClient.invalidateQueries({ queryKey: ["worker-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      toast.success(
        "Salida registrada",
        "Tu salida se ha registrado exitosamente. ¡Buen descanso!"
      );
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousAttendance) {
        queryClient.setQueryData(["attendance", "today"], context.previousAttendance);
      }

      toast.error(
        "Error al registrar salida",
        error.message || "No se pudo registrar tu salida. Por favor, intenta de nuevo."
      );
    },
    onSettled: () => {
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

  // Auto-expandir si no hay check-in
  const shouldAutoExpand = !todayAttendance?.checkIn;

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // VISTA COLAPSADA: Cuando ya hay check-in activo
  if (!isExpanded && todayAttendance?.checkIn && !todayAttendance?.checkOut && !shouldAutoExpand) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Clock className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Sesión activa desde {formatTime(todayAttendance.checkIn)}
                </p>
                <p className="text-xs text-green-700">
                  {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCheckOut}
                disabled={checking}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(true)}
                className="text-green-700 hover:text-green-900 hover:bg-green-100"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // VISTA COLAPSADA: Cuando hay check-in y check-out completos
  if (!isExpanded && todayAttendance?.checkIn && todayAttendance?.checkOut && !shouldAutoExpand) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Última sesión: {formatTime(todayAttendance.checkIn)} - {formatTime(todayAttendance.checkOut)}
                </p>
                <p className="text-xs text-gray-600">
                  Registra nueva entrada si vuelves de almorzar
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(true)}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // VISTA EXPANDIDA: Formulario completo
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Control de Asistencia</h2>
          {todayAttendance?.checkIn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Estado actual */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-semibold mb-1">Hoy</p>
                <p className="text-base font-bold text-gray-900">
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
          <div className="grid grid-cols-1 gap-3">
            {!todayAttendance?.checkIn ? (
              <div className="space-y-2">
                <Button
                  onClick={handleCheckIn}
                  disabled={checking}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {checking ? "Registrando..." : "Registrar Entrada"}
                </Button>

                {showFixButton && (
                  <Button
                    onClick={handleCloseActive}
                    disabled={checking}
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    {closeActiveMutation.isPending ? "Cerrando..." : "⚠️ Cerrar Sesiones Activas"}
                  </Button>
                )}
              </div>
            ) : !todayAttendance?.checkOut ? (
              <Button
                onClick={handleCheckOut}
                disabled={checking}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-base"
              >
                <LogOut className="h-5 w-5 mr-2" />
                {checking ? "Registrando..." : "Registrar Salida"}
              </Button>
            ) : (
              <div className="space-y-3">
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

                <Button
                  onClick={handleCheckIn}
                  disabled={checking}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {checking ? "Registrando..." : "Registrar Nueva Entrada"}
                </Button>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 Puedes registrar múltiples entradas y salidas en el día (ej: salida a almorzar).
              Este panel se minimizará automáticamente después del registro.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
