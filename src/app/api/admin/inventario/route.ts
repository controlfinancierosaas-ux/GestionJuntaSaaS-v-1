import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Inventario GET: Missing Supabase URL or Key");
    return NextResponse.json([]);
  }

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    // Obtenemos todos los movimientos de inventario del edificio
    const res = await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario?edificio_id=eq.${edificio_id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Inventario GET Error: ${res.status} ${errText}`);
      return NextResponse.json([]);
    }

    const movimientos = await res.json();
    if (!Array.isArray(movimientos)) {
      console.warn("Inventario GET: Movimientos is not an array", movimientos);
      return NextResponse.json([]);
    }

    // Consolidar stock en memoria (Articulo -> Cantidad)
    const stock: Record<string, any> = {};

    movimientos.forEach(m => {
      if (!m.articulo_nombre) {
        console.warn("Inventario GET: Movimiento sin nombre de artículo", m);
        return;
      }
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
      
      const cant = parseFloat(m.cantidad) || 0;
      if (m.tipo_movimiento === 'Entrada') {
        stock[key].cantidad += cant;
      } else {
        stock[key].cantidad -= cant;
      }
    });

    console.log(`Inventario GET: Consolidado ${Object.keys(stock).length} artículos`);
    return NextResponse.json(Object.values(stock));
  } catch (error) {
    console.error("Inventario GET Exception:", error);
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

    const body = await req.json(); // articulo_nombre, cantidad, unidad, tipo_movimiento, recibido_por
    console.log("Inventario POST Body:", body);
    
    // Forzamos el edificio_id y nos aseguramos que tipo_movimiento venga del body o sea 'Salida' por defecto si no viene
    const payload: any = { 
      articulo_nombre: body.articulo_nombre,
      cantidad: body.cantidad,
      unidad: body.unidad,
      recibido_por: body.recibido_por,
      edificio_id, 
      tipo_movimiento: body.tipo_movimiento || 'Salida' 
    };

    // Solo enviamos observaciones si el usuario las puso, pero esto fallará si la columna no existe en la DB.
    // Para ser resilientes, si el usuario reporta que no existe, lo manejamos.
    if (body.observaciones) {
      payload.observaciones = body.observaciones;
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario`, {
      method: "POST",
      headers: {
        "apikey": apiKeyStr,
        "Authorization": `Bearer ${apiKeyStr}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Inventario POST Supabase Error:", errorData);
      return NextResponse.json({ error: errorData.message || "Error al registrar movimiento" }, { status: res.status });
    }

    const data = await res.json();
    console.log("Inventario POST Success:", data[0]);
    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error("Inventario POST Exception:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
