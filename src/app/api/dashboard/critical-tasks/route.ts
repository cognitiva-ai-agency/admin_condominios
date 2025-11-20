import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard/critical-tasks
 * Obtiene tareas críticas: urgentes, atrasadas, por vencer
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfToday = new Date(tomorrow);
    endOfToday.setMilliseconds(endOfToday.getMilliseconds() - 1);

    // Query todas las tareas activas del admin
    const tasks = await prisma.task.findMany({
      where: {
        createdById: userId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            isCompleted: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });

    // Clasificar tareas
    const urgentTasks: any[] = [];
    const overdueTasks: any[] = [];
    const dueTodayTasks: any[] = [];
    const unassignedUrgent: any[] = [];

    tasks.forEach((task) => {
      const endDate = new Date(task.scheduledEndDate);
      const isOverdue = endDate < now;
      const isDueToday = endDate >= today && endDate <= endOfToday;
      const isUrgent = task.priority === "URGENT" || task.priority === "HIGH";
      const isUnassigned = task.assignedTo.length === 0;

      const taskData = {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        category: task.category,
        scheduledEndDate: task.scheduledEndDate,
        assignedTo: task.assignedTo,
        subtasksCompleted: task.subtasks.filter((st) => st.isCompleted).length,
        subtasksTotal: task.subtasks.length,
        progress:
          task.subtasks.length > 0
            ? Math.round(
                (task.subtasks.filter((st) => st.isCompleted).length /
                  task.subtasks.length) *
                  100
              )
            : 0,
      };

      // Tareas sin asignar y urgentes
      if (isUnassigned && isUrgent) {
        unassignedUrgent.push(taskData);
      }

      // Tareas atrasadas
      if (isOverdue) {
        overdueTasks.push(taskData);
      }

      // Tareas que vencen hoy
      if (isDueToday && !isOverdue) {
        dueTodayTasks.push(taskData);
      }

      // Todas las tareas urgentes/altas
      if (isUrgent) {
        urgentTasks.push(taskData);
      }
    });

    // Calcular resumen por prioridad
    const priorityBreakdown = {
      URGENT: tasks.filter((t) => t.priority === "URGENT").length,
      HIGH: tasks.filter((t) => t.priority === "HIGH").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
      LOW: tasks.filter((t) => t.priority === "LOW").length,
    };

    // Calcular resumen por categoría (si existe)
    const categoryBreakdown: Record<string, number> = {};
    tasks.forEach((task) => {
      if (task.category) {
        categoryBreakdown[task.category] =
          (categoryBreakdown[task.category] || 0) + 1;
      }
    });

    return NextResponse.json({
      urgentTasks: urgentTasks.slice(0, 10), // Top 10
      overdueTasks: overdueTasks.slice(0, 10), // Top 10
      dueTodayTasks: dueTodayTasks.slice(0, 10), // Top 10
      unassignedUrgent: unassignedUrgent.slice(0, 5), // Top 5
      summary: {
        totalUrgent: urgentTasks.length,
        totalOverdue: overdueTasks.length,
        totalDueToday: dueTodayTasks.length,
        totalUnassignedUrgent: unassignedUrgent.length,
        priorityBreakdown,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error al obtener tareas críticas:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas críticas" },
      { status: 500 }
    );
  }
}
