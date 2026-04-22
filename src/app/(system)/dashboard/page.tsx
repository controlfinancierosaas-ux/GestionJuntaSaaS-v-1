"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-neutral-400 mb-8">Gestión de Incidencias del Edificio</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/admin/incidencias?filter=abiertas" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-red-500 transition-colors">
              <div className="text-2xl font-bold text-red-400">{loading ? "..." : stats.abiertas}</div>
              <div className="text-neutral-400 text-sm">Incidencias Abiertas</div>
            </Link>
            <Link href="/admin/incidencias?filter=En+Evaluación" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-yellow-500 transition-colors">
              <div className="text-2xl font-bold text-yellow-400">{loading ? "..." : stats["En Evaluación"]}</div>
              <div className="text-neutral-400 text-sm">En Evaluación</div>
            </Link>
            <Link href="/admin/incidencias?filter=En+Ejecución" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="text-2xl font-bold text-blue-400">{loading ? "..." : stats["En Ejecución"]}</div>
              <div className="text-neutral-400 text-sm">En Ejecución</div>
            </Link>
            <Link href="/admin/incidencias?filter=Asignada" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-purple-500 transition-colors">
              <div className="text-2xl font-bold text-purple-400">{loading ? "..." : stats.Asignada}</div>
              <div className="text-neutral-400 text-sm">Asignadas</div>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen por Estatus</h2>
              <div className="space-y-3">
                <Link href="/admin/incidencias?filter=Activa" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>🟢 Activas</span>
                  <span className="font-bold">{loading ? "..." : stats.Activa}</span>
                </Link>
                <Link href="/admin/incidencias?filter=En+Evaluación" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>🟡 En Evaluación</span>
                  <span className="font-bold">{loading ? "..." : stats["En Evaluación"]}</span>
                </Link>
                <Link href="/admin/incidencias?filter=En+Ejecución" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>🔵 En Ejecución</span>
                  <span className="font-bold">{loading ? "..." : stats["En Ejecución"]}</span>
                </Link>
                <Link href="/admin/incidencias?filter=Asignada" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>🟣 Asignadas</span>
                  <span className="font-bold">{loading ? "..." : stats.Asignada}</span>
                </Link>
                <Link href="/admin/incidencias?filter=Pospuesta" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>⏸️ Pospuestas</span>
                  <span className="font-bold">{loading ? "..." : stats.Pospuesta}</span>
                </Link>
                <Link href="/admin/incidencias?filter=Descartada" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>❌ Descartadas</span>
                  <span className="font-bold">{loading ? "..." : stats.Descartada}</span>
                </Link>
                <Link href="/admin/incidencias?filter=Resuelta" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>✅ Resueltas</span>
                  <span className="font-bold">{loading ? "..." : stats.Resuelta}</span>
                </Link>
                <Link href="/admin/incidencias?filter=Archivada" className="flex items-center justify-between p-3 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-colors">
                  <span>📁 Archivadas</span>
                  <span className="font-bold">{loading ? "..." : stats.Archivada}</span>
                </Link>
              </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <Link href="/incidencias" className="block w-full text-left p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                  + Nueva Incidencia
                </Link>
                <Link href="/admin/proveedores" className="block w-full text-left p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                  👥 Directorio de Proveedores
                </Link>
                <Link href="/admin/incidencias" className="block w-full text-left p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                  Ver Todas las Incidencias
                </Link>
                <Link href="/admin/incidencias?filter=Activa" className="block w-full text-left p-3 bg-neutral-700/50 hover:bg-neutral-700 rounded-lg transition-colors">
                  Ver Incidencias Activas
                </Link>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
