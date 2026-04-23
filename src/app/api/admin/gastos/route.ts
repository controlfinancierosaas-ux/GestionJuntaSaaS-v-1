import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });
  const apiKey = supabaseServiceKey || supabaseKey;

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas?edificio_id=eq.${edificio_id}&select=*,proveedores(nombre,categoria),incidencias(codigo_personalizado)&order=fecha_factura.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${apiKey}` },
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
  const apiKey = supabaseServiceKey || supabaseKey;

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const body = await req.json();
    const { items, ...gastoData } = body;

    // Limpieza de datos para compatibilidad con Supabase (Strings vacíos -> null)
    const dataToSave: Record<string, any> = { ...gastoData, edificio_id };
    
    for (const key in dataToSave) {
      const val = dataToSave[key];
      // Manejo de Fechas y UUIDs vacíos
      if (val === "" && (key.startsWith("fecha_") || key.endsWith("_id"))) {
        dataToSave[key] = null;
      }
    }
    
    // 1. Insertar el gasto principal (Transparente)
    const res = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(dataToSave),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const createdGasto = await res.json();
    const gastoId = createdGasto[0].id;

    // 1.1. Si el método de pago es Caja Chica, registrar el movimiento de salida
    if (gastoData.metodo_pago_sugerido === "Caja Chica") {
      console.log("Registrando egreso automático en Caja Chica...");
      const ccRes = await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${apiKey}`,
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
          notas: `Vinculado a Gasto ID: ${gastoId}. Ref: ${gastoData.numero_comprobante || 'S/N'}`
        }),
      });
      if (!ccRes.ok) {
        console.error("Error registrando en Caja Chica:", await ccRes.text());
      } else {
        console.log("Egreso en Caja Chica registrado con éxito.");
      }
    }

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
          "Authorization": `Bearer ${apiKey}`,
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
