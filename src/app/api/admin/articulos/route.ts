import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([]);
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json([]);
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/articulos_inventario?edificio_id=eq.${edificio_id}&order=nombre.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    return NextResponse.json(await res.json());
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    const { edificio_id } = JSON.parse(userDataCookie!.value);
    const body = await req.json();
    
    const res = await fetch(`${supabaseUrl}/rest/v1/articulos_inventario`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey as string,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ ...body, edificio_id }),
    });
    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    const res = await fetch(`${supabaseUrl}/rest/v1/articulos_inventario?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey as string,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
