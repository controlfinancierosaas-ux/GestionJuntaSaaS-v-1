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
    const { items, ...gastoData } = body;
    
    // 1. Insertar el gasto principal
    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ ...gastoData, edificio_id }),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const createdGasto = await res.json();
    const gastoId = createdGasto[0].id;

    // 2. Si hay items de inventario, insertarlos vinculados al gasto
    if (items && Array.isArray(items) && items.length > 0) {
      const movimientos = items.map((item: any) => ({
        ...item,
        gasto_id: gastoId,
        edificio_id: edificio_id
      }));

      await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(movimientos),
      });
    }

    return NextResponse.json(createdGasto[0]);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
