import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    // Filtrar por el edificio del administrador logueado
    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?edificio_id=eq.${edificio_id}&order=created_at.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) {
      // Si falla el filtro por edificio (ej: columna no existe aún), intentar traer todas como fallback temporal
      const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/incidencias?order=created_at.desc`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      return NextResponse.json(await fallbackRes.json());
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) { 
    console.error("Admin Incidencias API error:", error);
    return NextResponse.json([], { status: 500 }); 
  }
}
