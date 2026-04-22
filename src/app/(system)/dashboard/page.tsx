"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then(res => res.json()),
      fetch("/api/dashboard/movimientos-hoy").then(res => res.json())
    ]).then(([statsData, movsData]) => {
      setStats(statsData);
      setMovimientos(movsData);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const totalDia = movimientos.reduce((acc, m) => m.tipo === 'Ingreso' ? acc + parseFloat(m.monto) : acc - parseFloat(m.monto), 0);

  return (
    <main className="text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
        <p className="text-neutral-400 mb-8">Gestión Operativa y Financiera</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/admin/incidencias?filter=abiertas" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-red-500 transition-colors">
              <div className="text-2xl font-bold text-red-400">{loading ? "..." : stats.abiertas || 0}</div>
              <div className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Incidencias Abiertas</div>
            </Link>
            <Link href="/admin/incidencias?filter=En+Evaluación" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-yellow-500 transition-colors">
              <div className="text-2xl font-bold text-yellow-400">{loading ? "..." : stats["En Evaluación"] || 0}</div>
              <div className="text-neutral-400 text-sm font-bold uppercase tracking-wider">En Evaluación</div>
            </Link>
            <Link href="/admin/incidencias?filter=En+Ejecución" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="text-2xl font-bold text-blue-400">{loading ? "..." : stats["En Ejecución"] || 0}</div>
              <div className="text-neutral-400 text-sm font-bold uppercase tracking-wider">En Ejecución</div>
            </Link>
            <Link href="/admin/incidencias?filter=Asignada" className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 hover:border-purple-500 transition-colors">
              <div className="text-2xl font-bold text-purple-400">{loading ? "..." : stats.Asignada || 0}</div>
              <div className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Asignadas</div>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Movimientos de Hoy */}
            <div className="lg:col-span-2 bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
                <div>
                   <h2 className="text-lg font-bold text-white uppercase tracking-tight">Movimientos de Hoy ({hoy})</h2>
                   <p className="text-[10px] text-emerald-500 font-bold uppercase animate-pulse">Sincronización en tiempo real</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-neutral-500 font-bold uppercase">Balance del Día</p>
                   <p className={`text-xl font-black ${totalDia >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                     Bs. {totalDia.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                   </p>
                </div>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                {movimientos.length === 0 ? (
                  <div className="p-10 text-center text-neutral-500 italic">No se han registrado movimientos el día de hoy.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-900/50 text-neutral-500 uppercase text-[9px] font-black">
                      <tr>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Descripción / Referencia</th>
                        <th className="p-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700/50">
                      {movimientos.map((m, i) => (
                        <tr key={i} className="hover:bg-neutral-750 transition-colors">
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              m.tipo === 'Ingreso' ? 'bg-green-900 text-green-300' : 
                              m.tipo === 'Gasto' ? 'bg-orange-900 text-orange-200' : 'bg-red-900 text-red-300'
                            }`}>
                              {m.tipo}
                            </span>
                            <div className="text-[8px] text-neutral-500 mt-1 uppercase font-bold">{m.fuente}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-white font-medium line-clamp-1">{m.descripcion}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">Ref: {m.referencia}</div>
                          </td>
                          <td className={`p-4 text-right font-bold ${m.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-white'}`}>
                            {m.tipo === 'Ingreso' ? '+' : '-'}Bs. {parseFloat(m.monto).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="p-4 bg-neutral-900/30 border-t border-neutral-700">
                <Link href="/admin/gastos" className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest">
                  Ver Control Maestro de Gastos →
                </Link>
              </div>
            </div>

            {/* Resumen Lateral */}
            <div className="space-y-6">
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Estatus General</h2>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-700">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Activas</p>
                      <p className="text-xl font-bold text-red-400">{stats.Activa || 0}</p>
                   </div>
                   <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-700">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Resueltas</p>
                      <p className="text-xl font-bold text-green-400">{stats.Resuelta || 0}</p>
                   </div>
                </div>
                <Link href="/admin/incidencias" className="block mt-4 text-center py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs font-bold uppercase transition-colors">
                  Gestionar Todas
                </Link>
              </div>

              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
                <div className="space-y-3">
                  <Link href="/incidencias" className="block w-full text-center p-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 rounded-xl font-bold text-sm transition-all">
                    ➕ Nueva Incidencia
                  </Link>
                  <Link href="/admin/caja-chica" className="block w-full text-center p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-xl font-bold text-sm transition-all">
                    💰 Caja Chica
                  </Link>
                  <Link href="/admin/inventario" className="block w-full text-center p-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 text-purple-400 rounded-xl font-bold text-sm transition-all">
                    📦 Almacén / Inventario
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
