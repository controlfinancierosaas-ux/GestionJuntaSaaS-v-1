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
    observaciones: ""
  });

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/proveedores/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) setFormData({
            ...data,
            persona_contacto: data.persona_contacto || "",
            banco: data.banco || "",
            numero_cuenta: data.numero_cuenta || "",
            tipo_cuenta: data.tipo_cuenta || "Corriente"
          });
          else setError("Proveedor no encontrado");
        })
        .catch(() => setError("Error al cargar el proveedor"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isNew ? "/api/admin/proveedores" : `/api/admin/proveedores/${id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                <label className="block text-sm font-medium text-neutral-400 mb-2">Persona de Contacto</label>
                <input
                  type="text"
                  value={formData.persona_contacto}
                  onChange={e => setFormData({ ...formData, persona_contacto: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
                  placeholder="Nombre de la persona enlace"
                />
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
    </div>
  );
}
