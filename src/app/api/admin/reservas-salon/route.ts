import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const smtpUser = process.env.SMTP_USER || "controlfinancierosaas@gmail.com";
const smtpPass = process.env.SMTP_PASS;

async function sendEmail(to: string, subject: string, html: string) {
  if (!smtpPass) {
    console.error("Email: SMTP_PASS no configurada");
    return;
  }
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPass } });
  try {
    await transporter.sendMail({ from: `"Sistema Junta Torrebela" <${smtpUser}>`, to, subject, html });
    console.log(`Email enviado a ${to}: ${subject}`);
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
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([]);
  }
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

    // VALIDACIÓN DE ANTICIPACIÓN
    const fechaEvento = new Date(body.fecha_evento);
    const hoy = new Date();
    const diffDays = Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return NextResponse.json({ error: "La reserva debe hacerse con al menos 7 días de anticipación." }, { status: 400 });
    }

    // MAPEO MAESTRO (Enviamos todas las variantes para asegurar compatibilidad con tu DB)
    const payload = {
      edificio_id,
      // Variante 1 (Nombres descriptivos)
      nombre_propietario: body.nombre_propietario,
      apartamento: body.apartamento,
      motivo_evento: body.motivo_evento,
      monto_canon: body.monto_canon || 0,
      
      // Variante 2 (Nombres detectados por tus errores)
      propietario: body.nombre_propietario, // Error corregido
      unidad_codigo: body.apartamento,     // Error corregido
      tipo_evento: body.motivo_evento,     // Error reportado ahora
      monto: body.monto_canon || 0,         // Probable columna
      
      // Datos comunes
      email: body.email,
      telefono: body.telefono,
      fecha_evento: body.fecha_evento,
      horario_desde: body.horario_desde,
      horario_hasta: body.horario_hasta,
      invitados_estimados: body.invitados_estimados || 30,
      solvente: body.solvente || false,
      estatus: 'Pendiente',
      estado: 'Pendiente', // Por si acaso
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
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const data = await res.json();

    // EMAILS
    const htmlEmail = `<div style="font-family:Arial;padding:20px;border:1px solid #eee;">
      <h2 style="color:#6366f1;">Solicitud Recibida</h2>
      <p>Hola <b>${body.nombre_propietario}</b>, recibimos tu solicitud para el <b>${body.fecha_evento}</b>.</p>
      <p>Apto: ${body.apartamento} | Motivo: ${body.motivo_evento}</p>
      <p>Revisaremos tu solvencia y te notificaremos pronto.</p>
    </div>`;
    
    await sendEmail(body.email, "Reserva Recibida - Torrebela", htmlEmail);
    await sendEmail("correojago@gmail.com", `NUEVA RESERVA: ${body.apartamento}`, htmlEmail);

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, estatus, monto_canon, apartamento } = body;

    const res = await fetch(`${supabaseUrl}/rest/v1/reservas_salon?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey as string,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ estatus, estado: estatus }),
    });

    if (res.ok && estatus === 'Aprobada') {
      const resData = await fetch(`${supabaseUrl}/rest/v1/reservas_salon?id=eq.${id}&select=*`, {
        headers: { "apikey": supabaseKey as string, "Authorization": `Bearer ${supabaseKey}` },
      });
      const reserva = (await resData.json())[0];
      const htmlAprobado = `<div style="font-family:Arial;padding:20px;">
        <h2 style="color:#10b981;">Solicitud APROBADA</h2>
        <p>Tu solicitud para el día ${reserva.fecha_evento} ha sido aprobada.</p>
        <p>Canon a pagar: $${reserva.monto_canon || reserva.monto || 0}</p>
      </div>`;
      await sendEmail(reserva.email, "Reserva APROBADA - Torrebela", htmlAprobado);
    }

    if (res.ok && estatus === 'Pagada') {
      const cookieStore = await cookies();
      const { edificio_id } = JSON.parse(cookieStore.get("user_data")!.value);
      await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
        method: "POST",
        headers: { "apikey": supabaseKey as string, "Authorization": `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: `Alquiler Salón - Apto ${apartamento}`,
          tipo: 'Ingreso',
          monto: monto_canon || 0,
          monto_usd: monto_canon || 0,
          saldo: monto_canon || 0,
          responsable: 'Sistema',
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
