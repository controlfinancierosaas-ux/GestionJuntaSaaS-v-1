import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
...
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    console.log("Fetching stats for building:", edificio_id);

    const stats: Record<string, number> = {};
    const estatusList = ["Activa", "En Evaluación", "En Ejecución", "Asignada", "Pospuesta", "Descartada", "Resuelta", "Archivada"];
    
    // 1. Intentar contar incidencias del edificio actual
    const promises = estatusList.map(async (estatus) => {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/incidencias?estatus=eq.${encodeURIComponent(estatus)}&edificio_id=eq.${edificio_id}&select=id`,
        {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
          cache: 'no-store'
        }
      );
      if (res.ok) {
        const data = await res.json();
        return { estatus, count: data.length };
      }
      return { estatus, count: 0 };
    });

    const results = await Promise.all(promises);
    results.forEach(r => stats[r.estatus] = r.count);

    // --- FALLBACK: Si no hay NADA en este edificio, mostrar TODAS las de la DB (huérfanas) ---
    const currentBuildingTotal = Object.values(stats).reduce((a, b) => a + b, 0);
    console.log("Total found for current building:", currentBuildingTotal);
    
    if (currentBuildingTotal === 0) {
      console.log("Fallback triggered: fetching all incidences");
      const fallbackPromises = estatusList.map(async (estatus) => {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/incidencias?estatus=eq.${encodeURIComponent(estatus)}&select=id`,
          { 
            headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
            cache: 'no-store'
          }
        );
        if (res.ok) {
          const data = await res.json();
          return { estatus, count: data.length };
        }
        return { estatus, count: 0 };
      });
      const fallbackResults = await Promise.all(fallbackPromises);
      fallbackResults.forEach(r => stats[r.estatus] = r.count);
    }

    // Calcular total de "abiertas" para los cuadros superiores
    const abiertasList = ["Activa", "En Evaluación", "En Ejecución", "Asignada"];
    stats["abiertas"] = abiertasList.reduce((acc, est) => acc + (stats[est] || 0), 0);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 });
  }
}
