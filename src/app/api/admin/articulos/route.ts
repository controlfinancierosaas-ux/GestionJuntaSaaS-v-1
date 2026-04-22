import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Articulos GET: Missing Supabase URL or Key");
    return NextResponse.json([]);
  }
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json([]);
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/articulos_inventario?edificio_id=eq.${edificio_id}&order=nombre.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Articulos GET Error: ${res.status} ${errorText}`);
      return NextResponse.json([]);
    }

    return NextResponse.json(await res.json());
  } catch (error) { 
    console.error("Articulos GET Exception:", error);
    return NextResponse.json([]); 
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);
    const body = await req.json();
    console.log("Articulos POST Body:", body);
    
    // Solo enviamos lo estrictamente necesario inicialmente para asegurar compatibilidad
    const payload: any = {
      nombre: body.nombre,
      categoria: body.categoria || 'Otros',
      unidad_medida: body.unidad_medida || 'Unidad',
      stock_minimo: body.stock_minimo || 0,
      edificio_id
    };

    // Agregar campos opcionales si vienen en el body (pero esto fallará si la columna no existe)
    if (body.descripcion) payload.descripcion = body.descripcion;
    if (body.ubicacion_almacen) payload.ubicacion_almacen = body.ubicacion_almacen;
    
    const res = await fetch(`${supabaseUrl}/rest/v1/articulos_inventario`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey as string,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Articulos POST Supabase Error:", errorData);
      return NextResponse.json({ error: errorData.message || "Error al crear artículo" }, { status: res.status });
    }

    const data = await res.json();
    console.log("Articulos POST Success:", data[0]);
    return NextResponse.json(data[0]);
  } catch (error: any) { 
    console.error("Articulos POST Exception:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 }); 
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    console.log(`Articulos PATCH ID ${id}:`, updateData);

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

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Articulos PATCH Supabase Error:", errorData);
      return NextResponse.json({ error: errorData.message || "Error al actualizar artículo" }, { status: res.status });
    }

    const data = await res.json();
    console.log("Articulos PATCH Success:", data[0]);
    return NextResponse.json(data[0]);
  } catch (error: any) { 
    console.error("Articulos PATCH Exception:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 }); 
  }
}
