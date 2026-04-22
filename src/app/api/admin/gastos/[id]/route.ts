import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });
  const { id } = await params;

  try {
    const body = await req.json();
    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return NextResponse.json({ error: "Update failed" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
