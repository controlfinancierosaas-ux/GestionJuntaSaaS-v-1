"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GastosPage() {
  const router = useRouter();
  const [gastos, setGastos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevoGasto, setNuevaGasto] = useState({
    proveedor_id: "",
    fecha_factura: new Date().toISOString().split('T')[0],
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
    responsable_autoriza: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGastos, resProvs] = await Promise.all([
        fetch("/api/admin/gastos"),
        fetch("/api/admin/proveedores")
      ]);
      setGastos(await resGastos.json());
      setProveedores(await resProvs.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...nuevoGasto,
        monto_usd: parseFloat(nuevoGasto.monto_usd) || 0,
        monto_bs: parseFloat(nuevoGasto.monto_bs) || 0,
        tasa_bcv_factura: parseFloat(nuevoGasto.tasa_bcv_factura) || 0
      };
      const res = await fetch("/api/admin/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleMarcarPagado = async (gastoId: string) => {
    const fecha = prompt("Fecha de pago (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!fecha) return;
    const monto = prompt("Monto pagado en Bs.:");
    if (!monto) return;

    try {
      await fetch(`/api/admin/gastos/${gastoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estatus_pago: 'Pagado',
          fecha_pago: fecha,
          monto_pagado_bs: parseFloat(monto)
        }),
      });
      fetchData();
    } catch (err) {
      alert("Error al actualizar pago");
    }
  };

  const filtered = gastos.filter(g => 
    g.proveedores?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    g.concepto_descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    g.numero_comprobante?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Control de Gastos y Mantenimientos</h1>
            <p className="text-neutral-400 text-sm">Registro de facturas, notas de entrega y control de pagos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <span>➕</span> REGISTRAR GASTO / FACTURA
          </button>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 border border-neutral-700">
          <input
            type="text"
            placeholder="Buscar por proveedor, factura o concepto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Cargando registros financieros...</div>
        ) : (
          <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Fecha/Fact</th>
                    <th className="p-3">Proveedor / Categoría</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3 text-right">Monto USD</th>
                    <th className="p-3 text-right">Monto Bs.</th>
                    <th className="p-3">Estatus Pago</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {filtered.map(g => (
                    <tr key={g.id} className="hover:bg-neutral-750 transition-colors">
                      <td className="p-3">
                        <div className="text-white font-medium">{g.fecha_factura}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Nº {g.numero_comprobante || 'S/N'}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-emerald-400 font-bold">{g.proveedores?.nombre}</div>
                        <div className="text-[10px] text-neutral-500 uppercase">{g.tipo_mantenimiento}</div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate text-neutral-300" title={g.concepto_descripcion}>{g.concepto_descripcion}</div>
                        {g.incidencias?.codigo_personalizado && (
                          <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1 rounded">Ref: {g.incidencias.codigo_personalizado}</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-white font-mono">${Number(g.monto_usd).toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-500 font-mono">Bs. {Number(g.monto_bs).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          g.estatus_pago === 'Pagado' ? 'bg-green-900 text-green-200' : 
                          g.estatus_pago === 'Enviado a Administradora' ? 'bg-blue-900 text-blue-200' : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {g.estatus_pago}
                        </span>
                        {g.fecha_pago && <div className="text-[9px] text-neutral-500 mt-1">Pagado el: {g.fecha_pago}</div>}
                      </td>
                      <td className="p-3">
                        {g.estatus_pago !== 'Pagado' && (
                          <button
                            onClick={() => handleMarcarPagado(g.id)}
                            className="text-xs bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-emerald-400 font-bold transition-colors"
                          >
                            MARCAR PAGO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Registro de Gasto */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📝</span> Registro de Factura / Gasto
            </h3>
            
            <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Proveedor</label>
                <select
                  required
                  value={nuevoGasto.proveedor_id}
                  onChange={e => setNuevaGasto({...nuevoGasto, proveedor_id: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                >
                  <option value="">Seleccione proveedor...</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Fecha de Factura</label>
                <input
                  type="date"
                  required
                  value={nuevoGasto.fecha_factura}
                  onChange={e => setNuevaGasto({...nuevoGasto, fecha_factura: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Nº Factura / Control</label>
                <input
                  type="text"
                  value={nuevoGasto.numero_comprobante}
                  onChange={e => setNuevaGasto({...nuevoGasto, numero_comprobante: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                  placeholder="000123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Concepto / Descripción</label>
                <textarea
                  required
                  rows={2}
                  value={nuevoGasto.concepto_descripcion}
                  onChange={e => setNuevaGasto({...nuevoGasto, concepto_descripcion: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                  placeholder="Ej: Mantenimiento de ascensores mes de Abril..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Monto USD</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={nuevoGasto.monto_usd}
                  onChange={e => setNuevaGasto({...nuevoGasto, monto_usd: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Tasa BCV</label>
                <input
                  type="number"
                  step="0.0001"
                  value={nuevoGasto.tasa_bcv_factura}
                  onChange={e => setNuevaGasto({...nuevoGasto, tasa_bcv_factura: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Tipo</label>
                <select
                  value={nuevoGasto.tipo_mantenimiento}
                  onChange={e => setNuevaGasto({...nuevoGasto, tipo_mantenimiento: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                >
                  <option value="Preventivo">Preventivo (Rutina)</option>
                  <option value="Correctivo">Correctivo (Reparación)</option>
                  <option value="Insumos">Insumos / Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Método de Pago</label>
                <select
                  value={nuevoGasto.metodo_pago_sugerido}
                  onChange={e => setNuevaGasto({...nuevoGasto, metodo_pago_sugerido: e.target.value})}
                  className="w-full bg-neutral-700 border border-neutral-600 p-2 rounded text-white"
                >
                  <option value="Administradora">Vía Administradora</option>
                  <option value="Caja Chica">Caja Chica / Efectivo</option>
                  <option value="Pago Móvil">Transferencia / Pago Móvil</option>
                </select>
              </div>

              {nuevoGasto.tipo_mantenimiento === 'Preventivo' && (
                <div className="md:col-span-2 bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20 space-y-4">
                  <h4 className="text-emerald-400 text-xs font-bold uppercase">Datos del Mantenimiento</h4>
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase mb-1">Hallazgos / Anomalías detectadas</label>
                    <textarea
                      value={nuevoGasto.hallazgos_anomalias}
                      onChange={e => setNuevaGasto({...nuevoGasto, hallazgos_anomalias: e.target.value})}
                      className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded text-xs text-white"
                      placeholder="Indique si se detectó algún problema durante la revisión..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase mb-1">Fecha Próximo Mantenimiento</label>
                    <input
                      type="date"
                      value={nuevoGasto.fecha_proximo_mantenimiento}
                      onChange={e => setNuevaGasto({...nuevoGasto, fecha_proximo_mantenimiento: e.target.value})}
                      className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
                >
                  {saving ? "Guardando..." : "REGISTRAR EN CONTROL"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
