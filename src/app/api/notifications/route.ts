import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const onlyUnread = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limitar a últimas 50 notificaciones
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Crear notificación (para testing o admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, title, message, type, relatedTaskId } = body;

    // Solo ADMIN puede crear notificaciones para otros usuarios
    if (userId && userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sin permisos para crear notificaciones para otros usuarios" },
        { status: 403 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId || session.user.id,
        title,
        message,
        type: type || "SYSTEM",
        relatedTaskId: relatedTaskId || null,
      },
      include: {
        relatedTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Notificación creada",
      notification,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear notificación:", error);
    return NextResponse.json(
      { error: "Error al crear notificación" },
      { status: 500 }
    );
  }
}
