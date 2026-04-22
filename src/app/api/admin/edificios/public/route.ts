import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/edificios?select=id,nombre&order=nombre.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    if (!res.ok) return NextResponse.json([], { status: 500 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch { return NextResponse.json([], { status: 500 }); }
}
