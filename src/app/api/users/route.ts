import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/users - Listar trabajadores del admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const workers = await prisma.user.findMany({
      where: {
        parentId: session.user.id,
        role: "WORKER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ workers, total: workers.length });
  } catch (error) {
    console.error("Error al obtener trabajadores:", error);
    return NextResponse.json(
      { error: "Error al obtener trabajadores" },
      { status: 500 }
    );
  }
}
