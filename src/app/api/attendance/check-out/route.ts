import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Verificar que existe entrada registrada
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Debes registrar tu entrada primero" },
        { status: 400 }
      );
    }

    if (!existing.checkIn) {
      return NextResponse.json(
        { error: "Debes registrar tu entrada primero" },
        { status: 400 }
      );
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { error: "Ya registraste tu salida hoy" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      data: {
        checkOut: now,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error al registrar salida:", error);
    return NextResponse.json(
      { error: "Error al registrar salida" },
      { status: 500 }
    );
  }
}
