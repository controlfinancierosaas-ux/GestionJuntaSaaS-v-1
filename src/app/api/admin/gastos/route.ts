import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Intentar obtener la clave de servicio de varias posibles variables de entorno
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_SERVICE_KEY || 
                   process.env.SERVICE_ROLE_KEY ||
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !serviceKey) return NextResponse.json([], { status: 500 });

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas?edificio_id=eq.${edificio_id}&select=*,proveedores(nombre,categoria),incidencias(codigo_personalizado)&order=fecha_factura.desc`, {
      headers: { 
        "apikey": serviceKey, 
        "Authorization": `Bearer ${serviceKey}` 
      },
    });
    
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseUrl || !serviceKey) {
    console.error("Configuración de Supabase faltante");
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    let user;
    try {
      user = JSON.parse(userDataCookie.value);
    } catch (e) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 });
    }
    
    const edificio_id = user.edificio_id;
    if (!edificio_id) return NextResponse.json({ error: "Edificio ID no encontrado en sesión" }, { status: 400 });

    const body = await req.json();
    const { items, ...gastoData } = body;

    // Limpieza de datos: Convertir strings vacíos en campos sensibles a NULL
    const dataToSave: Record<string, any> = { ...gastoData, edificio_id };
    for (const key in dataToSave) {
      if (dataToSave[key] === "" && (key.startsWith("fecha_") || key.endsWith("_id") || key === "incidencia_id" || key === "proveedor_id")) {
        dataToSave[key] = null;
      }
    }
    
    console.log("Intentando guardar gasto para edificio:", edificio_id);

    // 1. Insertar el gasto principal
    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(dataToSave),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Supabase Error Gastos (RLS?):", errorText);
      // Intentar parsear el error para dar un mensaje más limpio
      let cleanError = errorText;
      try {
        const errObj = JSON.parse(errorText);
        cleanError = errObj.message || errorText;
      } catch(e) {}
      return NextResponse.json({ error: cleanError }, { status: res.status });
    }

    const createdGasto = await res.json();
    if (!createdGasto || createdGasto.length === 0) {
      return NextResponse.json({ error: "No se pudo crear el gasto" }, { status: 500 });
    }
    const gastoId = createdGasto[0].id;

    // 1.1. Registro automático en Caja Chica si aplica
    if (gastoData.metodo_pago_sugerido === "Caja Chica") {
      await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          edificio_id,
          concepto: `Gasto: ${gastoData.concepto_descripcion || "Sin descripción"}`,
          tipo: "Egreso",
          monto: parseFloat(gastoData.monto_usd) || 0,
          monto_usd: parseFloat(gastoData.monto_usd) || 0,
          monto_bs: parseFloat(gastoData.monto_bs) || 0,
          tasa_bcv: parseFloat(gastoData.tasa_bcv_factura) || 0,
          fecha: gastoData.fecha_factura || new Date().toISOString(),
          responsable: gastoData.responsable_autoriza || "Administración",
          notas: `Vinculado a Gasto ID: ${gastoId}`
        }),
      });
    }

    // 2. Insertar items de inventario si existen
    if (items && Array.isArray(items) && items.length > 0) {
      const movimientos = items.map((item: any) => ({
        ...item,
        gasto_id: gastoId,
        edificio_id: edificio_id
      }));

      await fetch(`${supabaseUrl}/rest/v1/movimientos_inventario`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(movimientos),
      });
    }

    return NextResponse.json(createdGasto[0]);
  } catch (error: any) {
    console.error("Fatal API Error Gastos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
