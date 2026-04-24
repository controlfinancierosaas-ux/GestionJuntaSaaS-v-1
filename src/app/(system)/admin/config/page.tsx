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
        if (data && !data.error) {
          // Asegurar valores por defecto si el JSON viene vacío
          if (!data.columnas_visibles_incidencias) {
            data.columnas_visibles_incidencias = ["categoria", "sistema", "manual"];
          }
          setConfig(data);
        } else {
          setError(data?.error || "Error al cargar configuración");
        }
      })
      .catch(() => setError("Error de conexión"))
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
      router.refresh();
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

  const toggleColumna = (col: string) => {
    const current = config.columnas_visibles_incidencias || ["categoria", "sistema", "manual"];
    let next;
    if (current.includes(col)) {
      if (current.length === 1) return; // No dejar vacío
      next = current.filter((c: string) => c !== col);
    } else {
      next = [...current, col];
    }
    setConfig({ ...config, columnas_visibles_incidencias: next });
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">Cargando configuración...</div>;
  if (!config) return <div className="p-8 text-center text-red-400">{error}</div>;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
            <p className="text-neutral-400 text-sm">Personalice la numeración y visualización del edificio</p>
          </div>
          <button onClick={() => router.push("/admin/edificio")} className="text-neutral-400 hover:text-white transition-colors text-sm">
            ← Volver a Módulos
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold">{success}</div>}

        <form onSubmit={handleSave} className="space-y-8">
          {/* SECCIÓN: VISUALIZACIÓN DE COLUMNAS */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-400 mb-4 border-b border-neutral-700 pb-2 flex items-center gap-2">
              <span>👁️</span> Visualización de Incidencias
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              Seleccione qué números de identificación desea ver en las tablas y reportes.
            </p>
            
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={config.columnas_visibles_incidencias?.includes("categoria")}
                  onChange={() => toggleColumna("categoria")}
                  className="w-5 h-5 rounded border-neutral-600 bg-neutral-700 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">Código de Categoría</span>
                  <span className="text-xs text-neutral-500">Ej: PLO-000001</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={config.columnas_visibles_incidencias?.includes("sistema")}
                  onChange={() => toggleColumna("sistema")}
                  className="w-5 h-5 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-blue-400 transition-colors">Nº Único de Sistema</span>
                  <span className="text-xs text-neutral-500">Ej: 202404221645</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={config.columnas_visibles_incidencias?.includes("manual")}
                  onChange={() => toggleColumna("manual")}
                  className="w-5 h-5 rounded border-neutral-600 bg-neutral-700 text-purple-500 focus:ring-purple-500"
                />
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-purple-400 transition-colors">Código Manual</span>
                  <span className="text-xs text-neutral-500">Personalizado por Ud.</span>
                </div>
              </label>
            </div>
          </div>

          {/* SECCIÓN: NUMERACIÓN */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-emerald-500 mb-4 border-b border-neutral-700 pb-2 flex items-center gap-2">
              <span>🔢</span> Personalización de Prefijos
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Siguiente Correlativo</label>
                <input
                  type="number"
                  value={config.siguiente_numero_incidencia || 1}
                  onChange={e => setConfig({ ...config, siguiente_numero_incidencia: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat}>
                  <label className="block text-[10px] text-neutral-500 mb-1 uppercase font-bold">{cat}</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={config.prefijos_por_categoria?.[cat] || ""}
                    onChange={e => updatePrefijo(cat, e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-emerald-400 font-mono"
                    placeholder="INC"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN: COMUNICACIONES */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-neutral-300 mb-4 border-b border-neutral-700 pb-2 flex items-center gap-2">
              <span>📧</span> Notificaciones por Email
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Usuario Gmail</label>
                <input
                  type="text"
                  value={config.smtp_user || ""}
                  onChange={e => setConfig({ ...config, smtp_user: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  placeholder="edificio@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Password de Aplicación</label>
                <input
                  type="password"
                  value={config.smtp_pass || ""}
                  onChange={e => setConfig({ ...config, smtp_pass: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  placeholder="••••••••••••••••"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: WHATSAPP */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-emerald-500/5">
              <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <span>💬</span> Notificaciones por WhatsApp
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.whatsapp_enabled} 
                  onChange={e => setConfig({ ...config, whatsapp_enabled: e.target.checked })} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-sm font-medium text-neutral-300">{config.whatsapp_enabled ? 'Activado' : 'Desactivado'}</span>
              </label>
            </div>

            <div className={`p-6 space-y-6 transition-opacity ${!config.whatsapp_enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider">Servicio de Envío</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setConfig({ ...config, whatsapp_service: 'GREENAPI' })}
                      className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all ${config.whatsapp_service === 'GREENAPI' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-neutral-700 border-neutral-600 text-neutral-400'}`}
                    >
                      GREEN API
                      <span className="block text-[10px] font-normal opacity-70 mt-1">Recomendado</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setConfig({ ...config, whatsapp_service: 'WHAPI' })}
                      className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all ${config.whatsapp_service === 'WHAPI' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-neutral-700 border-neutral-600 text-neutral-400'}`}
                    >
                      WHAPI
                      <span className="block text-[10px] font-normal opacity-70 mt-1">Alternativo</span>
                    </button>
                  </div>

                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700 space-y-2">
                    <h4 className="text-xs font-bold text-blue-400 uppercase">Ayuda de Configuración</h4>
                    {config.whatsapp_service === 'GREENAPI' ? (
                      <p className="text-[11px] text-neutral-400">1. Regístrate en green-api.com<br/>2. Escanea el QR en su consola<br/>3. Copia el ID de Instancia y el API Token</p>
                    ) : (
                      <p className="text-[11px] text-neutral-400">1. Regístrate en whapi.cloud<br/>2. Vincula tu número con el QR<br/>3. Copia el API Token del canal</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 bg-neutral-900/30 p-5 rounded-2xl border border-neutral-700">
                  <h4 className="text-white text-xs font-bold uppercase">Credenciales del Servicio</h4>
                  
                  {config.whatsapp_service === 'GREENAPI' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-neutral-500 text-[10px] mb-1 font-bold">ID DE INSTANCIA</label>
                        <input 
                          type="text"
                          value={config.greenapi_id_instance || ""} 
                          onChange={e => setConfig({ ...config, greenapi_id_instance: e.target.value })}
                          placeholder="Ej: 7107580078"
                          className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-500 text-[10px] mb-1 font-bold">API TOKEN</label>
                        <input 
                          type="password"
                          value={config.greenapi_api_token || ""} 
                          onChange={e => setConfig({ ...config, greenapi_api_token: e.target.value })}
                          placeholder="Tu token de Green-API"
                          className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" 
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-neutral-500 text-[10px] mb-1 font-bold">WHAPI TOKEN</label>
                      <input 
                        type="password"
                        value={config.whapi_token || ""} 
                        onChange={e => setConfig({ ...config, whapi_token: e.target.value })}
                        placeholder="Tu token de Whapi.cloud"
                        className="w-full bg-neutral-700 border border-neutral-600 text-white rounded-lg px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-neutral-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Guardando cambios..." : "GUARDAR CONFIGURACIÓN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
