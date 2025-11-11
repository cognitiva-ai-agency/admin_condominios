import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="z-10 max-w-3xl w-full bg-white rounded-lg shadow-xl p-12">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-800">
          Admin Condominios
        </h1>
        <p className="text-center text-gray-600 text-lg mb-8">
          Sistema de administración de condominios
        </p>

        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/health"
              className="block p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h2 className="text-xl font-semibold text-blue-700 mb-2">
                🔍 Health Check
              </h2>
              <p className="text-sm text-gray-600">
                Verificar conexión con la base de datos
              </p>
            </Link>

            <div className="block p-6 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-50">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                🏢 Módulos
              </h2>
              <p className="text-sm text-gray-600">
                Próximamente disponible
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Desarrollado por Cognitiva SpA</p>
        </div>
      </div>
    </main>
  );
}
