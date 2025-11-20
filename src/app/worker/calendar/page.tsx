"use client";

import { useSession } from "next-auth/react";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import WorkerTaskCalendar from "@/components/WorkerTaskCalendar";

export default function WorkerCalendarPage() {
  const { data: session } = useSession();

  return (
    <MobileLayout title="Mi Calendario" role="WORKER">
      {/* Header informativo */}
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Calendario de Tareas</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Visualiza tus tareas programadas, realizadas y subtareas completadas
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Guía de uso */}
      <Card className="mb-6 border-0 shadow-md bg-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">Cómo usar el calendario:</p>
              <ul className="space-y-1 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span><strong>Punto morado:</strong> Tarea programada para ese día</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span><strong>Punto azul:</strong> Tarea que iniciaste o finalizaste</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-xs text-green-600 font-bold">3</div>
                  <span><strong>Número verde:</strong> Cantidad de subtareas que completaste</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                💡 <strong>Tip:</strong> Haz clic en cualquier día para ver los detalles de tus tareas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      {session?.user?.id ? (
        <WorkerTaskCalendar userId={session.user.id} />
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Cargando calendario...</p>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}
