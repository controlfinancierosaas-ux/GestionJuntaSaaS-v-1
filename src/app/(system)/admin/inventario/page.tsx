"use client";
import { useState, useEffect } from "react";

export default function InventarioPage() {
  const [view, setView] = useState<"stock" | "catalogo">("stock");
  const [items, setItems] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMovModal, setShowMovModal] = useState(false);
  const [showArticuloModal, setShowArticuloModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [tipoMov, setTipoMov] = useState<"Entrada" | "Salida">("Salida");
  const [nuevoMov, setNuevoMov] = useState({ articulo_nombre: "", cantidad: 1, unidad: "Unidad", recibido_por: "", ubicacion_uso: "" });
  const [nuevoArticulo, setNuevoArticulo] = useState({ id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 2 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resStock, resCat] = await Promise.all([
        fetch("/api/admin/inventario"),
        fetch("/api/admin/articulos")
      ]);
      const stockData = await resStock.json();
      const catData = await resCat.json();
      
      setItems(Array.isArray(stockData) ? stockData : []);
      setCatalogo(Array.isArray(catData) ? catData : []);
    } catch (e) {
      setError("Error al conectar con la base de datos");
    } finally { setLoading(false); }
  };

  const handleMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoMov, tipo_movimiento: tipoMov }),
      });
      if (res.ok) {
        setShowMovModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Error al registrar movimiento");
      }
    } catch (e) { setError("Error de red"); }
    finally { setSaving(false); }
  };

  const handleSaveArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = nuevoArticulo.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/articulos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoArticulo),
      });
      if (res.ok) {
        setShowArticuloModal(false);
        setNuevoArticulo({ id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 2 });
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Error al guardar artículo");
      }
    } catch (e) { setError("Error de red"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventario / Almacén</h1>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setView("stock")}
                className={`text-xs font-black pb-1 border-b-2 transition-all uppercase tracking-widest ${view === 'stock' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent'}`}
              >
                STOCK ACTUAL
              </button>
              <button 
                onClick={() => setView("catalogo")}
                className={`text-xs font-black pb-1 border-b-2 transition-all uppercase tracking-widest ${view === 'catalogo' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent'}`}
              >
                CATÁLOGO / ARTÍCULOS
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => { setTipoMov("Entrada"); setShowMovModal(true); }}
              className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase"
            >
              ⬆️ Entrada
            </button>
            <button 
              onClick={() => { setTipoMov("Salida"); setShowMovModal(true); }}
              className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs uppercase"
            >
              ⬇️ Salida
            </button>
            <button 
              onClick={() => { setNuevoArticulo({id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 2}); setShowArticuloModal(true); }}
              className="flex-1 md:flex-none px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xs uppercase"
            >
              ➕ Nuevo Artículo
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {view === "stock" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(it => (
              <div key={it.nombre} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{it.categoria}</span>
                  <span className={`text-2xl font-black ${it.cantidad <= 1 ? 'text-red-500' : 'text-white'}`}>{it.cantidad}</span>
                </div>
                <h3 className="text-white font-bold text-sm uppercase truncate mb-1">{it.nombre}</h3>
                <p className="text-neutral-500 text-[10px] font-bold">{it.unidad}</p>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center bg-neutral-900 rounded-2xl border border-dashed border-neutral-700 text-neutral-500 italic font-medium">
                El almacén está vacío. Registre entradas del catálogo para ver el stock.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Unidad</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {catalogo.map(art => (
                  <tr key={art.id} className="hover:bg-neutral-750 transition-colors">
                    <td className="p-4 text-white font-bold uppercase">{art.nombre}</td>
                    <td className="p-4 text-neutral-400 font-medium">{art.categoria}</td>
                    <td className="p-4 text-neutral-400 font-medium">{art.unidad_medida}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => { setNuevoArticulo(art); setShowArticuloModal(true); }}
                        className="text-[10px] bg-neutral-700 px-3 py-1.5 rounded text-emerald-400 font-black uppercase hover:bg-neutral-600 transition-colors"
                      >
                        EDITAR
                      </button>
                    </td>
                  </tr>
                ))}
                {catalogo.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-10 text-center text-neutral-500 italic">No hay artículos creados en el catálogo.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL MOVIMIENTO */}
      {showMovModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className={`text-xl font-bold mb-6 uppercase tracking-tighter ${tipoMov === 'Entrada' ? 'text-emerald-500' : 'text-red-500'}`}>
              Registrar {tipoMov}
            </h3>
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Artículo del Catálogo</label>
                <select 
                  required 
                  className="w-full bg-neutral-700 p-3 rounded-lg text-white font-bold"
                  onChange={e => {
                    const art = catalogo.find(c => c.nombre === e.target.value);
                    setNuevoMov({...nuevoMov, articulo_nombre: e.target.value, unidad: art?.unidad_medida || 'Unidad'});
                  }}
                >
                  <option value="">Seleccione...</option>
                  {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Cantidad</label>
                  <input type="number" required step="0.1" min="0.1" className="w-full bg-neutral-700 p-3 rounded-lg text-white" onChange={e => setNuevoMov({...nuevoMov, cantidad: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{tipoMov === 'Entrada' ? 'Origen' : 'Entregado a'}</label>
                  <input type="text" required className="w-full bg-neutral-700 p-3 rounded-lg text-white" onChange={e => setNuevoMov({...nuevoMov, recibido_por: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className={`flex-1 py-3 rounded-xl font-black text-white uppercase tracking-widest ${tipoMov === 'Entrada' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  {saving ? '...' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setShowMovModal(false)} className="flex-1 bg-neutral-700 py-3 rounded-xl font-black text-white uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ARTICULO */}
      {showArticuloModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tighter">Configurar Artículo</h3>
            <form onSubmit={handleSaveArticulo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre</label>
                <input type="text" required value={nuevoArticulo.nombre} className="w-full bg-neutral-800 p-3 rounded-lg text-white font-bold" onChange={e => setNuevoArticulo({...nuevoArticulo, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Categoría</label>
                  <select value={nuevoArticulo.categoria} className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevoArticulo({...nuevoArticulo, categoria: e.target.value})}>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Plomería">Plomería</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Unidad (Paq/Gal/Und)</label>
                  <input type="text" value={nuevoArticulo.unidad_medida} className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevoArticulo({...nuevoArticulo, unidad_medida: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-white uppercase tracking-widest">
                  {saving ? '...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowArticuloModal(false)} className="flex-1 bg-neutral-700 py-3 rounded-xl font-black text-white uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
