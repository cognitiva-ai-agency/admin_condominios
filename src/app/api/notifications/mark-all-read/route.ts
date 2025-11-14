import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/notifications/mark-all-read - Marcar todas las notificaciones como leídas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Marcar todas las notificaciones no leídas del usuario como leídas
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: "Todas las notificaciones marcadas como leídas",
      count: result.count,
    });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    return NextResponse.json(
      { error: "Error al marcar notificaciones como leídas" },
      { status: 500 }
    );
  }
}
