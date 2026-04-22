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
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    // 1. Intentar buscar incidencias del edificio
    let res = await fetch(`${supabaseUrl}/rest/v1/incidencias?edificio_id=eq.${edificio_id}&order=created_at.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      cache: 'no-store'
    });
    
    let data = await res.json();

    // 2. Si no hay nada en este edificio, buscar TODAS (incluyendo huérfanas) para no mostrar lista vacía
    if (!Array.isArray(data) || data.length === 0) {
      console.log("No building-specific incidences found, fetching all as fallback");
      const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/incidencias?order=created_at.desc`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      data = await fallbackRes.json();
    }

    return NextResponse.json(data);
  } catch (error) { 
    console.error("Admin Incidencias API error:", error);
    return NextResponse.json([], { status: 500 }); 
  }
}
