"use client";
import { useState, useEffect } from "react";
import { formatDateForInput, parseDateFromUI } from "@/lib/formatters";

export default function InventarioPage() {
  const [view, setView] = useState<"stock" | "catalogo" | "reportes">("stock");
  const [items, setItems] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
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
  const [nuevoArticulo, setNuevoArticulo] = useState({ id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 1, descripcion: "", ubicacion_almacen: "Almacén PB", estado: "Activo" });

  useEffect(() => { fetchData(); }, [view]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    console.log("Inventario Page: Fetching data for view:", view);
    try {
      const fetches: any[] = [
        fetch("/api/admin/articulos"),
        fetch("/api/admin/proveedores")
      ];

      if (view === "stock") fetches.push(fetch("/api/admin/inventario"));
      if (view === "reportes") fetches.push(fetch("/api/admin/inventario?raw=true"));

      const results = await Promise.all(fetches);
      const catData = await results[0].json();
      const provData = await results[1].json();
      
      setCatalogo(Array.isArray(catData) ? catData : []);
      setProveedores(Array.isArray(provData) ? provData : []);

      if (view === "stock") {
        const stockData = await results[2].json();
        setItems(Array.isArray(stockData) ? stockData : []);
      }
      if (view === "reportes") {
        const movData = await results[2].json();
        setMovimientos(Array.isArray(movData) ? movData : []);
      }
    } catch (e) { 
      console.error("Inventario Page: Error fetching data:", e);
      setError("Error de conexión"); 
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (articuloId: string, nuevoEstado: string) => {
    try {
      const res = await fetch("/api/admin/articulos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articuloId, estado: nuevoEstado }),
      });
      if (res.ok) fetchData();
    } catch (e) { console.error("Error updating status:", e); }
  };

  const handleDeleteArticulo = async (articuloId: string) => {
    if (!confirm("¿Está seguro de eliminar este artículo? Si tiene movimientos registrados, la operación fallará y deberá ARCHIVARLO en su lugar.")) return;
    try {
      const res = await fetch(`/api/admin/articulos?id=${articuloId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
      else {
        const err = await res.json();
        alert(err.error || "No se pudo eliminar");
      }
    } catch (e) { console.error("Error deleting article:", e); }
  };

  const exportToCSV = () => {
    if (movimientos.length === 0) return;
    const headers = ["Fecha", "Tipo", "Artículo", "Cantidad", "Unidad", "Responsable/Origen", "Observaciones"];
    const rows = movimientos.map(m => [
      formatDateForInput(m.created_at),
      m.tipo_movimiento,
      m.articulo_nombre,
      m.cantidad,
      m.unidad,
      m.recibido_por,
      m.observaciones || ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        setNuevoArticulo({ id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 1, descripcion: "", ubicacion_almacen: "Almacén PB", estado: "Activo" }); 
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
              <button onClick={() => setView("reportes")} className={`text-xs font-black pb-1 border-b-2 uppercase tracking-widest ${view === 'reportes' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent'}`}>REPORTES / HISTORIAL</button>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {view === "reportes" && (
              <button onClick={exportToCSV} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs uppercase">📊 Exportar CSV</button>
            )}
            <button onClick={() => { setTipoMov("Entrada"); setShowMovModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase">⬆️ Entrada</button>
            <button onClick={() => { setTipoMov("Salida"); setShowMovModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-xs uppercase">⬇️ Salida</button>
            <button onClick={() => { setNuevoArticulo({id: "", nombre: "", categoria: "Otros", unidad_medida: "Unidad", stock_minimo: 1, descripcion: "", ubicacion_almacen: "Almacén PB", estado: "Activo"}); setShowArticuloModal(true); }} className="flex-1 md:flex-none px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xs uppercase">➕ Nuevo Artículo</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl">⚠️ {error}</div>}

        {view === "stock" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items
              .filter(it => {
                const art = catalogo.find(c => c.nombre.trim().toUpperCase() === it.nombre.trim().toUpperCase());
                return art ? art.estado !== 'Archivado' : true;
              })
              .map(it => (
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
        )}

        {view === "catalogo" && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Estado</th>
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
                    <td className="p-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                        art.estado === 'Activo' ? 'bg-emerald-900/40 text-emerald-400' :
                        art.estado === 'Suspendido' ? 'bg-orange-900/40 text-orange-400' :
                        art.estado === 'Archivado' ? 'bg-neutral-900 text-neutral-500' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {art.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-400 font-medium uppercase text-xs">{art.ubicacion_almacen}</td>
                    <td className="p-4 text-neutral-400 font-medium">{art.stock_minimo} {art.unidad_medida}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setNuevoArticulo(art); setShowArticuloModal(true); }} className="text-[9px] bg-neutral-700 px-2 py-1 rounded text-white font-bold hover:bg-neutral-600">EDITAR</button>
                        {art.estado === 'Activo' ? (
                          <button onClick={() => handleUpdateStatus(art.id, 'Inactivo')} className="text-[9px] bg-orange-900/30 px-2 py-1 rounded text-orange-400 font-bold hover:bg-orange-900/50 uppercase">Desactivar</button>
                        ) : (
                          <button onClick={() => handleUpdateStatus(art.id, 'Activo')} className="text-[9px] bg-emerald-900/30 px-2 py-1 rounded text-emerald-400 font-bold hover:bg-emerald-900/50 uppercase">Activar</button>
                        )}
                        <button onClick={() => handleUpdateStatus(art.id, 'Archivado')} className="text-[9px] bg-neutral-900 px-2 py-1 rounded text-neutral-500 font-bold hover:bg-neutral-950 uppercase">Archivar</button>
                        <button onClick={() => handleDeleteArticulo(art.id)} className="text-[9px] bg-red-900/30 px-2 py-1 rounded text-red-400 font-bold hover:bg-red-900/50 uppercase">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === "reportes" && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-neutral-700/50 border-b border-neutral-700 flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Historial Reciente de Movimientos</h3>
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{movimientos.length} REGISTROS ENCONTRADOS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Artículo</th>
                    <th className="p-4">Cant.</th>
                    <th className="p-4">Responsable / Origen</th>
                    <th className="p-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-neutral-750 text-xs">
                      <td className="p-4 text-neutral-400 whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`font-black uppercase px-2 py-0.5 rounded ${m.tipo_movimiento === 'Entrada' ? 'bg-emerald-900/30 text-emerald-500' : 'bg-red-900/30 text-red-500'}`}>
                          {m.tipo_movimiento === 'Entrada' ? '⬆️' : '⬇️'} {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="p-4 text-white font-bold uppercase">{m.articulo_nombre}</td>
                      <td className="p-4 text-white font-black">{m.cantidad} <span className="text-neutral-500 font-normal">{m.unidad}</span></td>
                      <td className="p-4 text-neutral-300 font-medium">{m.recibido_por}</td>
                      <td className="p-4 text-neutral-500 italic max-w-xs truncate">{m.observaciones || '-'}</td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-neutral-500 font-bold uppercase italic">No se han registrado movimientos aún</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  {catalogo.filter(c => c.estado === 'Activo').map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
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
                      <div className="relative">
                        <input 
                          type="text" 
                          required={vincularGasto}
                          value={formatDateForInput(nuevoMov.fecha_factura)}
                          className="w-full bg-neutral-700 p-2 pr-8 rounded-lg text-white text-xs"
                          placeholder="dd/mm/yyyy"
                          onChange={e => setNuevoMov({...nuevoMov, fecha_factura: parseDateFromUI(e.target.value)})}
                        />
                        <input 
                          type="date" 
                          required={vincularGasto}
                          value={nuevoMov.fecha_factura}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer z-10"
                          onChange={e => setNuevoMov({...nuevoMov, fecha_factura: e.target.value})}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm">📅</span>
                      </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre Exacto</label>
                  <input 
                    type="text" 
                    required 
                    value={nuevoArticulo.nombre} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white font-bold" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, nombre: e.target.value})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Descripción / Detalle</label>
                  <input 
                    type="text" 
                    value={nuevoArticulo.descripcion || ""} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white text-sm" 
                    placeholder="Ej: Led 12W 6500k Luz Blanca" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, descripcion: e.target.value})} 
                  />
                </div>
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
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Estado del Producto</label>
                  <select 
                    value={nuevoArticulo.estado} 
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white font-bold" 
                    onChange={e => setNuevoArticulo({...nuevoArticulo, estado: e.target.value})}
                  >
                    <option value="Activo">✅ Activo</option>
                    <option value="Inactivo">❌ Inactivo</option>
                    <option value="Suspendido">🟠 Suspendido</option>
                    <option value="Archivado">📁 Archivado</option>
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
