/**
 * Utilidades para calcular y formatear duraciones de tareas
 */

interface TaskTimeData {
  scheduledStartDate: string | Date;
  scheduledEndDate: string | Date;
  actualStartDate?: string | Date | null;
  actualEndDate?: string | Date | null;
  status: string;
}

/**
 * Calcula la duración en milisegundos entre dos fechas
 */
export function calculateDuration(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return end - start;
}

/**
 * Formatea una duración en milisegundos a formato legible
 * Ejemplos: "2h 30m", "1d 4h", "45m"
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Formatea una duración a formato detallado
 * Ejemplo: "2 días, 3 horas, 15 minutos"
 */
export function formatDurationDetailed(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "día" : "días"}`);
  }

  const remainingHours = hours % 24;
  if (remainingHours > 0) {
    parts.push(`${remainingHours} ${remainingHours === 1 ? "hora" : "horas"}`);
  }

  const remainingMinutes = minutes % 60;
  if (remainingMinutes > 0) {
    parts.push(
      `${remainingMinutes} ${remainingMinutes === 1 ? "minuto" : "minutos"}`
    );
  }

  if (parts.length === 0) {
    parts.push("menos de 1 minuto");
  }

  return parts.join(", ");
}

/**
 * Calcula el tiempo real que tomó completar una tarea
 */
export function getTaskActualDuration(task: TaskTimeData): number | null {
  if (!task.actualStartDate || !task.actualEndDate) {
    return null;
  }
  return calculateDuration(task.actualStartDate, task.actualEndDate);
}

/**
 * Calcula el tiempo estimado de una tarea
 */
export function getTaskEstimatedDuration(task: TaskTimeData): number {
  return calculateDuration(task.scheduledStartDate, task.scheduledEndDate);
}

/**
 * Calcula la diferencia entre tiempo estimado y real
 * Retorna negativo si se completó antes, positivo si se demoró más
 */
export function getTaskTimeDifference(task: TaskTimeData): number | null {
  const actualDuration = getTaskActualDuration(task);
  if (actualDuration === null) {
    return null;
  }
  const estimatedDuration = getTaskEstimatedDuration(task);
  return actualDuration - estimatedDuration;
}

/**
 * Determina si una tarea se completó a tiempo, antes o con retraso
 */
export function getTaskTimeStatus(
  task: TaskTimeData
): "on-time" | "early" | "late" | "pending" {
  if (task.status !== "COMPLETED") {
    return "pending";
  }

  const difference = getTaskTimeDifference(task);
  if (difference === null) {
    return "pending";
  }

  // Margen de 1 hora para considerar "a tiempo"
  const ONE_HOUR = 60 * 60 * 1000;

  if (Math.abs(difference) <= ONE_HOUR) {
    return "on-time";
  }

  return difference < 0 ? "early" : "late";
}

/**
 * Obtiene el color para el badge de tiempo según el estado
 */
export function getTimeStatusColor(
  status: "on-time" | "early" | "late" | "pending"
): string {
  switch (status) {
    case "early":
      return "bg-green-100 text-green-800 border-green-200";
    case "on-time":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "late":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Obtiene el label para el badge de tiempo
 */
export function getTimeStatusLabel(
  status: "on-time" | "early" | "late" | "pending"
): string {
  switch (status) {
    case "early":
      return "Antes de tiempo";
    case "on-time":
      return "A tiempo";
    case "late":
      return "Con retraso";
    case "pending":
      return "Pendiente";
  }
}

/**
 * Calcula el porcentaje de progreso de tiempo
 */
export function getTimeProgress(task: TaskTimeData): number {
  const now = new Date().getTime();
  const start = new Date(task.scheduledStartDate).getTime();
  const end = new Date(task.scheduledEndDate).getTime();

  if (now < start) return 0;
  if (now > end) return 100;

  const total = end - start;
  const elapsed = now - start;

  return Math.round((elapsed / total) * 100);
}

/**
 * Calcula estadísticas de tiempo para un conjunto de tareas
 */
export function calculateTimeStats(tasks: TaskTimeData[]) {
  const completedTasks = tasks.filter(
    (t) => t.status === "COMPLETED" && t.actualStartDate && t.actualEndDate
  );

  if (completedTasks.length === 0) {
    return {
      totalCompleted: 0,
      averageDuration: 0,
      onTime: 0,
      early: 0,
      late: 0,
      averageDelay: 0,
    };
  }

  let totalDuration = 0;
  let totalDelay = 0;
  let onTimeCount = 0;
  let earlyCount = 0;
  let lateCount = 0;

  completedTasks.forEach((task) => {
    const duration = getTaskActualDuration(task);
    if (duration) {
      totalDuration += duration;
    }

    const status = getTaskTimeStatus(task);
    if (status === "on-time") onTimeCount++;
    if (status === "early") earlyCount++;
    if (status === "late") lateCount++;

    const difference = getTaskTimeDifference(task);
    if (difference !== null && difference > 0) {
      totalDelay += difference;
    }
  });

  return {
    totalCompleted: completedTasks.length,
    averageDuration: totalDuration / completedTasks.length,
    onTime: onTimeCount,
    early: earlyCount,
    late: lateCount,
    averageDelay: lateCount > 0 ? totalDelay / lateCount : 0,
  };
}

/**
 * Formatea un porcentaje de eficiencia (early + onTime / total)
 */
export function calculateEfficiencyRate(tasks: TaskTimeData[]): number {
  const stats = calculateTimeStats(tasks);
  if (stats.totalCompleted === 0) return 0;

  return Math.round(
    ((stats.early + stats.onTime) / stats.totalCompleted) * 100
  );
}
