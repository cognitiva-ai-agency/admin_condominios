import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Repeat, Calendar } from "lucide-react";

interface TaskWizardStep1Props {
  formData: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
    scheduledStartDate: string;
    scheduledEndDate: string;
    isRecurring: boolean;
    recurrencePattern?: "DAILY" | "WEEKLY" | "MONTHLY";
    recurrenceEndDate?: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function TaskWizardStep1({
  formData,
  onChange,
}: TaskWizardStep1Props) {
  return (
    <div className="space-y-6 py-4">
      {/* Header informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Paso 1: Información Básica
            </h4>
            <p className="text-xs text-blue-700">
              Define los detalles principales de la tarea y sus fechas de
              ejecución.
            </p>
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Título de la tarea *
        </Label>
        <Input
          id="title"
          placeholder="Ej: Mantención de jardín común"
          required
          value={formData.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-gray-500">
          Nombre descriptivo y claro de la tarea
        </p>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">
          Descripción
        </Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Describe los detalles de la tarea..."
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="text-base resize-none"
        />
        <p className="text-xs text-gray-500">
          Información adicional sobre el trabajo a realizar
        </p>
      </div>

      {/* Prioridad y Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-base font-semibold">
            Prioridad *
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => onChange("priority", value)}
          >
            <SelectTrigger id="priority" className="text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">🟢 Baja</SelectItem>
              <SelectItem value="MEDIUM">🔵 Media</SelectItem>
              <SelectItem value="HIGH">🟠 Alta</SelectItem>
              <SelectItem value="URGENT">🔴 Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-semibold">
            Categoría
          </Label>
          <Input
            id="category"
            placeholder="Ej: Mantención"
            value={formData.category}
            onChange={(e) => onChange("category", e.target.value)}
            className="text-base"
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">
          Programación
        </h4>

        <div className="space-y-2">
          <Label htmlFor="start" className="text-base font-semibold">
            Fecha de inicio *
          </Label>
          <Input
            id="start"
            type="date"
            required
            value={formData.scheduledStartDate}
            onChange={(e) => onChange("scheduledStartDate", e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end" className="text-base font-semibold">
            Fecha de término *
          </Label>
          <Input
            id="end"
            type="date"
            required
            value={formData.scheduledEndDate}
            onChange={(e) => onChange("scheduledEndDate", e.target.value)}
            min={formData.scheduledStartDate}
            className="text-base"
          />
          {formData.scheduledStartDate && formData.scheduledEndDate && (
            <p className="text-xs text-gray-500">
              Duración:{" "}
              {Math.ceil(
                (new Date(formData.scheduledEndDate).getTime() -
                  new Date(formData.scheduledStartDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              día(s)
            </p>
          )}
        </div>
      </div>

      {/* Configuración de Recurrencia */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Tarea Recurrente
        </h4>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) => {
                onChange("isRecurring", checked);
                // Resetear campos de recurrencia si se desmarca
                if (!checked) {
                  onChange("recurrencePattern", undefined);
                  onChange("recurrenceEndDate", undefined);
                }
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="isRecurring"
                className="text-sm font-semibold text-purple-900 cursor-pointer"
              >
                Esta es una tarea recurrente
              </Label>
              <p className="text-xs text-purple-700 mt-1">
                Marca esta opción si la tarea se repite periódicamente (ej: aseo diario del ascensor)
              </p>
            </div>
          </div>

          {/* Configuración de recurrencia (solo visible si está marcado) */}
          {formData.isRecurring && (
            <div className="mt-4 space-y-4 pl-7 border-l-2 border-purple-300">
              <div className="space-y-2">
                <Label htmlFor="recurrencePattern" className="text-sm font-semibold text-purple-900">
                  Patrón de repetición *
                </Label>
                <Select
                  value={formData.recurrencePattern || ""}
                  onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY") =>
                    onChange("recurrencePattern", value)
                  }
                >
                  <SelectTrigger id="recurrencePattern" className="bg-white">
                    <SelectValue placeholder="Selecciona la frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">
                      📅 Diario - Se repite todos los días
                    </SelectItem>
                    <SelectItem value="WEEKLY">
                      📆 Semanal - Se repite cada semana
                    </SelectItem>
                    <SelectItem value="MONTHLY">
                      🗓️ Mensual - Se repite cada mes
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-600">
                  Define cada cuánto tiempo se repetirá esta tarea
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurrenceEndDate" className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de fin de recurrencia (opcional)
                </Label>
                <Input
                  id="recurrenceEndDate"
                  type="date"
                  value={formData.recurrenceEndDate || ""}
                  onChange={(e) => onChange("recurrenceEndDate", e.target.value || undefined)}
                  min={formData.scheduledStartDate}
                  className="bg-white"
                />
                <p className="text-xs text-purple-600">
                  {formData.recurrenceEndDate
                    ? "La tarea dejará de repetirse después de esta fecha"
                    : "Si no defines una fecha, la tarea se repetirá indefinidamente"}
                </p>
              </div>

              {/* Resumen visual de la configuración */}
              {formData.recurrencePattern && (
                <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 mb-2">
                    📋 Resumen de recurrencia:
                  </p>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>
                      • <strong>Frecuencia:</strong>{" "}
                      {formData.recurrencePattern === "DAILY" && "Todos los días"}
                      {formData.recurrencePattern === "WEEKLY" && "Cada semana"}
                      {formData.recurrencePattern === "MONTHLY" && "Cada mes"}
                    </li>
                    <li>
                      • <strong>Primera ejecución:</strong>{" "}
                      {formData.scheduledStartDate
                        ? new Date(formData.scheduledStartDate).toLocaleDateString("es-CL")
                        : "No definida"}
                    </li>
                    <li>
                      • <strong>Se repetirá:</strong>{" "}
                      {formData.recurrenceEndDate
                        ? `Hasta el ${new Date(formData.recurrenceEndDate).toLocaleDateString("es-CL")}`
                        : "Indefinidamente"}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
