import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Función para calcular la siguiente fecha basándose en el patrón de recurrencia
function getNextOccurrence(
  currentDate: Date,
  pattern: "DAILY" | "WEEKLY" | "MONTHLY"
): Date {
  const nextDate = new Date(currentDate);

  switch (pattern) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  return nextDate;
}

// Función para calcular la duración de una tarea
function getTaskDuration(startDate: Date, endDate: Date): number {
  return endDate.getTime() - startDate.getTime();
}

// POST /api/tasks/generate-recurring - Generar instancias de tareas recurrentes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden generar tareas." },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar todas las tareas recurrentes
    const recurringTasks = await prisma.task.findMany({
      where: {
        isRecurring: true,
        createdById: session.user.id,
      },
      include: {
        assignedTo: true,
        subtasks: true,
        costs: true,
        generatedTasks: {
          orderBy: {
            scheduledStartDate: "desc",
          },
          take: 1,
        },
      },
    });

    const generatedTasks = [];

    for (const task of recurringTasks) {
      // Verificar si la recurrencia ha terminado
      if (task.recurrenceEndDate) {
        const endDate = new Date(task.recurrenceEndDate);
        endDate.setHours(0, 0, 0, 0);
        if (today > endDate) {
          continue; // Saltar esta tarea, la recurrencia ha terminado
        }
      }

      // Determinar la fecha de la última instancia
      let lastInstanceDate: Date;
      if (task.generatedTasks.length > 0) {
        lastInstanceDate = new Date(task.generatedTasks[0].scheduledStartDate);
      } else {
        lastInstanceDate = new Date(task.scheduledStartDate);
      }

      // Calcular la próxima fecha de ocurrencia
      const nextStartDate = getNextOccurrence(
        lastInstanceDate,
        task.recurrencePattern!
      );

      // Verificar si ya es tiempo de generar la siguiente instancia
      if (nextStartDate <= today) {
        // Verificar si no se excede la fecha de fin de recurrencia
        if (task.recurrenceEndDate) {
          const endDate = new Date(task.recurrenceEndDate);
          endDate.setHours(0, 0, 0, 0);
          if (nextStartDate > endDate) {
            continue; // No generar esta instancia
          }
        }

        // Calcular la duración de la tarea original
        const taskDuration = getTaskDuration(
          new Date(task.scheduledStartDate),
          new Date(task.scheduledEndDate)
        );

        const nextEndDate = new Date(nextStartDate.getTime() + taskDuration);

        // Generar la nueva instancia de la tarea
        const newTask = await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            scheduledStartDate: nextStartDate,
            scheduledEndDate: nextEndDate,
            createdById: task.createdById,
            parentTaskId: task.id,
            isRecurring: false, // Las instancias generadas no son recurrentes
            assignedTo: {
              connect: task.assignedTo.map((worker: { id: string }) => ({ id: worker.id })),
            },
            subtasks: {
              create: task.subtasks.map((st: { title: string; order: number }) => ({
                title: st.title,
                order: st.order,
              })),
            },
            costs: {
              create: task.costs.map((cost: any) => ({
                description: cost.description,
                amount: cost.amount,
                costType: cost.costType,
              })),
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
          },
        });

        // Crear notificaciones para cada trabajador asignado
        await Promise.all(
          task.assignedTo.map((worker: { id: string }) =>
            prisma.notification.create({
              data: {
                userId: worker.id,
                title: "Nueva tarea asignada (recurrente)",
                message: `Se te ha asignado la tarea recurrente: ${task.title}`,
                type: "TASK_ASSIGNED",
                relatedTaskId: newTask.id,
              },
            })
          )
        );

        generatedTasks.push(newTask);
      }
    }

    return NextResponse.json({
      message: `Se generaron ${generatedTasks.length} instancias de tareas recurrentes`,
      generatedCount: generatedTasks.length,
      tasks: generatedTasks,
    });
  } catch (error) {
    console.error("Error al generar tareas recurrentes:", error);
    return NextResponse.json(
      { error: "Error al generar tareas recurrentes" },
      { status: 500 }
    );
  }
}
