"use client";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function SalonReservasPage() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [nuevaReserva, setNuevaReserva] = useState({
    nombre_propietario: "",
    apartamento: "",
    email: "",
    telefono: "",
    motivo_evento: "",
    fecha_evento: "",
    horario_desde: "14:00",
    horario_hasta: "22:00",
    invitados_estimados: 30,
    monto_canon: 0,
    solvente: true
  });

  useEffect(() => { fetchReservas(); }, []);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reservas-salon");
      setReservas(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reservas-salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaReserva),
      });
      if (res.ok) {
        setShowModal(false);
        fetchReservas();
      } else {
        const data = await res.json();
        setError(data.error || "Error al crear reserva");
      }
    } catch (e) { setError("Error de red"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, estatus: string, monto: number, apto: string) => {
    try {
      await fetch("/api/admin/reservas-salon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estatus, monto_canon: monto, apartamento: apto }),
      });
      fetchReservas();
    } catch (e) { console.error(e); }
  };

  const generarPDF = (reserva: any) => {
    const doc = new jsPDF();
    const margin = 20;
    const width = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(16);
    doc.text("SOLICITUD Y COMPROMISO DE USO DEL SALÓN DE FIESTAS", width / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Residencias Torrebela", width / 2, 28, { align: "center" });
    doc.line(margin, 32, width - margin, 32);

    // I. DATOS DEL EVENTO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("I. DATOS DEL EVENTO", margin, 40);
    doc.setFont("helvetica", "normal");
    
    (doc as any).autoTable({
      startY: 43,
      margin: { left: margin },
      body: [
        ["Fecha de Solicitud:", new Date(reserva.fecha_solicitud || new Date()).toLocaleDateString()],
        ["Fecha del Evento:", new Date(reserva.fecha_evento).toLocaleDateString()],
        ["Motivo del Evento:", reserva.motivo_evento],
        ["Horario de Uso:", `Desde ${reserva.horario_desde} Hasta ${reserva.horario_hasta}`],
        ["Invitados:", reserva.invitados_estimados || "N/A"]
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } }
    });

    // II. DATOS DEL PROPIETARIO
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont("helvetica", "bold");
    doc.text("II. DATOS DEL PROPIETARIO RESPONSABLE", margin, finalY + 10);
    
    (doc as any).autoTable({
      startY: finalY + 13,
      margin: { left: margin },
      body: [
        ["Nombre Completo:", reserva.nombre_propietario],
        ["Apartamento:", reserva.apartamento],
        ["Teléfono:", reserva.telefono || "N/A"],
        ["Correo Electrónico:", reserva.email]
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } }
    });

    // III. REGLAMENTO (Resumen)
    const finalY2 = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("III. COMPROMISO Y ACEPTACIÓN DEL REGLAMENTO", margin, finalY2 + 10);
    doc.setFont("helvetica", "normal");
    
    const reglamento = [
      "1. Horario Límite: El evento finalizará a la hora máxima permitida. Música hasta las 10pm (Dom-Jue) y 12pm (Vie-Sáb).",
      "2. Responsabilidad: Asumo total responsabilidad por invitados y daños.",
      "3. Daños: Me comprometo a cubrir cualquier daño al mobiliario o instalaciones.",
      "4. Limpieza: El salón debe entregarse limpio en un máximo de 48 horas.",
      "5. Depósito de Garantía: Se requiere un pago de $50 USD reintegrable tras inspección satisfactoria.",
      "6. Gestión: El procesamiento está supeditado al pago de la Tarifa de Uso y Depósito."
    ];

    doc.text(reglamento, margin, finalY2 + 15, { maxWidth: width - (margin * 2), lineHeightFactor: 1.5 });

    // FIRMAS
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.line(margin, footerY, margin + 60, footerY);
    doc.text("Firma del Propietario", margin, footerY + 5);
    
    doc.line(width - margin - 60, footerY, width - margin, footerY);
    doc.text("Firma y Sello Junta", width - margin - 60, footerY + 5);

    doc.save(`Solicitud_Salon_${reserva.apartamento}_${reserva.fecha_evento}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestión del Salón de Fiestas</h1>
            <p className="text-neutral-400 text-sm">Control de reservas, reglamentos y cobros</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 uppercase tracking-widest text-xs">
            ➕ Nueva Solicitud
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl">⚠️ {error}</div>}

        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-700 text-neutral-300 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-4">Fecha Evento</th>
                <th className="p-4">Apto / Propietario</th>
                <th className="p-4">Horario</th>
                <th className="p-4">Estatus</th>
                <th className="p-4">Monto</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {reservas.map(r => (
                <tr key={r.id} className="hover:bg-neutral-750 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-bold">{new Date(r.fecha_evento).toLocaleDateString()}</div>
                    <div className="text-[10px] text-neutral-500 uppercase">{r.motivo_evento}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-white font-medium uppercase">{r.nombre_propietario}</div>
                    <div className="text-[10px] text-neutral-500">APTO: {r.apartamento}</div>
                  </td>
                  <td className="p-4 text-neutral-400 font-mono text-xs">
                    {r.horario_desde} - {r.horario_hasta}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      r.estatus === 'Pendiente' ? 'bg-yellow-900 text-yellow-300' :
                      r.estatus === 'Pagada' ? 'bg-emerald-900 text-emerald-300' :
                      r.estatus === 'Aprobada' ? 'bg-blue-900 text-blue-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {r.estatus}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">${r.monto_canon}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {r.estatus === 'Pendiente' && (
                        <button onClick={() => updateStatus(r.id, 'Aprobada', r.monto_canon, r.apartamento)} className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white font-bold uppercase">Aprobar</button>
                      )}
                      {r.estatus === 'Aprobada' && (
                        <button onClick={() => updateStatus(r.id, 'Pagada', r.monto_canon, r.apartamento)} className="text-[10px] bg-emerald-600 px-2 py-1 rounded text-white font-bold uppercase">Confirmar Pago</button>
                      )}
                      <button onClick={() => generarPDF(r)} className="text-[10px] bg-neutral-700 px-2 py-1 rounded text-white font-bold uppercase underline">Planilla</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Solicitud de Salón de Fiestas</h3>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre del Propietario</label>
                <input type="text" required className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevaReserva({...nuevaReserva, nombre_propietario: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Apartamento</label>
                <input type="text" required className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevaReserva({...nuevaReserva, apartamento: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Fecha del Evento</label>
                <input type="date" required className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevaReserva({...nuevaReserva, fecha_evento: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Motivo / Tipo de Evento</label>
                <input type="text" required className="w-full bg-neutral-800 p-3 rounded-lg text-white" placeholder="Ej: Cumpleaños" onChange={e => setNuevaReserva({...nuevaReserva, motivo_evento: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Desde</label>
                  <input type="time" required value={nuevaReserva.horario_desde} className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevaReserva({...nuevaReserva, horario_desde: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Hasta</label>
                  <input type="time" required value={nuevaReserva.horario_hasta} className="w-full bg-neutral-800 p-3 rounded-lg text-white" onChange={e => setNuevaReserva({...nuevaReserva, horario_hasta: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Canon Alquiler (USD)</label>
                <input type="number" required className="w-full bg-neutral-800 p-3 rounded-lg text-white font-bold text-emerald-400" onChange={e => setNuevaReserva({...nuevaReserva, monto_canon: parseFloat(e.target.value)})} />
              </div>
              <div className="col-span-2">
                <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-xl text-[10px] text-neutral-400 leading-relaxed">
                  <p className="font-bold text-neutral-300 mb-2 uppercase tracking-widest">Reglamento de Uso (Resumen):</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Solicitud con al menos 7 días de anticipación.</li>
                    <li>Música hasta las 10pm (Dom-Jue) o 12pm (Vie-Sáb).</li>
                    <li>Depósito de garantía de $50 (reintegrable).</li>
                    <li>El salón debe entregarse limpio en un máximo de 48 horas.</li>
                  </ul>
                </div>
              </div>
              <div className="col-span-2 flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 py-4 rounded-xl font-bold text-white uppercase tracking-widest">{saving ? 'Procesando...' : 'Crear Solicitud'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-neutral-700 py-4 rounded-xl font-bold text-white uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
