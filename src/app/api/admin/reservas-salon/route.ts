import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const smtpUser = process.env.SMTP_USER || "controlfinancierosaas@gmail.com";
const smtpPass = process.env.SMTP_PASS;

async function sendEmail(to: string, subject: string, html: string) {
  if (!smtpPass) return;
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPass } });
  try {
    await transporter.sendMail({ from: `"Sistema Junta Torrebela" <${smtpUser}>`, to, subject, html });
  } catch (error) {
    console.error("Error enviando email:", error);
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    if (!userDataCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { edificio_id } = JSON.parse(userDataCookie.value);

    const res = await fetch(`${supabaseUrl}/rest/v1/reservas_salon?edificio_id=eq.${edificio_id}&order=fecha_evento.desc`, {
      headers: { "apikey": supabaseKey as string, "Authorization": `Bearer ${supabaseKey}` },
    });
    return NextResponse.json(await res.json());
  } catch (error) { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    let edificio_id = "";
    const body = await req.json();

    if (userDataCookie) {
      edificio_id = JSON.parse(userDataCookie.value).edificio_id;
    } else {
      edificio_id = body.edificio_id;
    }

    if (!edificio_id) return NextResponse.json({ error: "Edificio no identificado" }, { status: 400 });

    // Generar un número de reserva único para cumplir con la restricción UNIQUE
    const numeroReserva = `RS-${Date.now().toString().slice(-6)}`;

    // MAPEO DEFINITIVO basado en las restricciones del usuario
    const payload = {
      edificio_id,
      numero: numeroReserva,             // Columna con UNIQUE constraint
      propietario: body.nombre_propietario, // Columna obligatoria detectada
      unidad_codigo: body.apartamento,     // Columna obligatoria detectada
      tipo_evento: body.motivo_evento,     // Columna obligatoria detectada
      monto: body.monto_canon || 0,        // Columna de monto detectada
      
      // Otros campos necesarios
      email: body.email,
      telefono: body.telefono,
      fecha_evento: body.fecha_evento,
      horario_desde: body.horario_desde,
      horario_hasta: body.horario_hasta,
      invitados_estimados: body.invitados_estimados || 30,
      solvente: body.solvente || false,
      estatus: 'Pendiente',
      fecha_solicitud: new Date().toISOString()
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/reservas_salon`, {
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
      const err = await res.json();
      console.error("Supabase Error:", err);
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const data = await res.json();
    const createdReserva = data[0];

    // Enviar Emails
    const htmlEmail = `<div style="font-family:Arial;padding:20px;border:1px solid #eee;">
      <h2 style="color:#6366f1;">Solicitud Recibida: ${numeroReserva}</h2>
      <p>Hola <b>${body.nombre_propietario}</b>, recibimos tu solicitud para el <b>${body.fecha_evento}</b>.</p>
      <p>Apto: ${body.apartamento} | Motivo: ${body.motivo_evento}</p>
    </div>`;
    
    await sendEmail(body.email, `Reserva Recibida ${numeroReserva} - Torrebela`, htmlEmail);
    await sendEmail("correojago@gmail.com", `NUEVA RESERVA ${numeroReserva}: ${body.apartamento}`, htmlEmail);

    return NextResponse.json(createdReserva);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, estatus, monto_canon, apartamento } = body;

    // 1. Actualizar estatus de la reserva
    const res = await fetch(`${supabaseUrl}/rest/v1/reservas_salon?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey as string,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ estatus }),
    });

    if (res.ok && estatus === 'Pagada') {
      const cookieStore = await cookies();
      const { edificio_id } = JSON.parse(cookieStore.get("user_data")!.value);
      
      // 2. Registrar en Caja Chica VINCULANDO con reserva_id
      await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
        method: "POST",
        headers: { "apikey": supabaseKey as string, "Authorization": `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reserva_id: id, // Vínculo detectado en las restricciones
          concepto: `Alquiler Salón - Apto ${apartamento}`,
          tipo: 'Ingreso',
          monto: monto_canon || 0,
          monto_usd: monto_canon || 0,
          saldo: 0, // El saldo se maneja por DB o se enviará 0 para que no falle
          responsable: 'Sistema Reservas',
          edificio_id,
          fecha: new Date().toISOString()
        }),
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
