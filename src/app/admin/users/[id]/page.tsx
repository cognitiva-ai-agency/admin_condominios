"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  IdCard,
  Users,
  Building,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Award,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
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
  _count?: {
    assignedTasks: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  scheduledEndDate: string;
}

export default function AdminWorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workerId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
    hireDate: "",
    birthDate: "",
    isActive: true,
  });

  useEffect(() => {
    if (workerId) {
      fetchProfile();
      fetchWorkerTasks();
    }
  }, [workerId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${workerId}`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
      } else {
        toast.error("Error al cargar", "No se pudo cargar el perfil del trabajador");
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      toast.error("Error de conexión", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerTasks = async () => {
    try {
      const response = await fetch(`/api/users/${workerId}/tasks`);
      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error al cargar tareas:", error);
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
        hireDate: profile.hireDate
          ? new Date(profile.hireDate).toISOString().split("T")[0]
          : "",
        birthDate: profile.birthDate
          ? new Date(profile.birthDate).toISOString().split("T")[0]
          : "",
        isActive: profile.isActive,
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
        hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        isActive: formData.isActive,
      };

      const response = await fetch(`/api/users/${workerId}`, {
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

      toast.success("Perfil actualizado", "La información se actualizó correctamente");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al actualizar el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En Progreso",
    COMPLETED: "Completada",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
  };

  const priorityLabels: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  if (loading) {
    return (
      <MobileLayout title="Perfil del Trabajador" role="ADMIN">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return null;
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
  };

  return (
    <MobileLayout title="Perfil del Trabajador" role="ADMIN">
      {/* Botón Volver */}
      <Link href="/admin/users">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Trabajadores
        </Button>
      </Link>

      {/* Hero Section - Profile Header */}
      <Card className="mb-section-gap border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
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
                <Badge
                  className={
                    profile.isActive
                      ? "bg-green-500/20 text-white border-green-300/30 backdrop-blur-sm"
                      : "bg-red-500/20 text-white border-red-300/30 backdrop-blur-sm"
                  }
                >
                  {profile.isActive ? "Activo" : "Inactivo"}
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

      {/* Tabs */}
      <Tabs defaultValue="info" className="mb-section-gap">
        <TabsList className="grid w-full grid-cols-2 mb-card-gap">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            Información
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tareas ({taskStats.total})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información */}
        <TabsContent value="info" className="space-y-card-gap">
          {/* Estadísticas Rápidas */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Resumen de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-purple-700">
                      Total
                    </span>
                    <ClipboardList className="h-3 w-3 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {taskStats.total}
                  </p>
                  <p className="text-xs text-purple-700 mt-0.5">tareas</p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-green-700">
                      Completadas
                    </span>
                    <Award className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {taskStats.completed}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">tareas</p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-700">
                      Activas
                    </span>
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {taskStats.inProgress + taskStats.pending}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">tareas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información Personal
                </CardTitle>
                {!isEditing && (
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
                        placeholder="Nombre completo del trabajador"
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
                        placeholder="email@ejemplo.com"
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
                          setFormData({
                            ...formData,
                            emergencyContact: e.target.value,
                          })
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

                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Fecha de contratación</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) =>
                          setFormData({ ...formData, hireDate: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Usuario activo
                      </Label>
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
                      <p className="font-medium text-gray-900 break-all">
                        {profile.email}
                      </p>
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
                        <p className="font-medium text-gray-900">
                          {profile.phoneNumber}
                        </p>
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
                        <p className="font-medium text-gray-900">
                          {profile.emergencyContact}
                        </p>
                        {profile.emergencyPhone && (
                          <p className="text-sm text-gray-600 mt-1">
                            {profile.emergencyPhone}
                          </p>
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
                        <p className="font-medium text-gray-900">
                          {profile.department}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.hireDate && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Fecha de contratación</p>
                        <p className="font-medium text-gray-900">
                          {new Date(profile.hireDate).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tareas */}
        <TabsContent value="tasks" className="space-y-card-gap">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Tareas Asignadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay tareas asignadas a este trabajador
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/admin/tasks/${task.id}`}
                      className="block"
                    >
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {task.title}
                          </h4>
                          <Badge className={statusColors[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            Prioridad: {priorityLabels[task.priority]}
                          </span>
                          <span>
                            Vence:{" "}
                            {new Date(task.scheduledEndDate).toLocaleDateString(
                              "es-CL"
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
