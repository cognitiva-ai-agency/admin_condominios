import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error("Error al verificar usuarios:", error);
    return NextResponse.json(
      { error: "Error al verificar configuración" },
      { status: 500 }
    );
  }
}
