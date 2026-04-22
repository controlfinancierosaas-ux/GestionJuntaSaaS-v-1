"use client";
import { useState, useEffect } from "react";

export default function InventarioPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevaSalida, setNuevaSalida] = useState({ articulo_nombre: "", cantidad: 1, unidad: "Unidad", recibido_por: "", ubicacion_uso: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventario");
      setItems(await res.json());
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaSalida),
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (e) {} finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventario de Almacén</h1>
            <p className="text-neutral-400 text-sm">Control de stock de materiales e insumos</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">
            ⬇️ REGISTRAR SALIDA (USO)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(it => (
            <div key={it.nombre} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[10px] font-bold rounded uppercase">{it.categoria || 'Sin Categoría'}</span>
                <span className={`text-2xl font-bold ${it.cantidad <= 2 ? 'text-red-500' : 'text-white'}`}>{it.cantidad}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 uppercase">{it.nombre}</h3>
              <p className="text-neutral-500 text-xs mb-4">Unidad: {it.unidad}</p>
              <div className="w-full bg-neutral-900 rounded-full h-1.5 mb-2">
                <div className={`h-1.5 rounded-full ${it.cantidad <= 2 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(it.cantidad * 10, 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div className="text-center py-20 bg-neutral-800/50 border border-dashed border-neutral-700 rounded-3xl">
            <p className="text-neutral-500 italic">No hay artículos con stock. Registre una compra en el módulo de Gastos para alimentar el inventario.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Registrar Salida de Material</h3>
            <form onSubmit={handleSalida} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Artículo</label>
                <select 
                  required 
                  className="w-full bg-neutral-700 p-3 rounded text-white"
                  onChange={e => {
                    const item = items.find(i => i.nombre === e.target.value);
                    setNuevaSalida({...nuevaSalida, articulo_nombre: e.target.value, unidad: item?.unidad || 'Unidad'});
                  }}
                >
                  <option value="">Seleccione artículo en stock...</option>
                  {items.filter(i => i.cantidad > 0).map(i => <option key={i.nombre} value={i.nombre}>{i.nombre} ({i.cantidad} disp.)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Cantidad a Usar</label>
                  <input type="number" required min="1" className="w-full bg-neutral-700 p-3 rounded text-white" onChange={e => setNuevaSalida({...nuevaSalida, cantidad: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Entregado a:</label>
                  <input type="text" required placeholder="Ej: Luis Toro" className="w-full bg-neutral-700 p-3 rounded text-white" onChange={e => setNuevaSalida({...nuevaSalida, recibido_por: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ubicación / Destino</label>
                <input type="text" placeholder="Ej: Pasillo Piso 3" className="w-full bg-neutral-700 p-3 rounded text-white" onChange={e => setNuevaSalida({...nuevaSalida, ubicacion_uso: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-red-600 py-3 rounded-xl font-bold text-white uppercase">{saving ? 'Procesando...' : 'Confirmar Salida'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-neutral-700 py-3 rounded-xl font-bold text-white uppercase">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
