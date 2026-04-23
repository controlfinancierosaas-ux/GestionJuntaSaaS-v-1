"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatters";

export default function ReporteRecurrentesPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resProveedores = await fetch("/api/admin/proveedores");
        const proveedores = await resProveedores.json();
        
        const recurrentes = proveedores.filter((p: any) => p.tipo_relacion === "Recurrente");
        
        const resGastos = await fetch("/api/admin/gastos");
        const gastos = await resGastos.json();
        
        const data = recurrentes.map((p: any) => {
          const ultimoGasto = gastos
            .filter((g: any) => g.proveedor_id === p.id && g.fecha_proximo_mantenimiento)
            .sort((a: any, b: any) => new Date(b.fecha_proximo_mantenimiento).getTime() - new Date(a.fecha_proximo_mantenimiento).getTime())[0];
          
          return {
            ...p,
            proxima_fecha: ultimoGasto ? ultimoGasto.fecha_proximo_mantenimiento : null,
            ultimo_servicio: ultimoGasto ? ultimoGasto.fecha_factura : null
          };
        });
        
        setReportData(data.sort((a: any, b: any) => {
            if (!a.proxima_fecha) return 1;
            if (!b.proxima_fecha) return -1;
            return new Date(a.proxima_fecha).getTime() - new Date(b.proxima_fecha).getTime();
        }));
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Cronograma de Servicios Recurrentes</h1>
          <button onClick={() => router.push("/admin/proveedores")} className="text-neutral-400 hover:text-white">
            ← Volver al Directorio
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400">Generando reporte...</div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">No hay proveedores recurrentes registrados</div>
        ) : (
          <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-neutral-300">Proveedor</th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-300">Servicio</th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-300">Último Servicio</th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-300">Próxima Fecha</th>
                  <th className="p-3 text-left text-sm font-medium text-neutral-300">Estado</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((p: any) => {
                  const hoy = new Date();
                  const proxima = p.proxima_fecha ? new Date(p.proxima_fecha) : null;
                  const esVencido = proxima && proxima < hoy;
                  
                  return (
                    <tr key={p.id} className="border-t border-neutral-700 hover:bg-neutral-750 transition-colors">
                      <td className="p-3">
                        <div className="text-sm font-medium text-white">{p.nombre}</div>
                        <div className="text-xs text-neutral-500">{p.categoria}</div>
                      </td>
                      <td className="p-3 text-sm text-neutral-300">{p.servicio_contratado || "No especificado"}</td>
                      <td className="p-3 text-sm text-neutral-300">{formatDate(p.ultimo_servicio)}</td>
                      <td className={`p-3 text-sm font-bold ${esVencido ? "text-red-400" : "text-emerald-400"}`}>
                        {formatDate(p.proxima_fecha)}
                      </td>
                      <td className="p-3">
                        {esVencido ? (
                          <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-500/30">Vencido</span>
                        ) : proxima ? (
                          <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-xs border border-emerald-500/30">Programado</span>
                        ) : (
                          <span className="px-2 py-1 bg-neutral-700 text-neutral-400 rounded text-xs">Sin fecha</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
