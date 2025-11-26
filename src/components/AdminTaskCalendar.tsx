"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedTo: Worker[];
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
  completedBy: string;
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

interface AdminTaskCalendarProps {
  selectedWorkerId?: string;
}

export default function AdminTaskCalendar({ selectedWorkerId }: AdminTaskCalendarProps) {
  const [date, setDate] = useState<Date>(new Date());

  // REACT QUERY: Sincronización automática con el resto de la aplicación
  const { data: tasksData, isLoading: loading } = useQuery({
    queryKey: queryKeys.tasks.calendar.admin,
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Error al cargar tareas");
      const data = await response.json();
      return data.tasks || [];
    },
    staleTime: 10000, // 10 segundos - datos frescos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const tasks: Task[] = tasksData || [];

  // OPTIMIZACIÓN: Filtrado memoizado basado en fecha y trabajador seleccionado
  const { selectedDateTasks, scheduledTasks, selectedDateSubtasks } = useMemo(() => {
    const dateStr = date.toDateString();

    // Filtrar tareas por trabajador si hay uno seleccionado
    let filteredTasks = tasks;
    if (selectedWorkerId) {
      filteredTasks = tasks.filter((task) =>
        task.assignedTo.some((worker) => worker.id === selectedWorkerId)
      );
    }

    // Tareas que iniciaron o finalizaron en esta fecha
    const tasksOnDate = filteredTasks.filter((task) => {
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

    // Tareas programadas para esta fecha
    const scheduled = filteredTasks.filter((task) => {
      const selected = date.getTime();
      const start = new Date(task.scheduledStartDate).getTime();
      const end = new Date(task.scheduledEndDate).getTime();

      return selected >= start && selected <= end;
    });

    // Obtener subtareas completadas en esta fecha
    const subtasksOnDate: SubtaskCompletion[] = [];
    filteredTasks.forEach((task) => {
      task.subtasks.forEach((subtask) => {
        if (subtask.isCompleted && subtask.completedAt) {
          // Si hay trabajador seleccionado, solo mostrar sus subtareas
          if (selectedWorkerId && subtask.completedBy?.id !== selectedWorkerId) {
            return;
          }

          const completedDate = new Date(subtask.completedAt).toDateString();
          if (completedDate === dateStr) {
            subtasksOnDate.push({
              subtaskTitle: subtask.title,
              completedAt: subtask.completedAt,
              taskId: task.id,
              taskTitle: task.title,
              completedBy: subtask.completedBy?.name || "Desconocido",
            });
          }
        }
      });
    });

    return {
      selectedDateTasks: tasksOnDate,
      scheduledTasks: scheduled,
      selectedDateSubtasks: subtasksOnDate,
    };
  }, [date, tasks, selectedWorkerId]);

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateStr = date.toDateString();

    // Filtrar tareas por trabajador si hay uno seleccionado
    let filteredTasks = tasks;
    if (selectedWorkerId) {
      filteredTasks = tasks.filter((task) =>
        task.assignedTo.some((worker) => worker.id === selectedWorkerId)
      );
    }

    // Contar tareas que iniciaron o finalizaron en esta fecha
    const tasksCount = filteredTasks.filter((task) => {
      if (task.actualStartDate) {
        const startDate = new Date(task.actualStartDate).toDateString();
        if (startDate === dateStr) return true;
      }

      if (task.actualEndDate) {
        const endDate = new Date(task.actualEndDate).toDateString();
        if (endDate === dateStr) return true;
      }

      return false;
    }).length;

    // Contar tareas programadas
    const scheduledCount = filteredTasks.filter((task) => {
      const selected = date.getTime();
      const start = new Date(task.scheduledStartDate).getTime();
      const end = new Date(task.scheduledEndDate).getTime();

      return selected >= start && selected <= end;
    }).length;

    // Contar subtareas completadas
    let subtasksCount = 0;
    filteredTasks.forEach((task) => {
      task.subtasks.forEach((subtask) => {
        if (subtask.isCompleted && subtask.completedAt) {
          // Si hay trabajador seleccionado, solo contar sus subtareas
          if (selectedWorkerId && subtask.completedBy?.id !== selectedWorkerId) {
            return;
          }

          const completedDate = new Date(subtask.completedAt).toDateString();
          if (completedDate === dateStr) {
            subtasksCount++;
          }
        }
      });
    });

    if (tasksCount === 0 && subtasksCount === 0 && scheduledCount === 0) return null;

    return (
      <div className="flex flex-col items-center justify-center mt-1">
        {scheduledCount > 0 && (
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
        )}
        {tasksCount > 0 && (
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-0.5"></div>
        )}
        {subtasksCount > 0 && (
          <div className="text-[8px] text-green-600 font-bold">{subtasksCount}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Calendario de Tareas {selectedWorkerId ? "(Filtrado por Trabajador)" : ""}
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendario - Ocupa 2 columnas */}
        <div className="xl:col-span-2">
          <div className="calendar-wrapper">
            <Calendar
              onChange={(value) => setDate(value as Date)}
              value={date}
              locale="es-CL"
              tileContent={getTileContent}
              className="w-full border-none shadow-sm text-lg"
            />
          </div>
          <div className="mt-4 text-sm text-gray-800 font-medium space-y-1">
            <p>• Punto morado: Tarea programada</p>
            <p>• Punto azul: Tarea iniciada o finalizada</p>
            <p>• Número verde: Subtareas completadas</p>
          </div>
        </div>

        {/* Detalles del día seleccionado - Ocupa 1 columna */}
        <div className="xl:col-span-1 max-h-[600px] overflow-y-auto xl:pl-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {date.toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>

          {selectedDateTasks.length === 0 &&
          selectedDateSubtasks.length === 0 &&
          scheduledTasks.length === 0 ? (
            <p className="text-gray-700 text-center py-8 font-medium">
              No hay actividad para esta fecha
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {/* Tareas programadas */}
              {scheduledTasks.length > 0 && (
                <AccordionItem value="scheduled" className="border rounded-lg px-4 bg-purple-50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <h3 className="text-base font-semibold text-purple-900">
                        Tareas Programadas
                      </h3>
                      <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded-full text-xs font-bold">
                        {scheduledTasks.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                    {scheduledTasks.map((task) => (
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
                            <svg
                              className="w-4 h-4 mr-2 text-purple-600"
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
                            <span className="font-medium">Período:</span>
                            <span className="ml-2">
                              {new Date(task.scheduledStartDate).toLocaleDateString(
                                "es-CL"
                              )}{" "}
                              - {new Date(task.scheduledEndDate).toLocaleDateString("es-CL")}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-700">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium">Asignada a:</span>
                            <span className="ml-2">
                              {task.assignedTo.map((w) => w.name).join(", ")}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-700">
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span className="font-medium">Subtareas:</span>
                            <span className="ml-2">
                              {task.subtasks.filter((st) => st.isCompleted).length}/
                              {task.subtasks.length} completadas
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/admin/tasks/${task.id}`}
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

              {/* Tareas iniciadas o finalizadas */}
              {selectedDateTasks.length > 0 && (
                <AccordionItem value="completed" className="border rounded-lg px-4 bg-blue-50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <h3 className="text-base font-semibold text-blue-900">
                        Tareas Realizadas
                      </h3>
                      <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full text-xs font-bold">
                        {selectedDateTasks.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                    {selectedDateTasks.map((task) => (
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium">Asignada a:</span>
                            <span className="ml-2">
                              {task.assignedTo.map((w) => w.name).join(", ")}
                            </span>
                          </div>

                          {task.actualStartDate && (
                            <div className="flex items-center text-gray-700">
                              <svg
                                className="w-4 h-4 mr-2 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
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
                              <svg
                                className="w-4 h-4 mr-2 text-blue-600"
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
                              <svg
                                className="w-4 h-4 mr-2 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span className="font-medium">Duración:</span>
                              <span className="ml-2 font-bold text-purple-700">
                                {formatDurationLong(task.actualStartDate, task.actualEndDate)}
                              </span>
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/admin/tasks/${task.id}`}
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
              {selectedDateSubtasks.length > 0 && (
                <AccordionItem value="subtasks" className="border rounded-lg px-4 bg-green-50">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <h3 className="text-base font-semibold text-green-900">
                        Subtareas Completadas
                      </h3>
                      <span className="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                        {selectedDateSubtasks.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                    {selectedDateSubtasks.map((subtask, idx) => (
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
                                href={`/admin/tasks/${subtask.taskId}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {subtask.taskTitle}
                              </Link>
                            </p>
                            <p className="text-xs text-gray-800 font-medium mt-1">
                              Por: {subtask.completedBy}
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
      </div>
    </div>
  );
}
