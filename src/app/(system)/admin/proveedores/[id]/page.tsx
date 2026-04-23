"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateForInput, parseDateFromUI } from "@/lib/formatters";

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
    copia_rif_url: "",
    // Nuevos campos para Pago Móvil y Contacto Adicional
    pm_banco: "",
    pm_documento_identidad: "",
    pm_telefono_movil: "",
    telefono_fijo: "",
    email2: "",
    whatsapp: "",
    pagina_web: "",
    documentos_adicionales: [] as any[]
  });

  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [nuevaEval, setNuevaEval] = useState({
    puntaje: 5,
    criterio_resumido: "",
    comentarios: "",
    evaluado_por: ""
  });
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // ...
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

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const currentDocs = formData.documentos_adicionales || [];
    if (currentDocs.length + newFiles.length + files.length > 10) {
      alert("Máximo 10 archivos permitidos");
      return;
    }

    const newFilesArr: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFilesArr.push({ 
        name: file.name, 
        size: file.size, 
        content: base64.replace(/^data:[^;]+;base64,/, ""),
        addedAt: new Date().toISOString()
      });
    }
    setNewFiles([...newFiles, ...newFilesArr]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isNew ? "/api/admin/proveedores" : `/api/admin/proveedores/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const dataToSave = {
        ...formData,
        edificio_id: edificioId,
        newFiles,
        // Sanitizar campos numéricos
        monto_canon_usd: formData.monto_canon_usd === "" ? null : parseFloat(formData.monto_canon_usd),
        monto_canon_bs: formData.monto_canon_bs === "" ? null : parseFloat(formData.monto_canon_bs),
        dia_pago: formData.dia_pago === "" ? null : parseInt(formData.dia_pago)
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
                  <option value="Suspendido">Suspendido</option>
                  <option value="En revisión/pendiente">En revisión/pendiente</option>
                  <option value="No elegible">No elegible</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Vetado/lista Negra">Vetado/lista Negra</option>
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
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateForInput(formData.fecha_inicio_contrato)}
                      onChange={e => setFormData({ ...formData, fecha_inicio_contrato: parseDateFromUI(e.target.value) })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                      placeholder="dd/mm/yyyy"
                    />
                    <input
                      type="date"
                      value={formData.fecha_inicio_contrato || ""}
                      onChange={e => setFormData({ ...formData, fecha_inicio_contrato: e.target.value })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-lg">📅</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Fecha Vencimiento</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatDateForInput(formData.fecha_vencimiento_contrato)}
                      onChange={e => setFormData({ ...formData, fecha_vencimiento_contrato: parseDateFromUI(e.target.value) })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                      placeholder="dd/mm/yyyy"
                    />
                    <input
                      type="date"
                      value={formData.fecha_vencimiento_contrato || ""}
                      onChange={e => setFormData({ ...formData, fecha_vencimiento_contrato: e.target.value })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-lg">📅</span>
                  </div>
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
                <label className="block text-sm font-medium text-neutral-400 mb-2">Teléfono Móvil (WhatsApp)</label>
                <input
                  type="text"
                  value={formData.telefono || "+58-"}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="+58-412-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Teléfono Fijo</label>
                <input
                  type="text"
                  value={formData.telefono_fijo || "+58-"}
                  onChange={e => setFormData({ ...formData, telefono_fijo: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="+58-212-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Correo Electrónico 1</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Correo Electrónico 2 (Opcional)</label>
                <input
                  type="email"
                  value={formData.email2}
                  onChange={e => setFormData({ ...formData, email2: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="otro@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Página Web</label>
                <input
                  type="url"
                  value={formData.pagina_web}
                  onChange={e => setFormData({ ...formData, pagina_web: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="https://www.empresa.com"
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
            
            <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-wider italic">Cuenta Bancaria Principal</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
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

            <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-wider italic">Datos para Pago Móvil</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Banco Pago Móvil</label>
                <input
                  type="text"
                  value={formData.pm_banco}
                  onChange={e => setFormData({ ...formData, pm_banco: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="Banco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">CI / RIF Pago Móvil</label>
                <input
                  type="text"
                  value={formData.pm_documento_identidad}
                  onChange={e => setFormData({ ...formData, pm_documento_identidad: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Teléfono Pago Móvil</label>
                <input
                  type="text"
                  value={formData.pm_telefono_movil || "+58-"}
                  onChange={e => setFormData({ ...formData, pm_telefono_movil: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="+58-4XX-XXXXXXX"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Documentos Adicionales (Máx. 10)</label>
            <div className="flex gap-4 items-center mb-4">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleAddFiles}
                className="hidden"
                id="doc-adicionales"
              />
              <label
                htmlFor="doc-adicionales"
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg cursor-pointer text-sm"
              >
                + Cargar Archivos
              </label>
              <span className="text-xs text-neutral-500">
                {((formData.documentos_adicionales?.length || 0) + newFiles.length)} / 10 archivos
              </span>
            </div>

            <div className="space-y-2">
              {/* Archivos ya guardados */}
              {formData.documentos_adicionales?.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-neutral-900/30 rounded border border-neutral-700">
                  <span className="text-sm text-neutral-300 flex items-center gap-2">
                    📄 <a href={doc.url || "#"} target="_blank" className="hover:underline">{doc.name}</a>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.documentos_adicionales.filter((_: any, i: number) => i !== idx);
                      setFormData({ ...formData, documentos_adicionales: updated });
                    }}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {/* Archivos nuevos por subir */}
              {newFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-emerald-900/10 rounded border border-emerald-500/30">
                  <span className="text-sm text-emerald-300 flex items-center gap-2">
                    🆕 {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewFiles(newFiles.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Quitar
                  </button>
                </div>
              ))}
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
                        <span className="text-xs text-neutral-500">{formatDate(ev.fecha_evaluacion)}</span>
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
