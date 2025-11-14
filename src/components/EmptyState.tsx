import {
  FileX,
  ClipboardList,
  Users,
  Calendar,
  Search,
  Inbox,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  variant?: "default" | "card";
  size?: "sm" | "md" | "lg";
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  size = "md",
}: EmptyStateProps) {
  const sizeConfig = {
    sm: {
      iconSize: "h-12 w-12",
      titleSize: "text-base",
      descSize: "text-sm",
      padding: "py-8",
    },
    md: {
      iconSize: "h-16 w-16",
      titleSize: "text-lg",
      descSize: "text-sm",
      padding: "py-12",
    },
    lg: {
      iconSize: "h-24 w-24",
      titleSize: "text-xl",
      descSize: "text-base",
      padding: "py-16",
    },
  };

  const config = sizeConfig[size];

  const EmptyContent = () => (
    <div
      className={`flex flex-col items-center justify-center text-center space-y-4 ${config.padding}`}
    >
      {/* Icono con animación */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-gray-100 p-6 rounded-full border-4 border-gray-200">
          {icon || <Inbox className={`${config.iconSize} text-gray-400`} />}
        </div>
      </div>

      {/* Texto */}
      <div className="space-y-2 max-w-md px-4">
        <h3 className={`${config.titleSize} font-bold text-gray-900`}>
          {title}
        </h3>
        {description && (
          <p className={`${config.descSize} text-gray-600 leading-relaxed`}>
            {description}
          </p>
        )}
      </div>

      {/* Acción */}
      {action && (
        <Button onClick={action.onClick} size="lg" className="mt-4">
          {action.icon || <Plus className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );

  // Variante Card
  if (variant === "card") {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <EmptyContent />
        </CardContent>
      </Card>
    );
  }

  // Variante Default
  return <EmptyContent />;
}

// Empty States Predefinidos

export function EmptyTasksState({
  onCreateTask,
  filtered = false,
}: {
  onCreateTask?: () => void;
  filtered?: boolean;
}) {
  if (filtered) {
    return (
      <EmptyState
        icon={<Search className="h-16 w-16 text-gray-400" />}
        title="No hay tareas que coincidan"
        description="Intenta ajustar los filtros para ver más resultados."
        variant="card"
      />
    );
  }

  return (
    <EmptyState
      icon={<ClipboardList className="h-16 w-16 text-gray-400" />}
      title="No hay tareas creadas"
      description="Comienza creando tu primera tarea para organizar el trabajo del equipo."
      action={
        onCreateTask
          ? {
              label: "Crear primera tarea",
              onClick: onCreateTask,
            }
          : undefined
      }
      variant="card"
    />
  );
}

export function EmptyWorkersState({
  onCreateWorker,
}: {
  onCreateWorker?: () => void;
}) {
  return (
    <EmptyState
      icon={<Users className="h-16 w-16 text-gray-400" />}
      title="No hay trabajadores registrados"
      description="Agrega trabajadores para poder asignarles tareas y gestionar el equipo."
      action={
        onCreateWorker
          ? {
              label: "Agregar primer trabajador",
              onClick: onCreateWorker,
            }
          : undefined
      }
      variant="card"
    />
  );
}

export function EmptyHistoryState() {
  return (
    <EmptyState
      icon={<Calendar className="h-16 w-16 text-gray-400" />}
      title="No hay historial disponible"
      description="El historial de tareas completadas aparecerá aquí una vez que se finalicen trabajos."
      variant="card"
      size="md"
    />
  );
}

export function EmptyNotificationsState() {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16 text-gray-400" />}
      title="No tienes notificaciones"
      description="Estás al día. Las nuevas notificaciones aparecerán aquí."
      variant="default"
      size="sm"
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16 text-gray-400" />}
      title="No se encontraron resultados"
      description={
        query
          ? `No hay resultados para "${query}". Intenta con otros términos.`
          : "Intenta buscar con otros términos."
      }
      variant="card"
      size="md"
    />
  );
}

export function EmptyCalendarState() {
  return (
    <EmptyState
      icon={<Calendar className="h-16 w-16 text-gray-400" />}
      title="No hay actividad en esta fecha"
      description="No se registraron tareas o eventos para el día seleccionado."
      variant="default"
      size="sm"
    />
  );
}

export function EmptyGenericState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={<FileX className="h-16 w-16 text-gray-400" />}
      title={title}
      description={description}
      variant="card"
      size="md"
    />
  );
}
