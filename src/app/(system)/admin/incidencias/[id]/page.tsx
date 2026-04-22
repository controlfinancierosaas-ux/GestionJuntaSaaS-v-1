"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const ESTATUS_OPTIONS = ["Activa", "En Evaluación", "En Ejecución", "Asignada", "Pospuesta", "Descartada", "Resuelta", "Archivada"];

interface FileItem {
  name: string;
  size: number;
  content?: string;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [incident, setIncident] = useState<any>(null);
  const [newFiles, setNewFiles] = useState<FileItem[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evaluacion, setEvaluacion] = useState({
    puntaje: 5,
    criterio_resumido: "Resolución de Incidencia",
    comentarios: "",
    evaluado_por: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/incidencias/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setIncident(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/admin/proveedores")
      .then(res => res.json())
      .then(data => setProveedores(data))
      .catch(() => {});
  }, [params.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFilesArr: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFilesArr.push({ name: file.name, size: file.size, content: base64 });
    }
    setNewFiles([...newFiles, ...newFilesArr]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData: any = { ...incident };
    if (newFiles.length > 0) {
      updateData.documentos_junta = [
        ...(incident.documentos_junta || []),
        ...newFiles.map(f => ({
          name: f.name,
          content: f.content?.replace(/^data:[^;]+;base64,/, "") || "",
          addedAt: new Date().toISOString(),
        })),
      ];
    }
    const res = await fetch(`/api/incidencias/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (res.ok) {
      const updatedIncident = await res.json();
      alert("Incidencia actualizada correctamente");
      setIncident(Array.isArray(updatedIncident) ? updatedIncident[0] : updatedIncident);
      if (newFiles.length > 0) {
        setNewFiles([]);
      }
    } else {
      alert("Error al guardar");
    }
    setSaving(false);
  };

  const handleMarkResolved = () => {
    setShowEvalModal(true);
  };

  const confirmResolve = async (withEvaluation: boolean) => {
    setSaving(true);
    try {
      // 1. Marcar como resuelta
      const res = await fetch(`/api/incidencias/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estatus: "Resuelta",
          estado: "Cerrada",
          fecha_resolucion: new Date().toISOString(),
          enviar_email_resuelto: true,
        }),
      });

      if (!res.ok) throw new Error("Error al marcar como resuelta");

      // 2. Guardar evaluación si se proporcionó y hay un proveedor asignado
      if (withEvaluation && incident.proveedor_id) {
        await fetch(`/api/admin/proveedores/${incident.proveedor_id}/evaluaciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...evaluacion,
            criterio_resumido: `Incidencia ${params.id?.toString().slice(0,8)}: ${evaluacion.criterio_resumido}`
          }),
        });
      }

      alert("Incidencia marcada como resuelta correctamente.");
      router.push("/admin/incidencias");
    } catch (error) {
      alert("Error en el proceso de resolución");
    } finally {
      setSaving(false);
      setShowEvalModal(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) return <div className="text-white p-8 text-center">Cargando...</div>;
  if (!incident) return <div className="text-white p-8 text-center">Incidencia no encontrada</div>;

  const documentosJunta = incident.documentos_junta || [];

  return (
    <div className="text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button onClick={() => router.push("/admin/incidencias")} className="text-blue-400 hover:text-blue-300 mb-2">
              ← Volver al Listado
            </button>
            <h1 className="text-2xl font-bold">Gestión de Incidencia</h1>
            <p className="text-neutral-400 text-sm">ID: {incident.id}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            {incident.estatus !== "Resuelta" && incident.estatus !== "Archivada" && (
              <button onClick={handleMarkResolved} disabled={saving} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50">
                ✓ Marcar como Resuelta
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">Información del Reporte</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-400">Reportado por</label>
                <input value={incident.reportado_por || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Apartamento</label>
                <input value={incident.unidad_codigo || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Email contacto</label>
                <input value={incident.email_contacto || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Teléfono</label>
                <input value={incident.telefono_contacto || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Fecha de Reporte</label>
                <input value={incident.created_at?.split("T")[0] || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-400">Detalles de la Incidencia</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-neutral-400">Tipo de Incidencia</label>
                <input value={incident.area_afectada || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Descripción</label>
                <textarea value={incident.descripcion || ""} readOnly rows={3} className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Justificación/Observaciones</label>
                <textarea value={incident.justificacion || ""} readOnly rows={2} className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Ubicación</label>
                <input value={incident.ubicacion || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400">Prioridad</label>
                <input value={incident.prioridad || ""} readOnly className="w-full bg-neutral-700 p-2 rounded text-neutral-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">Administración y Gestión</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Responsable de Gestión</label>
              <input
                value={incident.responsable_gestion || ""}
                onChange={e => setIncident({...incident, responsable_gestion: e.target.value})}
                placeholder="Nombre del encargado"
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Estatus</label>
              <select
                value={incident.estatus || "Activa"}
                onChange={e => setIncident({...incident, estatus: e.target.value})}
                className="w-full bg-neutral-700 p-2 rounded"
              >
                {ESTATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Proveedor Asignado</label>
              <select
                value={incident.proveedor_id || ""}
                onChange={e => {
                  const p = proveedores.find(x => x.id === e.target.value);
                  setIncident({
                    ...incident, 
                    proveedor_id: e.target.value || null,
                    proveedor_asignado: p ? p.nombre : ""
                  });
                }}
                className="w-full bg-neutral-700 p-2 rounded text-white"
              >
                <option value="">Sin asignar</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Fecha de Asignación</label>
              <input
                type="date"
                value={incident.fecha_asignacion?.split("T")[0] || ""}
                onChange={e => setIncident({...incident, fecha_asignacion: e.target.value})}
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Fecha de Resolución</label>
              <input
                type="date"
                value={incident.fecha_resolucion?.split("T")[0] || ""}
                onChange={e => setIncident({...incident, fecha_resolucion: e.target.value})}
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Monto (Bs.)</label>
              <input
                type="number"
                value={incident.monto_bs || 0}
                onChange={e => setIncident({...incident, monto_bs: Number(e.target.value)})}
                placeholder="0.00"
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">Observaciones y Notas</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Observaciones / Notas de Gestión</label>
              <textarea
                value={incident.observaciones || ""}
                onChange={e => setIncident({...incident, observaciones: e.target.value})}
                rows={4}
                placeholder="Notas sobre el progreso de la gestión, acciones tomadas, etc."
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Observaciones de Resolución</label>
              <textarea
                value={incident.observaciones_resolucion || ""}
                onChange={e => setIncident({...incident, observaciones_resolucion: e.target.value})}
                rows={4}
                placeholder="Notas sobre cómo fue resuelta la incidencia"
                className="w-full bg-neutral-700 p-2 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Documentos de la Junta</h2>
          <p className="text-neutral-400 text-sm mb-4">Agregar documentos adicionales como facturas, cotizaciones, etc.</p>
          
          <div className="flex gap-2 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              id="junta-documentos"
            />
            <label
              htmlFor="junta-documentos"
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg cursor-pointer"
            >
              + Agregar Documentos
            </label>
            <span className="text-neutral-400 text-sm self-center">({newFiles.length} nuevos)</span>
          </div>

          {newFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {newFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>📎</span>
                    <div>
                      <p className="text-sm">{file.name}</p>
                      <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeNewFile(index)} className="text-red-400 hover:text-red-300 px-2">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {documentosJunta.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-400 mb-2">Documentos guardados:</p>
              {documentosJunta.map((doc: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>📄</span>
                    <div>
                      <p className="text-sm">{doc.name}</p>
                      <p className="text-xs text-neutral-400">
                        Agregado: {doc.addedAt ? new Date(doc.addedAt).toLocaleDateString("es-VE") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No hay documentos guardados</p>
          )}
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Estado Actual</h2>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-lg text-lg font-medium ${
              incident.estatus === "Resuelta" ? "bg-green-900 text-green-200" :
              incident.estatus === "Archivada" ? "bg-gray-800 text-gray-400" :
              incident.estatus === "Activa" ? "bg-red-900 text-red-200" :
              "bg-yellow-900 text-yellow-200"
            }`}>
              {incident.estatus || "Activa"}
            </span>
            <span className="text-neutral-400">
              Reportada el {incident.created_at ? new Date(incident.created_at).toLocaleDateString("es-VE") : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Evaluación al Resolver */}
      {showEvalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-white">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Cerrar y Evaluar</h3>
            <p className="text-neutral-400 text-sm mb-6">
              ¿Deseas calificar el trabajo realizado por <b>{incident.proveedor_asignado || "el proveedor"}</b>?
            </p>

            {incident.proveedor_id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Puntaje</label>
                  <div className="flex gap-2 text-2xl">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEvaluacion({ ...evaluacion, puntaje: num })}
                        className="focus:outline-none transition-transform active:scale-90"
                      >
                        {num <= evaluacion.puntaje ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Comentarios del trabajo</label>
                  <textarea
                    rows={3}
                    value={evaluacion.comentarios}
                    onChange={e => setEvaluacion({ ...evaluacion, comentarios: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ej: El trabajo quedó impecable..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Evaluado por</label>
                  <input
                    type="text"
                    value={evaluacion.evaluado_por}
                    onChange={e => setEvaluacion({ ...evaluacion, evaluado_por: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Tu nombre o cargo"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() => confirmResolve(true)}
                    disabled={saving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    {saving ? "Procesando..." : "Resolver con Evaluación"}
                  </button>
                  <button
                    onClick={() => confirmResolve(false)}
                    disabled={saving}
                    className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Resolver sin Evaluar
                  </button>
                  <button
                    onClick={() => setShowEvalModal(false)}
                    className="w-full py-2 text-neutral-400 hover:text-white text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-xs">
                  ⚠️ No hay un proveedor vinculado estructuralmente a esta incidencia. Para evaluar, selecciona un proveedor en la sección de Administración y guarda los cambios primero.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => confirmResolve(false)}
                    disabled={saving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    {saving ? "Procesando..." : "Resolver Incidencia"}
                  </button>
                  <button
                    onClick={() => setShowEvalModal(false)}
                    className="w-full py-2 text-neutral-400 hover:text-white text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
