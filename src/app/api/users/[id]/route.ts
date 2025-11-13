import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  email: z.string().email("Email inválido").optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users/[id] - Obtener trabajador específico
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

    const worker = await prisma.user.findFirst({
      where: {
        id,
        parentId: session.user.id,
        role: "WORKER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ worker });
  } catch (error) {
    console.error("Error al obtener trabajador:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajador" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar trabajador
export async function PUT(
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
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Verificar que el trabajador pertenezca al admin
    const existingWorker = await prisma.user.findFirst({
      where: {
        id,
        parentId: session.user.id,
        role: "WORKER",
      },
    });

    if (!existingWorker) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    // Si se cambió el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingWorker.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "El email ya está en uso" },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.password) {
      updateData.password = await hash(validatedData.password, 12);
    }

    const updatedWorker = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Trabajador actualizado exitosamente",
      worker: updatedWorker,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar trabajador:", error);
    return NextResponse.json(
      { error: "Error al actualizar trabajador" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar trabajador
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

    // Verificar que el trabajador pertenezca al admin
    const existingWorker = await prisma.user.findFirst({
      where: {
        id,
        parentId: session.user.id,
        role: "WORKER",
      },
    });

    if (!existingWorker) {
      return NextResponse.json(
        { error: "Trabajador no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Trabajador eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar trabajador:", error);
    return NextResponse.json(
      { error: "Error al eliminar trabajador" },
      { status: 500 }
    );
  }
}
