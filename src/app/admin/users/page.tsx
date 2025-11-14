"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface Worker {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error("Error al obtener trabajadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al crear trabajador");
        return;
      }

      setShowSheet(false);
      setFormData({ name: "", email: "", password: "" });
      fetchWorkers();
    } catch (error) {
      setError("Ocurrió un error al crear el trabajador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    setError("");
    setSubmitting(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users/${editingWorker.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al actualizar trabajador");
        return;
      }

      setShowSheet(false);
      setEditingWorker(null);
      setFormData({ name: "", email: "", password: "" });
      fetchWorkers();
    } catch (error) {
      setError("Ocurrió un error al actualizar el trabajador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm("¿Estás seguro de eliminar este trabajador?")) return;

    try {
      const response = await fetch(`/api/users/${workerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Error al eliminar", "No se pudo eliminar el trabajador");
        return;
      }

      toast.success("Trabajador eliminado", "El trabajador se eliminó exitosamente");
      fetchWorkers();
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al eliminar el trabajador");
    }
  };

  const handleToggleActive = async (worker: Worker) => {
    try {
      const response = await fetch(`/api/users/${worker.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !worker.isActive,
        }),
      });

      if (!response.ok) {
        toast.error("Error al cambiar estado", "No se pudo actualizar el estado del trabajador");
        return;
      }

      toast.success(
        "Estado actualizado",
        `El trabajador ahora está ${!worker.isActive ? "activo" : "inactivo"}`
      );
      fetchWorkers();
    } catch (error) {
      toast.error("Error de conexión", "Ocurrió un error al cambiar el estado");
    }
  };

  const openCreateSheet = () => {
    setEditingWorker(null);
    setFormData({ name: "", email: "", password: "" });
    setError("");
    setShowSheet(true);
  };

  const openEditSheet = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({ name: worker.name, email: worker.email, password: "" });
    setError("");
    setShowSheet(true);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <MobileLayout title="Trabajadores" role="ADMIN">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Gestión de Trabajadores" role="ADMIN">
      {/* Stats Summary */}
      <Card className="mb-4 border-0 shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                Total Trabajadores
              </p>
              <p className="text-3xl font-bold mt-1">{workers.length}</p>
              <p className="text-xs text-white/90 mt-1">
                {workers.filter((w) => w.isActive).length} activos
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
              <UserCheck className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Trabajadores */}
      <div className="space-y-4 mb-4">
        {workers.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-4">
                No hay trabajadores registrados
              </p>
              <Button onClick={openCreateSheet}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Trabajador
              </Button>
            </CardContent>
          </Card>
        ) : (
          workers.map((worker) => (
            <Card
              key={worker.id}
              className="border-0 shadow-md hover:shadow-lg transition-all"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {getUserInitials(worker.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {worker.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{worker.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Desde{" "}
                          {new Date(worker.createdAt).toLocaleDateString(
                            "es-CL"
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(worker)}
                      className="flex-shrink-0"
                    >
                      <Badge
                        variant={worker.isActive ? "default" : "secondary"}
                        className={
                          worker.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                        }
                      >
                        {worker.isActive ? (
                          <UserCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <UserX className="h-3 w-3 mr-1" />
                        )}
                        {worker.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <Link href={`/admin/users/${worker.id}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9"
                      >
                        <Eye className="h-3 w-3 mr-1.5" />
                        Ver
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSheet(worker)}
                      className="h-9"
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWorker(worker.id)}
                      className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botón Flotante Nuevo Trabajador */}
      {workers.length > 0 && (
        <Button
          className="fixed right-4 bottom-20 h-14 w-14 rounded-full shadow-2xl z-40"
          size="icon"
          onClick={openCreateSheet}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Sheet Crear/Editar Trabajador */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>
              {editingWorker ? "Editar Trabajador" : "Nuevo Trabajador"}
            </SheetTitle>
          </SheetHeader>

          <form
            onSubmit={editingWorker ? handleUpdateWorker : handleCreateWorker}
            className="space-y-4 mt-6"
          >
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

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
                placeholder="Ej: Juan Pérez"
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
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña {editingWorker && "(dejar vacío para no cambiar)"}
              </Label>
              <Input
                id="password"
                type="password"
                required={!editingWorker}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={
                  editingWorker
                    ? "Nueva contraseña (opcional)"
                    : "Contraseña segura"
                }
              />
              {!editingWorker && (
                <p className="text-xs text-gray-500">
                  Mínimo 6 caracteres. El trabajador podrá cambiarla después.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSheet(false);
                  setFormData({ name: "", email: "", password: "" });
                  setEditingWorker(null);
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting
                  ? "Guardando..."
                  : editingWorker
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </MobileLayout>
  );
}
