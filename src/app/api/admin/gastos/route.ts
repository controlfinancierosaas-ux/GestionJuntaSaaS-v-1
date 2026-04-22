import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas?edificio_id=eq.${edificio_id}&select=*,proveedores(nombre,categoria),incidencias(codigo_personalizado)&order=fecha_factura.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) return NextResponse.json([], { status: 500 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const body = await req.json();
    
    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        ...body,
        edificio_id
      }),
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
