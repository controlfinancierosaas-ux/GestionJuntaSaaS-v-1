"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateForInput, parseDateFromUI } from "@/lib/formatters";

export default function PublicSalonReservaPage() {
  const [edificios, setEdificios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    edificio_id: "",
    nombre_propietario: "",
    apartamento: "",
    email: "",
    telefono: "",
    motivo_evento: "",
    fecha_evento: "",
    horario_desde: "14:00",
    horario_hasta: "22:00",
    invitados_estimados: 30,
    solvente: false
  });

  useEffect(() => {
    fetch("/api/admin/edificios")
      .then(res => res.json())
      .then(data => {
        setEdificios(data);
        if (data.length === 1) setFormData(prev => ({ ...prev, edificio_id: data[0].id }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const res = await fetch("/api/admin/reservas-salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar la solicitud");
      }
    } catch (e) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">¡Solicitud Enviada!</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            Hemos recibido tu solicitud para el uso del salón de fiestas. 
            Próximamente recibirás un correo electrónico con los pasos a seguir y la planilla para firmar.
          </p>
          <Link href="/" className="inline-block w-full py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-emerald-500 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 py-12 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-purple-600/20 text-purple-500 rounded-2xl mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Solicitud de Salón</h1>
          <p className="text-neutral-500 font-medium">Residencias Torrebela — Formulario para Copropietarios</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl text-sm font-bold animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Seleccione su Edificio</label>
            <select 
              required 
              value={formData.edificio_id}
              className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white focus:border-purple-600 transition-colors"
              onChange={e => setFormData({...formData, edificio_id: e.target.value})}
            >
              <option value="">Seleccione...</option>
              {edificios.map(ed => <option key={ed.id} value={ed.id}>{ed.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nombre Completo</label>
              <input type="text" required className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" onChange={e => setFormData({...formData, nombre_propietario: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Apartamento / Piso</label>
              <input type="text" required className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" placeholder="Ej: 1-A" onChange={e => setFormData({...formData, apartamento: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Correo Electrónico</label>
              <input type="email" required className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" placeholder="tu@email.com" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Teléfono Celular</label>
              <input type="tel" required className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" onChange={e => setFormData({...formData, telefono: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Fecha del Evento</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  value={formatDateForInput(formData.fecha_evento)} 
                  className="w-full bg-black border border-neutral-800 p-4 pr-12 rounded-xl text-white focus:border-purple-600 transition-colors" 
                  placeholder="dd/mm/yyyy" 
                  onChange={e => setFormData({...formData, fecha_evento: parseDateFromUI(e.target.value)})} 
                />
                <input 
                  type="date" 
                  required 
                  value={formData.fecha_evento} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10" 
                  onChange={e => setFormData({...formData, fecha_evento: e.target.value})} 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xl">📅</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Motivo del Evento</label>
              <input type="text" required className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" placeholder="Ej: Cumpleaños, Reunión" onChange={e => setFormData({...formData, motivo_evento: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Desde</label>
              <input type="time" required value={formData.horario_desde} className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" onChange={e => setFormData({...formData, horario_desde: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Hasta</label>
              <input type="time" required value={formData.horario_hasta} className="w-full bg-black border border-neutral-800 p-4 rounded-xl text-white" onChange={e => setFormData({...formData, horario_hasta: e.target.value})} />
            </div>
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-800">
            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Términos y Condiciones Importantes</h4>
            <div className="space-y-3 text-[11px] text-neutral-400 leading-relaxed overflow-y-auto max-h-48 scrollbar-hide">
              <p><strong>1. Anticipación:</strong> La solicitud debe realizarse con un mínimo de 7 días de antelación.</p>
              <p><strong>2. Horario:</strong> El evento finalizará a la hora máxima permitida. Música hasta las 10pm (Dom-Jue) y 12pm (Vie-Sáb).</p>
              <p><strong>3. Responsabilidad:</strong> El propietario asume total responsabilidad por daños e invitados.</p>
              <p><strong>4. Limpieza:</strong> El salón debe entregarse limpio en un máximo de 48 horas post-evento.</p>
              <p><strong>5. Depósito:</strong> Se requiere un depósito de garantía de $50 (USD) reintegrable tras la inspección satisfactoria.</p>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <input type="checkbox" required id="solvente" className="mt-1 w-4 h-4 accent-purple-600" onChange={e => setFormData({...formData, solvente: e.target.checked})} />
              <label htmlFor="solvente" className="text-xs font-bold text-neutral-300">Declaro que estoy SOLVENTE con el condominio y acepto los términos descritos.</label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving} 
            className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-purple-500 shadow-xl shadow-purple-900/20 disabled:opacity-50"
          >
            {saving ? 'Procesando Solicitud...' : 'Enviar Solicitud de Reserva'}
          </button>
        </form>

        <p className="mt-8 text-center text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
          Sistema de Gestión Operativa — Residencias Torrebela
        </p>
      </div>
    </div>
  );
}
