import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?order=nombre.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return NextResponse.json([], { status: 500 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch { return NextResponse.json([], { status: 500 }); }
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });

  try {
    const body = await req.json();
    const res = await fetch(`${supabaseUrl}/rest/v1/proveedores`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
