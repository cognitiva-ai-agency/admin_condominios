import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateCheckInStreak, checkEarlyCheckIn } from "@/utils/gamification";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Verificar si ya existe un registro para hoy
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return NextResponse.json(
        { error: "Ya registraste tu entrada hoy" },
        { status: 400 }
      );
    }

    // Determinar el estado (PRESENT, LATE, etc.)
    const checkInHour = now.getHours();
    const checkInMinutes = now.getMinutes();
    const totalMinutes = checkInHour * 60 + checkInMinutes;

    // Consideramos tarde después de las 9:00 AM (540 minutos)
    const status = totalMinutes > 540 ? "LATE" : "PRESENT";

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      update: {
        checkIn: now,
        status,
      },
      create: {
        userId: session.user.id,
        date: today,
        checkIn: now,
        status,
      },
    });

    // Actualizar streak y otorgar puntos de gamificación
    try {
      await updateCheckInStreak(session.user.id, now);
      await checkEarlyCheckIn(session.user.id, now);
    } catch (gamificationError) {
      console.error("Error al actualizar gamificación:", gamificationError);
      // No bloquear el check-in si falla la gamificación
    }

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error al registrar entrada:", error);
    return NextResponse.json(
      { error: "Error al registrar entrada" },
      { status: 500 }
    );
  }
}
