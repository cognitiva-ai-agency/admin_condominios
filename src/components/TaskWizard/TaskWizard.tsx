"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Check, Loader2, X } from "lucide-react";
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

// Helper function para detectar si un elemento es parte de un Select de Radix UI
const isRadixSelectElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  // Buscar hacia arriba en el DOM por elementos de Select
  let current: HTMLElement | null = element;
  while (current) {
    // Verificar atributos de Radix Select
    if (
      current.hasAttribute('data-radix-select-content') ||
      current.hasAttribute('data-radix-select-viewport') ||
      current.hasAttribute('data-radix-popper-content-wrapper') ||
      current.getAttribute('role') === 'listbox' ||
      current.getAttribute('role') === 'option' ||
      current.closest('[data-radix-select-content]') !== null
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Ref para rastrear si el submit fue iniciado intencionalmente por el botón
  const intentionalSubmitRef = useRef(false);

  const [formData, setFormData] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    priority: (editingTask?.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
    category: editingTask?.category || "",
    scheduledStartDate: editingTask?.scheduledStartDate?.split("T")[0] || "",
    scheduledEndDate: editingTask?.scheduledEndDate?.split("T")[0] || "",
    assignedWorkerIds: editingTask?.assignedTo.map((w) => w.id) || [],
    isRecurring: false,
    recurrencePattern: undefined as "DAILY" | "WEEKLY" | "MONTHLY" | undefined,
    recurrenceEndDate: undefined as string | undefined,
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
    editingTask?.costs?.map((c: any) => ({
        id: c.id,
        description: c.description || "",
        amount: Number(c.amount) || 0,
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
        isRecurring: false,
        recurrencePattern: undefined,
        recurrenceEndDate: undefined,
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
        editingTask.costs?.map((c: any) => ({
            id: c.id,
            description: c.description || "",
            amount: Number(c.amount) || 0,
          })) || []
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
        isRecurring: false,
        recurrencePattern: undefined,
        recurrenceEndDate: undefined,
      });
      setSubtasks([{ title: "", order: 0 }]);
      setCosts([]);
      setCurrentStep(1);
    }
  }, [editingTask, open]);

  // CAPA DE PROTECCIÓN ADICIONAL: Monitorear cierres inesperados (no aplicar si fue submit exitoso)
  useEffect(() => {
    if (!open && hasData() && !submitting && !intentionalSubmitRef.current) {
      // Monitoreo silencioso - no mostrar warnings en consola
    }
  }, [open]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const canGoNext = () => {
    if (currentStep === 1) {
      const basicFieldsValid =
        formData.title.trim() !== "" &&
        formData.scheduledStartDate !== "" &&
        formData.scheduledEndDate !== "";

      // Si es recurrente, validar que tenga patrón de recurrencia
      if (formData.isRecurring) {
        return basicFieldsValid && formData.recurrencePattern !== undefined;
      }

      return basicFieldsValid;
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

    // PROTECCIÓN CRÍTICA: Solo permitir submit si fue intencional
    if (!intentionalSubmitRef.current) {
      // Submit no iniciado por el botón - bloquear silenciosamente
      return;
    }

    // PROTECCIÓN: Solo permitir submit en el paso 3
    if (currentStep !== totalSteps) {
      intentionalSubmitRef.current = false; // Reset flag
      return;
    }
    const validSubtasks = subtasks.filter((st) => st.title.trim() !== "");
    const validCosts = costs.filter(
      (c) => c.description && c.description.trim() !== "" && c.amount > 0
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
        };
        if (c.id) {
          cost.id = c.id;
        }
        return cost;
      });
    }

    // Agregar campos de recurrencia si está marcado
    if (formData.isRecurring) {
      requestBody.isRecurring = true;
      requestBody.recurrencePattern = formData.recurrencePattern;
      if (formData.recurrenceEndDate) {
        requestBody.recurrenceEndDate = formData.recurrenceEndDate;
      }
    }

    await onSubmit(requestBody);

    // Reset el flag después del submit exitoso
    intentionalSubmitRef.current = false;
  };

  // Verificar si hay datos ingresados (para evitar cierre accidental)
  const hasData = () => {
    return (
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.category.trim() !== "" ||
      formData.assignedWorkerIds.length > 0 ||
      subtasks.some((st) => st.title.trim() !== "") ||
      costs.length > 0
    );
  };

  // Manejar intento de cierre con confirmación si hay datos
  const handleOpenChange = (newOpen: boolean) => {
    // IMPORTANTE: Siempre prevenir cierre automático
    // Solo permitir cierre explícito desde el botón X o después de submit
    if (!newOpen) {
      // No hacer nada - el cierre solo puede venir del botón X explícito
      return;
    }
    onOpenChange(newOpen);
  };

  // Manejar click en el botón X de cierre
  const handleCloseButtonClick = () => {
    if (hasData() && !submitting) {
      // Mostrar confirmación personalizada antes de cerrar
      setShowCloseConfirm(true);
    } else {
      // Cerrar directamente si no hay datos
      onOpenChange(false);
    }
  };

  // Confirmar cierre del wizard
  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
  };

  // Cancelar cierre del wizard
  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-hidden flex flex-col p-0"
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            // Permitir clicks en elementos de Select (están en portales fuera del Sheet)
            if (isRadixSelectElement(target)) {
              return;
            }
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            // Permitir interacciones con elementos de Select (están en portales fuera del Sheet)
            if (isRadixSelectElement(target)) {
              return;
            }
            e.preventDefault();
          }}
        >
        {/* Header con progreso */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              {editingTask ? "Editar Tarea" : "Nueva Tarea"}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCloseButtonClick}
              disabled={submitting}
              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Prevenir submit con Enter key - solo permitir submit con botón explícito
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
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
          <div className="border-t bg-white px-6 py-4">
            {/* Mensaje informativo */}
            {currentStep < totalSteps && (
              <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-800 text-center">
                  💡 Navega entre los pasos sin preocuparte. Tus datos se guardarán hasta que completes el paso {totalSteps}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {/* Botón invisible para prevenir submit accidental con Enter */}
              <button type="button" style={{ display: 'none' }} aria-hidden="true" />

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
                  onClick={() => {
                    intentionalSubmitRef.current = true;
                  }}
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
          </div>
        </form>
      </SheetContent>
    </Sheet>

    {/* Diálogo de confirmación de cierre */}
    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Los datos ingresados se perderán si cierras ahora. ¿Estás seguro de
            que deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClose}
            className="bg-red-600 hover:bg-red-700"
          >
            Cerrar sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
