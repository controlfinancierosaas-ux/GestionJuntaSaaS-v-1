import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({});

  try {
    // 1. Traer ABSOLUTAMENTE TODAS las incidencias de la base de datos (Ignoramos filtros de edificio para recuperar visualización)
    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?select=*`, {
      headers: { 
        "apikey": supabaseKey, 
        "Authorization": `Bearer ${supabaseKey}` 
      },
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error("Dashboard error: Response is not array", data);
      return NextResponse.json({});
    }

    const stats: Record<string, number> = {
      "Activa": 0, "En Evaluación": 0, "En Ejecución": 0, "Asignada": 0,
      "Pospuesta": 0, "Descartada": 0, "Resuelta": 0, "Archivada": 0, "abiertas": 0
    };

    data.forEach(inc => {
      const s = inc.estatus || "Activa";
      if (stats[s] !== undefined) stats[s]++;
    });

    stats["abiertas"] = (stats["Activa"] || 0) + (stats["En Evaluación"] || 0) + (stats["En Ejecución"] || 0) + (stats["Asignada"] || 0);

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({});
  }
}
