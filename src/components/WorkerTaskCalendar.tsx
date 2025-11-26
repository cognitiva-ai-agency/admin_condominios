"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { calculateDuration, formatDurationLong } from "@/utils/taskDuration";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  subtasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    completedAt?: string;
    completedBy?: {
      id: string;
      name: string;
    };
  }>;
}

interface SubtaskCompletion {
  subtaskTitle: string;
  completedAt: string;
  taskId: string;
  taskTitle: string;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-300",
};

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

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

interface WorkerTaskCalendarProps {
  userId: string;
}

export default function WorkerTaskCalendar({ userId }: WorkerTaskCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());

  // Fetch de tareas usando React Query
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["worker-calendar-tasks", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/tasks`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al obtener tareas");
      }

      const data = await response.json();
      return data.tasks || [];
    },
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Filtrar tareas por fecha seleccionada
  const { scheduledTasks, completedTasks, subtasksCompleted } = useMemo(() => {
    const dateStr = date.toDateString();

    // Normalizar fecha seleccionada
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const selectedTime = selectedDate.getTime();

    // Tareas programadas para esta fecha
    const scheduled = tasks.filter((task: Task) => {
      const start = new Date(task.scheduledStartDate);
      start.setHours(0, 0, 0, 0);
      const startTime = start.getTime();

      const end = new Date(task.scheduledEndDate);
      end.setHours(0, 0, 0, 0);
      const endTime = end.getTime();

      return selectedTime >= startTime && selectedTime <= endTime;
    });

    // Tareas que iniciaron o finalizaron en esta fecha
    const completed = tasks.filter((task: Task) => {
      if (task.actualStartDate) {
        const startDate = new Date(task.actualStartDate).toDateString();
        if (startDate === dateStr) return true;
      }

      if (task.actualEndDate) {
        const endDate = new Date(task.actualEndDate).toDateString();
        if (endDate === dateStr) return true;
      }

      return false;
    });

    // Subtareas completadas en esta fecha por el trabajador
    const subtasksOnDate: SubtaskCompletion[] = [];
    tasks.forEach((task: Task) => {
      task.subtasks.forEach((subtask) => {
        if (
          subtask.isCompleted &&
          subtask.completedAt &&
          subtask.completedBy?.id === userId
        ) {
          const completedDate = new Date(subtask.completedAt).toDateString();
          if (completedDate === dateStr) {
            subtasksOnDate.push({
              subtaskTitle: subtask.title,
              completedAt: subtask.completedAt,
              taskId: task.id,
              taskTitle: task.title,
            });
          }
        }
      });
    });

    return {
      scheduledTasks: scheduled,
      completedTasks: completed,
      subtasksCompleted: subtasksOnDate,
    };
  }, [date, tasks, userId]);

  // Renderizar indicadores en el calendario
  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateStr = date.toDateString();

    // Normalizar fecha del tile
    const tileDate = new Date(date);
    tileDate.setHours(0, 0, 0, 0);
    const tileTime = tileDate.getTime();

    // Contar tareas iniciadas o finalizadas
    const completedCount = tasks.filter((task: Task) => {
      if (task.actualStartDate && new Date(task.actualStartDate).toDateString() === dateStr) {
        return true;
      }
      if (task.actualEndDate && new Date(task.actualEndDate).toDateString() === dateStr) {
        return true;
      }
      return false;
    }).length;

    // Contar tareas programadas
    const scheduledCount = tasks.filter((task: Task) => {
      const start = new Date(task.scheduledStartDate);
      start.setHours(0, 0, 0, 0);
      const startTime = start.getTime();

      const end = new Date(task.scheduledEndDate);
      end.setHours(0, 0, 0, 0);
      const endTime = end.getTime();

      return tileTime >= startTime && tileTime <= endTime;
    }).length;

    // Contar subtareas completadas por el trabajador
    let subtasksCount = 0;
    tasks.forEach((task: Task) => {
      task.subtasks.forEach((subtask) => {
        if (
          subtask.isCompleted &&
          subtask.completedAt &&
          subtask.completedBy?.id === userId &&
          new Date(subtask.completedAt).toDateString() === dateStr
        ) {
          subtasksCount++;
        }
      });
    });

    if (completedCount === 0 && subtasksCount === 0 && scheduledCount === 0) return null;

    return (
      <div className="flex flex-col items-center justify-center mt-1 gap-0.5">
        {scheduledCount > 0 && (
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
        )}
        {completedCount > 0 && (
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        )}
        {subtasksCount > 0 && (
          <div className="text-[8px] text-green-600 font-bold">{subtasksCount}</div>
        )}
      </div>
    );
  };

  // Estado de carga
  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de error
  if (error) {
    return (
      <Card className="border-0 shadow-md border-l-4 border-red-500">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar calendario</p>
              <p className="text-sm text-gray-600">{(error as Error).message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sin tareas asignadas
  if (tasks.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16 text-center">
          <div className="bg-gray-100 rounded-full h-20 w-20 mx-auto mb-4 flex items-center justify-center">
            <CalendarIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg mb-2">
            No tienes tareas asignadas
          </p>
          <p className="text-sm text-gray-500">
            Cuando te asignen tareas, aparecerán aquí en el calendario
          </p>
        </CardContent>
      </Card>
    );
  }

  // Renderizado principal
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Calendar
                onChange={(value) => setDate(value as Date)}
                value={date}
                locale="es-CL"
                tileContent={getTileContent}
                className="w-full border-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Detalles del día seleccionado */}
        <div className="xl:col-span-1">
          <Card className="border-0 shadow-lg xl:sticky xl:top-4">
            <CardContent className="p-6">
              {/* Header del día seleccionado */}
              <div className="mb-4 pb-3 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">
                    {date.toLocaleDateString("es-CL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  {scheduledTasks.length + completedTasks.length + subtasksCompleted.length > 0
                    ? `${scheduledTasks.length + completedTasks.length + subtasksCompleted.length} actividad(es) para este día`
                    : "Sin actividades para este día"}
                </p>
              </div>

              {/* Contenedor con scroll */}
              <div className="max-h-[500px] xl:max-h-[600px] overflow-y-auto -mx-6 px-6">

              {scheduledTasks.length === 0 &&
              completedTasks.length === 0 &&
              subtasksCompleted.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No tienes actividad para esta fecha
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Selecciona otro día para ver tus tareas
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" defaultValue={[]} className="space-y-3">
                  {/* Tareas programadas */}
                  {scheduledTasks.length > 0 && (
                    <AccordionItem value="scheduled" className="border-0 rounded-lg overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 shadow-md">
                      <AccordionTrigger className="hover:no-underline py-4 px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                            <h3 className="text-base font-semibold text-purple-900">
                              Programadas
                            </h3>
                          </div>
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {scheduledTasks.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 p-4 pt-0">
                          {scheduledTasks.map((task: Task) => (
                            <div
                              key={task.id}
                              className={`p-4 border-2 rounded-lg ${statusColors[task.status]}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[task.priority]}`}
                                >
                                  {priorityLabels[task.priority]}
                                </span>
                              </div>

                              <div className="space-y-1 text-sm">
                                <div className="flex items-center text-gray-700">
                                  <CalendarIcon className="w-4 h-4 mr-2 text-purple-600" />
                                  <span className="font-medium">Período:</span>
                                  <span className="ml-2">
                                    {new Date(task.scheduledStartDate).toLocaleDateString("es-CL")} - {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                                  </span>
                                </div>

                                <div className="flex items-center text-gray-700">
                                  <span className="font-medium">Subtareas:</span>
                                  <span className="ml-2">
                                    {task.subtasks.filter((st) => st.isCompleted).length}/{task.subtasks.length} completadas
                                  </span>
                                </div>
                              </div>

                              <Link
                                href={`/worker/tasks/${task.id}`}
                                className="mt-3 inline-block text-sm text-blue-700 hover:text-blue-900 font-medium"
                              >
                                Ver detalles →
                              </Link>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Tareas realizadas */}
                  {completedTasks.length > 0 && (
                    <AccordionItem value="completed" className="border-0 rounded-lg overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 shadow-md">
                      <AccordionTrigger className="hover:no-underline py-4 px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            <h3 className="text-base font-semibold text-blue-900">
                              Realizadas
                            </h3>
                          </div>
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {completedTasks.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 p-4 pt-0">
                          {completedTasks.map((task: Task) => (
                            <div
                              key={task.id}
                              className={`p-4 border-2 rounded-lg ${statusColors[task.status]}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[task.priority]}`}
                                >
                                  {priorityLabels[task.priority]}
                                </span>
                              </div>

                              <div className="space-y-1 text-sm">
                                {task.actualStartDate && (
                                  <div className="flex items-center text-gray-700">
                                    <span className="font-medium">Iniciada:</span>
                                    <span className="ml-2">
                                      {new Date(task.actualStartDate).toLocaleString("es-CL", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                )}

                                {task.actualEndDate && (
                                  <div className="flex items-center text-gray-700">
                                    <span className="font-medium">Finalizada:</span>
                                    <span className="ml-2">
                                      {new Date(task.actualEndDate).toLocaleString("es-CL", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                )}

                                {task.actualStartDate && task.actualEndDate && (
                                  <div className="flex items-center text-gray-700 bg-white bg-opacity-70 p-2 rounded mt-2">
                                    <span className="font-medium">Duración:</span>
                                    <span className="ml-2 font-bold text-purple-700">
                                      {formatDurationLong(task.actualStartDate, task.actualEndDate)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <Link
                                href={`/worker/tasks/${task.id}`}
                                className="mt-3 inline-block text-sm text-blue-700 hover:text-blue-900 font-medium"
                              >
                                Ver detalles →
                              </Link>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Subtareas completadas */}
                  {subtasksCompleted.length > 0 && (
                    <AccordionItem value="subtasks" className="border-0 rounded-lg overflow-hidden bg-gradient-to-r from-green-50 to-green-100 shadow-md">
                      <AccordionTrigger className="hover:no-underline py-4 px-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-green-600">✓</div>
                            <h3 className="text-base font-semibold text-green-900">
                              Subtareas Completadas
                            </h3>
                          </div>
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {subtasksCompleted.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 p-4 pt-0">
                          {subtasksCompleted.map((subtask, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    ✓ {subtask.subtaskTitle}
                                  </p>
                                  <p className="text-xs text-gray-800 font-medium mt-1">
                                    De la tarea:{" "}
                                    <Link
                                      href={`/worker/tasks/${subtask.taskId}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      {subtask.taskTitle}
                                    </Link>
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-800 font-medium mt-2">
                                {new Date(subtask.completedAt).toLocaleString("es-CL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}
              </div>
              {/* Fin del contenedor con scroll */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
