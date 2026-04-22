import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({});

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    let edificioId = null;
    if (userDataCookie) {
      try { edificioId = JSON.parse(userDataCookie.value).edificio_id; } catch(e){}
    }

    // Traer TODO para ser resilientes a cambios de esquema
    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      cache: 'no-store'
    });

    const allIncidencias = await res.json();
    if (!Array.isArray(allIncidencias)) {
      console.error("Dashboard error: Response is not array", allIncidencias);
      return NextResponse.json({});
    }

    // Filtrar en memoria por edificio si lo tenemos
    const myIncidencias = edificioId 
      ? allIncidencias.filter(i => i.edificio_id === edificioId)
      : [];

    // Fallback: Si no hay nada para este edificio, usamos TODAS (históricas)
    const dataToProcess = myIncidencias.length > 0 ? myIncidencias : allIncidencias;

    const stats: Record<string, number> = {
      "Activa": 0, "En Evaluación": 0, "En Ejecución": 0, "Asignada": 0,
      "Pospuesta": 0, "Descartada": 0, "Resuelta": 0, "Archivada": 0, "abiertas": 0
    };

    dataToProcess.forEach(inc => {
      const s = inc.estatus || "Activa";
      if (stats[s] !== undefined) stats[s]++;
    });

    // Calcular abiertas
    stats["abiertas"] = (stats["Activa"] || 0) + (stats["En Evaluación"] || 0) + (stats["En Ejecución"] || 0) + (stats["Asignada"] || 0);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Critical Error:", error);
    return NextResponse.json({});
  }
}
