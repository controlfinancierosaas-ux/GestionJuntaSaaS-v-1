import { NextResponse } from "next/server";

const DEMO_USER = { 
  id: "demo", 
  email: "demo@gestioncondo.com", 
  password: "demo123", 
  nombre: "Usuario Demo", 
  rol: "admin",
  edificio_nombre: "Edificio Demo" 
};

export async function POST(request: Request) {
  console.log("=== Login API started ===");
  
  try {
    const { email, password } = await request.json();
    console.log("Login attempt for:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    let userData;
    let isDemo = false;

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      console.log("Demo user login successful");
      userData = DEMO_USER;
      isDemo = true;
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

      console.log("Supabase URL:", supabaseUrl ? "SET" : "NOT SET");
      console.log("Supabase Key:", supabaseKey ? "SET" : "NOT SET");

      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase env vars");
        return NextResponse.json(
          { error: "Error de configuración del servidor" },
          { status: 500 }
        );
      }

      const apiKey = supabaseServiceKey || supabaseKey;
      const authHeader = `Bearer ${apiKey}`;

      console.log("Querying usuarios table...");
      const res = await fetch(
        `${supabaseUrl}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "apikey": supabaseKey,
            "Authorization": authHeader,
          },
        }
      );

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Supabase error:", res.status, errorText);
        return NextResponse.json(
          { error: "Error al verificar credenciales" },
          { status: 500 }
        );
      }

      const users = await res.json();
      console.log("Users found:", users.length);

      if (!users || users.length === 0) {
        console.log("No user found with email:", email);
        return NextResponse.json(
          { error: "Email o contraseña incorrectos" },
          { status: 401 }
        );
      }

      const user = users[0];
      console.log("User found, checking password...");

      if (user.password !== password) {
        return NextResponse.json(
          { error: "Email o contraseña incorrectos" },
          { status: 401 }
        );
      }

      userData = {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        edificio_id: user.edificio_id,
      };
    }

    console.log("=== Login successful ===");

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    response.cookies.set("user_data", JSON.stringify(userData), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión: " + String(error) },
      { status: 500 }
    );
  }
}