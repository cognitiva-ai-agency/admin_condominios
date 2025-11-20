"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      onUnreadCountChange?.(data.unreadCount || 0);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      const newUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newUnreadCount);
      onUnreadCountChange?.(newUnreadCount);
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      // Actualizar estado local
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      if (notification && !notification.isRead) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        onUnreadCountChange?.(newUnreadCount);
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
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
                onClick={markAllAsRead}
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
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-all hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
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
                            deleteNotification(notification.id);
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
