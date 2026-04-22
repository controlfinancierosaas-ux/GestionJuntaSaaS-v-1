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
  console.log("Reservas Salon API: GET Request");
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
    console.error("Reservas Salon GET Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  console.log("Reservas Salon API: POST Request");
  try {
    // Intentar obtener cookie pero permitir si es pública (desde el form de copropietarios)
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user_data");
    let edificio_id = "";
    
    const body = await req.json();

    if (userDataCookie) {
      edificio_id = JSON.parse(userDataCookie.value).edificio_id;
    } else {
      edificio_id = body.edificio_id; // Viene del form público
    }

    if (!edificio_id) return NextResponse.json({ error: "Edificio no identificado" }, { status: 400 });

    console.log("Reservas Salon POST Body:", body);

    // Validación de 7 días (Lógica del AppScript)
    const fechaEvento = new Date(body.fecha_evento);
    const hoy = new Date();
    const diffTime = fechaEvento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      console.warn("Reservas Salon: Intento de reserva con menos de 7 días");
      return NextResponse.json({ error: "La reserva debe hacerse con al menos 7 días de anticipación." }, { status: 400 });
    }

    const payload = {
      ...body,
      edificio_id,
      propietario: body.nombre_propietario, // Mapeo para evitar error de constraint
      unidad_codigo: body.apartamento, // Mapeo para evitar error de constraint
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
      console.error("Reservas Salon POST Supabase Error:", err);
      return NextResponse.json({ error: err.message }, { status: res.status });
    }

    const data = await res.json();
    console.log("Reservas Salon: Reserva creada con éxito", data[0]);
    
    // ENVIAR EMAIL DE SOLICITUD RECIBIDA
    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #6366f1;">Solicitud de Salón Recibida</h2>
        <p>Estimado(a) <strong>${body.nombre_propietario}</strong>,</p>
        <p>Hemos recibido tu solicitud para el uso del salón de fiestas:</p>
        <ul>
          <li><strong>Fecha:</strong> ${new Date(body.fecha_evento).toLocaleDateString()}</li>
          <li><strong>Horario:</strong> ${body.horario_desde} a ${body.horario_hasta}</li>
          <li><strong>Motivo:</strong> ${body.motivo_evento}</li>
        </ul>
        <p>Tu solicitud está siendo revisada por la Junta de Condominio. Recibirás otro correo cuando sea aprobada para proceder con el pago y firma de la planilla.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 10px; color: #999;">NOTA: Por favor no responder a este email. Esta es una notificación automática.</p>
      </div>
    `;
    await sendEmail(body.email, "Solicitud de Salón Recibida - Residencias Torrebela", htmlEmail);
    // Email a la junta
    await sendEmail("correojago@gmail.com", `NUEVA SOLICITUD SALÓN: ${body.apartamento}`, htmlEmail);

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error("Reservas Salon POST Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  console.log("Reservas Salon API: PATCH Request (Update Status)");
  try {
    const body = await req.json();
    const { id, estatus, monto_canon } = body;

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

    if (res.ok && estatus === 'Aprobada') {
      // Notificar aprobación al propietario
      const resData = await fetch(`${supabaseUrl}/rest/v1/reservas_salon?id=eq.${id}&select=*`, {
        headers: { "apikey": supabaseKey as string, "Authorization": `Bearer ${supabaseKey}` },
      });
      const reserva = (await resData.json())[0];
      
      const htmlAprobado = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #10b981;">Solicitud APROBADA</h2>
          <p>Hola <strong>${reserva.nombre_propietario}</strong>,</p>
          <p>Tu solicitud para el día ${new Date(reserva.fecha_evento).toLocaleDateString()} ha sido <strong>APROBADA</strong>.</p>
          <p>Por favor, acércate a la oficina de la Junta para firmar la planilla y realizar el pago del canon correspondiente.</p>
          <p><strong>Canon:</strong> $${reserva.monto_canon || 'A consultar'}</p>
        </div>
      `;
      await sendEmail(reserva.email, "Solicitud de Salón APROBADA - Residencias Torrebela", htmlAprobado);
    }

    if (res.ok && estatus === 'Pagada') {
      console.log("Reservas Salon: Pago confirmado. Registrando en Caja Chica...");
      const cookieStore = await cookies();
      const userDataCookie = cookieStore.get("user_data");
      const { edificio_id } = JSON.parse(userDataCookie!.value);

      await fetch(`${supabaseUrl}/rest/v1/caja_chica`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey as string,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          concepto: `Alquiler Salón de Fiestas - Apto ${body.apartamento}`,
          tipo: 'Ingreso',
          monto: monto_canon || 0,
          monto_usd: monto_canon || 0,
          responsable: 'Sistema (Reserva Salon)',
          edificio_id,
          fecha: new Date().toISOString()
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reservas Salon PATCH Exception:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
