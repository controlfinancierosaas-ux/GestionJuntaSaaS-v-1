import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json([]);

  try {
    // Traer TODO sin filtros complejos inicialmente para asegurar que aparezcan datos
    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?select=*&order=created_at.desc`, {
      headers: { 
        "apikey": supabaseKey, 
        "Authorization": `Bearer ${supabaseKey}`,
        "Range": "0-999" 
      },
      cache: 'no-store'
    });
    
    const data = await res.json();

    if (Array.isArray(data)) {
      return NextResponse.json(data);
    }
    
    console.error("Supabase error or non-array response:", data);
    return NextResponse.json([]);
  } catch (error) { 
    return NextResponse.json([]); 
  }
}
