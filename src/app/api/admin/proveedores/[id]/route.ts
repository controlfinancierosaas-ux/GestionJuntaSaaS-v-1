import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json(null, { status: 500 });
  const { id } = await params;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?id=eq.${id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return NextResponse.json(null, { status: 500 });
    const data = await res.json();
    return NextResponse.json(data[0] || null);
  } catch { return NextResponse.json(null, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });
  const { id } = await params;

  try {
    const body = await req.json();
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?id=eq.${id}`, {
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });
  const { id } = await params;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });

    if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: res.status });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
