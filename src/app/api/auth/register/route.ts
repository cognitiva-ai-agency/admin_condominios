import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  role: z.enum(["ADMIN", "WORKER"]),
  parentId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

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

    // Si es un worker, verificar que tenga parentId
    if (validatedData.role === "WORKER" && !validatedData.parentId) {
      return NextResponse.json(
        { error: "Los trabajadores deben tener un administrador asignado" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hash(validatedData.password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        parentId: validatedData.parentId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        parentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user,
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

    console.error("Error al registrar usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
