import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    let edificioId = null;
    
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie.value);
        edificioId = userData.edificio_id;
      } catch (e) {}
    }

    // Caso A: Intentar filtrar por edificio si lo tenemos
    if (edificioId) {
      const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?edificio_id=eq.${edificioId}&order=created_at.desc`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
        cache: 'no-store'
      });
      
      const data = await res.json();
      // Si devolvió datos válidos y no es un error de Supabase, retornarlos
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    }

    // Caso B: Fallback Total - Si no hay edificio o el filtro no trajo nada, traer ABSOLUTAMENTE TODO
    console.log("Fetching all incidences as absolute fallback");
    const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/incidencias?order=created_at.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      cache: 'no-store'
    });
    const allData = await fallbackRes.json();
    
    return NextResponse.json(Array.isArray(allData) ? allData : []);

  } catch (error) { 
    console.error("Critical error in Admin Incidencias API:", error);
    return NextResponse.json([], { status: 500 }); 
  }
}
