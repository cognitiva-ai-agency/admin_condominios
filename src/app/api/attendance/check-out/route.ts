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

    // NUEVO: Buscar el registro ACTIVO (con checkIn pero sin checkOut)
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: today,
        checkIn: { not: null },
        checkOut: null, // Sin checkout = sesión activa
      },
      orderBy: {
        checkIn: "desc", // El más reciente primero
      },
    });

    if (!activeAttendance) {
      return NextResponse.json(
        { error: "No tienes una sesión activa para cerrar. Debes registrar tu entrada primero." },
        { status: 400 }
      );
    }

    // Actualizar el registro activo con el checkOut
    const attendance = await prisma.attendance.update({
      where: {
        id: activeAttendance.id,
      },
      data: {
        checkOut: now,
      },
    });

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error) {
    console.error("Error al registrar salida:", error);

    // Intentar proporcionar un mensaje de error más específico
    const errorMessage = error instanceof Error
      ? error.message
      : "Error al registrar salida";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
