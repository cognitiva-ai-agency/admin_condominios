import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaderboard } from "@/utils/gamification";

/**
 * GET /api/gamification/leaderboard
 * Obtiene el leaderboard de trabajadores ordenados por puntos
 * Solo accesible para ADMIN
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden ver el leaderboard" },
        { status: 403 }
      );
    }

    // Obtener parámetro limit de la query string (default 10)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const leaderboard = await getLeaderboard(Math.min(limit, 50)); // Max 50

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error al obtener leaderboard:", error);
    return NextResponse.json(
      { error: "Error al obtener leaderboard" },
      { status: 500 }
    );
  }
}
