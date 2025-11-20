"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ReactNode, useState, useEffect } from "react";
import {
  Home,
  ClipboardList,
  Users,
  History,
  Bell,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import NotificationCenter from "@/components/NotificationCenter";

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  role?: "ADMIN" | "WORKER";
}

export default function MobileLayout({
  children,
  title,
  role = "ADMIN",
}: MobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar contador de notificaciones al montar
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unread=true");
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error al obtener contador de notificaciones:", error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const adminNavItems = [
    { href: "/admin/dashboard", icon: Home, label: "Inicio" },
    { href: "/admin/tasks", icon: ClipboardList, label: "Tareas" },
    { href: "/admin/users", icon: Users, label: "Personal" },
    { href: "/admin/history", icon: History, label: "Historial" },
  ];

  const workerNavItems = [
    { href: "/worker/dashboard", icon: Home, label: "Inicio" },
    { href: "/worker/tasks", icon: ClipboardList, label: "Tareas" },
  ];

  const navItems = role === "ADMIN" ? adminNavItems : workerNavItems;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20 md:pb-0 md:flex">
      {/* Sidebar Desktop - Hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:fixed md:inset-y-0 md:z-50 md:border-r md:bg-white">
        <div className="flex h-16 items-center px-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <span className="text-lg font-bold text-white">AC</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Admin Condominios</h2>
              <p className="text-xs text-gray-500">
                {role === "ADMIN" ? "Administrador" : "Trabajador"}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start h-11 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => router.push(item.href)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Desktop User Menu */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-sm">
                {getUserInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 lg:ml-72">
        {/* Header Superior - Mobile/Tablet */}
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
            {/* Título */}
            <div className="flex items-center space-x-3">
              <div className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <span className="text-lg font-bold text-white">AC</span>
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                  {title}
                </h1>
                <p className="text-xs text-gray-500 md:hidden">
                  {role === "ADMIN" ? "Administrador" : "Trabajador"}
                </p>
              </div>
            </div>

            {/* Acciones Header */}
            <div className="flex items-center space-x-2">
              {/* Notificaciones */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full"
                onClick={() => setNotificationOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Menú de Usuario - Solo móvil/tablet */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                        {getUserInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Mi Perfil</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col items-center space-y-2 pb-4 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl font-semibold">
                          {getUserInitials(session?.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">
                          {session?.user?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session?.user?.email}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {role === "ADMIN" ? "Administrador" : "Trabajador"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          const profilePath = role === "ADMIN" ? "/admin/profile" : "/worker/profile";
                          router.push(profilePath);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
          {children}
        </main>

        {/* Bottom Navigation - Solo móvil - Optimizado para touch */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t-2 bg-white shadow-2xl safe-bottom">
          <div className="flex h-touch-target-lg items-center justify-around px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  className={`flex flex-col items-center justify-center min-h-touch-target flex-1 gap-1 rounded-xl transition-all active:scale-95 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 active:bg-gray-50"
                  }`}
                  onClick={() => router.push(item.href)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`h-6 w-6 transition-all ${
                      isActive ? "scale-110" : ""
                    }`}
                  />
                  <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        onUnreadCountChange={setUnreadCount}
        role={role}
      />
    </div>
  );
}
