import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([]);

  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json([]);
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const hoy = new Date().toISOString().split('T')[0];

    // 1. Obtener movimientos de Caja Chica de hoy
    const resCaja = await fetch(`${supabaseUrl}/rest/v1/caja_chica?edificio_id=eq.${edificio_id}&fecha=gte.${hoy}T00:00:00&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    const cajaData = await resCaja.json();

    // 2. Obtener gastos de hoy
    const resGastos = await fetch(`${supabaseUrl}/rest/v1/gastos_facturas?edificio_id=eq.${edificio_id}&created_at=gte.${hoy}T00:00:00&select=*,proveedores(nombre)`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    const gastosData = await resGastos.json();

    // Consolidar
    const movimientos = [];

    if (Array.isArray(cajaData)) {
      cajaData.forEach(m => {
        movimientos.push({
          tipo: m.tipo, // Ingreso / Egreso
          descripcion: `${m.concepto} ${m.notas ? `(${m.notas})` : ''}`,
          monto: m.monto_bs,
          referencia: m.referencia_comprobante || 'S/R',
          fuente: 'Caja Chica'
        });
      });
    }

    if (Array.isArray(gastosData)) {
      gastosData.forEach(g => {
        movimientos.push({
          tipo: 'Gasto',
          descripcion: `${g.proveedores?.nombre || 'Proveedor'}: ${g.concepto_descripcion}`,
          monto: g.monto_bs,
          referencia: g.numero_comprobante || 'S/N',
          fuente: 'Facturación'
        });
      });
    }

    return NextResponse.json(movimientos);
  } catch (error) {
    return NextResponse.json([]);
  }
}
