import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, GripVertical, Info, Users } from "lucide-react";

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

interface TaskWizardStep2Props {
  workers: Worker[];
  formData: {
    assignedWorkerIds: string[];
  };
  subtasks: Subtask[];
  onChange: (field: string, value: any) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

function SortableSubtask({
  subtask,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  subtask: Subtask;
  index: number;
  onUpdate: (index: number, title: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}) {
  const id = `subtask-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold text-gray-500 w-6">
        {index + 1}.
      </span>
      <Input
        placeholder={`Subtarea ${index + 1}`}
        value={subtask.title}
        onChange={(e) => onUpdate(index, e.target.value)}
        className="flex-1 border-0 focus-visible:ring-0 px-2"
      />
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function TaskWizardStep2({
  workers,
  formData,
  subtasks,
  onChange,
  onSubtasksChange,
}: TaskWizardStep2Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex(
        (_, idx) => `subtask-${idx}` === active.id
      );
      const newIndex = subtasks.findIndex(
        (_, idx) => `subtask-${idx}` === over.id
      );

      onSubtasksChange(arrayMove(subtasks, oldIndex, newIndex));
    }
  };

  const addSubtask = () => {
    onSubtasksChange([...subtasks, { title: "", order: subtasks.length }]);
  };

  const removeSubtask = (index: number) => {
    onSubtasksChange(subtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, title: string) => {
    const updated = [...subtasks];
    updated[index].title = title;
    onSubtasksChange(updated);
  };

  const toggleWorker = (workerId: string) => {
    const currentIds = formData.assignedWorkerIds;
    if (currentIds.includes(workerId)) {
      onChange(
        "assignedWorkerIds",
        currentIds.filter((id) => id !== workerId)
      );
    } else {
      onChange("assignedWorkerIds", [...currentIds, workerId]);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header informativo */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-1">
              Paso 2: Asignación y Checklist
            </h4>
            <p className="text-xs text-purple-700">
              Selecciona quién ejecutará la tarea y define las subtareas a
              completar.
            </p>
          </div>
        </div>
      </div>

      {/* Asignación de Trabajadores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Asignar trabajadores *
          </Label>
          <Badge variant="secondary">
            {formData.assignedWorkerIds.length} seleccionado(s)
          </Badge>
        </div>

        {workers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800">
              No hay trabajadores disponibles. Crea trabajadores primero.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-3 bg-gray-50">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors"
              >
                <Checkbox
                  id={`worker-${worker.id}`}
                  checked={formData.assignedWorkerIds.includes(worker.id)}
                  onCheckedChange={() => toggleWorker(worker.id)}
                />
                <label
                  htmlFor={`worker-${worker.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {worker.name}
                  </p>
                  <p className="text-xs text-gray-500">{worker.email}</p>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtareas (Checklist) */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Checklist de subtareas *
        </Label>
        <p className="text-xs text-gray-500 -mt-2">
          Arrastra para reordenar. Mínimo 1 subtarea requerida.
        </p>

        {subtasks.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={addSubtask}
            className="w-full border-dashed border-2 h-16 text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar primera subtarea
          </Button>
        ) : (
          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subtasks.map((_, idx) => `subtask-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {subtasks.map((subtask, index) => (
                    <SortableSubtask
                      key={`subtask-${index}`}
                      subtask={subtask}
                      index={index}
                      onUpdate={updateSubtask}
                      onRemove={removeSubtask}
                      canRemove={subtasks.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSubtask}
              className="w-full border-dashed border-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar otra subtarea
            </Button>
          </div>
        )}
      </div>

      {/* Contador de subtareas */}
      {subtasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 text-center">
            📝 Total: <span className="font-bold">{subtasks.length}</span>{" "}
            subtarea(s) en el checklist
          </p>
        </div>
      )}
    </div>
  );
}
