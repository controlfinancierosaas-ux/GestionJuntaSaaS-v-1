import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json(null, { status: 500 });

  try {
    // 1. Obtener el edificio del usuario actual
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`);
    const me = await meRes.json();
    if (!me?.edificio_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${supabaseUrl}/rest/v1/edificio_config?edificio_id=eq.${me.edificio_id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    let data = await res.json();
    
    // Si no existe, crear una por defecto
    if (!data || data.length === 0) {
      const createRes = await fetch(`${supabaseUrl}/rest/v1/edificio_config`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ edificio_id: me.edificio_id }),
      });
      data = await createRes.json();
    }

    return NextResponse.json(data[0] || null);
  } catch { return NextResponse.json(null, { status: 500 }); }
}

export async function PATCH(req: Request) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    const res = await fetch(`${supabaseUrl}/rest/v1/edificio_config?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) return NextResponse.json({ error: "Update failed" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
