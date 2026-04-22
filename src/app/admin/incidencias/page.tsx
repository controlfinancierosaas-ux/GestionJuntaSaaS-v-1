"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = ["Todos", "Activa", "En Evaluación", "En Ejecución", "Asignada", "Pospuesta", "Descartada", "Resuelta", "Archivada"];

function IncidenciasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFilter = searchParams.get("filter") || "Todos";
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const [proveedorFilter, setProveedorFilter] = useState("");
  const [responsableFilter, setResponsableFilter] = useState("");

  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    fetch("/api/admin/incidencias")
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSendReport = async () => {
    if (!confirm("¿Deseas enviar el reporte de gestión semanal a todos los administradores y junta?")) return;
    
    setSendingReport(true);
    try {
      const res = await fetch("/api/cron/reporte-semanal");
      const data = await res.json();
      if (res.ok) {
        alert("✅ Reporte enviado exitosamente a: " + (data.destinatarios?.join(", ") || "destinatarios configurados"));
      } else {
        alert("❌ Error al enviar reporte: " + (data.error || "Error desconocido"));
      }
    } catch (error) {
      alert("❌ Error de red al intentar enviar el reporte");
    } finally {
      setSendingReport(false);
    }
  };

  const filtered = incidents.filter((inc: any) => {
    if (filter !== "Todos" && inc.estatus !== filter) return false;
    if (search && !(
      inc.reportado_por?.toLowerCase().includes(search.toLowerCase()) ||
      inc.area_afectada?.toLowerCase().includes(search.toLowerCase()) ||
      inc.unidad_codigo?.toLowerCase().includes(search.toLowerCase()) ||
      inc.id?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    if (proveedorFilter && inc.proveedor_asignado?.toLowerCase() !== proveedorFilter.toLowerCase()) return false;
    if (responsableFilter && inc.responsable_gestion?.toLowerCase() !== responsableFilter.toLowerCase()) return false;
    return true;
  });

  const openCount = incidents.filter((i: any) => i.estatus === "Activa").length;
  const uniqueProveedores = [...new Set(incidents.map((i: any) => i.proveedor_asignado).filter(Boolean))];
  const uniqueResponsables = [...new Set(incidents.map((i: any) => i.responsable_gestion).filter(Boolean))];

  const getEstatusColor = (estatus: string) => {
    const colors: Record<string, string> = {
      "Activa": "bg-red-900 text-red-200",
      "En Evaluación": "bg-yellow-900 text-yellow-200",
      "En Ejecución": "bg-blue-900 text-blue-200",
      "Asignada": "bg-purple-900 text-purple-200",
      "Pospuesta": "bg-gray-700 text-gray-300",
      "Descartada": "bg-red-800 text-red-300",
      "Resuelta": "bg-green-900 text-green-200",
      "Archivada": "bg-gray-800 text-gray-400",
    };
    return colors[estatus] || "bg-gray-700 text-gray-300";
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Incidencias</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleSendReport}
              disabled={sendingReport}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sendingReport 
                  ? "bg-neutral-700 text-neutral-500 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {sendingReport ? "Enviando..." : "📊 Enviar Reporte de Gestión"}
            </button>
            <button onClick={() => router.push("/dashboard")} className="text-neutral-400 hover:text-white">
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {openCount > 0 && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <span className="text-red-400 font-semibold">{openCount}</span>
            <span className="text-red-300"> incidencias activas requieren atención</span>
          </div>
        )}

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre, tipo, apartamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-400">Proveedor:</label>
              <select
                value={proveedorFilter}
                onChange={e => setProveedorFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Todos</option>
                {uniqueProveedores.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-400">Responsable:</label>
              <select
                value={responsableFilter}
                onChange={e => setResponsableFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Todos</option>
                {uniqueResponsables.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { setSearch(""); setProveedorFilter(""); setResponsableFilter(""); setFilter("Todos"); }}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
              }`}
            >
              {f}
              {f !== "Todos" && (
                <span className="ml-1 text-xs opacity-75">
                  ({incidents.filter((i: any) => i.estatus === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Cargando incidencias...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No hay incidencias que coincidan con los filtros</div>
        ) : (
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-700">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">ID</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Fecha</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Tipo</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Reportado Por</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Unidad</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Responsable</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Estatus</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Proveedor</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Monto</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc: any) => (
                    <tr key={inc.id} className="border-t border-neutral-700 hover:bg-neutral-750">
                      <td className="p-3 text-sm font-mono">{inc.id?.slice(0, 8)}</td>
                      <td className="p-3 text-sm">{inc.created_at?.split("T")[0]}</td>
                      <td className="p-3 text-sm">{inc.area_afectada}</td>
                      <td className="p-3 text-sm">{inc.reportado_por}</td>
                      <td className="p-3 text-sm text-neutral-400">{inc.unidad_codigo}</td>
                      <td className="p-3 text-sm">{inc.responsable_gestion || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${getEstatusColor(inc.estatus || "Activa")}`}>
                          {inc.estatus || "Activa"}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{inc.proveedor_asignado || "-"}</td>
                      <td className="p-3 text-sm">{inc.monto_bs ? `Bs. ${Number(inc.monto_bs).toLocaleString()}` : "-"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => router.push("/admin/incidencias/" + inc.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Ver / Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-neutral-400">
          Mostrando {filtered.length} de {incidents.length} incidencias
        </div>
      </div>
    </div>
  );
}

export default function IncidenciasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Cargando...</div>}>
      <IncidenciasContent />
    </Suspense>
  );
}
