import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard/workers
 * Obtiene información detallada de trabajadores con sus tareas activas
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener trabajadores con sus tareas
    const workers = await prisma.user.findMany({
      where: {
        parentId: userId,
        role: "WORKER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            scheduledStartDate: true,
            scheduledEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
            category: true,
            subtasks: {
              select: {
                id: true,
                isCompleted: true,
              },
            },
          },
          orderBy: {
            scheduledStartDate: "desc",
          },
        },
        completedSubtasks: {
          where: {
            isCompleted: true,
          },
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calcular today para stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Procesar datos de cada trabajador
    const workersWithStats = workers.map((worker: any) => {
      const tasks = worker.assignedTasks;

      // Tareas por estado
      const pending = tasks.filter((t: any) => t.status === "PENDING").length;
      const inProgress = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
      const completed = tasks.filter((t: any) => t.status === "COMPLETED").length;

      // Tareas completadas hoy
      const completedToday = tasks.filter((t: any) => {
        if (t.status === "COMPLETED" && t.actualEndDate) {
          const endDate = new Date(t.actualEndDate);
          return endDate >= today && endDate < tomorrow;
        }
        return false;
      }).length;

      // Tarea actual (primera en progreso o pendiente)
      const currentTask = tasks.find(
        (t: any) => t.status === "IN_PROGRESS" || t.status === "PENDING"
      );

      // Última actividad (última tarea completada)
      const lastActivity = tasks.find(
        (t: any) => t.status === "COMPLETED" && t.actualEndDate
      );

      // Subtareas completadas hoy
      const subtasksToday = worker.completedSubtasks.filter((st: any) => {
        if (st.completedAt) {
          const completedDate = new Date(st.completedAt);
          return completedDate >= today && completedDate < tomorrow;
        }
        return false;
      }).length;

      // Calcular progreso total de subtareas
      const totalSubtasks = tasks.reduce(
        (sum: any, task: any) => sum + task.subtasks.length,
        0
      );
      const completedSubtasks = tasks.reduce(
        (sum: any, task: any) => sum + task.subtasks.filter((st: any) => st.isCompleted).length,
        0
      );
      const subtaskProgress =
        totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

      // Tareas urgentes sin completar
      const urgentTasks = tasks.filter(
        (t: any) =>
          (t.status === "PENDING" || t.status === "IN_PROGRESS") &&
          t.priority === "URGENT"
      ).length;

      // Tareas atrasadas
      const now = new Date();
      const overdueTasks = tasks.filter((t: any) => {
        if (t.status === "PENDING" || t.status === "IN_PROGRESS") {
          const endDate = new Date(t.scheduledEndDate);
          return endDate < now;
        }
        return false;
      }).length;

      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        stats: {
          pending,
          inProgress,
          completed,
          completedToday,
          subtasksToday,
          subtaskProgress,
          urgentTasks,
          overdueTasks,
          total: tasks.length,
        },
        currentTask: currentTask
          ? {
              id: currentTask.id,
              title: currentTask.title,
              status: currentTask.status,
              priority: currentTask.priority,
              category: currentTask.category,
            }
          : null,
        lastActivity: lastActivity
          ? {
              date: lastActivity.actualEndDate,
              title: lastActivity.title,
            }
          : null,
      };
    });

    return NextResponse.json({
      workers: workersWithStats,
    });
  } catch (error) {
    console.error("Error al obtener datos de trabajadores:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de trabajadores" },
      { status: 500 }
    );
  }
}
