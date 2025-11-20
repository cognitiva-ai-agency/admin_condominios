"use client";

import MobileLayout from "@/components/MobileLayout";
import RecentActivity from "@/components/RecentActivity";

export default function HistoryPage() {
  return (
    <MobileLayout title="Actividad en Tiempo Real" role="ADMIN">
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Monitoreo en Tiempo Real
          </h2>
          <p className="text-sm text-gray-600">
            Seguimiento de todas las actividades de tus trabajadores en tiempo real
          </p>
        </div>

        <RecentActivity />
      </div>
    </MobileLayout>
  );
}
