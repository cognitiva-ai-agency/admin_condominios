"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Users,
  Calendar,
  Tag,
} from "lucide-react";

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface HistoryFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  categories: string[];
  filterWorker: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterCategory: string;
  onFilterChange: (filters: {
    worker: string;
    dateFrom: string;
    dateTo: string;
    category: string;
  }) => void;
  totalFiltered: number;
  totalTasks: number;
}

export default function HistoryFiltersDrawer({
  open,
  onOpenChange,
  workers,
  categories,
  filterWorker,
  filterDateFrom,
  filterDateTo,
  filterCategory,
  onFilterChange,
  totalFiltered,
  totalTasks,
}: HistoryFiltersDrawerProps) {
  const [localWorker, setLocalWorker] = useState(filterWorker);
  const [localDateFrom, setLocalDateFrom] = useState(filterDateFrom);
  const [localDateTo, setLocalDateTo] = useState(filterDateTo);
  const [localCategory, setLocalCategory] = useState(filterCategory);

  useEffect(() => {
    setLocalWorker(filterWorker);
    setLocalDateFrom(filterDateFrom);
    setLocalDateTo(filterDateTo);
    setLocalCategory(filterCategory);
  }, [filterWorker, filterDateFrom, filterDateTo, filterCategory]);

  const hasActiveFilters =
    localWorker !== "all" ||
    localDateFrom !== "" ||
    localDateTo !== "" ||
    localCategory !== "all";

  const handleApply = () => {
    onFilterChange({
      worker: localWorker,
      dateFrom: localDateFrom,
      dateTo: localDateTo,
      category: localCategory,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalWorker("all");
    setLocalDateFrom("");
    setLocalDateTo("");
    setLocalCategory("all");
    onFilterChange({
      worker: "all",
      dateFrom: "",
      dateTo: "",
      category: "all",
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
          {/* Trabajador Asignado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-semibold">
                Trabajador
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

          {/* Rango de Fechas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Label className="text-base font-semibold">
                Rango de Fechas
              </Label>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm text-gray-600">
                  Desde
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={localDateFrom}
                  onChange={(e) => setLocalDateFrom(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm text-gray-600">
                  Hasta
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={localDateTo}
                  onChange={(e) => setLocalDateTo(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Categoría */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                <Label className="text-base font-semibold">
                  Categoría
                </Label>
              </div>
              <Select value={localCategory} onValueChange={setLocalCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>Todas las categorías</span>
                    </div>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    {localWorker !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Trabajador: {workers.find((w) => w.id === localWorker)?.name}
                      </Badge>
                    )}
                    {localDateFrom !== "" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Desde: {new Date(localDateFrom).toLocaleDateString("es-CL")}
                      </Badge>
                    )}
                    {localDateTo !== "" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Hasta: {new Date(localDateTo).toLocaleDateString("es-CL")}
                      </Badge>
                    )}
                    {localCategory !== "all" && (
                      <Badge variant="secondary" className="bg-blue-100">
                        Categoría: {localCategory}
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
