"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GestionCalidadPage() {
  const router = useRouter();
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevaEval, setNuevaEval] = useState({
    proveedor_id: "",
    puntaje: 5,
    criterio_resumido: "Evaluación General",
    comentarios: "",
    evaluado_por: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/evaluaciones").then(res => res.json()),
      fetch("/api/admin/proveedores").then(res => res.json())
    ]).then(([evals, provs]) => {
      setEvaluaciones(evals || []);
      setProveedores(provs || []);
    }).catch(() => {
      setEvaluaciones([]);
      setProveedores([]);
    }).finally(() => setLoading(false));
  };

  const handleSaveEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaEval.proveedor_id) {
      alert("Selecciona un proveedor");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/proveedores/${nuevaEval.proveedor_id}/evaluaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaEval),
      });
      if (res.ok) {
        setShowModal(false);
        setNuevaEval({ proveedor_id: "", puntaje: 5, criterio_resumido: "Evaluación General", comentarios: "", evaluado_por: "" });
        fetchData();
      }
    } catch (err) {
      alert("Error al guardar la evaluación");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Fecha", "Proveedor", "Categoria", "Puntaje", "Criterio", "Comentario", "Evaluado Por"],
      ...filtered.map(ev => [
        new Date(ev.fecha_evaluacion).toLocaleDateString(),
        ev.proveedores?.nombre,
        ev.proveedores?.categoria,
        ev.puntaje,
        ev.criterio_resumido,
        ev.comentarios,
        ev.evaluado_por
      ])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_calidad_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = evaluaciones.filter((ev: any) => {
    const providerName = ev.proveedores?.nombre?.toLowerCase() || "";
    const criterion = ev.criterio_resumido?.toLowerCase() || "";
    const comments = ev.comentarios?.toLowerCase() || "";
    const searchLower = search.toLowerCase();
    
    const matchesSearch = providerName.includes(searchLower) || 
                         criterion.includes(searchLower) || 
                         comments.includes(searchLower);
    
    const matchesStars = starFilter === "Todos" || ev.puntaje === parseInt(starFilter);
    
    const evDate = new Date(ev.fecha_evaluacion);
    const dFrom = dateFrom ? new Date(dateFrom) : null;
    const dTo = dateTo ? new Date(dateTo) : null;
    if (dTo) dTo.setHours(23, 59, 59, 999);

    const matchesDateFrom = !dFrom || evDate >= dFrom;
    const matchesDateTo = !dTo || evDate <= dTo;

    return matchesSearch && matchesStars && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Calidad</h1>
            <p className="text-neutral-400 text-sm">Histórico de evaluaciones y desempeño de proveedores</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>⭐</span> Nueva Evaluación
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium border border-neutral-700 transition-colors flex items-center gap-2"
            >
              <span>📥</span> Exportar Reporte
            </button>
            <button
              onClick={() => router.push("/admin/proveedores")}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium border border-neutral-700 transition-colors"
            >
              Ir a Proveedores
            </button>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 border border-neutral-700 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Filtrar por proveedor, criterio o comentario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
            />
            
            <select
              value={starFilter}
              onChange={e => setStarFilter(e.target.value)}
              className="bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Todos">Todas las calificaciones</option>
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-neutral-700/50">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400 uppercase font-bold">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400 uppercase font-bold">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => { setSearch(""); setStarFilter("Todos"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-emerald-500 hover:text-emerald-400 font-bold ml-auto uppercase"
            >
              Limpiar Filtros
            </button>
          </div>
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

      {/* Modal Nueva Evaluación Manual */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Registrar Evaluación de Calidad</h3>
            <form onSubmit={handleSaveEval} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Proveedor</label>
                <select
                  required
                  value={nuevaEval.proveedor_id}
                  onChange={e => setNuevaEval({ ...nuevaEval, proveedor_id: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccione un proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Puntaje</label>
                <div className="flex gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNuevaEval({ ...nuevaEval, puntaje: num })}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      {num <= nuevaEval.puntaje ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Criterio / Concepto</label>
                <input
                  type="text"
                  required
                  value={nuevaEval.criterio_resumido}
                  onChange={e => setNuevaEval({ ...nuevaEval, criterio_resumido: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: Evaluación semestral, Limpieza de áreas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Comentarios Detallados</label>
                <textarea
                  required
                  rows={3}
                  value={nuevaEval.comentarios}
                  onChange={e => setNuevaEval({ ...nuevaEval, comentarios: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Justifique la calificación..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Evaluado por</label>
                <input
                  type="text"
                  required
                  value={nuevaEval.evaluado_por}
                  onChange={e => setNuevaEval({ ...nuevaEval, evaluado_por: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Tu nombre o cargo"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Registrar Evaluación"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
