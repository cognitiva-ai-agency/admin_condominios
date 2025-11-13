import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z.string().optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  assignedWorkerIds: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().optional().nullable(),
  subtasks: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
        order: z.number(),
      })
    )
    .optional(),
  costs: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().min(1),
        amount: z.number(),
        costType: z.enum(["MATERIALS", "LABOR", "OTHER"]),
      })
    )
    .optional(),
});

// GET /api/tasks/[id] - Obtener tarea específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          {
            assignedTo: {
              some: {
                id: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
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
          include: {
            completedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        costs: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const totalCost = task.costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;

    return NextResponse.json({
      task: {
        ...task,
        totalCost,
        completedSubtasks,
        progress: task.subtasks.length > 0
          ? Math.round((completedSubtasks / task.subtasks.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    return NextResponse.json(
      { error: "Error al obtener tarea" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Actualizar tarea
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Verificar que la tarea existe y el usuario tiene acceso
    let existingTask;

    if (session.user.role === "ADMIN") {
      // Admin: puede actualizar sus propias tareas
      existingTask = await prisma.task.findFirst({
        where: {
          id,
          createdById: session.user.id,
        },
      });
    } else if (session.user.role === "WORKER") {
      // Worker: puede actualizar solo el status de tareas asignadas a él
      existingTask = await prisma.task.findFirst({
        where: {
          id,
          assignedTo: {
            some: {
              id: session.user.id,
            },
          },
        },
      });

      // Workers solo pueden cambiar el status, no otros campos
      const allowedFields = ["status"];
      const providedFields = Object.keys(validatedData);
      const invalidFields = providedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: "Los trabajadores solo pueden actualizar el estado de la tarea" },
          { status: 403 }
        );
      }
    }

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.category !== undefined)
      updateData.category = validatedData.category;
    if (validatedData.scheduledStartDate)
      updateData.scheduledStartDate = new Date(validatedData.scheduledStartDate);
    if (validatedData.scheduledEndDate)
      updateData.scheduledEndDate = new Date(validatedData.scheduledEndDate);

    // Actualizar campos de recurrencia
    if (validatedData.isRecurring !== undefined) {
      updateData.isRecurring = validatedData.isRecurring;
      if (validatedData.isRecurring) {
        if (validatedData.recurrencePattern)
          updateData.recurrencePattern = validatedData.recurrencePattern;
        if (validatedData.recurrenceEndDate !== undefined) {
          updateData.recurrenceEndDate = validatedData.recurrenceEndDate
            ? new Date(validatedData.recurrenceEndDate)
            : null;
        }
      } else {
        // Si se desactiva la recurrencia, limpiar los campos
        updateData.recurrencePattern = null;
        updateData.recurrenceEndDate = null;
      }
    }

    // Si se cambió el status a completado, registrar fecha
    if (validatedData.status === "COMPLETED" && existingTask.status !== "COMPLETED") {
      updateData.actualEndDate = new Date();
    }

    // Si se cambió el status a en progreso, registrar fecha de inicio
    if (validatedData.status === "IN_PROGRESS" && existingTask.status === "PENDING") {
      updateData.actualStartDate = new Date();
    }

    // Actualizar trabajadores asignados si se proporcionaron
    if (validatedData.assignedWorkerIds) {
      updateData.assignedTo = {
        set: [], // Limpiar asignaciones anteriores
        connect: validatedData.assignedWorkerIds.map((id) => ({ id })),
      };
    }

    // Actualizar subtareas solo si es ADMIN y se proporcionaron
    if (session.user.role === "ADMIN" && validatedData.subtasks) {
      // Obtener IDs de subtareas actuales
      const currentSubtasks = await prisma.subtask.findMany({
        where: { taskId: id },
        select: { id: true },
      });
      const currentIds = currentSubtasks.map((st) => st.id);
      const newIds = validatedData.subtasks
        .filter((st) => st.id)
        .map((st) => st.id!);

      // Eliminar subtareas que ya no están en la lista
      const idsToDelete = currentIds.filter((id) => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await prisma.subtask.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // Actualizar o crear subtareas
      for (const subtask of validatedData.subtasks) {
        if (subtask.id) {
          // Actualizar existente
          await prisma.subtask.update({
            where: { id: subtask.id },
            data: {
              title: subtask.title,
              order: subtask.order,
            },
          });
        } else {
          // Crear nueva
          await prisma.subtask.create({
            data: {
              title: subtask.title,
              order: subtask.order,
              taskId: id,
            },
          });
        }
      }
    }

    // Actualizar costos solo si es ADMIN y se proporcionaron
    if (session.user.role === "ADMIN" && validatedData.costs) {
      // Obtener IDs de costos actuales
      const currentCosts = await prisma.taskCost.findMany({
        where: { taskId: id },
        select: { id: true },
      });
      const currentIds = currentCosts.map((c) => c.id);
      const newIds = validatedData.costs
        .filter((c) => c.id)
        .map((c) => c.id!);

      // Eliminar costos que ya no están en la lista
      const idsToDelete = currentIds.filter((id) => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await prisma.taskCost.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      // Actualizar o crear costos
      for (const cost of validatedData.costs) {
        if (cost.id) {
          // Actualizar existente
          await prisma.taskCost.update({
            where: { id: cost.id },
            data: {
              description: cost.description,
              amount: cost.amount,
              costType: cost.costType, // Cambio: type -> costType
            },
          });
        } else {
          // Crear nuevo
          await prisma.taskCost.create({
            data: {
              description: cost.description,
              amount: cost.amount,
              costType: cost.costType, // Cambio: type -> costType
              taskId: id,
            },
          });
        }
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subtasks: true,
        costs: true,
      },
    });

    return NextResponse.json({
      message: "Tarea actualizada exitosamente",
      task: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar tarea:", error);
    return NextResponse.json(
      { error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Eliminar tarea
export async function DELETE(
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

    // Verificar que la tarea pertenezca al admin
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Tarea eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { error: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
