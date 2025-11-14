import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  birthDate: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo el admin puede actualizar perfiles de otros o el usuario su propio perfil
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error },
        { status: 400 }
      );
    }

    const data: any = {};

    if (validation.data.phoneNumber !== undefined) {
      data.phoneNumber = validation.data.phoneNumber;
    }
    if (validation.data.address !== undefined) {
      data.address = validation.data.address;
    }
    if (validation.data.emergencyContact !== undefined) {
      data.emergencyContact = validation.data.emergencyContact;
    }
    if (validation.data.emergencyPhone !== undefined) {
      data.emergencyPhone = validation.data.emergencyPhone;
    }
    if (validation.data.jobTitle !== undefined) {
      data.jobTitle = validation.data.jobTitle;
    }
    if (validation.data.department !== undefined) {
      data.department = validation.data.department;
    }
    if (validation.data.birthDate !== undefined && validation.data.birthDate) {
      data.birthDate = new Date(validation.data.birthDate);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneNumber: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        jobTitle: true,
        department: true,
        hireDate: true,
        birthDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
