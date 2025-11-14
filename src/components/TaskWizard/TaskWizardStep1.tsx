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
import { Info } from "lucide-react";

interface TaskWizardStep1Props {
  formData: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
    scheduledStartDate: string;
    scheduledEndDate: string;
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
    </div>
  );
}
