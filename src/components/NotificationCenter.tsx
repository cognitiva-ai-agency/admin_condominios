"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  ClipboardList,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { EmptyNotificationsState } from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "TASK_ASSIGNED" | "TASK_COMPLETED" | "TASK_OVERDUE" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
  relatedTask?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
  role?: "ADMIN" | "WORKER";
}

export default function NotificationCenter({
  open,
  onOpenChange,
  onUnreadCountChange,
  role = "ADMIN",
}: NotificationCenterProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // OPTIMIZACIÓN: Migrar a React Query para sincronización automática
  const { data, isLoading: loading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      return response.json();
    },
    staleTime: 5000, // 5 segundos
    refetchInterval: open ? 15000 : false, // Polling cada 15 segundos solo cuando está abierto
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: open, // Solo consultar cuando el panel está abierto
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Actualizar contador cuando cambien las notificaciones
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // OPTIMIZACIÓN: Mutation para marcar como leída con optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousData = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },
  });

  // OPTIMIZACIÓN: Mutation para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousData = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },
  });

  // OPTIMIZACIÓN: Mutation para eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previousData = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        const notification = old.notifications.find((n: Notification) => n.id === notificationId);
        const unreadDecrement = notification && !notification.isRead ? 1 : 0;

        return {
          ...old,
          notifications: old.notifications.filter((n: Notification) => n.id !== notificationId),
          unreadCount: Math.max(0, old.unreadCount - unreadDecrement),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.relatedTask) {
      onOpenChange(false);
      // Navegar a la ruta correcta según el rol del usuario
      const basePath = role === "ADMIN" ? "/admin" : "/worker";
      router.push(`${basePath}/tasks/${notification.relatedTask.id}`);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case "TASK_COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "TASK_OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "SYSTEM":
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return "bg-blue-50 border-blue-200";
      case "TASK_COMPLETED":
        return "bg-green-50 border-green-200";
      case "TASK_OVERDUE":
        return "bg-red-50 border-red-200";
      case "SYSTEM":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <SheetTitle>Notificaciones</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-6">
              <LoadingState message="Cargando notificaciones..." size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6">
              <EmptyNotificationsState />
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-all cursor-pointer group ${
                    !notification.isRead
                      ? "bg-blue-50/50 hover:bg-blue-100/70 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  title={
                    !notification.isRead
                      ? "Clic para marcar como leída y ver detalles"
                      : notification.relatedTask
                        ? "Clic para ver detalles de la tarea"
                        : ""
                  }
                >
                  <div className="flex gap-3">
                    {/* Icono */}
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg border ${getTypeColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm font-semibold ${
                            !notification.isRead
                              ? "text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.relatedTask && (
                        <Badge
                          variant="outline"
                          className="text-xs mb-2 bg-white"
                        >
                          <ClipboardList className="h-3 w-3 mr-1" />
                          {notification.relatedTask.title}
                        </Badge>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                              locale: es,
                            }
                          )}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
