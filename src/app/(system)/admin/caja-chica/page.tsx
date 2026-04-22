"use client";
import { useState, useEffect } from "react";

export default function CajaChicaPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevoMov, setNuevoMov] = useState({ 
    concepto: "", 
    tipo: "Egreso", 
    monto_usd: 0, 
    monto_bs: 0, 
    tasa_bcv: 0, 
    responsable: "",
    notas: "" 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log("Caja Chica Page: Fetching data...");
    try {
      const res = await fetch("/api/admin/caja-chica");
      const data = await res.json();
      console.log("Caja Chica Page: Data received:", data);
      setMovimientos(data);
    } catch (e) {
      console.error("Caja Chica Page: Error fetching data:", e);
    } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    console.log("Caja Chica Page: Saving movement...", nuevoMov);
    try {
      const data = {
        ...nuevoMov,
        monto_usd: parseFloat(nuevoMov.monto_usd.toString()) || 0,
        monto_bs: parseFloat(nuevoMov.monto_bs.toString()) || 0,
        tasa_bcv: parseFloat(nuevoMov.tasa_bcv.toString()) || 0
      };
      const res = await fetch("/api/admin/caja-chica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        console.log("Caja Chica Page: Movement saved successfully:", result);
        setShowModal(false);
        setNuevoMov({ concepto: "", tipo: "Egreso", monto_usd: 0, monto_bs: 0, tasa_bcv: 0, responsable: "", notas: "" });
        fetchData();
      } else {
        const errData = await res.json();
        console.error("Caja Chica Page: Error from API:", errData);
        setError(errData.error || "Error al guardar el movimiento");
      }
    } catch (e) {
      console.error("Caja Chica Page: Connection error:", e);
      setError("Error de conexión con el servidor");
    } finally { setSaving(false); }
  };

  // Calcular balance total
  const totalUsd = movimientos.reduce((acc, m) => m.tipo === 'Ingreso' ? acc + parseFloat(m.monto_usd) : acc - parseFloat(m.monto_usd), 0);
  const totalBs = movimientos.reduce((acc, m) => m.tipo === 'Ingreso' ? acc + parseFloat(m.monto_bs) : acc - parseFloat(m.monto_bs), 0);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Caja Chica</h1>
            <p className="text-neutral-400 text-sm">Control de efectivo y pequeños gastos del edificio</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
            ➕ NUEVO MOVIMIENTO
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Resumen de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-800 border-2 border-emerald-500/30 rounded-2xl p-6 text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-2">Saldo Total (USD)</p>
            <p className={`text-4xl font-black ${totalUsd >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>${totalUsd.toLocaleString()}</p>
          </div>
          <div className="bg-neutral-800 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase mb-2">Saldo Total (Bs.)</p>
            <p className={`text-4xl font-black ${totalBs >= 0 ? 'text-blue-400' : 'text-red-500'}`}>Bs. {totalBs.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Concepto / Notas</th>
                <th className="p-4 text-right">Monto USD</th>
                <th className="p-4 text-right">Monto Bs.</th>
                <th className="p-4">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {movimientos.map(m => (
                <tr key={m.id} className="hover:bg-neutral-750 transition-colors">
                  <td className="p-4 text-neutral-400 font-mono text-xs">{new Date(m.fecha).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.tipo === 'Ingreso' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="p-4 max-w-sm">
                    <div className="text-white font-medium">{m.concepto}</div>
                    <div className="text-[10px] text-neutral-500 italic mt-1">{m.notas}</div>
                  </td>
                  <td className={`p-4 text-right font-bold ${m.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-white'}`}>
                    {m.tipo === 'Egreso' ? '-' : '+'}${m.monto_usd}
                  </td>
                  <td className={`p-4 text-right font-bold ${m.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {m.tipo === 'Egreso' ? '-' : '+'}Bs. {m.monto_bs}
                  </td>
                  <td className="p-4 text-neutral-300">{m.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nuevo Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Registrar en Caja Chica</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setNuevoMov({...nuevoMov, tipo: 'Ingreso'})}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${nuevoMov.tipo === 'Ingreso' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                >
                  🟢 INGRESO
                </button>
                <button 
                  type="button"
                  onClick={() => setNuevoMov({...nuevoMov, tipo: 'Egreso'})}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${nuevoMov.tipo === 'Egreso' ? 'bg-red-600 border-red-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                >
                  🔴 EGRESO
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Concepto</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white" 
                  placeholder="Ej: Alquiler Salón de Fiestas..." 
                  value={nuevoMov.concepto}
                  onChange={e => setNuevoMov({...nuevoMov, concepto: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Monto USD</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white" 
                    value={nuevoMov.monto_usd || ""}
                    onChange={e => setNuevoMov({...nuevoMov, monto_usd: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Monto Bs.</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white" 
                    value={nuevoMov.monto_bs || ""}
                    onChange={e => setNuevoMov({...nuevoMov, monto_bs: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Responsable</label>
                <input 
                  type="text" 
                  required 
                  className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white" 
                  placeholder="Quién registra o autoriza..." 
                  value={nuevoMov.responsable}
                  onChange={e => setNuevoMov({...nuevoMov, responsable: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Notas adicionales</label>
                <textarea 
                  rows={2} 
                  className="w-full bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-white text-xs" 
                  value={nuevoMov.notas}
                  onChange={e => setNuevoMov({...nuevoMov, notas: e.target.value})} 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 py-4 rounded-xl font-bold text-white uppercase">{saving ? 'Procesando...' : 'Guardar'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-neutral-700 py-4 rounded-xl font-bold text-white uppercase">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
