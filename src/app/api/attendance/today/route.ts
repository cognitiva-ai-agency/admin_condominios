import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // NUEVO: Buscar el registro "activo" (con checkIn pero sin checkOut)
    // o el más reciente del día si todos están completos
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: today,
        checkIn: { not: null },
        checkOut: null, // Buscar registro activo (sin checkout)
      },
      orderBy: {
        checkIn: "desc", // El más reciente primero
      },
    });

    // Si hay un registro activo, retornarlo
    if (activeAttendance) {
      return NextResponse.json({ attendance: activeAttendance });
    }

    // Si no hay registro activo, buscar el más reciente del día
    const latestAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: today,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ attendance: latestAttendance });
  } catch (error) {
    console.error("Error al obtener asistencia:", error);
    return NextResponse.json(
      { error: "Error al obtener asistencia" },
      { status: 500 }
    );
  }
}
