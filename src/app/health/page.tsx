"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HealthData {
  status: string;
  message: string;
  database?: {
    connected: boolean;
    userCount: number;
    query: any;
  };
  error?: string;
  timestamp: string;
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setHealthData({
          status: "error",
          message: "No se pudo conectar con la API",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Verificando conexión...</p>
        </div>
      </main>
    );
  }

  const isConnected = healthData?.status === "ok";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Health Check - Admin Condominios
        </h1>

        <div
          className={`p-6 rounded-lg mb-6 ${
            isConnected
              ? "bg-green-100 border-2 border-green-500"
              : "bg-red-100 border-2 border-red-500"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Estado: {isConnected ? "✅ Conectado" : "❌ Error"}
            </h2>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                isConnected
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {healthData?.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-700">{healthData?.message}</p>
        </div>

        {healthData?.database && (
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">
              📊 Información de Base de Datos
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Conexión:</span>
                <span
                  className={
                    healthData.database.connected
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {healthData.database.connected ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Usuarios en BD:</span>
                <span className="text-blue-600">
                  {healthData.database.userCount}
                </span>
              </div>
            </div>
          </div>
        )}

        {healthData?.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">
              <strong>Error:</strong> {healthData.error}
            </p>
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded text-sm">
          <p className="text-gray-600">
            <strong>Timestamp:</strong> {healthData?.timestamp}
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            🔄 Verificar nuevamente
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
