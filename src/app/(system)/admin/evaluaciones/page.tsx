"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GestionCalidadPage() {
  const router = useRouter();
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/evaluaciones")
      .then(res => res.json())
      .then(data => setEvaluaciones(data))
      .catch(() => setEvaluaciones([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = evaluaciones.filter((ev: any) => {
    const providerName = ev.proveedores?.nombre?.toLowerCase() || "";
    const criterion = ev.criterio_resumido?.toLowerCase() || "";
    const comments = ev.comentarios?.toLowerCase() || "";
    const searchLower = search.toLowerCase();
    
    return providerName.includes(searchLower) || 
           criterion.includes(searchLower) || 
           comments.includes(searchLower);
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Calidad</h1>
            <p className="text-neutral-400 text-sm">Histórico de evaluaciones y desempeño de proveedores</p>
          </div>
          <button
            onClick={() => router.push("/admin/proveedores")}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium border border-neutral-700 transition-colors"
          >
            Ir a Proveedores
          </button>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 border border-neutral-700">
          <input
            type="text"
            placeholder="Filtrar por proveedor, criterio o comentario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Cargando histórico de calidad...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No se encontraron evaluaciones registradas</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((ev: any) => (
              <div key={ev.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 hover:border-emerald-500/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 text-xs font-bold rounded uppercase tracking-wider">
                        {ev.proveedores?.categoria || "Servicio"}
                      </span>
                      <h3 className="text-lg font-bold text-white">{ev.proveedores?.nombre}</h3>
                    </div>
                    
                    <div className="flex text-yellow-500 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-xl">{i < ev.puntaje ? "⭐" : "☆"}</span>
                      ))}
                      <span className="ml-2 text-neutral-400 text-sm self-center">({ev.puntaje}/5)</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-white font-medium flex items-center gap-2">
                        <span className="text-emerald-500">📌</span> {ev.criterio_resumido}
                      </p>
                      <p className="text-neutral-400 italic text-sm bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                        "{ev.comentarios}"
                      </p>
                    </div>
                  </div>

                  <div className="md:text-right flex flex-col justify-between gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-neutral-700">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase font-semibold">Evaluado por</p>
                      <p className="text-sm text-neutral-300 font-medium">{ev.evaluado_por || "Administración"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 uppercase font-semibold">Fecha</p>
                      <p className="text-sm text-neutral-300">{new Date(ev.fecha_evaluacion).toLocaleDateString('es-VE', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/admin/proveedores/${ev.proveedor_id}`)}
                      className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest hover:underline"
                    >
                      Ver Proveedor →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-sm text-neutral-500 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Se muestran {filtered.length} registros del histórico de calidad
        </div>
      </div>
    </div>
  );
}
