import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createWorkerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden crear trabajadores." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createWorkerSchema.parse(body);

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hash(validatedData.password, 12);

    // Crear trabajador asignado al admin en sesión
    const worker = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: "WORKER",
        parentId: session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Crear notificación para el trabajador
    await prisma.notification.create({
      data: {
        userId: worker.id,
        title: "Bienvenido al sistema",
        message: `Hola ${worker.name}, tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión con tu email y contraseña.`,
        type: "SYSTEM",
      },
    });

    return NextResponse.json(
      {
        message: "Trabajador creado exitosamente",
        worker,
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

    console.error("Error al crear trabajador:", error);
    return NextResponse.json(
      { error: "Error al crear trabajador" },
      { status: 500 }
    );
  }
}
