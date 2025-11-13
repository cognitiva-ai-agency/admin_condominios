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

    const tasks = await prisma.task.findMany({
      where,
      include: {
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
        subtasks: {
          orderBy: {
            order: "asc",
          },
        },
        costs: true,
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular totales
    const tasksWithTotals = tasks.map((task) => ({
      ...task,
      totalCost: task.costs.reduce((sum, cost) => sum + Number(cost.amount), 0),
      completedSubtasks: task.subtasks.filter((st) => st.isCompleted).length,
      totalSubtasks: task.subtasks.length,
    }));

    return NextResponse.json({
      tasks: tasksWithTotals,
      total: tasks.length,
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}
