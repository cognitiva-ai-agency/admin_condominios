import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  X,
  Info,
  DollarSign,
  Calendar,
  Users,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Repeat,
} from "lucide-react";

interface Cost {
  id?: string;
  description: string;
  amount: number;
}

interface Subtask {
  id?: string;
  title: string;
  order: number;
}

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface TaskWizardStep3Props {
  workers: Worker[];
  formData: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: string;
    scheduledStartDate: string;
    scheduledEndDate: string;
    assignedWorkerIds: string[];
    isRecurring: boolean;
    recurrencePattern?: "DAILY" | "WEEKLY" | "MONTHLY";
    recurrenceEndDate?: string;
  };
  subtasks: Subtask[];
  costs: Cost[];
  onCostsChange: (costs: Cost[]) => void;
}

export default function TaskWizardStep3({
  workers,
  formData,
  subtasks,
  costs,
  onCostsChange,
}: TaskWizardStep3Props) {
  const addCost = () => {
    onCostsChange([
      ...costs,
      { description: "", amount: 0 },
    ]);
  };

  const removeCost = (index: number) => {
    onCostsChange(costs.filter((_, i) => i !== index));
  };

  const updateCost = (index: number, field: keyof Cost, value: any) => {
    const updated = [...costs];
    if (field === "amount") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onCostsChange(updated);
  };

  const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  const assignedWorkers = workers.filter((w) =>
    formData.assignedWorkerIds.includes(w.id)
  );

  const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");

  const priorityConfig = {
    LOW: { label: "Baja", color: "bg-gray-100 text-gray-800", icon: "🟢" },
    MEDIUM: { label: "Media", color: "bg-blue-100 text-blue-800", icon: "🔵" },
    HIGH: { label: "Alta", color: "bg-orange-100 text-orange-800", icon: "🟠" },
    URGENT: {
      label: "Urgente",
      color: "bg-red-100 text-red-800",
      icon: "🔴",
    },
  };

  const priority = priorityConfig[formData.priority];

  return (
    <div className="space-y-6 py-4">
      {/* Header informativo */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-green-900 mb-1">
              Paso 3: Costos y Confirmación
            </h4>
            <p className="text-xs text-green-700">
              Agrega costos opcionales y revisa el resumen antes de crear la
              tarea.
            </p>
          </div>
        </div>
      </div>

      {/* Costos (Opcional) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Costos (Opcional)
          </Label>
          {totalCost > 0 && (
            <Badge variant="secondary" className="text-base">
              ${totalCost.toLocaleString("es-CL")}
            </Badge>
          )}
        </div>

        {costs.length > 0 && (
          <div className="space-y-3">
            {costs.map((cost, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Costo #{index + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCost(index)}
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Descripción del costo</Label>
                    <Textarea
                      placeholder="Ej: Pintura para paredes exteriores, incluye rodillos y brochas"
                      value={cost.description}
                      onChange={(e) =>
                        updateCost(index, "description", e.target.value)
                      }
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Monto (CLP)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={cost.amount || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? 0 : parseFloat(e.target.value);
                        updateCost(index, "amount", value);
                      }}
                      className="text-lg font-semibold"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCost}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar costo
        </Button>
      </div>

      {/* Resumen de la Tarea */}
      <div className="space-y-3">
        <h4 className="text-base font-semibold border-b pb-2">
          Resumen de la Tarea
        </h4>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-3">
            {/* Título */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {formData.title || "Sin título"}
              </h3>
              {formData.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {formData.description}
                </p>
              )}
            </div>

            {/* Prioridad y Categoría */}
            <div className="flex gap-2">
              <Badge className={priority.color}>
                {priority.icon} {priority.label}
              </Badge>
              {formData.category && (
                <Badge variant="outline">{formData.category}</Badge>
              )}
            </div>

            {/* Fechas */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {formData.scheduledStartDate &&
                  new Date(formData.scheduledStartDate).toLocaleDateString(
                    "es-CL"
                  )}{" "}
                -{" "}
                {formData.scheduledEndDate &&
                  new Date(formData.scheduledEndDate).toLocaleDateString(
                    "es-CL"
                  )}
              </span>
            </div>

            {/* Recurrencia */}
            {formData.isRecurring && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Repeat className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-900 mb-1">
                      Tarea Recurrente
                    </p>
                    <div className="text-xs text-purple-700 space-y-1">
                      <p>
                        • <strong>Frecuencia:</strong>{" "}
                        {formData.recurrencePattern === "DAILY" && "Todos los días"}
                        {formData.recurrencePattern === "WEEKLY" && "Cada semana"}
                        {formData.recurrencePattern === "MONTHLY" && "Cada mes"}
                      </p>
                      {formData.recurrenceEndDate && (
                        <p>
                          • <strong>Hasta:</strong>{" "}
                          {new Date(formData.recurrenceEndDate).toLocaleDateString("es-CL")}
                        </p>
                      )}
                      {!formData.recurrenceEndDate && (
                        <p>• <strong>Duración:</strong> Indefinida</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trabajadores */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users className="h-4 w-4" />
                Asignado a ({assignedWorkers.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {assignedWorkers.length === 0 ? (
                  <Badge variant="outline" className="bg-yellow-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Sin asignar
                  </Badge>
                ) : (
                  assignedWorkers.map((worker) => (
                    <Badge key={worker.id} variant="secondary">
                      {worker.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Subtareas */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <ClipboardCheck className="h-4 w-4" />
                Checklist ({validSubtasks.length} subtareas)
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {validSubtasks.length === 0 ? (
                  <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Sin subtareas
                  </p>
                ) : (
                  validSubtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                    >
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-gray-400" />
                      <span>
                        {index + 1}. {subtask.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Costos */}
            {costs.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Costos estimados
                  </div>
                  <span className="text-green-600 text-base">
                    ${totalCost.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="space-y-1">
                  {costs
                    .filter((c) => c.description && c.amount > 0)
                    .map((cost, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        <span>{cost.description}</span>
                        <span className="font-semibold">
                          ${cost.amount.toLocaleString("es-CL")}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validaciones */}
        {(assignedWorkers.length === 0 || validSubtasks.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Atención:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {assignedWorkers.length === 0 && (
                    <li>Debes asignar al menos un trabajador</li>
                  )}
                  {validSubtasks.length === 0 && (
                    <li>Debes agregar al menos una subtarea</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
