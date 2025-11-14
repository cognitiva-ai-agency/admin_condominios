"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  Key,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: "",
      email: "",
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error al actualizar", data.error || "No se pudo actualizar el perfil");
        return;
      }

      toast.success("Perfil actualizado", "Tu información se actualizó correctamente");
      setIsEditing(false);

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email,
        },
      });
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al actualizar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Contraseñas no coinciden", "La nueva contraseña y la confirmación deben ser iguales");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Contraseña muy corta", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error al cambiar contraseña", data.error || "No se pudo cambiar la contraseña");
        return;
      }

      toast.success("Contraseña actualizada", "Tu contraseña se cambió correctamente");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al cambiar la contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <MobileLayout title="Mi Perfil" role="ADMIN">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </MobileLayout>
    );
  }

  if (!session?.user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <MobileLayout title="Mi Perfil" role="ADMIN">
      {/* Hero Section - Profile Header */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                {getUserInitials(session.user.name || "Usuario")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{session.user.name}</h2>
              <p className="text-sm opacity-90 mt-1">{session.user.email}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Shield className="h-3 w-3 mr-1" />
                Administrador
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del Perfil */}
      <Card className="mb-card-gap border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Información Personal
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="tu@email.com"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                  disabled={submitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{session.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Rol</p>
                  <p className="font-medium text-gray-900">Administrador</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card className="mb-card-gap border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Seguridad
            </CardTitle>
            {!isChangingPassword && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Repite la contraseña"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="flex-1"
                  disabled={submitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">
              Mantén tu cuenta segura cambiando tu contraseña regularmente.
            </p>
          )}
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
