import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 * Endpoint optimizado para obtener estadísticas del dashboard
 * Evita cargar todas las tareas y workers, solo usa agregaciones
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const userId = session.user.id;

    if (isAdmin) {
      // Dashboard de ADMIN - Estadísticas optimizadas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Ejecutar queries en paralelo para mejor performance
      const [
        totalWorkers,
        tasksByStatus,
        completedToday,
        timeStats,
      ] = await Promise.all([
        // 1. Total de trabajadores
        prisma.user.count({
          where: {
            parentId: userId,
            role: "WORKER",
          },
        }),

        // 2. Tareas por estado (solo conteos)
        prisma.task.groupBy({
          by: ["status"],
          where: {
            createdById: userId,
          },
          _count: {
            id: true,
          },
        }),

        // 3. Tareas completadas hoy
        prisma.task.count({
          where: {
            createdById: userId,
            status: "COMPLETED",
            actualEndDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),

        // 4. Estadísticas de tiempo (solo tareas completadas recientes)
        prisma.task.findMany({
          where: {
            createdById: userId,
            status: "COMPLETED",
            actualEndDate: {
              not: null,
            },
          },
          select: {
            scheduledEndDate: true,
            actualEndDate: true,
          },
          take: 100, // Solo últimas 100 para cálculo de eficiencia
          orderBy: {
            actualEndDate: "desc",
          },
        }),
      ]);

      // Calcular conteos por estado
      const statusCounts = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      };

      tasksByStatus.forEach((group: any) => {
        if (group.status in statusCounts) {
          statusCounts[group.status as keyof typeof statusCounts] = group._count.id;
        }
      });

      // Calcular estadísticas de tiempo
      let onTimeCount = 0;
      let earlyCount = 0;
      let lateCount = 0;

      timeStats.forEach((task) => {
        if (task.actualEndDate && task.scheduledEndDate) {
          const scheduled = new Date(task.scheduledEndDate).getTime();
          const actual = new Date(task.actualEndDate).getTime();

          if (actual < scheduled) {
            earlyCount++;
          } else if (actual <= scheduled + 86400000) {
            // Dentro del día
            onTimeCount++;
          } else {
            lateCount++;
          }
        }
      });

      const totalTimed = onTimeCount + earlyCount + lateCount;
      const efficiencyRate =
        totalTimed > 0
          ? Math.round(((onTimeCount + earlyCount) / totalTimed) * 100)
          : 100;

      return NextResponse.json({
        stats: {
          totalWorkers,
          activeTasks: statusCounts.PENDING + statusCounts.IN_PROGRESS,
          completedToday,
          pendingNotifications: 0, // Placeholder
          efficiencyRate,
          onTimeCount,
          earlyCount,
          lateCount,
          tasksByStatus: statusCounts,
        },
      });
    } else {
      // Dashboard de WORKER - Estadísticas optimizadas
      const tasksByStatus = await prisma.task.groupBy({
        by: ["status"],
        where: {
          assignedTo: {
            some: {
              id: userId,
            },
          },
        },
        _count: {
          id: true,
        },
      });

      const statusCounts = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
      };

      tasksByStatus.forEach((group: any) => {
        if (group.status in statusCounts) {
          statusCounts[group.status as keyof typeof statusCounts] = group._count.id;
        }
      });

      return NextResponse.json({
        stats: {
          total: statusCounts.PENDING + statusCounts.IN_PROGRESS + statusCounts.COMPLETED,
          pending: statusCounts.PENDING,
          inProgress: statusCounts.IN_PROGRESS,
          completed: statusCounts.COMPLETED,
          tasksByStatus: statusCounts,
        },
      });
    }
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
