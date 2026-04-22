"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Todos", "Ascensores", "Bombas de Agua", "CCTV / Cámaras", "Electricidad", "Jardinería", "Limpieza", "Pintura", "Plomería", "Portones", "Otros"];

export default function ProveedoresPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/proveedores")
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter((s: any) => {
    if (filter !== "Todos" && s.categoria !== filter) return false;
    if (search && !(
      s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      s.rif_cedula?.toLowerCase().includes(search.toLowerCase()) ||
      s.categoria?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Directorio de Proveedores</h1>
          <button
            onClick={() => router.push("/admin/proveedores/nuevo")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            + Nuevo Proveedor
          </button>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 mb-6 space-y-4 border border-neutral-700">
          <input
            type="text"
            placeholder="Buscar por nombre, RIF o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:border-emerald-500 focus:outline-none text-white"
          />
          
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === c
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Cargando proveedores...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No hay proveedores que coincidan con los filtros</div>
        ) : (
          <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-700">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Nombre</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Contacto</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Categoría</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Teléfono</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300">Estatus</th>
                    <th className="p-3 text-left text-sm font-medium text-neutral-300 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="border-t border-neutral-700 hover:bg-neutral-750 transition-colors">
                      <td className="p-3">
                        <div className="text-sm font-medium text-white">{s.nombre}</div>
                        <div className="text-xs text-neutral-500 font-mono">{s.rif_cedula || ""}</div>
                      </td>
                      <td className="p-3 text-sm text-neutral-300">{s.persona_contacto || "-"}</td>
                      <td className="p-3 text-sm text-neutral-300">{s.categoria || "-"}</td>
                      <td className="p-3 text-sm text-neutral-300">{s.telefono || "-"}</td>
                      <td className="p-3 text-sm text-neutral-300">{s.email || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          s.estatus === "Activo" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
                        }`}>
                          {s.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => router.push("/admin/proveedores/" + s.id)}
                          className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-blue-400 hover:text-blue-300 text-sm font-medium rounded transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-neutral-400">
          Mostrando {filtered.length} de {suppliers.length} proveedores
        </div>
      </div>
    </div>
  );
}
