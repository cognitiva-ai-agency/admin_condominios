import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks - Listar tareas (del admin o asignadas al trabajador)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    // Paginación
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // Límite por defecto 50
    const skip = (page - 1) * Math.min(limit, 100); // Máximo 100 por página
    const take = Math.min(limit, 100);

    // Flag para obtener todas las tareas (backward compatibility)
    const all = searchParams.get("all") === "true";

    // Construir filtro según el rol del usuario
    const where: any = {};

    if (session.user.role === "ADMIN") {
      // Admin: ver solo sus tareas creadas
      where.createdById = session.user.id;
    } else if (session.user.role === "WORKER") {
      // Worker: ver solo las tareas asignadas a él
      where.assignedTo = {
        some: {
          id: session.user.id,
        },
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Obtener total de tareas para paginación
    const total = await prisma.task.count({ where });

    // OPTIMIZACIÓN: Reducir las relaciones cargadas
    const tasks = await prisma.task.findMany({
      where,
      ...(all ? {} : { skip, take }), // Solo paginar si no se solicita "all"
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        scheduledStartDate: true,
        scheduledEndDate: true,
        actualStartDate: true,
        actualEndDate: true,
        createdAt: true,
        updatedAt: true,
        // Relaciones optimizadas
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Incluir subtasks con completedBy para RecentActivity
        subtasks: {
          select: {
            id: true,
            title: true,
            order: true,
            isCompleted: true,
            completedAt: true,
            completedById: true,
            // IMPORTANTE: Incluir completedBy para mostrar en RecentActivity
            completedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        // Agregados para evitar joins
        _count: {
          select: {
            subtasks: true,
            costs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // OPTIMIZACIÓN: Obtener costs solo si es necesario (menos queries)
    const taskIds = tasks.map((t) => t.id);
    const costs = taskIds.length > 0
      ? await prisma.taskCost.groupBy({
          by: ["taskId"],
          where: {
            taskId: {
              in: taskIds,
            },
          },
          _sum: {
            amount: true,
          },
        })
      : [];

    const costsMap = new Map(
      costs.map((c) => [c.taskId, Number(c._sum.amount || 0)])
    );

    // Calcular totales optimizado
    const tasksWithTotals = tasks.map((task: any) => ({
      ...task,
      totalCost: costsMap.get(task.id) || 0,
      completedSubtasks: task.subtasks.filter((st: { isCompleted: boolean }) => st.isCompleted).length,
      totalSubtasks: task.subtasks.length,
      costs: [], // No devolver costs detallados en lista, solo en detalle
    }));

    return NextResponse.json({
      tasks: tasksWithTotals,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}
