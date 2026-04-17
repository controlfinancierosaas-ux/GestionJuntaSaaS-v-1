import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/incidencias?id=eq.${id}`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data[0] || null);
  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const apiKey = supabaseServiceKey || supabaseKey;

    if (body.enviar_email_resuelto && body.enviar_email_resuelto === true) {
      const getRes = await fetch(
        `${supabaseUrl}/rest/v1/incidencias?id=eq.${id}&select=*`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${apiKey}`,
          },
        }
      );
      const incidents = await getRes.json();
      if (incidents.length > 0) {
        const incident = incidents[0];
        await sendResolutionEmail(incident);
      }
    }

    const updateData: Record<string, any> = { ...body };
    delete updateData.enviar_email_resuelto;

    if (updateData.estatus === "Resuelta" && !updateData.fecha_resolucion) {
      updateData.fecha_resolucion = new Date().toISOString();
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/incidencias?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Update error:", error);
      return NextResponse.json({ error: "Error updating" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

async function sendResolutionEmail(incident: any) {
  const nodemailer = require("nodemailer");

  const smtpUser = process.env.SMTP_USER || "controlfinancierosaas@gmail.com";
  const smtpPass = process.env.SMTP_PASS || "bjed epzg boco cwsl";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPass },
  });

  const fechaResolucion = incident.fecha_resolucion
    ? new Date(incident.fecha_resolucion).toLocaleDateString("es-VE")
    : new Date().toLocaleDateString("es-VE");

  const htmlEmail = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Su Incidencia ha sido Resuelta</h2>
        <p>Estimado/a ${incident.reportado_por},</p>
        <p>Le informamos que la incidencia reportada ha sido resuelta.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Número de Reporte</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${incident.id}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Tipo de Incidencia</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${incident.area_afectada}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Fecha de Resolución</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${fechaResolucion}</td>
          </tr>
          ${
            incident.observaciones_resolucion
              ? `
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa; vertical-align: top;">Observaciones de Resolución</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${incident.observaciones_resolucion}</td>
          </tr>
          `
              : ""
          }
        </table>
        
        <p>Si tiene alguna consulta sobre la resolución, por favor contacte a la administración de la junta.</p>
        <p>Gracias por su reporte.<br>Junta de Condominio</p>
        <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
          <strong>NOTA:</strong> Por favor no responder a este email. Esta dirección es de envío automático.
        </p>
      </body>
    </html>
  `;

  if (incident.email_contacto) {
    await transporter.sendMail({
      from: `"Junta de Condominio" <${smtpUser}>`,
      to: incident.email_contacto,
      subject: `✅ Su Incidencia ha sido Resuelta - ${incident.id}`,
      html: htmlEmail,
    });
    console.log("Email de resolución enviado a:", incident.email_contacto);
  }
}
