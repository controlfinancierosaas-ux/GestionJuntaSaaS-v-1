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

    const res = await fetch(`${supabaseUrl}/rest/v1/caja_chica?edificio_id=eq.${edificio_id}&order=fecha.desc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });
    
    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    const { edificio_id } = JSON.parse(userDataCookie!.value);

    const body = await req.json();
    
    const res = await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ ...body, edificio_id }),
    });

    const data = await res.json();
    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
