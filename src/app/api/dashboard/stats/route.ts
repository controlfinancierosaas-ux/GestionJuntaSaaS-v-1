import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const stats: Record<string, number> = {};
    const estatusList = ["Activa", "En Evaluación", "En Ejecución", "Asignada", "Pospuesta", "Descartada", "Resuelta", "Archivada"];
    
    const promises = estatusList.map(async (estatus) => {
      // Filtrar por estatus Y por edificio
      const res = await fetch(
        `${supabaseUrl}/rest/v1/incidencias?estatus=eq.${encodeURIComponent(estatus)}&edificio_id=eq.${edificio_id}&select=id`,
        {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
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

    // --- FALLBACK MEJORADO PARA INCIDENCIAS EXISTENTES ---
    const currentBuildingTotal = Object.values(stats).reduce((a, b) => a + b, 0);
    
    if (currentBuildingTotal === 0) {
      // Si no hay nada en este edificio, contar las que NO tienen edificio (is null) o simplemente todas
      const fallbackPromises = estatusList.map(async (estatus) => {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/incidencias?estatus=eq.${encodeURIComponent(estatus)}&select=id`,
          { headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` } }
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

    // Calcular total de "abiertas" basándose en los stats ya calculados (sea por edificio o fallback)
    const abiertasList = ["Activa", "En Evaluación", "En Ejecución", "Asignada"];
    stats["abiertas"] = abiertasList.reduce((acc, est) => acc + (stats[est] || 0), 0);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 });
  }
}
