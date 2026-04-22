import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([], { status: 500 });

  try {
    // Obtenemos las evaluaciones con información del proveedor usando join de Supabase/PostgREST
    const res = await fetch(`${supabaseUrl}/rest/v1/evaluaciones_proveedores?select=*,proveedores(nombre,categoria)&order=fecha_evaluacion.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    if (!res.ok) {
      console.error("Error fetching evaluations:", await res.text());
      return NextResponse.json([], { status: 500 });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server error fetching evaluations:", error);
    return NextResponse.json([], { status: 500 });
  }
}
