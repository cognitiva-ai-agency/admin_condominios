"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export default function AttendanceCheckIn() {
  const { data: session } = useSession();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch("/api/attendance/today");
      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
      }
    } catch (error) {
      console.error("Error al obtener asistencia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
      } else {
        alert("Error al registrar entrada");
      }
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      alert("Error al registrar entrada");
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
      } else {
        alert("Error al registrar salida");
      }
    } catch (error) {
      console.error("Error al registrar salida:", error);
      alert("Error al registrar salida");
    } finally {
      setChecking(false);
    }
  };

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
            <button
              onClick={handleCheckIn}
              disabled={checking}
              className="col-span-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {checking ? "Registrando..." : "🟢 Registrar Entrada"}
            </button>
          ) : !todayAttendance?.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={checking}
              className="col-span-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {checking ? "Registrando..." : "🔴 Registrar Salida"}
            </button>
          ) : (
            <div className="col-span-2 bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-gray-800 font-medium mb-2">Asistencia completada</p>
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
          )}
        </div>

        {/* Información adicional */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-800 font-medium">
            💡 Recuerda registrar tu entrada al comenzar tu jornada y tu salida al finalizarla.
          </p>
        </div>
      </div>
    </div>
  );
}
