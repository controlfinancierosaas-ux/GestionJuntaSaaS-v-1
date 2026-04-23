"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateForInput, parseDateFromUI } from "@/lib/formatters";

export default function GastosPage() {
  const router = useRouter();
  const [gastos, setGastos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [articulos, setArticulos] = useState<any[]>([]);
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
    estatus_pago: "Pendiente",
    items: []
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

  const [filterEstatus, setFilterEstatus] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGastos, resProvs, resArts] = await Promise.all([
        fetch("/api/admin/gastos"),
        fetch("/api/admin/proveedores"),
        fetch("/api/admin/articulos")
      ]);
      setGastos(await resGastos.json());
      setProveedores(await resProvs.json());
      setArticulos(await resArts.json());
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

  const handleEdit = (g: any) => {
    setEditingId(g.id);
    setNuevaGasto({
      proveedor_id: g.proveedor_id || "",
      posee_comprobante: g.posee_comprobante ?? true,
      fecha_factura: g.fecha_factura || "",
      fecha_ejecucion: g.fecha_ejecucion || "",
      numero_comprobante: g.numero_comprobante || "",
      concepto_descripcion: g.concepto_descripcion || "",
      monto_usd: g.monto_usd?.toString() || "",
      monto_bs: g.monto_bs?.toString() || "",
      tasa_bcv_factura: g.tasa_bcv_factura?.toString() || "",
      tipo_mantenimiento: g.tipo_mantenimiento || "Preventivo",
      categoria_gasto: g.categoria_gasto || "Mantenimiento Recurrente",
      metodo_pago_sugerido: g.metodo_pago_sugerido || "Administradora",
      hallazgos_anomalias: g.hallazgos_anomalias || "",
      fecha_proximo_mantenimiento: g.fecha_proximo_mantenimiento || "",
      responsable_autoriza: g.responsable_autoriza || "",
      fecha_envio_administradora: g.fecha_envio_administradora || "",
      pagador_nombre: g.pagador_nombre || "",
      estatus_pago: g.estatus_pago || "Pendiente",
      items: [] // Los items no se editan por ahora para simplificar, o podrías traerlos si los necesitas
    });
    setShowModal(true);
  };

  const updateStatus = async (id: string, nuevoEstatus: string) => {
    try {
      const res = await fetch(`/api/admin/gastos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estatus_pago: nuevoEstatus,
          fecha_pago: nuevoEstatus === "Pagado" ? new Date().toISOString().split('T')[0] : null
        }),
      });
      if (res.ok) fetchData();
      else alert("Error al actualizar estatus");
    } catch (err) { alert("Error de conexión"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const montoTotalBs = parseFloat(nuevoGasto.monto_bs as string) || 0;
    const esInventario = nuevoGasto.categoria_gasto === "Compra para Inventario";
    
    // Solo procesamos items si es explícitamente una Compra para Inventario
    let itemsValidos: any[] = [];
    if (esInventario) {
      itemsValidos = nuevoGasto.items ? nuevoGasto.items.filter((it: any) => it.articulo_nombre && it.articulo_nombre.trim() !== "") : [];
      
      if (itemsValidos.length === 0) {
        alert("Si seleccionó 'Compra para Inventario', debe agregar al menos un artículo.");
        return;
      }

      const totalRenglones = itemsValidos.reduce((acc, it) => acc + (parseFloat(it.monto_renglon_bs as any) || 0), 0);
      if (Math.abs(totalRenglones - montoTotalBs) > 0.01) {
        alert(`El total de los renglones (Bs. ${totalRenglones.toFixed(2)}) no coincide con el monto total de la factura (Bs. ${montoTotalBs.toFixed(2)}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const { items, ...gastoData } = nuevoGasto as any;
      
      const data = {
        ...gastoData,
        monto_usd: parseFloat(nuevoGasto.monto_usd as string) || 0,
        monto_bs: montoTotalBs,
        tasa_bcv_factura: parseFloat(nuevoGasto.tasa_bcv_factura as string) || 0,
        items: esInventario ? itemsValidos : [] // SOLO mandamos items si es compra de inventario
      };
      
      const url = editingId ? `/api/admin/gastos/${editingId}` : "/api/admin/gastos";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setNuevaGasto(initialGasto);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Error al guardar: ${errData.error || res.statusText}`);
      }
    } catch (err: any) { 
      alert("Error crítico al guardar: " + err.message); 
    }
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

  const filtered = gastos.filter(g => {
    const matchSearch = g.proveedores?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                        g.concepto_descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchEstatus = filterEstatus === "Todos" || g.estatus_pago === filterEstatus;
    return matchSearch && matchEstatus;
  });

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pagado': return 'bg-emerald-900 text-emerald-200';
      case 'Enviado a Administradora': return 'bg-blue-900 text-blue-200';
      default: return 'bg-yellow-900 text-yellow-200';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Control de Gastos</h1>
            <p className="text-neutral-400 text-sm">Seguimiento de facturas, pagos y movimientos de almacén</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setNuevaGasto(initialGasto); setShowModal(true); }} 
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all"
          >
            + REGISTRAR FACTURA / NOTA
          </button>
        </div>

        {/* Filtros y Buscador */}
        <div className="flex flex-wrap gap-3 mb-6 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
          <input 
            type="text" 
            placeholder="Buscar por proveedor o concepto..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[250px] bg-neutral-800 border border-neutral-700 p-2.5 rounded-lg text-white text-sm"
          />
          <div className="flex gap-2">
            {["Todos", "Pendiente", "Enviado a Administradora", "Pagado"].map(est => (
              <button
                key={est}
                onClick={() => setFilterEstatus(est)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filterEstatus === est ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Mejorada */}
        <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-800/50 text-neutral-500 uppercase text-[10px] font-black tracking-widest border-b border-neutral-800">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Proveedor</th>
                  <th className="p-4">Concepto / Descripción</th>
                  <th className="p-4 text-right">Monto Total</th>
                  <th className="p-4">Estatus</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filtered.map(g => (
                  <tr key={g.id} className="hover:bg-neutral-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="text-white font-medium">{formatDate(g.fecha_factura)}</div>
                      <div className="text-[10px] text-neutral-500">Reg: {formatDate(g.created_at)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-emerald-400 font-bold">{g.proveedores?.nombre || "Sin proveedor"}</div>
                      <div className="text-[10px] text-neutral-500">{g.proveedores?.rif_cedula}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-neutral-300 line-clamp-1">{g.concepto_descripcion}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">{g.categoria_gasto}</span>
                        {g.incidencias && <span className="text-[9px] bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-400">Ref: {g.incidencias.codigo_personalizado}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-white font-mono font-bold">Bs. {g.monto_bs}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">${g.monto_usd} USD</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${getEstatusColor(g.estatus_pago)}`}>
                        {g.estatus_pago}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(g)}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-all"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {g.estatus_pago === 'Pendiente' && g.metodo_pago_sugerido === 'Administradora' && (
                          <button 
                            onClick={() => updateStatus(g.id, 'Enviado a Administradora')}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[9px] font-bold uppercase transition-all"
                          >
                            Enviar Admin
                          </button>
                        )}
                        {g.estatus_pago !== 'Pagado' && (
                          <button 
                            onClick={() => updateStatus(g.id, 'Pagado')}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[9px] font-bold uppercase transition-all"
                          >
                            Pagado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-neutral-600 font-medium">
              No se encontraron gastos con estos criterios.
            </div>
          )}
        </div>
      </div>

      {/* Modal Principal de Gasto */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-4xl shadow-2xl my-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingId ? "Editar Registro de Gasto" : "Nuevo Registro de Gasto"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              {/* Bloque: Estatus (solo en edición) */}
              {editingId && (
                <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Estatus de Pago Actual:</span>
                  <select 
                    value={nuevoGasto.estatus_pago}
                    onChange={e => setNuevaGasto({...nuevoGasto, estatus_pago: e.target.value})}
                    className="bg-neutral-800 border border-neutral-700 p-2 rounded-lg text-white text-sm"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Enviado a Administradora">Enviado a Administradora</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
              )}
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
                      className="px-4 py-2 bg-neutral-700 text-emerald-400 rounded-lg hover:bg-neutral-600 font-bold border border-emerald-500/30 text-[10px] uppercase whitespace-nowrap"
                    >
                      + NUEVO PROVEEDOR
                    </button>
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Clasificación del Gasto</label>
                  <select
                    value={nuevoGasto.categoria_gasto}
                    onChange={e => {
                      const val = e.target.value;
                      // Si cambia a inventario, asegurar que tenga al menos un item inicial
                      setNuevaGasto({
                        ...nuevoGasto, 
                        categoria_gasto: val,
                        items: val === "Compra para Inventario" ? [{ articulo_nombre: "", categoria: "", cantidad: 1, unidad: "Unidad", monto_renglon_bs: 0 }] : []
                      });
                    }}
                    className="w-full bg-neutral-800 border border-emerald-500/50 p-3 rounded-lg text-white text-sm focus:ring-2 ring-emerald-500/20"
                  >
                    <option value="Mantenimiento Recurrente">Mantenimiento Recurrente</option>
                    <option value="Reparación Puntual">Reparación Puntual</option>
                    <option value="Compra para Inventario">📦 Compra para INVENTARIO</option>
                    <option value="Insumos / Repuestos">Insumos / Repuestos (Uso inmediato)</option>
                    <option value="Servicios Básicos">Servicios Básicos (Luz/Agua/etc)</option>
                    <option value="Honorarios Profesionales">Honorarios Profesionales</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              {/* Bloque Extra: Tipo de Mantenimiento */}
              <div className="grid md:grid-cols-2 gap-4 bg-emerald-900/5 p-4 rounded-xl border border-emerald-500/10">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tipo de Servicio</label>
                  <div className="flex gap-4">
                    {["Preventivo", "Correctivo", "Mejora", "Emergencia"].map(tipo => (
                      <label key={tipo} className="flex items-center gap-2 text-white cursor-pointer group">
                        <input 
                          type="radio" 
                          name="tipo_mant"
                          checked={nuevoGasto.tipo_mantenimiento === tipo}
                          onChange={() => setNuevaGasto({...nuevoGasto, tipo_mantenimiento: tipo})}
                          className="w-4 h-4 accent-emerald-500"
                        />
                        <span className="text-xs group-hover:text-emerald-400 transition-colors">{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                   <label className="flex items-center gap-2 text-white cursor-pointer mt-4 md:mt-0 justify-end h-full">
                     <input 
                       type="checkbox" 
                       checked={nuevoGasto.posee_comprobante} 
                       onChange={e => setNuevaGasto({...nuevoGasto, posee_comprobante: e.target.checked})}
                       className="w-4 h-4 accent-emerald-500"
                     />
                     <span className="text-sm font-bold">¿Posee Factura/Nota Física?</span>
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

              {/* Bloque 3: Renglones de Inventario (SOLO si es Compra para Inventario) */}
              {nuevoGasto.categoria_gasto === "Compra para Inventario" && (
                <div className="space-y-3 bg-emerald-900/5 p-4 rounded-xl border border-emerald-500/20">
                  <h4 className="text-sm font-bold text-emerald-500 flex justify-between items-center">
                    ARTÍCULOS PARA CARGAR AL INVENTARIO
                    <button type="button" onClick={addRow} className="text-[10px] bg-emerald-600 px-2 py-1 rounded text-white">+ Agregar Artículo</button>
                  </h4>
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-neutral-500 uppercase px-2">
                    <div className="col-span-1">Cant</div>
                    <div className="col-span-2">Unidad</div>
                    <div className="col-span-7">Seleccionar Artículo del Catálogo</div>
                    <div className="col-span-2 text-right">Monto Bs.</div>
                  </div>
                  {nuevoGasto.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input type="number" value={it.cantidad} onChange={e => {
                        const items = [...nuevoGasto.items];
                        items[idx].cantidad = parseFloat(e.target.value);
                        setNuevaGasto({...nuevoGasto, items});
                      }} className="col-span-1 bg-neutral-800 p-2 rounded text-white text-xs border border-neutral-700" />
                      
                      <select value={it.unidad} onChange={e => {
                        const items = [...nuevoGasto.items];
                        items[idx].unidad = e.target.value;
                        setNuevaGasto({...nuevoGasto, items});
                      }} className="col-span-2 bg-neutral-800 p-2 rounded text-white text-xs border border-neutral-700">
                         <option value="Unidad">Unid.</option>
                         <option value="Paquete">Paq.</option>
                         <option value="Galón">Gal.</option>
                         <option value="Litro">Lt.</option>
                      </select>

                      <div className="col-span-7 relative">
                        <input 
                          list={`articulos-datalist-${idx}`}
                          value={it.articulo_nombre} 
                          onChange={e => {
                            const art = articulos.find(a => a.nombre === e.target.value);
                            const items = [...nuevoGasto.items];
                            items[idx].articulo_nombre = e.target.value;
                            if (art) items[idx].categoria = art.categoria;
                            setNuevaGasto({...nuevoGasto, items});
                          }} 
                          className="w-full bg-neutral-800 p-2 rounded text-white text-xs border border-neutral-700" 
                          placeholder="Buscar artículo..." 
                        />
                        <datalist id={`articulos-datalist-${idx}`}>
                          {articulos.map(a => <option key={a.id} value={a.nombre}>{a.categoria}</option>)}
                        </datalist>
                      </div>

                      <input type="number" step="0.01" value={it.monto_renglon_bs} onChange={e => {
                        const items = [...nuevoGasto.items];
                        items[idx].monto_renglon_bs = parseFloat(e.target.value);
                        setNuevaGasto({...nuevoGasto, items});
                      }} className="col-span-2 bg-neutral-800 p-2 rounded text-white text-xs text-right border border-neutral-700" />
                    </div>
                  ))}
                  <p className="text-[10px] text-emerald-500/70 italic">
                    * Estos artículos se sumarán automáticamente al stock de tu inventario al guardar.
                  </p>
                </div>
              )}

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
