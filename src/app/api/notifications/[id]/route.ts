import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notifications/[id] - Marcar notificación como leída
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id: notificationId } = await params;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta notificación" },
        { status: 403 }
      );
    }

    // Marcar como leída
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: "Notificación marcada como leída",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error al actualizar notificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar notificación" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Eliminar notificación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id: notificationId } = await params;

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta notificación" },
        { status: 403 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      message: "Notificación eliminada",
    });
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
    return NextResponse.json(
      { error: "Error al eliminar notificación" },
      { status: 500 }
    );
  }
}
