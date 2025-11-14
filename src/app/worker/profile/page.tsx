"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Save,
  X,
  Key,
  IdCard,
  Users,
  Building,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  rut?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  hireDate?: string | null;
  birthDate?: string | null;
  createdAt: string;
}

export default function WorkerProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rut: "",
    phoneNumber: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    jobTitle: "",
    department: "",
    birthDate: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
      } else {
        console.error("Error al cargar perfil:", data);
        toast.error(
          "Error al cargar",
          data.error || "No se pudo cargar el perfil del trabajador"
        );
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      toast.error(
        "Error de conexión",
        "No se pudo conectar con el servidor"
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        rut: profile.rut || "",
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
        emergencyPhone: profile.emergencyPhone || "",
        jobTitle: profile.jobTitle || "",
        department: profile.department || "",
        birthDate: profile.birthDate
          ? new Date(profile.birthDate).toISOString().split("T")[0]
          : "",
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        rut: formData.rut || null,
        phoneNumber: formData.phoneNumber || null,
        address: formData.address || null,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,
        jobTitle: formData.jobTitle || null,
        department: formData.department || null,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      };

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error al actualizar", data.error || "No se pudo actualizar el perfil");
        return;
      }

      toast.success("Perfil actualizado", "Tu información se actualizó correctamente");
      setIsEditing(false);
      fetchProfile();

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
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al cambiar la contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <MobileLayout title="Mi Perfil" role="WORKER">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </MobileLayout>
    );
  }

  if (!session?.user) {
    router.push("/");
    return null;
  }

  if (!profile) {
    return (
      <MobileLayout title="Mi Perfil" role="WORKER">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-3 text-red-300" />
              <p className="text-sm text-red-600 font-medium mb-2">
                Error al cargar el perfil
              </p>
              <p className="text-xs text-gray-500 mb-4">
                No se pudo cargar tu información. Intenta nuevamente.
              </p>
              <Button onClick={() => fetchProfile()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Mi Perfil" role="WORKER">
      {/* Hero Section - Profile Header */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                {getUserInitials(profile.name || "Usuario")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-sm opacity-90 mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Trabajador
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  Desde {new Date(profile.createdAt).toLocaleDateString("es-CL")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Personal */}
      <Card className="mb-card-gap border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Información Personal
            </CardTitle>
            {!isEditing && !isChangingPassword && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
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
                  <Label htmlFor="email">Email *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    type="text"
                    value={formData.rut}
                    onChange={(e) =>
                      setFormData({ ...formData, rut: e.target.value })
                    }
                    placeholder="12.345.678-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Calle, número, comuna, ciudad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contacto de emergencia</Label>
                  <Input
                    id="emergencyContact"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContact: e.target.value })
                    }
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Teléfono de emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyPhone: e.target.value })
                    }
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Cargo</Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    placeholder="Ej: Conserje, Jardinero, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento/Área</Label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Ej: Mantenimiento, Limpieza, etc."
                  />
                </div>
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
                <Button type="submit" className="flex-1" disabled={submitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">{profile.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">{profile.email}</p>
                </div>
              </div>

              {profile.rut && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <IdCard className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">RUT</p>
                    <p className="font-medium text-gray-900">{profile.rut}</p>
                  </div>
                </div>
              )}

              {profile.phoneNumber && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-900">{profile.phoneNumber}</p>
                  </div>
                </div>
              )}

              {profile.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="font-medium text-gray-900">{profile.address}</p>
                  </div>
                </div>
              )}

              {profile.birthDate && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Fecha de nacimiento</p>
                    <p className="font-medium text-gray-900">
                      {new Date(profile.birthDate).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
              )}

              {profile.emergencyContact && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Contacto de emergencia</p>
                    <p className="font-medium text-gray-900">{profile.emergencyContact}</p>
                    {profile.emergencyPhone && (
                      <p className="text-sm text-gray-600 mt-1">{profile.emergencyPhone}</p>
                    )}
                  </div>
                </div>
              )}

              {profile.jobTitle && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Cargo</p>
                    <p className="font-medium text-gray-900">{profile.jobTitle}</p>
                  </div>
                </div>
              )}

              {profile.department && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Departamento</p>
                    <p className="font-medium text-gray-900">{profile.department}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      {!isEditing && (
        <Card className="mb-card-gap border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                Seguridad
              </CardTitle>
              {!isChangingPassword && (
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
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
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
                  <Button type="submit" className="flex-1" disabled={submitting}>
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
      )}
    </MobileLayout>
  );
}
