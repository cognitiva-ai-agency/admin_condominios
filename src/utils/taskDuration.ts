/**
 * Calcula la duración entre dos fechas y retorna un string formateado
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de finalización
 * @returns String con la duración formateada (ej: "2h 30m", "1d 5h", "45m")
 */
export function calculateDuration(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }

  return `${days}d`;
}

/**
 * Calcula la duración en minutos
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de finalización
 * @returns Duración en minutos
 */
export function calculateDurationInMinutes(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Calcula la duración y retorna un objeto con días, horas y minutos
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de finalización
 * @returns Objeto con días, horas y minutos
 */
export function calculateDurationDetailed(
  startDate: string | Date,
  endDate: string | Date
): { days: number; hours: number; minutes: number; totalMinutes: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, totalMinutes };
}

/**
 * Formatea la duración de manera larga y legible
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de finalización
 * @returns String con la duración formateada (ej: "2 días, 5 horas y 30 minutos")
 */
export function formatDurationLong(startDate: string | Date, endDate: string | Date): string {
  const { days, hours, minutes } = calculateDurationDetailed(startDate, endDate);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  }

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  }

  if (parts.length === 0) {
    return 'Menos de 1 minuto';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} y ${parts[1]}`;
  }

  return `${parts[0]}, ${parts[1]} y ${parts[2]}`;
}
