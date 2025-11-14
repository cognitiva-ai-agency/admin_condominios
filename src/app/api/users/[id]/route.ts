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
  rut: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
});

// GET /api/users/[id] - Obtener usuario específico
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

    // Los trabajadores solo pueden ver su propio perfil
    // Los admins pueden ver sus trabajadores o su propio perfil
    let whereClause: any = { id };

    if (session.user.role === "WORKER") {
      // Los trabajadores solo pueden ver su propio perfil
      if (id !== session.user.id) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "ADMIN") {
      // Los admins pueden ver su perfil o el de sus trabajadores
      if (id !== session.user.id) {
        whereClause = {
          id,
          parentId: session.user.id,
          role: "WORKER",
        };
      }
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        rut: true,
        phoneNumber: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        jobTitle: true,
        department: true,
        hireDate: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      {
        error: "Error al obtener usuario",
        details: error?.message || "Error desconocido"
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar usuario
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
    const validatedData = updateUserSchema.parse(body);

    // Verificar permisos
    let existingUser;

    if (session.user.role === "WORKER") {
      // Los trabajadores solo pueden actualizar su propio perfil
      if (id !== session.user.id) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }

      existingUser = await prisma.user.findUnique({
        where: { id },
      });

      // Los trabajadores no pueden cambiar su estado isActive
      if (validatedData.isActive !== undefined) {
        return NextResponse.json(
          { error: "No tienes permiso para cambiar el estado de tu cuenta" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "ADMIN") {
      // Los admins pueden actualizar su perfil o el de sus trabajadores
      if (id === session.user.id) {
        existingUser = await prisma.user.findUnique({
          where: { id },
        });
      } else {
        existingUser = await prisma.user.findFirst({
          where: {
            id,
            parentId: session.user.id,
            role: "WORKER",
          },
        });
      }
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si se cambió el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingUser.email) {
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

    // Campos de perfil personal
    if (validatedData.rut !== undefined) updateData.rut = validatedData.rut;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact;
    if (validatedData.emergencyPhone !== undefined) updateData.emergencyPhone = validatedData.emergencyPhone;
    if (validatedData.jobTitle !== undefined) updateData.jobTitle = validatedData.jobTitle;
    if (validatedData.department !== undefined) updateData.department = validatedData.department;
    if (validatedData.hireDate !== undefined) {
      updateData.hireDate = validatedData.hireDate ? new Date(validatedData.hireDate as any) : null;
    }
    if (validatedData.birthDate !== undefined) {
      updateData.birthDate = validatedData.birthDate ? new Date(validatedData.birthDate as any) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        rut: true,
        phoneNumber: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        jobTitle: true,
        department: true,
        hireDate: true,
        birthDate: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Usuario actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar usuario",
        details: error?.message || "Error desconocido"
      },
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
