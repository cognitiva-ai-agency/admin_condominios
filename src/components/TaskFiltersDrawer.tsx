"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Target,
  Calendar,
} from "lucide-react";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface TaskFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  filterStatus: string;
  filterPriority: string;
  filterWorker: string;
  onFilterChange: (filters: {
    status: string;
    priority: string;
    worker: string;
  }) => void;
  totalFiltered: number;
  totalTasks: number;
}

export default function TaskFiltersDrawer({
  open,
  onOpenChange,
  workers,
  filterStatus,
  filterPriority,
  filterWorker,
  onFilterChange,
  totalFiltered,
  totalTasks,
}: TaskFiltersDrawerProps) {
  const [localStatus, setLocalStatus] = useState(filterStatus);
  const [localPriority, setLocalPriority] = useState(filterPriority);
  const [localWorker, setLocalWorker] = useState(filterWorker);

  useEffect(() => {
    setLocalStatus(filterStatus);
    setLocalPriority(filterPriority);
    setLocalWorker(filterWorker);
  }, [filterStatus, filterPriority, filterWorker]);

  const statusOptions = [
    {
      value: "all",
      label: "Todas",
      icon: Target,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      value: "PENDING",
      label: "Pendientes",
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      value: "IN_PROGRESS",
      label: "En Progreso",
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      value: "COMPLETED",
      label: "Completadas",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  const priorityOptions = [
    {
      value: "all",
      label: "Todas",
      emoji: "🎯",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "URGENT",
      label: "Urgente",
      emoji: "🔴",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "HIGH",
      label: "Alta",
      emoji: "🟠",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "MEDIUM",
      label: "Media",
      emoji: "🔵",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "LOW",
      label: "Baja",
      emoji: "🟢",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const hasActiveFilters =
    localStatus !== "all" ||
    localPriority !== "all" ||
    localWorker !== "all";

  const handleApply = () => {
    onFilterChange({
      status: localStatus,
      priority: localPriority,
      worker: localWorker,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalStatus("all");
    setLocalPriority("all");
    setLocalWorker("all");
    onFilterChange({
      status: "all",
      priority: "all",
      worker: "all",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <SheetTitle className="text-xl">Filtros</SheetTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm text-gray-600">Resultados:</span>
            <Badge variant="secondary" className="text-base font-semibold">
              {totalFiltered} de {totalTasks}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Estado de la Tarea */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-semibold">Estado</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = localStatus === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setLocalStatus(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? `${option.bg} border-current ${option.color}`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected ? option.color : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? option.color : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prioridad */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-semibold">Prioridad</Label>
            </div>
            <div className="space-y-2">
              {priorityOptions.map((option) => {
                const isSelected = localPriority === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setLocalPriority(option.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? `${option.color} border-current`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trabajador Asignado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-semibold">
                Trabajador Asignado
              </Label>
            </div>
            <Select value={localWorker} onValueChange={setLocalWorker}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Seleccionar trabajador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Todos los trabajadores</span>
                  </div>
                </SelectItem>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{worker.name}</span>
                      <span className="text-xs text-gray-500">
                        {worker.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumen de Filtros Activos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Filter className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Filtros Activos:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {localStatus !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Estado: {statusOptions.find((o) => o.value === localStatus)?.label}
                      </Badge>
                    )}
                    {localPriority !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Prioridad: {priorityOptions.find((o) => o.value === localPriority)?.label}
                      </Badge>
                    )}
                    {localWorker !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Trabajador: {workers.find((w) => w.id === localWorker)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleApply} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
