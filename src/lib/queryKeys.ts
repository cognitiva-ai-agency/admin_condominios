/**
 * Centralización de Query Keys para React Query
 * Esto asegura consistencia en todas las invalidaciones y actualizaciones de caché
 */

export const queryKeys = {
  // Tareas
  tasks: {
    all: ["tasks"] as const,
    detail: (id: string) => ["task", id] as const,
    worker: ["worker-tasks"] as const,
    workerList: ["worker-tasks-list"] as const, // Lista simple para /worker/tasks
    admin: ["admin-tasks"] as const,
    calendar: {
      worker: ["worker-calendar-tasks"] as const,
      admin: ["admin-calendar-tasks"] as const,
    },
  },

  // Dashboard
  dashboard: {
    stats: ["dashboard-stats"] as const,
    critical: ["dashboard-critical"] as const,
    workers: ["dashboard-workers"] as const,
  },

  // Asistencia
  attendance: {
    today: ["attendance", "today"] as const,
    recent: ["attendance-recent"] as const,
  },

  // Actividad y notificaciones
  activity: {
    recent: ["recent-activity"] as const,
  },
  notifications: ["notifications"] as const,

  // Usuarios
  users: {
    all: ["users"] as const,
    workers: ["workers"] as const,
    detail: (id: string) => ["user", id] as const,
  },
} as const;

/**
 * Grupos de invalidación para operaciones comunes
 * Esto define qué queries deben invalidarse para cada tipo de operación
 */
export const invalidationGroups = {
  // Cuando se completa una subtarea o cambia estado de tarea
  taskUpdate: [
    queryKeys.tasks.worker,
    queryKeys.tasks.workerList, // Lista simple de tareas del worker
    queryKeys.tasks.admin,
    queryKeys.tasks.calendar.worker,
    queryKeys.tasks.calendar.admin,
    queryKeys.dashboard.stats,
    queryKeys.dashboard.critical,
    queryKeys.activity.recent,
    queryKeys.notifications,
  ],

  // Cuando se crea o elimina una tarea
  taskMutation: [
    queryKeys.tasks.worker,
    queryKeys.tasks.workerList, // Lista simple de tareas del worker
    queryKeys.tasks.admin,
    queryKeys.tasks.calendar.worker,
    queryKeys.tasks.calendar.admin,
    queryKeys.dashboard.stats,
    queryKeys.dashboard.critical,
    queryKeys.activity.recent,
  ],

  // Cuando se registra check-in/check-out
  // NOTA: NO incluimos attendance.today porque ya lo actualizamos directamente con setQueryData
  // Esto evita un refetch innecesario que podría causar parpadeo
  attendanceUpdate: [
    queryKeys.attendance.recent,
    queryKeys.tasks.worker,
    queryKeys.dashboard.stats,
    queryKeys.activity.recent,
  ],
} as const;
