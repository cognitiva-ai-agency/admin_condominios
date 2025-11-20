import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/users/[id]/tasks - Obtener todas las tareas asignadas a un trabajador
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el trabajador pertenezca al admin
    const worker = await prisma.user.findFirst({
      where: {
        id,
        parentId: session.user.id,
        role: "WORKER",
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todas las tareas asignadas a este trabajador
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: {
          some: {
            id,
          },
        },
        createdById: session.user.id, // Solo tareas creadas por el admin
      },
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
          select: {
            id: true,
            title: true,
            isCompleted: true,
            completedAt: true,
            order: true,
          },
        },
        costs: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        scheduledStartDate: "desc",
      },
    });

    // Calcular estadísticas para cada tarea
    const tasksWithStats = tasks.map((task) => {
      const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
      const totalCost = task.costs?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
      const progress =
        task.subtasks.length > 0
          ? Math.round((completedSubtasks / task.subtasks.length) * 100)
          : 0;

      return {
        ...task,
        completedSubtasks,
        totalCost,
        progress,
      };
    });

    return NextResponse.json({
      tasks: tasksWithStats,
    });
  } catch (error) {
    console.error("Error al obtener tareas del trabajador:", error);
    return NextResponse.json(
      { error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}
