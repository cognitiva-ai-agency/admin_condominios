import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/attendance/recent
 * Obtiene las asistencias recientes de todos los trabajadores del admin
 * (check-ins y check-outs de los últimos 7 días)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Solo admins pueden ver asistencias de todos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden ver las asistencias" },
        { status: 403 }
      );
    }

    // Obtener fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Obtener todos los trabajadores del admin
    const workers = await prisma.user.findMany({
      where: {
        parentId: session.user.id,
        role: "WORKER",
      },
      select: {
        id: true,
      },
    });

    const workerIds = workers.map((w: any) => w.id);

    // Obtener asistencias recientes de todos los trabajadores
    const attendances = await prisma.attendance.findMany({
      where: {
        userId: {
          in: workerIds,
        },
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 50, // Limitar a 50 registros más recientes
    });

    return NextResponse.json({
      attendances,
      total: attendances.length,
    });
  } catch (error) {
    console.error("Error al obtener asistencias recientes:", error);
    return NextResponse.json(
      { error: "Error al obtener asistencias" },
      { status: 500 }
    );
  }
}
