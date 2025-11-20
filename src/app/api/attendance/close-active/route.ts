import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Endpoint de emergencia para cerrar sesiones activas huérfanas
 * Útil cuando hay registros de check-in sin check-out que bloquean nuevos check-ins
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Buscar todas las sesiones activas (con checkIn pero sin checkOut) del día
    const activeSessions = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        date: today,
        checkIn: { not: null },
        checkOut: null,
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    if (activeSessions.length === 0) {
      return NextResponse.json(
        { message: "No hay sesiones activas para cerrar", closed: 0 },
        { status: 200 }
      );
    }

    // Cerrar todas las sesiones activas con la hora actual
    const updates = await Promise.all(
      activeSessions.map((session: any) =>
        prisma.attendance.update({
          where: { id: session.id },
          data: { checkOut: now },
        })
      )
    );

    return NextResponse.json(
      {
        message: `Se cerraron ${activeSessions.length} sesión(es) activa(s)`,
        closed: activeSessions.length,
        sessions: updates,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cerrar sesiones activas:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Error al cerrar sesiones activas";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
