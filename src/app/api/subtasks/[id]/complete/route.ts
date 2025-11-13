import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const completeSubtaskSchema = z.object({
  reportBefore: z.string().optional(),
  reportAfter: z.string().min(1, "El reporte final es requerido"),
  photosBefore: z.array(z.string()).optional(),
  photosAfter: z.array(z.string()).optional(),
});

export async function POST(
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
    const validatedData = completeSubtaskSchema.parse(body);

    // Verificar que la subtarea existe y que el usuario está asignado a la tarea padre
    const subtask = await prisma.subtask.findFirst({
      where: {
        id,
        task: {
          assignedTo: {
            some: {
              id: session.user.id,
            },
          },
        },
      },
      include: {
        task: {
          include: {
            assignedTo: true,
            createdBy: true,
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json(
        { error: "Subtarea no encontrada o no tienes permiso" },
        { status: 404 }
      );
    }

    if (subtask.isCompleted) {
      return NextResponse.json(
        { error: "La subtarea ya está completada" },
        { status: 400 }
      );
    }

    // Completar subtarea
    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: {
        isCompleted: true,
        completedById: session.user.id,
        completedAt: new Date(),
        reportBefore: validatedData.reportBefore,
        reportAfter: validatedData.reportAfter,
        photosBefore: validatedData.photosBefore || [],
        photosAfter: validatedData.photosAfter || [],
      },
    });

    // Verificar si todas las subtareas están completadas
    const allSubtasks = await prisma.subtask.findMany({
      where: {
        taskId: subtask.taskId,
      },
    });

    const allCompleted = allSubtasks.every((st) => st.isCompleted || st.id === id);

    // Si todas las subtareas están completadas, actualizar estado de la tarea
    if (allCompleted) {
      await prisma.task.update({
        where: { id: subtask.taskId },
        data: {
          status: "COMPLETED",
          actualEndDate: new Date(),
        },
      });

      // Crear notificación para el admin
      await prisma.notification.create({
        data: {
          userId: subtask.task.createdById,
          title: "Tarea completada",
          message: `La tarea "${subtask.task.title}" ha sido completada por ${session.user.name}`,
          type: "TASK_COMPLETED",
          relatedTaskId: subtask.taskId,
        },
      });
    } else {
      // Si no todas están completadas, pero esta es la primera, cambiar a IN_PROGRESS
      const completedCount = allSubtasks.filter((st) => st.isCompleted).length;
      if (completedCount === 0 && subtask.task.status === "PENDING") {
        await prisma.task.update({
          where: { id: subtask.taskId },
          data: {
            status: "IN_PROGRESS",
            actualStartDate: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      message: "Subtarea completada exitosamente",
      subtask: updatedSubtask,
      taskCompleted: allCompleted,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al completar subtarea:", error);
    return NextResponse.json(
      { error: "Error al completar subtarea" },
      { status: 500 }
    );
  }
}
