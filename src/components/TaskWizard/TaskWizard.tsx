"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import TaskWizardStep1 from "./TaskWizardStep1";
import TaskWizardStep2 from "./TaskWizardStep2";
import TaskWizardStep3 from "./TaskWizardStep3";

interface Subtask {
  id?: string;
  title: string;
  order: number;
}

interface Cost {
  id?: string;
  description: string;
  amount: number;
  costType: "MATERIALS" | "LABOR" | "OTHER";
}

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  category?: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  assignedTo: Worker[];
  subtasks: any[];
  costs: any[];
}

interface TaskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  editingTask?: Task | null;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
  error: string;
}

export default function TaskWizard({
  open,
  onOpenChange,
  workers,
  editingTask,
  onSubmit,
  submitting,
  error,
}: TaskWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    priority: (editingTask?.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
    category: editingTask?.category || "",
    scheduledStartDate: editingTask?.scheduledStartDate?.split("T")[0] || "",
    scheduledEndDate: editingTask?.scheduledEndDate?.split("T")[0] || "",
    assignedWorkerIds: editingTask?.assignedTo.map((w) => w.id) || [],
  });

  const [subtasks, setSubtasks] = useState<Subtask[]>(
    editingTask?.subtasks.length
      ? editingTask.subtasks.map((st: any) => ({
          id: st.id,
          title: st.title,
          order: st.order,
        }))
      : [{ title: "", order: 0 }]
  );

  const [costs, setCosts] = useState<Cost[]>(
    editingTask?.costs
      .filter((c: any) => c.costType)
      .map((c: any) => ({
        id: c.id,
        description: c.description || "",
        amount: Number(c.amount) || 0,
        costType: c.costType as "MATERIALS" | "LABOR" | "OTHER",
      })) || []
  );

  // Actualizar estados cuando cambia editingTask
  useEffect(() => {
    if (editingTask && open) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        category: editingTask.category || "",
        scheduledStartDate: editingTask.scheduledStartDate.split("T")[0],
        scheduledEndDate: editingTask.scheduledEndDate.split("T")[0],
        assignedWorkerIds: editingTask.assignedTo.map((w) => w.id),
      });
      setSubtasks(
        editingTask.subtasks.length
          ? editingTask.subtasks.map((st: any) => ({
              id: st.id,
              title: st.title,
              order: st.order,
            }))
          : [{ title: "", order: 0 }]
      );
      setCosts(
        editingTask.costs
          .filter((c: any) => c.costType)
          .map((c: any) => ({
            id: c.id,
            description: c.description || "",
            amount: Number(c.amount) || 0,
            costType: c.costType,
          }))
      );
    } else if (open && !editingTask) {
      // Reset para nueva tarea
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "",
        scheduledStartDate: "",
        scheduledEndDate: "",
        assignedWorkerIds: [],
      });
      setSubtasks([{ title: "", order: 0 }]);
      setCosts([]);
      setCurrentStep(1);
    }
  }, [editingTask, open]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      return (
        formData.title.trim() !== "" &&
        formData.scheduledStartDate !== "" &&
        formData.scheduledEndDate !== ""
      );
    }
    if (currentStep === 2) {
      const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");
      return formData.assignedWorkerIds.length > 0 && validSubtasks.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");
    const validCosts = costs.filter(
      (c) => c.description && c.description.trim() !== "" && c.amount > 0 && c.costType
    );

    const requestBody: any = {
      title: formData.title,
      priority: formData.priority,
      scheduledStartDate: formData.scheduledStartDate,
      scheduledEndDate: formData.scheduledEndDate,
      assignedWorkerIds: formData.assignedWorkerIds,
      subtasks: validSubtasks.map((st, index) => {
        const subtask: any = {
          title: st.title,
          order: index,
        };
        if (st.id) {
          subtask.id = st.id;
        }
        return subtask;
      }),
    };

    if (formData.description && formData.description.trim() !== "") {
      requestBody.description = formData.description;
    }

    if (formData.category && formData.category.trim() !== "") {
      requestBody.category = formData.category;
    }

    if (validCosts.length > 0) {
      requestBody.costs = validCosts.map((c) => {
        const amount = typeof c.amount === "number" ? c.amount : parseFloat(c.amount);
        const cost: any = {
          description: c.description,
          amount: isNaN(amount) ? 0 : amount,
          costType: c.costType,
        };
        if (c.id) {
          cost.id = c.id;
        }
        return cost;
      });
    }

    await onSubmit(requestBody);
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-hidden flex flex-col p-0"
      >
        {/* Header con progreso */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <SheetTitle className="text-xl">
            {editingTask ? "Editar Tarea" : "Nueva Tarea"}
          </SheetTitle>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600">
                Paso {currentStep} de {totalSteps}
              </span>
              <span className="text-xs text-gray-500">
                {currentStep === 1 && "Información Básica"}
                {currentStep === 2 && "Asignación y Checklist"}
                {currentStep === 3 && "Costos y Confirmación"}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </SheetHeader>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Steps container (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {currentStep === 1 && (
              <TaskWizardStep1 formData={formData} onChange={handleChange} />
            )}

            {currentStep === 2 && (
              <TaskWizardStep2
                workers={workers}
                formData={formData}
                subtasks={subtasks}
                onChange={handleChange}
                onSubtasksChange={setSubtasks}
              />
            )}

            {currentStep === 3 && (
              <TaskWizardStep3
                workers={workers}
                formData={formData}
                subtasks={subtasks}
                costs={costs}
                onCostsChange={setCosts}
              />
            )}
          </div>

          {/* Footer con botones */}
          <div className="border-t bg-white px-6 py-4 flex gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
                disabled={submitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1"
                disabled={!canGoNext()}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting || !canGoNext()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingTask ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {editingTask ? "Actualizar Tarea" : "Crear Tarea"}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
