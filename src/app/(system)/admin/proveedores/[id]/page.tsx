"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Ascensores", "Bombas de Agua", "CCTV / Cámaras", "Electricidad", "Jardinería", "Limpieza", "Pintura", "Plomería", "Portones", "Otros"];

export default function ProveedorDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "nuevo";
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [edificioId, setEdificioId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    rif_cedula: "",
    persona_contacto: "",
    categoria: "Otros",
    telefono: "",
    email: "",
    direccion: "",
    banco: "",
    numero_cuenta: "",
    tipo_cuenta: "Corriente",
    estatus: "Activo",
    observaciones: "",
    // Nuevos campos
    tipo_relacion: "Eventual",
    servicio_contratado: "",
    fecha_inicio_contrato: "",
    fecha_vencimiento_contrato: "",
    monto_canon_usd: "",
    monto_canon_bs: "",
    dia_pago: "",
    clausula_ajuste: "",
    aviso_finalizacion: "1 mes antes",
    documento_contrato_url: "",
    copia_rif_url: ""
  });

  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [nuevaEval, setNuevaEval] = useState({
    puntaje: 5,
    criterio_resumido: "",
    comentarios: "",
    evaluado_por: ""
  });

  useEffect(() => {
    // Cargar sesión para obtener edificio_id
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(user => {
        if (user && user.edificio_id) setEdificioId(user.edificio_id);
      })
      .catch(() => {});

    if (!isNew) {
      fetch(`/api/admin/proveedores/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) setFormData({
            ...data,
            persona_contacto: data.persona_contacto || "",
            banco: data.banco || "",
            numero_cuenta: data.numero_cuenta || "",
            tipo_cuenta: data.tipo_cuenta || "Corriente",
            tipo_relacion: data.tipo_relacion || "Eventual",
            aviso_finalizacion: data.aviso_finalizacion || "1 mes antes"
          });
          else setError("Proveedor no encontrado");
        })
        .catch(() => setError("Error al cargar el proveedor"))
        .finally(() => setLoading(false));

      // Cargar evaluaciones
      fetch(`/api/admin/proveedores/${id}/evaluaciones`)
        .then(res => res.json())
        .then(data => setEvaluaciones(data || []))
        .catch(() => {});
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isNew ? "/api/admin/proveedores" : `/api/admin/proveedores/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const dataToSave = {
        ...formData,
        edificio_id: edificioId
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!res.ok) throw new Error("Error al guardar");

      router.push("/admin/proveedores");
      router.refresh();
    } catch (err) {
      setError("Ocurrió un error al intentar guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/proveedores/${id}/evaluaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaEval),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluaciones([data, ...evaluaciones]);
        setShowEvalModal(false);
        setNuevaEval({ puntaje: 5, criterio_resumido: "", comentarios: "", evaluado_por: "" });
      }
    } catch (err) {
      console.error("Error al añadir evaluación", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proveedor?")) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/proveedores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      router.push("/admin/proveedores");
      router.refresh();
    } catch (err) {
      setError("Error al eliminar el proveedor");
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "Nuevo Proveedor" : "Editar Proveedor"}
          </h1>
          <button onClick={() => router.push("/admin/proveedores")} className="text-neutral-400 hover:text-white transition-colors">
            ← Volver al Directorio
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 space-y-8">
          {/* Sección 1: Datos Principales */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 border-b border-neutral-700 pb-2">Información Principal</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Nombre del Proveedor / Empresa *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="Ej: Ascensores Express C.A."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">RIF / Cédula</label>
                <input
                  type="text"
                  value={formData.rif_cedula}
                  onChange={e => setFormData({ ...formData, rif_cedula: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="J-12345678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Tipo de Relación Comercial</label>
                <select
                  value={formData.tipo_relacion}
                  onChange={e => setFormData({ ...formData, tipo_relacion: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                >
                  <option value="Eventual">Eventual</option>
                  <option value="Recurrente">Recurrente (Contrato)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Estatus</label>
                <select
                  value={formData.estatus}
                  onChange={e => setFormData({ ...formData, estatus: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección Contrato (Condicional) */}
          {formData.tipo_relacion === "Recurrente" && (
            <div className="p-6 bg-emerald-900/10 border border-emerald-500/30 rounded-xl space-y-6">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4 border-b border-emerald-500/20 pb-2">Detalles de Contratación Mensual</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Servicio Contratado</label>
                  <input
                    type="text"
                    value={formData.servicio_contratado}
                    onChange={e => setFormData({ ...formData, servicio_contratado: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="Ej: Mantenimiento preventivo 2 visitas/mes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio_contrato}
                    onChange={e => setFormData({ ...formData, fecha_inicio_contrato: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento_contrato}
                    onChange={e => setFormData({ ...formData, fecha_vencimiento_contrato: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Monto Canon (USD)</label>
                  <input
                    type="number"
                    value={formData.monto_canon_usd}
                    onChange={e => setFormData({ ...formData, monto_canon_usd: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Monto Canon (Bs.)</label>
                  <input
                    type="number"
                    value={formData.monto_canon_bs}
                    onChange={e => setFormData({ ...formData, monto_canon_bs: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Día de Pago (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_pago}
                    onChange={e => setFormData({ ...formData, dia_pago: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Aviso de Finalización</label>
                  <select
                    value={formData.aviso_finalizacion}
                    onChange={e => setFormData({ ...formData, aviso_finalizacion: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  >
                    <option value="15 días antes">15 días antes</option>
                    <option value="1 mes antes">1 mes antes</option>
                    <option value="2 meses antes">2 meses antes</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Cláusula de Ajuste</label>
                  <input
                    type="text"
                    value={formData.clausula_ajuste}
                    onChange={e => setFormData({ ...formData, clausula_ajuste: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="Ej: Ajuste trimestral según inflación o tasa BCV"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Documento del Contrato (URL)</label>
                  <input
                    type="text"
                    value={formData.documento_contrato_url}
                    onChange={e => setFormData({ ...formData, documento_contrato_url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="Enlace al PDF del contrato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Copia del RIF (URL)</label>
                  <input
                    type="text"
                    value={formData.copia_rif_url}
                    onChange={e => setFormData({ ...formData, copia_rif_url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                    placeholder="Enlace al RIF digitalizado"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sección 2: Contacto y Ubicación */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 border-b border-neutral-700 pb-2">Contacto y Ubicación</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="0412-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Dirección Física</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="Calle, Edificio, Oficina..."
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Datos Bancarios */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 border-b border-neutral-700 pb-2">Información de Pagos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={e => setFormData({ ...formData, banco: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="Nombre del banco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Tipo de Cuenta</label>
                <select
                  value={formData.tipo_cuenta}
                  onChange={e => setFormData({ ...formData, tipo_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                >
                  <option value="Corriente">Corriente</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Otro">Otro / Internacional</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Número de Cuenta</label>
                <input
                  type="text"
                  value={formData.numero_cuenta}
                  onChange={e => setFormData({ ...formData, numero_cuenta: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="0102-XXXX-XX-XXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Observaciones Internas</label>
            <textarea
              rows={3}
              value={formData.observaciones}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
              placeholder="Notas sobre el servicio, vigencia de contratos, etc..."
            />
          </div>

          {/* Sección de Evaluaciones */}
          {!isNew && (
            <div className="pt-6 border-t border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-emerald-500">Historial de Desempeño</h2>
                <button
                  type="button"
                  onClick={() => setShowEvalModal(true)}
                  className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors"
                >
                  + Agregar Evaluación
                </button>
              </div>

              <div className="space-y-4">
                {evaluaciones.length === 0 ? (
                  <p className="text-neutral-500 text-sm italic">No hay evaluaciones registradas aún.</p>
                ) : (
                  evaluaciones.slice(0, 5).map((ev, idx) => (
                    <div key={ev.id || idx} className="p-4 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>{i < ev.puntaje ? "⭐" : "☆"}</span>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500">{new Date(ev.fecha_evaluacion).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white font-medium mb-1">{ev.criterio_resumido}</p>
                      <p className="text-sm text-neutral-400 italic">"{ev.comentarios}"</p>
                      <p className="text-xs text-neutral-500 mt-2">— {ev.evaluado_por || "Anónimo"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-neutral-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : isNew ? "Registrar Proveedor" : "Guardar Cambios"}
            </button>
            
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-6 py-3 bg-red-900/50 hover:bg-red-800 text-red-200 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal de Nueva Evaluación */}
      {showEvalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Nueva Evaluación de Servicio</h3>
            <form onSubmit={handleAddEvaluacion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Puntaje</label>
                <div className="flex gap-2 text-2xl">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNuevaEval({ ...nuevaEval, puntaje: num })}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      {num <= nuevaEval.puntaje ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Criterio Resumido</label>
                <input
                  type="text"
                  required
                  value={nuevaEval.criterio_resumido}
                  onChange={e => setNuevaEval({ ...nuevaEval, criterio_resumido: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ej: Puntualidad, Calidad técnica..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Comentarios / Justificación</label>
                <textarea
                  required
                  rows={3}
                  value={nuevaEval.comentarios}
                  onChange={e => setNuevaEval({ ...nuevaEval, comentarios: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Explique el motivo de la calificación..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Evaluado por</label>
                <input
                  type="text"
                  required
                  value={nuevaEval.evaluado_por}
                  onChange={e => setNuevaEval({ ...nuevaEval, evaluado_por: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Nombre del miembro de la junta"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Guardar Evaluación
                </button>
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="flex-1 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
