import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Caja Chica GET: Missing Supabase URL or Key");
    return NextResponse.json([]);
  }

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    console.log(`Caja Chica GET: Fetching for edificio_id ${edificio_id}`);

    const res = await fetch(`${supabaseUrl}/rest/v1/caja_chica?edificio_id=eq.${edificio_id}&order=fecha.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Caja Chica GET Error: ${res.status} ${errorText}`);
      return NextResponse.json([]);
    }

    const data = await res.json();
    console.log(`Caja Chica GET: Found ${data.length} records`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Caja Chica GET Exception:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  console.log("Caja Chica API: POST Request Iniciado");
  try {
    const supabaseKeyStr = supabaseKey as string;
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    
    if (!userDataCookie) {
      console.error("Caja Chica API: No se encontró cookie user_data");
      return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
    }

    const userData = JSON.parse(userDataCookie.value);
    const { edificio_id } = userData;
    
    if (!edificio_id) {
      console.error("Caja Chica API: No hay edificio_id en la sesión", userData);
      return NextResponse.json({ error: "No se identificó el edificio" }, { status: 400 });
    }

    const body = await req.json();
    console.log("Caja Chica API: Body recibido:", body);
    
    const payload = {
      concepto: body.concepto,
      tipo: body.tipo,
      monto_usd: parseFloat(body.monto_usd) || 0,
      monto_bs: parseFloat(body.monto_bs) || 0,
      tasa_bcv: parseFloat(body.tasa_bcv) || 0,
      responsable: body.responsable,
      notas: body.notas || "",
      edificio_id,
      fecha: body.fecha || new Date().toISOString()
    };
    
    console.log("Caja Chica API: Enviando a Supabase:", payload);

    const res = await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
      method: "POST",
      headers: {
        "apikey": supabaseKeyStr,
        "Authorization": `Bearer ${supabaseKeyStr}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log("Caja Chica API: Respuesta raw Supabase:", responseText);

    if (!res.ok) {
      console.error("Caja Chica API: Error Supabase HTTP", res.status, responseText);
      return NextResponse.json({ error: "Error en base de datos: " + responseText }, { status: res.status });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Caja Chica API: Error parseando JSON de respuesta", responseText);
      return NextResponse.json({ error: "Respuesta inválida del servidor" }, { status: 500 });
    }

    console.log("Caja Chica API: Registro exitoso", data[0]);
    return NextResponse.json(data[0] || data);
  } catch (error: any) {
    console.error("Caja Chica API: Excepción fatal:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
