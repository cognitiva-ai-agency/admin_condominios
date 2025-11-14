"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface QuickTaskCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  onSuccess: () => void;
}

export default function QuickTaskCreate({
  open,
  onOpenChange,
  workers,
  onSuccess,
}: QuickTaskCreateProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    scheduledDate: "",
    assignedWorkerId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Crear fecha de inicio y fin (mismo día)
      const startDate = new Date(formData.scheduledDate);
      startDate.setHours(9, 0, 0, 0);

      const endDate = new Date(formData.scheduledDate);
      endDate.setHours(18, 0, 0, 0);

      const requestBody = {
        title: formData.title,
        priority: formData.priority,
        scheduledStartDate: startDate.toISOString(),
        scheduledEndDate: endDate.toISOString(),
        assignedWorkerIds: [formData.assignedWorkerId],
        subtasks: [
          {
            title: "Completar tarea",
            order: 0,
          },
        ],
      };

      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Error al crear tarea", data.error || "Ocurrió un error inesperado");
        return;
      }

      toast.success("¡Tarea creada!", "La tarea se ha creado exitosamente");

      // Resetear formulario
      setFormData({
        title: "",
        priority: "MEDIUM",
        scheduledDate: "",
        assignedWorkerId: "",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Error", "No se pudo crear la tarea. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    formData.title.trim() !== "" &&
    formData.scheduledDate !== "" &&
    formData.assignedWorkerId !== "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Crear Tarea Rápida
          </SheetTitle>
          <p className="text-sm text-gray-600">
            Crea una tarea simple. Para tareas complejas, usa el formulario completo.
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="quick-title">
              Título de la tarea <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quick-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ej: Reparar puerta principal"
              className="text-base"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-priority">
                Prioridad <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="quick-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-date">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quick-date"
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-worker">
              Asignar a <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.assignedWorkerId}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedWorkerId: value })
              }
            >
              <SelectTrigger id="quick-worker">
                <SelectValue placeholder="Selecciona un trabajador" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Podrás agregar subtareas, costos y más detalles
              después de crear la tarea.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting || !canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Crear Tarea
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
