"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="z-10 max-w-4xl w-full bg-white rounded-lg shadow-xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Admin Condominios
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Sistema de administración de condominios
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
            Selecciona tu tipo de acceso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Acceso Administradores */}
            <Link
              href="/auth/login"
              className="group block p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-600 p-4 rounded-full mb-4 group-hover:bg-blue-700 transition-colors">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">
                  Administradores
                </h3>
                <p className="text-sm text-gray-600">
                  Gestiona trabajadores, crea tareas y supervisa proyectos
                </p>
              </div>
            </Link>

            {/* Acceso Trabajadores */}
            <Link
              href="/auth/login"
              className="group block p-8 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-600 p-4 rounded-full mb-4 group-hover:bg-green-700 transition-colors">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  Trabajadores
                </h3>
                <p className="text-sm text-gray-600">
                  Accede a tus tareas asignadas y reporta tu progreso
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-center">
            <Link
              href="/health"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Verificar estado del sistema
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Desarrollado por Cognitiva SpA</p>
        </div>
      </div>
    </main>
  );
}
