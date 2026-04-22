import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([]);

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    // Obtenemos todos los movimientos de inventario del edificio
    const res = await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario?edificio_id=eq.${edificio_id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    const movimientos = await res.json();
    if (!Array.isArray(movimientos)) return NextResponse.json([]);

    // Consolidar stock en memoria (Articulo -> Cantidad)
    const stock: Record<string, any> = {};

    movimientos.forEach(m => {
      const key = m.articulo_nombre.trim().toUpperCase();
      if (!stock[key]) {
        stock[key] = {
          nombre: m.articulo_nombre,
          categoria: m.categoria,
          unidad: m.unidad,
          cantidad: 0,
          ultima_actualizacion: m.created_at
        };
      }
      
      if (m.tipo_movimiento === 'Entrada') {
        stock[key].cantidad += parseFloat(m.cantidad);
      } else {
        stock[key].cantidad -= parseFloat(m.cantidad);
      }
    });

    return NextResponse.json(Object.values(stock));
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  // Para registrar SALIDAS manuales
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const apiKey = supabaseServiceKey || supabaseKey;

  try {
    const apiKeyStr = apiKey as string;
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const body = await req.json(); // articulo_nombre, cantidad, unidad, tipo_movimiento: 'Salida', recibido_por
    
    const res = await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario`, {
      method: "POST",
      headers: {
        "apikey": apiKeyStr,
        "Authorization": `Bearer ${apiKeyStr}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ ...body, edificio_id, tipo_movimiento: 'Salida' }),
    });

    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
