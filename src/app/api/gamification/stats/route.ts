import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGamificationStats } from "@/utils/gamification";

/**
 * GET /api/gamification/stats
 * Obtiene las estadísticas de gamificación del usuario actual
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const stats = await getGamificationStats(session.user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error al obtener estadísticas de gamificación:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
