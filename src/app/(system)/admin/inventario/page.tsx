"use client";
import { useState, useEffect } from "react";

export default function InventarioPage() {
  const [view, setView] = useState<"stock" | "catalogo">("stock");
  const [items, setItems] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMovModal, setShowMovModal] = useState(false);
  const [showArticuloModal, setShowArticuloModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [tipoMov, setTipoMov] = useState<"Entrada" | "Salida">("Salida");
  const [vincularGasto, setVincularGasto] = useState(false);
  const [nuevoMov, setNuevoMov] = useState({ 
    articulo_nombre: "", 
    cantidad: 1, 
    unidad: "Unidad", 
    recibido_por: "", 
    ubicacion_uso: "", 
    observaciones: "",
    categoria: "",
    // Campos para gasto si aplica
    proveedor_id: "",
    numero_comprobante: "",
    monto_usd: 0,
    monto_bs: 0,
    fecha_factura: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    console.log("Inventario Page: Fetching stock, catalog and providers...");
    try {
      const [resStock, resCat, resProv] = await Promise.all([
        fetch("/api/admin/inventario"),
        fetch("/api/admin/articulos"),
        fetch("/api/admin/proveedores")
      ]);
      const stockData = await resStock.json();
      const catData = await resCat.json();
      const provData = await resProv.json();
      console.log("Inventario Page: Data received", { stockData, catData, provData });
      setItems(Array.isArray(stockData) ? stockData : []);
      setCatalogo(Array.isArray(catData) ? catData : []);
      setProveedores(Array.isArray(provData) ? provData : []);
    } catch (e) { 
      console.error("Inventario Page: Error fetching data:", e);
      setError("Error de conexión"); 
    } finally { setLoading(false); }
  };

  const handleMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (tipoMov === "Entrada" && vincularGasto) {
        // Lógica de Vincular a Gasto
        console.log("Inventario Page: Registrando entrada vinculada a Gasto...");
        const gastoPayload = {
          proveedor_id: nuevoMov.proveedor_id,
          numero_comprobante: nuevoMov.numero_comprobante,
          monto_usd: nuevoMov.monto_usd,
          monto_bs: nuevoMov.monto_bs,
          fecha_factura: nuevoMov.fecha_factura,
          categoria_gasto: "Insumos",
          concepto_descripcion: `Compra de ${nuevoMov.articulo_nombre} (${nuevoMov.cantidad} ${nuevoMov.unidad})`,
          items: [{
            articulo_nombre: nuevoMov.articulo_nombre,
            cantidad: nuevoMov.cantidad,
            unidad: nuevoMov.unidad,
            tipo_movimiento: "Entrada",
            recibido_por: nuevoMov.recibido_por,
            observaciones: nuevoMov.observaciones,
            categoria: nuevoMov.categoria
          }]
        };

        const res = await fetch("/api/admin/gastos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gastoPayload),
        });

        if (res.ok) {
          console.log("Inventario Page: Gasto e Inventario registrados con éxito");
          setShowMovModal(false);
          fetchData();
        } else {
          const err = await res.json();
          setError(err.error?.message || "Error al registrar gasto/inventario");
        }
      } else {
        // Lógica normal de Inventario
        console.log("Inventario Page: Registering movement...", { ...nuevoMov, tipo_movimiento: tipoMov });
        const res = await fetch("/api/admin/inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...nuevoMov, tipo_movimiento: tipoMov }),
        });
        if (res.ok) { 
          const result = await res.json();
          console.log("Inventario Page: Movement registered successfully:", result);
          setShowMovModal(false); 
          fetchData(); 
        } else { 
          const err = await res.json(); 
          console.error("Inventario Page: API Error (Movimiento):", err);
          setError(err.error || "Error al registrar"); 
        }
      }
    } catch (e) { 
      console.error("Inventario Page: Connection error:", e);
      setError("Error de red"); 
    } finally { setSaving(false); }
  };

  const handleSaveArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    console.log("Inventario Page: Saving article...", nuevoArticulo);
    try {
      const method = nuevoArticulo.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/articulos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoArticulo),
      });
      if (res.ok) { 
        const result = await res.json();
        console.log("Inventario Page: Article saved successfully:", result);
        setShowArticuloModal(false); 
        setNuevoArticulo({ id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 1, descripcion: "", ubicacion_almacen: "Almacén PB" }); 
        fetchData(); 
      } else {
        const err = await res.json();
        console.error("Inventario Page: API Error (Articulo):", err);
        setError(err.error || "Error al guardar artículo");
      }
    } catch (e) { 
      console.error("Inventario Page: Connection error (Articulo):", e);
      setError("Error de red"); 
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventario / Almacén</h1>
            <div className="flex gap-4 mt-2">
              <button onClick={() => setView("stock")} className={`text-xs font-black pb-1 border-b-2 uppercase tracking-widest ${view === 'stock' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent'}`}>STOCK ACTUAL</button>
              <button onClick={() => setView("catalogo")} className={`text-xs font-black pb-1 border-b-2 uppercase tracking-widest ${view === 'catalogo' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent'}`}>CATÁLOGO MAESTRO</button>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => { setTipoMov("Entrada"); setShowMovModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase">⬆️ Entrada</button>
            <button onClick={() => { setTipoMov("Salida"); setShowMovModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs uppercase">⬇️ Salida</button>
            <button onClick={() => { setNuevoArticulo({id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 1, descripcion: "", ubicacion_almacen: "Almacén PB"}); setShowArticuloModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xs uppercase">➕ Nuevo Artículo</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl">⚠️ {error}</div>}

        {view === "stock" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(it => (
              <div key={it.nombre} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">{it.categoria}</span>
                  <span className={`text-2xl font-black ${it.cantidad <= 0 ? 'text-red-500' : it.cantidad <= 1 ? 'text-yellow-500' : 'text-white'}`}>{it.cantidad}</span>
                </div>
                <h3 className="text-white font-bold text-sm uppercase truncate mb-1">{it.nombre}</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase">{it.unidad}</p>
                {it.cantidad <= 1 && <div className="mt-3 text-[9px] font-black text-red-400 uppercase tracking-tighter animate-pulse">⚠️ Reponer Stock</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4">Stock Mín.</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {catalogo.map(art => (
                  <tr key={art.id} className="hover:bg-neutral-750">
                    <td className="p-4">
                      <div className="text-white font-bold uppercase">{art.nombre}</div>
                      <div className="text-[10px] text-neutral-500 mt-1 italic">{art.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="p-4 text-neutral-400 font-medium uppercase text-xs">{art.ubicacion_almacen}</td>
                    <td className="p-4 text-neutral-400 font-medium">{art.stock_minimo} {art.unidad_medida}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => { setNuevoArticulo(art); setShowArticuloModal(true); }} className="text-[10px] bg-neutral-700 px-3 py-1.5 rounded text-emerald-400 font-black uppercase hover:bg-neutral-600 transition-colors">EDITAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL MOVIMIENTO */}
      {showMovModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8 w-full max-w-md shadow-2xl my-auto">
            <h3 className={`text-xl font-bold mb-6 uppercase ${tipoMov === 'Entrada' ? 'text-emerald-500' : 'text-red-500'}`}>Registrar {tipoMov}</h3>
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Artículo</label>
                <select 
                  required 
                  className="w-full bg-neutral-700 p-3 rounded-lg text-white font-bold" 
                  onChange={e => {
                    const art = catalogo.find(c => c.nombre === e.target.value);
                    setNuevoMov({...nuevoMov, articulo_nombre: e.target.value, unidad: art?.unidad_medida || 'Unidad', categoria: art?.categoria || 'Otros'});
                  }}
                >
                  <option value="">Seleccione...</option>
                  {catalogo.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </div>

              {tipoMov === 'Entrada' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="vincular" 
                    checked={vincularGasto} 
                    onChange={e => setVincularGasto(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <label htmlFor="vincular" className="text-xs font-bold text-emerald-400 uppercase cursor-pointer">Vincular a Gasto / Factura</label>
                </div>
              )}

              {vincularGasto && tipoMov === 'Entrada' && (
                <div className="space-y-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-700">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Proveedor</label>
                    <select 
                      required={vincularGasto}
                      className="w-full bg-neutral-700 p-2 rounded-lg text-white text-xs font-bold"
                      onChange={e => setNuevoMov({...nuevoMov, proveedor_id: e.target.value})}
                    >
                      <option value="">Seleccione Proveedor...</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nro Factura</label>
                      <input 
                        type="text" 
                        required={vincularGasto}
                        className="w-full bg-neutral-700 p-2 rounded-lg text-white text-xs"
                        onChange={e => setNuevoMov({...nuevoMov, numero_comprobante: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Fecha</label>
                      <input 
                        type="date" 
                        required={vincularGasto}
                        value={nuevoMov.fecha_factura}
                        className="w-full bg-neutral-700 p-2 rounded-lg text-white text-xs"
                        onChange={e => setNuevoMov({...nuevoMov, fecha_factura: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Monto USD</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required={vincularGasto}
                        className="w-full bg-neutral-700 p-2 rounded-lg text-white text-xs"
                        onChange={e => setNuevoMov({...nuevoMov, monto_usd: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Monto Bs.</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-neutral-700 p-2 rounded-lg text-white text-xs"
                        onChange={e => setNuevoMov({...nuevoMov, monto_bs: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Cantidad</label>
                  <input type="number" required step="1" min="1" className="w-full bg-neutral-700 p-3 rounded-lg text-white" onChange={e => setNuevoMov({...nuevoMov, cantidad: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{tipoMov === 'Entrada' ? 'Origen' : 'Entregado a'}</label>
                  <input type="text" required className="w-full bg-neutral-700 p-3 rounded-lg text-white" onChange={e => setNuevoMov({...nuevoMov, recibido_por: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Observaciones</label>
                <textarea rows={2} className="w-full bg-neutral-700 p-3 rounded-lg text-white text-xs" onChange={e => setNuevoMov({...nuevoMov, observaciones: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className={`flex-1 py-3 rounded-xl font-black text-white uppercase ${tipoMov === 'Entrada' ? 'bg-emerald-600' : 'bg-red-600'}`}>{saving ? '...' : 'Confirmar'}</button>
                <button type="button" onClick={() => setShowMovModal(false)} className="flex-1 bg-neutral-700 py-3 rounded-xl font-black text-white uppercase">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ARTICULO */}
      {showArticuloModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 uppercase">Configurar Artículo en Catálogo</h3>
            <form onSubmit={handleSaveArticulo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre Exacto</label>
                <input 
                  type="text" 
                  required 
                  value={nuevoArticulo.nombre} 
                  className="w-full bg-neutral-800 p-3 rounded-lg text-white font-bold" 
                  onChange={e => setNuevoArticulo({...nuevoArticulo, nombre: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Descripción / Detalle</label>
                <input 
                  type="text" 
                  value={nuevoArticulo.descripcion || ""} 
                  className="w-full bg-neutral-800 p-3 rounded-lg text-white text-sm" 
                  placeholder="Ej: Led 12W 6500k Luz Blanca" 
                  onChange={e => setNuevoArticulo({...nuevoArticulo, descripcion: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Categoría</label>
                  <select 
                    value={nuevoArticulo.categoria} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, categoria: e.target.value})}
                  >
                    <option value="Iluminación">Iluminación</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Plomería">Plomería</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Ubicación Física</label>
                  <input 
                    type="text" 
                    value={nuevoArticulo.ubicacion_almacen || ""} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white" 
                    placeholder="Ej: Almacén PB" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, ubicacion_almacen: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Unidad de Medida</label>
                  <input 
                    type="text" 
                    value={nuevoArticulo.unidad_medida || ""} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white" 
                    placeholder="Ej: Galón" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, unidad_medida: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Stock Mínimo</label>
                  <input 
                    type="number" 
                    value={nuevoArticulo.stock_minimo || 0} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, stock_minimo: parseInt(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-white uppercase tracking-widest">{saving ? '...' : 'Guardar en Catálogo'}</button>
                <button type="button" onClick={() => setShowArticuloModal(false)} className="flex-1 bg-neutral-700 py-3 rounded-xl font-black text-white uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
