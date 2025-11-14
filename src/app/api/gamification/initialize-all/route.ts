import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { initializeGamification } from "@/utils/gamification";

/**
 * POST /api/gamification/initialize-all
 * Inicializa la gamificación para todos los trabajadores que no la tienen
 * Solo accesible por administradores
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden ejecutar esta acción." },
        { status: 401 }
      );
    }

    // Obtener todos los trabajadores
    const workers = await prisma.user.findMany({
      where: {
        role: "WORKER",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Inicializar gamificación para cada trabajador
    let initializedCount = 0;
    let skippedCount = 0;

    for (const worker of workers) {
      const existing = await prisma.userGamification.findUnique({
        where: { userId: worker.id },
      });

      if (!existing) {
        await initializeGamification(worker.id);
        initializedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      message: "Inicialización completada",
      totalWorkers: workers.length,
      initialized: initializedCount,
      skipped: skippedCount,
    });
  } catch (error: any) {
    console.error("Error al inicializar gamificación:", error);
    return NextResponse.json(
      {
        error: "Error al inicializar gamificación",
        details: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}
