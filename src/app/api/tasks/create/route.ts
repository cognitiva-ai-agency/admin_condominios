import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const subtaskSchema = z.object({
  title: z.string().min(1, "El título de la subtarea es requerido"),
  order: z.number(),
});

const costSchema = z.object({
  description: z.string().min(1, "La descripción del costo es requerida"),
  amount: z.number().positive("El monto debe ser positivo"),
  costType: z.enum(["MATERIALS", "LABOR", "OTHER"]),
});

const createTaskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  category: z.string().optional(),
  scheduledStartDate: z.string(),
  scheduledEndDate: z.string(),
  assignedWorkerIds: z.array(z.string()).min(1, "Debe asignar al menos un trabajador"),
  subtasks: z.array(subtaskSchema),
  costs: z.array(costSchema).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden crear tareas." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // Verificar que todos los trabajadores pertenezcan al admin
    const workers = await prisma.user.findMany({
      where: {
        id: { in: validatedData.assignedWorkerIds },
        parentId: session.user.id,
        role: "WORKER",
      },
    });

    if (workers.length !== validatedData.assignedWorkerIds.length) {
      return NextResponse.json(
        { error: "Algunos trabajadores no son válidos" },
        { status: 400 }
      );
    }

    // Crear tarea con subtareas y costos
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        category: validatedData.category,
        scheduledStartDate: new Date(validatedData.scheduledStartDate),
        scheduledEndDate: new Date(validatedData.scheduledEndDate),
        createdById: session.user.id,
        isRecurring: validatedData.isRecurring || false,
        recurrencePattern: validatedData.isRecurring ? validatedData.recurrencePattern : null,
        recurrenceEndDate: validatedData.recurrenceEndDate ? new Date(validatedData.recurrenceEndDate) : null,
        assignedTo: {
          connect: validatedData.assignedWorkerIds.map((id) => ({ id })),
        },
        subtasks: {
          create: validatedData.subtasks.map((st) => ({
            title: st.title,
            order: st.order,
          })),
        },
        costs: validatedData.costs
          ? {
              create: validatedData.costs.map((cost) => ({
                description: cost.description,
                amount: cost.amount,
                costType: cost.costType,
              })),
            }
          : undefined,
      },
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

    // Crear notificaciones para cada trabajador asignado
    await Promise.all(
      validatedData.assignedWorkerIds.map((workerId) =>
        prisma.notification.create({
          data: {
            userId: workerId,
            title: "Nueva tarea asignada",
            message: `Se te ha asignado la tarea: ${validatedData.title}`,
            type: "TASK_ASSIGNED",
            relatedTaskId: task.id,
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: "Tarea creada exitosamente",
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { error: "Error al crear tarea" },
      { status: 500 }
    );
  }
}
