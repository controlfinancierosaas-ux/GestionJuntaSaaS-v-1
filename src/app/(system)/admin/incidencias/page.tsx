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
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>(["categoria", "sistema", "manual"]);

  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    // 1. Cargar configuración para saber qué columnas mostrar
    fetch("/api/admin/config")
      .then(res => res.json())
      .then(config => {
        if (config && config.columnas_visibles_incidencias) {
          setColumnasVisibles(config.columnas_visibles_incidencias);
        }
      })
      .catch((err) => {
        console.error("Error loading config, using defaults", err);
        setColumnasVisibles(["categoria", "sistema", "manual"]);
      });

    // 2. Cargar incidencias
    fetch("/api/admin/incidencias")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setIncidents(data);
        else setIncidents([]);
      })
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
    
    const searchLower = search.toLowerCase();
    if (search && !(
      inc.reportado_por?.toLowerCase().includes(searchLower) ||
      inc.area_afectada?.toLowerCase().includes(searchLower) ||
      inc.unidad_codigo?.toLowerCase().includes(searchLower) ||
      inc.id?.toLowerCase().includes(searchLower) ||
      inc.codigo_personalizado?.toLowerCase().includes(searchLower) ||
      inc.numero_sistema?.toLowerCase().includes(searchLower) ||
      inc.codigo_manual?.toLowerCase().includes(searchLower)
    )) return false;
    
    if (proveedorFilter && inc.proveedor_asignado?.toLowerCase() !== proveedorFilter.toLowerCase()) return false;
    if (responsableFilter && inc.responsable_gestion?.toLowerCase() !== responsableFilter.toLowerCase()) return false;
    return true;
  });

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

  const uniqueProveedores = [...new Set(incidents.map((i: any) => i.proveedor_asignado).filter(Boolean))];
  const uniqueResponsables = [...new Set(incidents.map((i: any) => i.responsable_gestion).filter(Boolean))];

  return (
    <div className="text-white p-6">
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

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Buscar por código, sistema, manual, nombre, tipo..."
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
          <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-700">
                  <tr>
                    {columnasVisibles.includes("categoria") && <th className="p-3 text-left text-sm font-medium text-neutral-300">Código</th>}
                    {columnasVisibles.includes("sistema") && <th className="p-3 text-left text-sm font-medium text-neutral-300">Nº Sistema</th>}
                    {columnasVisibles.includes("manual") && <th className="p-3 text-left text-sm font-medium text-neutral-300">Cód. Manual</th>}
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Fecha</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Tipo</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Unidad</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Estatus</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Proveedor</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc: any) => (
                    <tr key={inc.id} className="border-t border-neutral-700 hover:bg-neutral-750 transition-colors">
                      {columnasVisibles.includes("categoria") && (
                        <td className="p-3 text-sm font-mono text-emerald-400 font-bold">{inc.codigo_personalizado || "-"}</td>
                      )}
                      {columnasVisibles.includes("sistema") && (
                        <td className="p-3 text-sm font-mono text-blue-400 text-xs">{inc.numero_sistema || "-"}</td>
                      )}
                      {columnasVisibles.includes("manual") && (
                        <td className="p-3 text-sm font-mono text-purple-400 text-xs">{inc.codigo_manual || "-"}</td>
                      )}
                      <td className="p-3 text-sm">{inc.created_at?.split("T")[0]}</td>
                      <td className="p-3 text-sm">{inc.area_afectada}</td>
                      <td className="p-3 text-sm text-neutral-400">{inc.unidad_codigo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${getEstatusColor(inc.estatus || "Activa")}`}>
                          {inc.estatus || "Activa"}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-neutral-300">{inc.proveedor_asignado || "-"}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => router.push("/admin/incidencias/" + inc.id)}
                          className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-blue-400 text-xs font-bold rounded transition-colors"
                        >
                          GESTIONAR
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
