"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState<any>(null);

  const CATEGORIES = [
    "Ascensor", "Bomba de Agua", "Portón de Estacionamiento", 
    "Sistema Eléctrico", "Plomería", "CCTV / Cámaras", 
    "Control de Accesos", "Jardinería", "Pintura", "Áreas Comunes", "Otro"
  ];

  useEffect(() => {
    fetch("/api/admin/config")
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setConfig(data);
      })
      .catch(() => setError("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Error al guardar");
      setSuccess("Configuración actualizada correctamente");
    } catch (err) {
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const updatePrefijo = (cat: string, val: string) => {
    const newPrefijos = { ...config.prefijos_por_categoria, [cat]: val.toUpperCase().slice(0, 4) };
    setConfig({ ...config, prefijos_por_categoria: newPrefijos });
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">Cargando configuración...</div>;
  if (!config) return <div className="p-8 text-center text-red-400">{error || "No se encontró configuración para este edificio"}</div>;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
            <p className="text-neutral-400 text-sm">Personalice la numeración y servicios de su edificio</p>
          </div>
          <button onClick={() => router.push("/admin/edificio")} className="text-neutral-400 hover:text-white transition-colors">
            ← Volver
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400">{success}</div>}

        <form onSubmit={handleSave} className="space-y-8">
          {/* SECCIÓN: NUMERACIÓN */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 border-b border-neutral-700 pb-2 flex items-center gap-2">
              <span>🔢</span> Numeración y Prefijos de Incidencias
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Defina cómo se verán los códigos de reporte (Ej: PLO-00001). Use máximo 4 letras por prefijo.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Prefijo Genérico</label>
                <input
                  type="text"
                  value={config.prefijo_incidencias || ""}
                  onChange={e => setConfig({ ...config, prefijo_incidencias: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  placeholder="INC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Siguiente Número de Secuencia</label>
                <input
                  type="number"
                  value={config.siguiente_numero_incidencia || 1}
                  onChange={e => setConfig({ ...config, siguiente_numero_incidencia: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat}>
                  <label className="block text-xs text-neutral-500 mb-1">{cat}</label>
                  <input
                    type="text"
                    value={config.prefijos_por_categoria?.[cat] || ""}
                    onChange={e => updatePrefijo(cat, e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-white font-mono"
                    placeholder="PRE"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN: COMUNICACIONES */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-500 mb-4 border-b border-neutral-700 pb-2">
              <span>📧</span> Notificaciones por Email (SMTP)
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Usuario SMTP (Gmail)</label>
                <input
                  type="text"
                  value={config.smtp_user || ""}
                  onChange={e => setConfig({ ...config, smtp_user: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Password de Aplicación</label>
                <input
                  type="password"
                  value={config.smtp_pass || ""}
                  onChange={e => setConfig({ ...config, smtp_pass: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-neutral-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Toda la Configuración"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
