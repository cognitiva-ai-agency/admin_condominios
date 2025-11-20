"use client";

import { formatDuration } from "@/utils/timeUtils";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Tag,
  AlertCircle,
  Award,
} from "lucide-react";

interface MonthlyReportProps {
  report: {
    period: {
      month: number;
      year: number;
      monthName: string;
      startDate: string;
      endDate: string;
    };
    summary: {
      totalTasks: number;
      totalCost: number;
      efficiencyRate: number;
      totalWorkers: number;
      totalCategories: number;
    };
    timePerformance: {
      onTime: number;
      early: number;
      late: number;
      averageDuration: number;
      averageDelay: number;
    };
    workerStats: Array<{
      id: string;
      name: string;
      email: string;
      tasksCompleted: number;
      totalCost: number;
      onTime: number;
      early: number;
      late: number;
      subtasksCompleted: number;
    }>;
    categoryStats: Array<{
      category: string;
      count: number;
      totalCost: number;
      percentage: number;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      category: string | null;
      priority: string;
      totalCost: number;
      actualEndDate: string | null;
      assignedTo: Array<{ name: string }>;
    }>;
    generatedAt: string;
  };
}

export default function MonthlyReport({ report }: MonthlyReportProps) {
  return (
    <div className="bg-white text-gray-900 print:text-black">
      {/* Estilos para impresión optimizados */}
      <style jsx global>{`
        @media print {
          /* Configuración general */
          * {
            print-color-adjust: economy !important;
            -webkit-print-color-adjust: economy !important;
            color-adjust: economy !important;
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          /* Ocultar elementos no imprimibles */
          .no-print {
            display: none !important;
          }

          /* Configuración de página */
          @page {
            margin: 1cm;
            size: A4 portrait;
          }

          /* Control de saltos de página */
          .page-break {
            page-break-before: always;
            break-before: always;
          }

          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Evitar que las tablas se corten */
          table {
            page-break-inside: auto;
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tbody {
            display: table-row-group;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Optimizar secciones */
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
            color: #000 !important;
          }

          /* ELIMINAR TODOS LOS FONDOS DE COLOR Y GRADIENTES */
          [class*="bg-gradient"],
          [class*="from-"],
          [class*="to-"],
          .bg-gray-50,
          .bg-gray-100,
          .bg-blue-50,
          .bg-blue-100,
          .bg-green-50,
          .bg-green-100,
          .bg-purple-50,
          .bg-purple-100,
          .bg-orange-50,
          .bg-orange-100,
          .bg-red-50,
          .bg-red-100 {
            background: white !important;
            background-image: none !important;
          }

          /* Simplificar bordes para impresión */
          [class*="border-blue"],
          [class*="border-green"],
          [class*="border-purple"],
          [class*="border-orange"],
          [class*="border-red"] {
            border-color: #d1d5db !important;
          }

          /* Tablas: bordes simples y legibles */
          table {
            border: 1px solid #000 !important;
          }

          th, td {
            border: 1px solid #666 !important;
            padding: 4px 8px !important;
          }

          th {
            background: #f3f4f6 !important;
            font-weight: bold !important;
          }

          /* Ocultar iconos en impresión para ahorrar espacio */
          svg {
            display: none !important;
          }

          /* Fuentes más pequeñas para que quepa más contenido */
          body {
            font-size: 10pt !important;
          }

          h1 {
            font-size: 18pt !important;
            margin-bottom: 8pt !important;
          }

          h2 {
            font-size: 14pt !important;
            margin-bottom: 6pt !important;
            margin-top: 12pt !important;
          }

          h3 {
            font-size: 12pt !important;
            margin-bottom: 4pt !important;
          }

          p, div, span {
            font-size: 9pt !important;
          }

          /* Espaciado reducido agresivamente */
          .mb-8 {
            margin-bottom: 12pt !important;
          }

          .mb-4 {
            margin-bottom: 6pt !important;
          }

          .mb-2 {
            margin-bottom: 3pt !important;
          }

          .p-6, .p-4 {
            padding: 6pt !important;
          }

          .p-3 {
            padding: 4pt !important;
          }

          .p-2 {
            padding: 3pt !important;
          }

          /* Grids: simplificar a una columna en secciones críticas */
          .grid {
            display: block !important;
          }

          .grid > * {
            margin-bottom: 6pt !important;
          }

          /* Texto: todos en negro legible */
          * {
            color: #000 !important;
          }

          .text-gray-600,
          .text-gray-700,
          .text-gray-900,
          .text-blue-600,
          .text-green-600,
          .text-red-600,
          .text-purple-600,
          .text-orange-600 {
            color: #000 !important;
          }

          /* Bordes redondeados: eliminar en impresión */
          [class*="rounded"] {
            border-radius: 0 !important;
          }

          /* Sombras: eliminar */
          [class*="shadow"] {
            box-shadow: none !important;
          }

          /* Gap en grids */
          .gap-4, .gap-3, .gap-2 {
            gap: 4pt !important;
          }

          /* Optimizar ancho de columnas en tablas */
          table {
            table-layout: fixed !important;
          }

          /* Forzar división de palabras largas */
          td, th {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}</style>

      {/* Encabezado del Informe */}
      <div className="mb-8 pb-4 border-b-2 border-gray-900 page-break-avoid print:border-b">
        <div className="print:text-center">
          <div className="flex items-center gap-3 mb-2 print:justify-center">
            <Building2 className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Informe Mensual de Gestión
            </h1>
          </div>
          <p className="text-lg text-gray-600 font-medium capitalize mb-2">
            {report.period.monthName} {report.period.year}
          </p>
          <p className="text-sm text-gray-600">
            Generado: {new Date(report.generatedAt).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <p className="text-gray-700 mt-3 print:text-center">
          Período: {new Date(report.period.startDate).toLocaleDateString("es-CL")} - {new Date(report.period.endDate).toLocaleDateString("es-CL")}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="mb-8 page-break-avoid">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          Resumen Ejecutivo
        </h2>
        <div className="grid grid-cols-2 print:grid-cols-2 gap-4 print:gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-blue-200 print:border-gray-300">
            <div className="flex items-center gap-2 mb-2 print:mb-1">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700 print:text-black">
                Tareas Completadas
              </p>
            </div>
            <p className="text-3xl print:text-xl font-bold text-blue-900 print:text-black">
              {report.summary.totalTasks}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-green-200 print:border-gray-300">
            <div className="flex items-center gap-2 mb-2 print:mb-1">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-gray-700 print:text-black">Costo Total</p>
            </div>
            <p className="text-3xl print:text-xl font-bold text-green-900 print:text-black">
              ${report.summary.totalCost.toLocaleString("es-CL")}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-purple-200 print:border-gray-300">
            <div className="flex items-center gap-2 mb-2 print:mb-1">
              <Award className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-700 print:text-black">Eficiencia</p>
            </div>
            <p className="text-3xl print:text-xl font-bold text-purple-900 print:text-black">
              {report.summary.efficiencyRate}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-orange-200 print:border-gray-300">
            <div className="flex items-center gap-2 mb-2 print:mb-1">
              <Users className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-semibold text-gray-700 print:text-black">
                Trabajadores Activos
              </p>
            </div>
            <p className="text-3xl print:text-xl font-bold text-orange-900 print:text-black">
              {report.summary.totalWorkers}
            </p>
          </div>
        </div>
      </div>

      {/* Rendimiento de Tiempo */}
      <div className="mb-8 page-break-avoid">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" />
          Rendimiento de Tiempo
        </h2>
        <div className="bg-gray-50 print:bg-white p-6 print:p-3 rounded-lg print:rounded-none border border-gray-200 print:border-gray-300">
          <div className="grid grid-cols-3 gap-4 print:gap-2 mb-4 print:mb-2">
            <div className="bg-green-50 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-green-200 print:border-gray-300">
              <p className="text-sm font-semibold text-green-700 print:text-black mb-1">
                Completadas Antes
              </p>
              <p className="text-2xl print:text-lg font-bold text-green-900 print:text-black">
                {report.timePerformance.early}
              </p>
              <p className="text-xs text-green-700 print:text-black mt-1">
                {report.summary.totalTasks > 0
                  ? `${Math.round((report.timePerformance.early / report.summary.totalTasks) * 100)}%`
                  : "0%"}
              </p>
            </div>

            <div className="bg-blue-50 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-blue-200 print:border-gray-300">
              <p className="text-sm font-semibold text-blue-700 print:text-black mb-1">
                A Tiempo
              </p>
              <p className="text-2xl print:text-lg font-bold text-blue-900 print:text-black">
                {report.timePerformance.onTime}
              </p>
              <p className="text-xs text-blue-700 print:text-black mt-1">
                {report.summary.totalTasks > 0
                  ? `${Math.round((report.timePerformance.onTime / report.summary.totalTasks) * 100)}%`
                  : "0%"}
              </p>
            </div>

            <div className="bg-red-50 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-red-200 print:border-gray-300">
              <p className="text-sm font-semibold text-red-700 print:text-black mb-1">
                Con Retraso
              </p>
              <p className="text-2xl print:text-lg font-bold text-red-900 print:text-black">
                {report.timePerformance.late}
              </p>
              <p className="text-xs text-red-700 print:text-black mt-1">
                {report.summary.totalTasks > 0
                  ? `${Math.round((report.timePerformance.late / report.summary.totalTasks) * 100)}%`
                  : "0%"}
              </p>
            </div>
          </div>

          {report.timePerformance.averageDuration > 0 && (
            <div className="mt-4 print:mt-2 flex items-center justify-between text-sm print:text-xs print:block print:space-y-1">
              <div>
                <span className="font-semibold text-gray-700 print:text-black">
                  Duración Promedio:
                </span>{" "}
                <span className="text-gray-900 print:text-black">
                  {formatDuration(report.timePerformance.averageDuration)}
                </span>
              </div>
              {report.timePerformance.averageDelay > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 print:text-black">
                    Retraso Promedio:
                  </span>{" "}
                  <span className="text-red-700 print:text-black">
                    {formatDuration(report.timePerformance.averageDelay)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desempeño por Trabajador */}
      {report.workerStats.length > 0 && (
        <div className="mb-8 page-break">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Desempeño por Trabajador
          </h2>
          <p className="text-sm text-gray-600 mb-4 print:mb-2 italic">
            * Los costos se distribuyen proporcionalmente entre todos los trabajadores asignados a cada tarea.
          </p>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-gray-300 print:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-left text-sm font-bold text-gray-700">
                    Trabajador
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-center text-sm font-bold text-gray-700">
                    Tareas
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-center text-sm font-bold text-gray-700">
                    Subtareas
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-center text-sm font-bold text-gray-700">
                    Antes
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-center text-sm font-bold text-gray-700">
                    A Tiempo
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-center text-sm font-bold text-gray-700">
                    Tarde
                  </th>
                  <th className="border border-gray-300 px-4 py-3 print:px-2 print:py-2 text-right text-sm font-bold text-gray-700">
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.workerStats.map((worker, index) => (
                  <tr
                    key={worker.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900 print:text-xs">
                          {worker.name}
                        </p>
                        <p className="text-xs text-gray-600 print:hidden">{worker.email}</p>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-center text-sm font-semibold">
                      {worker.tasksCompleted}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-center text-sm">
                      {worker.subtasksCompleted}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-center text-sm text-green-700 font-medium">
                      {worker.early}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-center text-sm text-blue-700 font-medium">
                      {worker.onTime}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-center text-sm text-red-700 font-medium">
                      {worker.late}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 print:px-2 print:py-1 text-right text-sm font-semibold text-green-700">
                      ${worker.totalCost.toLocaleString("es-CL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Desglose por Categoría */}
      {report.categoryStats.length > 0 && (
        <div className="mb-8 page-break-avoid">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            Distribución por Categoría
          </h2>
          <div className="grid grid-cols-1 print:grid-cols-2 gap-4 print:gap-2">
            {report.categoryStats.map((cat) => (
              <div
                key={cat.category}
                className="bg-gray-50 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-gray-200 print:border-gray-300 page-break-avoid"
              >
                <div className="flex items-center justify-between mb-2 print:mb-1">
                  <p className="font-semibold text-gray-900 print:text-black">{cat.category}</p>
                  <span className="text-sm font-medium text-blue-600 print:text-black">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 print:text-black print:text-xs">
                  <span>{cat.count} tareas</span>
                  <span className="font-semibold text-green-700 print:text-black">
                    ${cat.totalCost.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 print:bg-white rounded-full h-2 print:hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle de Tareas Completadas */}
      <div className="mb-8 page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 print:mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-blue-600" />
          Detalle de Tareas Completadas ({report.tasks.length})
        </h2>
        <div className="space-y-3 print:space-y-2">
          {report.tasks.map((task, index) => (
            <div
              key={task.id}
              className="bg-gray-50 print:bg-white p-4 print:p-2 rounded-lg print:rounded-none border border-gray-200 print:border-gray-300 page-break-avoid print:text-sm"
            >
              <div className="flex items-start justify-between mb-2 print:mb-1">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 print:text-black mb-1">
                    {index + 1}. {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 print:text-black print:text-xs mb-2 print:mb-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <span className="ml-4 text-sm font-semibold text-green-700 print:text-black whitespace-nowrap">
                  ${task.totalCost.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 print:gap-2 text-xs text-gray-600 print:text-black">
                {task.category && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {task.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.actualEndDate!).toLocaleDateString("es-CL")}
                </span>
                {task.assignedTo.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {task.assignedTo.map((w) => w.name).join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pie de página */}
      <div className="mt-12 print:mt-6 pt-6 print:pt-3 border-t-2 border-gray-300 text-center text-sm print:text-xs text-gray-600 print:text-black">
        <p>
          Este informe fue generado automáticamente por el sistema de gestión
          del edificio.
        </p>
        <p className="mt-1">
          Para más información, contacte al administrador del edificio.
        </p>
      </div>
    </div>
  );
}
