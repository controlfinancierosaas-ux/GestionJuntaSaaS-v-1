import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("=== Register API started ===");
  
  try {
    const body = await request.json();
    console.log("Received body:", JSON.stringify(body));
    
    const {
      buildingName,
      rif,
      buildingType,
      units,
      address,
      adminName,
      adminDocType,
      adminDocNumber,
      adminPhone,
      adminEmail,
      adminPassword,
    } = body;

    if (!buildingName || !buildingType || !units || !address ||
        !adminName || !adminDocType || !adminDocNumber || !adminPhone || !adminEmail || !adminPassword) {
      console.log("Validation failed: missing fields");
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    console.log("Supabase URL:", supabaseUrl ? "SET" : "NOT SET");
    console.log("Supabase Key:", supabaseKey ? "SET" : "NOT SET");
    console.log("Service Key:", supabaseServiceKey ? "SET" : "NOT SET");

    if (!supabaseUrl || !supabaseKey) {
      console.log("Missing env vars");
      return NextResponse.json(
        { error: "Error de configuración del servidor. URL: " + (supabaseUrl ? "OK" : "MISSING") + ", Key: " + (supabaseKey ? "OK" : "MISSING") },
        { status: 500 }
      );
    }

    const apiKey = supabaseServiceKey || supabaseKey;
    const authHeader = `Bearer ${apiKey}`;

    console.log("Checking for existing user...");
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/usuarios?email=eq.${encodeURIComponent(adminEmail)}`,
      {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": authHeader,
        },
      }
    );

    if (!checkRes.ok) {
      const errorText = await checkRes.text();
      console.log("Check error:", checkRes.status, errorText);
    } else {
      const existingUsers = await checkRes.json();
      console.log("Existing users found:", existingUsers.length);
      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        );
      }
    }

    console.log("Creating building...");
    const buildingData = {
      nombre: buildingName,
      rif: rif,
      tipo: buildingType,
      unidades: units,
      direccion: address,
      telefono: adminPhone,
      email: adminEmail,
    };

    const buildingRes = await fetch(`${supabaseUrl}/rest/v1/edificios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(buildingData),
    });

    if (!buildingRes.ok) {
      const errorText = await buildingRes.text();
      console.log("Building insert error:", buildingRes.status, errorText);
      return NextResponse.json(
        { error: "Error al registrar el edificio: " + errorText.substring(0, 100) },
        { status: 500 }
      );
    }

    const buildingResult = await buildingRes.json();
    console.log("Building result:", JSON.stringify(buildingResult));
    
    const edificioId = buildingResult[0]?.id;
    console.log("Building ID:", edificioId);

    if (!edificioId) {
      return NextResponse.json(
        { error: "No se pudo obtener el ID del edificio" },
        { status: 500 }
      );
    }

    console.log("Creating user...");
    const userData = {
      edificio_id: edificioId,
      email: adminEmail,
      password: adminPassword,
      nombre: adminName,
      rol: 'admin',
      telefono: adminPhone,
      documento: adminDocNumber,
      documento_tipo: adminDocType,
    };

    const userRes = await fetch(`${supabaseUrl}/rest/v1/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(userData),
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.log("User insert error:", userRes.status, errorText);
      return NextResponse.json(
        { error: "Error al registrar el usuario: " + errorText.substring(0, 100) },
        { status: 500 }
      );
    }

    const userResult = await userRes.json();
    console.log("User result:", JSON.stringify(userResult));
    console.log("=== Register API completed successfully ===");

    return NextResponse.json({
      success: true,
      message: "Edificio registrado correctamente",
      user: {
        id: userResult[0]?.id,
        email: adminEmail,
        nombre: adminName,
        edificio_id: edificioId,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error al procesar el registro: " + String(error) },
      { status: 500 }
    );
  }
}