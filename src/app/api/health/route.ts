import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Intentar conectar y hacer una query simple
    const result = await prisma.$queryRaw`SELECT 1 as connected`;

    // Contar usuarios en la BD
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "ok",
      message: "Base de datos conectada correctamente",
      database: {
        connected: true,
        userCount,
        query: result,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Error al conectar con la base de datos",
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
