import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  calculateTimeStats,
  calculateEfficiencyRate,
  getTaskTimeStatus,
  getTaskActualDuration,
} from "@/utils/timeUtils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year"); // 2024, 2025, etc.

    if (!month || !year) {
      return NextResponse.json(
        { error: "Debe proporcionar mes y año" },
        { status: 400 }
      );
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Calcular fechas de inicio y fin del mes
    const startDate = new Date(yearNum, monthNum - 1, 1); // Primer día del mes
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Último día del mes

    // Obtener todas las tareas completadas en el período
    const tasks = await prisma.task.findMany({
      where: {
        status: "COMPLETED",
        actualEndDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
            completedAt: true,
            completedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        costs: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        actualEndDate: "asc",
      },
    });

    // Mapear tareas al formato esperado
    const formattedTasks = tasks.map((task: any) => {
      // Calcular costo total de la tarea
      const totalCost = task.costs?.reduce((sum: any, cost: any) => sum + Number(cost.amount), 0) || 0;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        scheduledStartDate: task.scheduledStartDate.toISOString(),
        scheduledEndDate: task.scheduledEndDate.toISOString(),
        actualStartDate: task.actualStartDate?.toISOString() || null,
        actualEndDate: task.actualEndDate?.toISOString() || null,
        totalCost: totalCost,
        costs: task.costs || [],
        completedSubtasks: task.subtasks.filter((st: any) => st.isCompleted).length,
        totalSubtasks: task.subtasks.length,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
        subtasks: task.subtasks.map((st: any) => ({
          id: st.id,
          title: st.title,
          isCompleted: st.isCompleted,
          completedAt: st.completedAt?.toISOString() || null,
          completedBy: st.completedBy,
        })),
      };
    });

    // Calcular estadísticas globales
    const timeStats = calculateTimeStats(formattedTasks);
    const efficiencyRate = calculateEfficiencyRate(formattedTasks);
    const totalCost = formattedTasks.reduce((sum: any, t: any) => sum + t.totalCost, 0);

    // Desglose por trabajador
    const workerStatsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        tasksCompleted: number;
        totalCost: number;
        onTime: number;
        early: number;
        late: number;
        subtasksCompleted: number;
      }
    >();

    formattedTasks.forEach((task: any) => {
      // CORRECCIÓN: Dividir el costo de la tarea entre todos los trabajadores asignados
      // Esto evita duplicación cuando una tarea tiene múltiples trabajadores
      const costPerWorker = task.assignedTo.length > 0
        ? task.totalCost / task.assignedTo.length
        : task.totalCost;

      task.assignedTo.forEach((worker: any) => {
        if (!workerStatsMap.has(worker.id)) {
          workerStatsMap.set(worker.id, {
            id: worker.id,
            name: worker.name,
            email: worker.email,
            tasksCompleted: 0,
            totalCost: 0,
            onTime: 0,
            early: 0,
            late: 0,
            subtasksCompleted: 0,
          });
        }

        const stats = workerStatsMap.get(worker.id)!;
        stats.tasksCompleted += 1;
        stats.totalCost += costPerWorker; // Suma proporcional del costo

        // Calcular tiempo
        const timeStatus = getTaskTimeStatus(task);
        if (timeStatus === "on-time") stats.onTime += 1;
        else if (timeStatus === "early") stats.early += 1;
        else if (timeStatus === "late") stats.late += 1;

        // Contar subtareas completadas por este trabajador
        const workerSubtasks = task.subtasks.filter(
          (st: any) => st.completedBy?.id === worker.id
        );
        stats.subtasksCompleted += workerSubtasks.length;
      });
    });

    const workerStats = Array.from(workerStatsMap.values()).sort(
      (a, b) => b.tasksCompleted - a.tasksCompleted
    );

    // Desglose por categoría
    const categoryStatsMap = new Map<
      string,
      {
        category: string;
        count: number;
        totalCost: number;
        percentage: number;
      }
    >();

    formattedTasks.forEach((task: any) => {
      const category = task.category || "Sin categoría";
      if (!categoryStatsMap.has(category)) {
        categoryStatsMap.set(category, {
          category,
          count: 0,
          totalCost: 0,
          percentage: 0,
        });
      }

      const stats = categoryStatsMap.get(category)!;
      stats.count += 1;
      stats.totalCost += task.totalCost;
    });

    // Calcular porcentajes
    const totalTasks = formattedTasks.length;
    categoryStatsMap.forEach((stats: any) => {
      stats.percentage = totalTasks > 0 ? (stats.count / totalTasks) * 100 : 0;
    });

    const categoryStats = Array.from(categoryStatsMap.values()).sort(
      (a, b) => b.count - a.count
    );

    // Construir respuesta del informe
    const report = {
      period: {
        month: monthNum,
        year: yearNum,
        monthName: new Date(yearNum, monthNum - 1).toLocaleString("es-CL", {
          month: "long",
        }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalTasks: totalTasks,
        totalCost: totalCost,
        efficiencyRate: efficiencyRate,
        totalWorkers: workerStats.length,
        totalCategories: categoryStats.length,
      },
      timePerformance: {
        onTime: timeStats.onTime,
        early: timeStats.early,
        late: timeStats.late,
        averageDuration: timeStats.averageDuration,
        averageDelay: timeStats.averageDelay,
      },
      workerStats: workerStats,
      categoryStats: categoryStats,
      tasks: formattedTasks,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("Error al generar informe mensual:", error);
    return NextResponse.json(
      { error: "Error al generar el informe" },
      { status: 500 }
    );
  }
}
