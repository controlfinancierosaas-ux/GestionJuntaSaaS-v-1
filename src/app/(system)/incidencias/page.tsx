"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface FileItem {
  name: string;
  size: number;
  content?: string; // base64
}

export default function IncidenciasPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [edificios, setEdificios] = useState<any[]>([]);

  useEffect(() => {
    // CARGA LIMPIA: Solo de la API pública de edificios
    fetch("/api/admin/edificios/public") 
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEdificios(data);
      })
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (selectedFiles.length + newFiles.length >= 10) break;
      const file = files[i];
      const base64 = await fileToBase64(file);
      newFiles.push({ name: file.name, size: file.size, content: base64 });
    }
    setSelectedFiles([...selectedFiles, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (selectedFiles.length > 0) {
      (data as any).archivos = selectedFiles.map(f => ({
        name: f.name,
        content: f.content?.replace(/^data:[^;]+;base64,/, '') || '',
      }));
    }

    try {
      const res = await fetch("/api/incidencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Error al registrar la incidencia");
        return;
      }
      setReportNumber(result.numero_reporte || "");
      setSuccess(true);
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="text-white p-6">
        <div className="max-w-4xl mx-auto text-center pt-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Incidencia Registrada</h1>
          {reportNumber && (
            <div className="bg-neutral-800 rounded-lg p-4 mb-6 inline-block">
              <p className="text-neutral-400 text-sm">Número de Reporte</p>
              <p className="text-2xl font-mono text-emerald-400">{reportNumber}</p>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard" className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors">Volver</Link>
            <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">Reportar Otra</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="text-white p-6">
      <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Reportar Incidencia</h1>
          </div>
          {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">{error}</div>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-emerald-900/10 border border-emerald-500/30 p-6 rounded-xl mb-6">
              <label className="block text-sm font-medium mb-2">Seleccione su Edificio *</label>
              <select name="edificio_id" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-emerald-500 text-white">
                <option value="">Selecciona...</option>
                {edificios.map(ed => <option key={ed.id} value={ed.id}>{ed.nombre}</option>)}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" name="nombre_completo" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="Nombre completo" />
              <input type="text" name="apartamento" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="Unidad / Apto" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="tel" name="telefono" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="Teléfono" />
              <input type="email" name="email" className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="Email (opcional)" />
            </div>
            <select name="tipo_incidencia" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
              <option value="">Tipo de Incidencia...</option>
              <option value="Ascensor">Ascensor</option>
              <option value="Bomba de Agua">Bomba de Agua</option>
              <option value="Sistema Eléctrico">Sistema Eléctrico</option>
              <option value="Plomería">Plomería</option>
              <option value="CCTV / Cámaras">CCTV / Cámaras</option>
              <option value="Otro">Otro</option>
            </select>
            <textarea name="descripcion" rows={4} required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="Descripción..."></textarea>
            <select name="prioridad" required className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
              <option value="Baja">Baja</option>
              <option value="Media" selected>Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors">
              {loading ? "Enviando..." : "ENVIAR REPORTE"}
            </button>
          </form>
        </div>
    </main>
  );
}
