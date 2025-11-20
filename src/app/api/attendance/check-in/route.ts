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

    // NUEVO: Verificar si ya existe un registro ACTIVO (con checkIn pero sin checkOut)
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: today,
        checkIn: { not: null },
        checkOut: null, // Sin checkout = sesión activa
      },
    });

    if (activeAttendance) {
      return NextResponse.json(
        { error: "Ya tienes una sesión activa. Debes registrar tu salida primero." },
        { status: 400 }
      );
    }

    // Determinar el estado (PRESENT, LATE, etc.)
    const checkInHour = now.getHours();
    const checkInMinutes = now.getMinutes();
    const totalMinutes = checkInHour * 60 + checkInMinutes;

    // Consideramos tarde después de las 9:00 AM (540 minutos)
    const status = totalMinutes > 540 ? "LATE" : "PRESENT";

    // NUEVO: Siempre crear un nuevo registro (permite múltiples entradas/salidas por día)
    const attendance = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        date: today,
        checkIn: now,
        status,
      },
    });

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    console.error("Error al registrar entrada:", error);

    // Intentar proporcionar un mensaje de error más específico
    const errorMessage = error instanceof Error
      ? error.message
      : "Error al registrar entrada";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
