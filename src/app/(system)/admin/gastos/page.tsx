"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateForInput, parseDateFromUI } from "@/lib/formatters";

export default function GastosPage() {
  const router = useRouter();
  const [gastos, setGastos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showNewProvModal, setShowNewProvModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [nuevoProv, setNuevoProv] = useState({ nombre: "", rif_cedula: "", categoria: "Otros" });
  
  const initialGasto = {
    proveedor_id: "",
    posee_comprobante: true,
    fecha_factura: new Date().toISOString().split('T')[0],
    fecha_ejecucion: new Date().toISOString().split('T')[0],
    numero_comprobante: "",
    concepto_descripcion: "",
    monto_usd: "",
    monto_bs: "",
    tasa_bcv_factura: "",
    tipo_mantenimiento: "Preventivo",
    categoria_gasto: "Mantenimiento Recurrente",
    metodo_pago_sugerido: "Administradora",
    hallazgos_anomalias: "",
    fecha_proximo_mantenimiento: "",
    responsable_autoriza: "",
    fecha_envio_administradora: "",
    pagador_nombre: "",
    items: [
      { articulo_nombre: "", categoria: "", cantidad: 1, unidad: "Unidad", monto_renglon_bs: 0 }
    ]
  };

  const [nuevoGasto, setNuevaGasto] = useState(initialGasto);
  const [tasaHoy, setTasaHoy] = useState<number>(0);

  useEffect(() => {
    fetchData();
    fetch("/api/cron/tasas")
      .then(res => res.json())
      .then(data => {
        if (data.tasas?.dolar) {
          setTasaHoy(data.tasas.dolar);
          setNuevaGasto(prev => ({ ...prev, tasa_bcv_factura: data.tasas.dolar.toString() }));
        }
      })
      .catch(() => {});
  }, []);

  const handleBsChange = (val: string) => {
    const bs = parseFloat(val) || 0;
    const tasa = parseFloat(nuevoGasto.tasa_bcv_factura as string) || tasaHoy || 1;
    const usd = bs / tasa;
    setNuevaGasto({
      ...nuevoGasto,
      monto_bs: val,
      monto_usd: usd.toFixed(2),
      tasa_bcv_factura: tasa.toString()
    });
  };

  const handleUsdChange = (val: string) => {
    const usd = parseFloat(val) || 0;
    const tasa = parseFloat(nuevoGasto.tasa_bcv_factura as string) || tasaHoy || 1;
    const bs = usd * tasa;
    setNuevaGasto({
      ...nuevoGasto,
      monto_usd: val,
      monto_bs: bs.toFixed(2),
      tasa_bcv_factura: tasa.toString()
    });
  };

  const handleTasaChange = (val: string) => {
    const tasa = parseFloat(val) || 0;
    const bs = parseFloat(nuevoGasto.monto_bs as string) || 0;
    const usd = tasa > 0 ? bs / tasa : 0;
    setNuevaGasto({
      ...nuevoGasto,
      tasa_bcv_factura: val,
      monto_usd: usd.toFixed(2)
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGastos, resProvs] = await Promise.all([
        fetch("/api/admin/gastos"),
        fetch("/api/admin/proveedores")
      ]);
      setGastos(await resGastos.json());
      setProveedores(await resProvs.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateProv = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProv),
      });
      if (res.ok) {
        const data = await res.json();
        setProveedores([data, ...proveedores]);
        setNuevaGasto({ ...nuevoGasto, proveedor_id: data.id });
        setShowNewProvModal(false);
      }
    } catch (err) { alert("Error al crear proveedor"); }
    finally { setSaving(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validar montos de renglones vs monto total
    const totalRenglones = nuevoGasto.items.reduce((acc, it) => acc + (parseFloat(it.monto_renglon_bs as any) || 0), 0);
    const montoTotalBs = parseFloat(nuevoGasto.monto_bs as string) || 0;
    
    if (nuevoGasto.items.some(it => it.articulo_nombre !== "") && Math.abs(totalRenglones - montoTotalBs) > 0.01) {
      alert(`El total de los renglones (Bs. ${totalRenglones.toFixed(2)}) no coincide con el monto total del gasto (Bs. ${montoTotalBs.toFixed(2)}).`);
      return;
    }

    setSaving(true);
    try {
      const { items, ...gastoData } = nuevoGasto as any;
      
      const data = {
        ...gastoData,
        monto_usd: parseFloat(nuevoGasto.monto_usd as string) || 0,
        monto_bs: montoTotalBs,
        tasa_bcv_factura: parseFloat(nuevoGasto.tasa_bcv_factura as string) || 0,
        items: nuevoGasto.items.filter(it => it.articulo_nombre !== "")
      };
      
      const res = await fetch("/api/admin/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        setNuevaGasto(initialGasto);
        fetchData();
      }
    } catch (err) { alert("Error al guardar"); }
    finally { setSaving(false); }
  };

  const addRow = () => {
    if (nuevoGasto.items.length < 5) {
      setNuevaGasto({
        ...nuevoGasto,
        items: [...nuevoGasto.items, { articulo_nombre: "", categoria: "", cantidad: 1, unidad: "Unidad", monto_renglon_bs: 0 }]
      });
    }
  };

  const filtered = gastos.filter(g => 
    g.proveedores?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    g.concepto_descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Control de Gastos e Inventario</h1>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
            + REGISTRAR FACTURA / NOTA
          </button>
        </div>

        {/* Tabla simplificada similar al anterior pero con filtros */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Concepto</th>
                <th className="p-3 text-right">Monto USD</th>
                <th className="p-3 text-right">Monto Bs.</th>
                <th className="p-3">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id} className="border-t border-neutral-700 hover:bg-neutral-750">
                  <td className="p-3 text-white">{formatDate(g.fecha_factura)}</td>
                  <td className="p-3 text-emerald-400 font-bold">{g.proveedores?.nombre}</td>
                  <td className="p-3 text-neutral-400 truncate max-w-xs">{g.concepto_descripcion}</td>
                  <td className="p-3 text-right font-mono">${g.monto_usd}</td>
                  <td className="p-3 text-right text-emerald-500 font-mono">Bs. {g.monto_bs}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-900 text-yellow-200 uppercase font-bold">{g.estatus_pago}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Principal de Gasto */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-4xl shadow-2xl my-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Registro de Gasto / Movimiento</h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Bloque 1: Proveedor */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Proveedor (Buscador)</label>
                  <div className="flex gap-2">
                    <input
                      list="proveedores-datalist"
                      required
                      value={proveedores.find(p => p.id === nuevoGasto.proveedor_id)?.nombre || ""}
                      onChange={e => {
                        const p = proveedores.find(x => x.nombre === e.target.value);
                        setNuevaGasto({...nuevoGasto, proveedor_id: p ? p.id : ""});
                      }}
                      placeholder="Buscar por nombre..."
                      className="flex-1 bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white focus:border-emerald-500"
                    />
                    <datalist id="proveedores-datalist">
                      {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.rif_cedula}</option>)}
                    </datalist>
                    <button 
                      type="button" 
                      onClick={() => setShowNewProvModal(true)}
                      className="px-4 py-2 bg-neutral-700 text-emerald-400 rounded-lg hover:bg-neutral-600 font-bold border border-emerald-500/30"
                    >
                      + NUEVO
                    </button>
                  </div>
                </div>
                <div>
                   <label className="flex items-center gap-2 text-white cursor-pointer mb-4">
                     <input 
                       type="checkbox" 
                       checked={nuevoGasto.posee_comprobante} 
                       onChange={e => setNuevaGasto({...nuevoGasto, posee_comprobante: e.target.checked})}
                       className="w-4 h-4"
                     />
                     <span className="text-sm">¿Posee Factura/Nota?</span>
                   </label>
                </div>
              </div>

              {/* Bloque 2: Datos del Comprobante */}
              <div className="grid md:grid-cols-4 gap-4 bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Fecha Factura</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formatDateForInput(nuevoGasto.fecha_factura)} 
                      onChange={e => setNuevaGasto({...nuevoGasto, fecha_factura: parseDateFromUI(e.target.value)})} 
                      className="w-full bg-neutral-800 p-2 pr-10 rounded text-white" 
                      placeholder="dd/mm/yyyy" 
                    />
                    <input 
                      type="date" 
                      value={nuevoGasto.fecha_factura} 
                      onChange={e => setNuevaGasto({...nuevoGasto, fecha_factura: e.target.value})} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-lg">📅</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Fecha Ejecución</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formatDateForInput(nuevoGasto.fecha_ejecucion)} 
                      onChange={e => setNuevaGasto({...nuevoGasto, fecha_ejecucion: parseDateFromUI(e.target.value)})} 
                      className="w-full bg-neutral-800 p-2 pr-10 rounded text-white" 
                      placeholder="dd/mm/yyyy" 
                    />
                    <input 
                      type="date" 
                      value={nuevoGasto.fecha_ejecucion} 
                      onChange={e => setNuevaGasto({...nuevoGasto, fecha_ejecucion: e.target.value})} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-lg">📅</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nº Comprobante</label>
                  <input type="text" value={nuevoGasto.numero_comprobante} onChange={e => setNuevaGasto({...nuevoGasto, numero_comprobante: e.target.value})} className="w-full bg-neutral-800 p-2 rounded text-white" placeholder="S/N" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1 text-emerald-400 font-bold">Monto Bs.</label>
                  <input type="number" step="0.01" value={nuevoGasto.monto_bs} onChange={e => handleBsChange(e.target.value)} className="w-full bg-neutral-800 p-2 rounded text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tasa BCV</label>
                  <input type="number" step="0.0001" value={nuevoGasto.tasa_bcv_factura} onChange={e => handleTasaChange(e.target.value)} className="w-full bg-neutral-800 p-2 rounded text-white font-bold text-emerald-400" />
                </div>
                <div className="md:col-start-3">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Monto USD</label>
                  <input type="number" step="0.01" value={nuevoGasto.monto_usd} onChange={e => handleUsdChange(e.target.value)} className="w-full bg-neutral-800 p-2 rounded text-white" />
                </div>
              </div>

              {/* Bloque 3: Renglones de Inventario (Si es Insumos/Otros) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-emerald-500 flex justify-between">
                  RENGLONES DE LA NOTA / ARTÍCULOS 
                  <button type="button" onClick={addRow} className="text-xs bg-emerald-900/30 px-2 py-1 rounded">+ Agregar Renglón</button>
                </h4>
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-neutral-500 uppercase px-2">
                  <div className="col-span-1">Cant</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-4">Artículo/Nombre</div>
                  <div className="col-span-3">Categoría</div>
                  <div className="col-span-2 text-right">Monto Bs.</div>
                </div>
                {nuevoGasto.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input type="number" value={it.cantidad} onChange={e => {
                      const items = [...nuevoGasto.items];
                      items[idx].cantidad = parseFloat(e.target.value);
                      setNuevaGasto({...nuevoGasto, items});
                    }} className="col-span-1 bg-neutral-800 p-2 rounded text-white text-xs" />
                    
                    <select value={it.unidad} onChange={e => {
                      const items = [...nuevoGasto.items];
                      items[idx].unidad = e.target.value;
                      setNuevaGasto({...nuevoGasto, items});
                    }} className="col-span-2 bg-neutral-800 p-2 rounded text-white text-xs">
                       <option value="Unidad">Unid.</option>
                       <option value="Paquete">Paq.</option>
                       <option value="Galón">Gal.</option>
                       <option value="Litro">Lt.</option>
                    </select>

                    <input type="text" value={it.articulo_nombre} onChange={e => {
                      const items = [...nuevoGasto.items];
                      items[idx].articulo_nombre = e.target.value;
                      setNuevaGasto({...nuevoGasto, items});
                    }} className="col-span-4 bg-neutral-800 p-2 rounded text-white text-xs" placeholder="Ej: Bombillo LED" />
                    
                    <select value={it.categoria} onChange={e => {
                      const items = [...nuevoGasto.items];
                      items[idx].categoria = e.target.value;
                      setNuevaGasto({...nuevoGasto, items});
                    }} className="col-span-3 bg-neutral-800 p-2 rounded text-white text-xs">
                       <option value="">Categoría...</option>
                       <option value="Ascensor">Ascensor</option>
                       <option value="Bomba de Agua">Bomba de Agua</option>
                       <option value="Electricidad">Electricidad</option>
                       <option value="Plomería">Plomería</option>
                       <option value="Iluminación">Iluminación</option>
                       <option value="Limpieza">Limpieza</option>
                       <option value="CCTV / Cámaras">CCTV / Cámaras</option>
                       <option value="Jardinería">Jardinería</option>
                       <option value="Pintura">Pintura</option>
                       <option value="Insumos">Insumos</option>
                       <option value="Otros">Otros</option>
                    </select>

                    <input type="number" value={it.monto_renglon_bs} onChange={e => {
                      const items = [...nuevoGasto.items];
                      items[idx].monto_renglon_bs = parseFloat(e.target.value);
                      setNuevaGasto({...nuevoGasto, items});
                    }} className="col-span-2 bg-neutral-800 p-2 rounded text-white text-xs text-right" />
                  </div>
                ))}
              </div>

              {/* Bloque 4: Método de Pago Detallado */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Método de Pago</label>
                  <select
                    value={nuevoGasto.metodo_pago_sugerido}
                    onChange={e => setNuevaGasto({...nuevoGasto, metodo_pago_sugerido: e.target.value})}
                    className="w-full bg-neutral-800 p-3 rounded-lg text-white"
                  >
                    <option value="Administradora">Administradora</option>
                    <option value="Caja Chica">Caja Chica</option>
                    <option value="Pago Móvil">Transferencia/P.Móvil</option>
                  </select>
                </div>
                {nuevoGasto.metodo_pago_sugerido === 'Administradora' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Fecha Envío a Admin.</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formatDateForInput(nuevoGasto.fecha_envio_administradora)} 
                        onChange={e => setNuevaGasto({...nuevoGasto, fecha_envio_administradora: parseDateFromUI(e.target.value)})} 
                        className="w-full bg-neutral-800 p-3 rounded-lg text-white" 
                        placeholder="dd/mm/yyyy" 
                      />
                      <input 
                        type="date" 
                        value={nuevoGasto.fecha_envio_administradora} 
                        onChange={e => setNuevaGasto({...nuevoGasto, fecha_envio_administradora: e.target.value})} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lg">📅</span>
                    </div>
                  </div>
                )}
                {nuevoGasto.metodo_pago_sugerido === 'Pago Móvil' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Pagador (Nombre)</label>
                    <input type="text" value={nuevoGasto.pagador_nombre} onChange={e => setNuevaGasto({...nuevoGasto, pagador_nombre: e.target.value})} className="w-full bg-neutral-800 p-3 rounded-lg text-white" placeholder="Ej: Juan (Apto 4C)" />
                  </div>
                )}
                <div>
                   <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Responsable Autoriza</label>
                   <input type="text" value={nuevoGasto.responsable_autoriza} onChange={e => setNuevaGasto({...nuevoGasto, responsable_autoriza: e.target.value})} className="w-full bg-neutral-800 p-3 rounded-lg text-white" placeholder="José / Junta" />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl transition-all">
                  {saving ? "PROCESANDO..." : "REGISTRAR GASTO Y MOVIMIENTOS"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl">
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Nuevo Proveedor Rápido */}
      {showNewProvModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h4 className="text-xl font-bold text-white mb-4">Nuevo Proveedor</h4>
            <form onSubmit={handleCreateProv} className="space-y-4">
              <input type="text" required placeholder="Nombre o Razón Social" className="w-full bg-neutral-700 p-3 rounded text-white" onChange={e => setNuevoProv({...nuevoProv, nombre: e.target.value})} />
              <input type="text" placeholder="RIF o Cédula" className="w-full bg-neutral-700 p-3 rounded text-white" onChange={e => setNuevoProv({...nuevoProv, rif_cedula: e.target.value})} />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 py-2 rounded font-bold text-white">GUARDAR</button>
                <button type="button" onClick={() => setShowNewProvModal(false)} className="flex-1 bg-neutral-700 py-2 rounded font-bold text-white">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
