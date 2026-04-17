import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  try {
    const stats: Record<string, number> = {};
    
    const estatusList = ["Activa", "En Evaluación", "En Ejecución", "Asignada", "Pospuesta", "Descartada", "Resuelta", "Archivada"];
    
    for (const estatus of estatusList) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/incidencias?estatus=eq.${encodeURIComponent(estatus)}&select=id`,
        {
          headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        stats[estatus] = data.length;
      }
    }

    const openRes = await fetch(
      `${supabaseUrl}/rest/v1/incidencias?estatus=in.(Activa,En%20Evaluación,En%20Ejecución,Asignada)&select=id`,
      {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      }
    );
    if (openRes.ok) {
      const openData = await openRes.json();
      stats["abiertas"] = openData.length;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json({ error: "Error fetching stats" }, { status: 500 });
  }
}
