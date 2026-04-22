import { NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/googleDrive";
import nodemailer from "nodemailer";

// Configuración para permitir archivos más grandes y mayor tiempo de ejecución en Vercel
export const maxDuration = 60; // 60 segundos (requiere plan Pro, en Hobby será el máximo permitido de 10-15s)
export const dynamic = 'force-dynamic';

interface IncidentData {
  nombre_completo: string;
  apartamento: string;
  telefono: string;
  email?: string;
  tipo_incidencia: string;
  descripcion: string;
  justificacion?: string;
  prioridad: string;
  ubicacion?: string;
  documentos?: string;
  archivos?: Array<{ name: string; content: string }>;
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

export async function POST(request: Request) {
  console.log("!!! API INVOCATION !!! Time:", new Date().toISOString());
  
  try {
    // Verificar el tamaño aproximado del body antes de parsear
    const contentType = request.headers.get("content-type");
    const contentLength = request.headers.get("content-length");
    console.log(`Request Content-Type: ${contentType}, Content-Length: ${contentLength}`);

    const body = await request.json();
    console.log("Body parsed successfully. Data keys:", Object.keys(body));
    
    const data: IncidentData & { edificio_id: string } = body;

    if (!data.nombre_completo || !data.apartamento || !data.telefono || !data.tipo_incidencia || !data.prioridad || !data.descripcion || !data.edificio_id) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados (incluyendo el edificio)" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const apiKey = supabaseServiceKey || supabaseKey;
    const authHeader = `Bearer ${apiKey}`;

    // --- NUEVA LÓGICA DE NUMERACIÓN AMIGABLE ---
    let numeroReporte = "";
    let numeroSecuencia = 0;
    try {
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_and_increment_incidencia_number`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": authHeader,
        },
        body: JSON.stringify({ p_edificio_id: data.edificio_id }),
      });
      
      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        const info = rpcData[0];
        numeroSecuencia = info.siguiente_numero;
        // Formato: PREFIJO-00001
        numeroReporte = `${info.prefijo || 'INC'}-${String(numeroSecuencia).padStart(5, '0')}`;
      } else {
        console.error("RPC Error:", await rpcRes.text());
        // Fallback al formato antiguo si falla el RPC
        const fR = new Date(Date.now() - 4 * 60 * 60 * 1000);
        numeroReporte = `INC-${fR.getTime()}`;
      }
    } catch (e) {
      console.error("Error generating friendly number:", e);
      numeroReporte = `INC-${Date.now()}`;
    }
    // ------------------------------------------

    // URL de la carpeta de Drive donde se guardan los documentos
    const driveFolderUrl = "https://drive.google.com/drive/folders/1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_";
    
    // Parsear los documentos si existen
    let documentosArray: string[] = [];
    let documentosHtml = "No se adjuntaron documentos.";
    let uploadedFiles: Array<{ name: string; webViewLink: string; id: string }> = [];
    
    // Upload files to Google Drive if provided
    if (data.archivos && data.archivos.length > 0) {
      console.log("=== INCIDENCIA API: PROCESSING ARCHIVOS (PARALLEL) ===");
      console.log("Total files in request:", data.archivos.length);
      
      try {
        const uploadPromises = data.archivos.map(async (file, index) => {
          console.log(`Starting parallel upload [${index + 1}]: ${file.name}`);
          
          if (!file.content) {
            console.error(`File ${file.name} has no content!`);
            return null;
          }

          const buffer = Buffer.from(file.content, "base64");
          const mimeType = getMimeType(file.name);
          
          try {
            const result = await uploadFileToDrive(buffer, file.name, mimeType);
            return {
              name: file.name,
              webViewLink: result.webViewLink,
              id: result.id
            };
          } catch (uploadError: any) {
            console.error(`Upload failed for ${file.name}:`, uploadError.message);
            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        uploadedFiles = results.filter((f): f is { name: string; webViewLink: string; id: string } => f !== null);
        
        console.log("Final upload success count:", uploadedFiles.length);
        
        if (uploadedFiles.length > 0) {
          documentosArray = uploadedFiles.map(f => f.name);
          documentosHtml = `<ul style="list-style: none; padding: 0;">
            ${uploadedFiles.map(f => `<li style="padding: 5px 0;">📎 <a href="${f.webViewLink}" target="_blank">${f.name}</a></li>`).join('')}
          </ul>
          <p style="margin-top: 10px;">📁 Carpeta de documentos: <a href="${driveFolderUrl}" target="_blank">${driveFolderUrl}</a></p>`;
        } else {
          documentosHtml = `<p style="color: #ef4444;">⚠️ Hubo errores al subir los documentos a Google Drive. Por favor, revise los logs del servidor.</p>`;
        }
    } catch (e: any) {
        console.error("Critical error in parallel upload process:", e.message);
        documentosHtml = `<p style="color: #ef4444;">⚠️ Error crítico del servidor al procesar archivos: ${e.message}</p>`;
      }
    } else if (data.documentos) {
      // Legacy format: file names only
      try {
        documentosArray = JSON.parse(data.documentos);
        if (documentosArray.length > 0) {
          documentosHtml = `<ul style="list-style: none; padding: 0;">
            ${documentosArray.map((nombre, idx) => `<li style="padding: 5px 0;">📎 ${nombre}</li>`).join('')}
          </ul>
          <p style="margin-top: 10px;">📁 Los documentos han sido guardados en: <a href="${driveFolderUrl}" target="_blank">${driveFolderUrl}</a></p>`;
        }
      } catch (e) {
        console.log("Error parsing documentos:", e);
      }
    }

    const fechaEnvio = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const incidentData = {
      edificio_id: data.edificio_id,
      tipo_origen: 'Residente',
      area_afectada: data.tipo_incidencia,
      reportado_por: data.nombre_completo,
      unidad_codigo: data.apartamento,
      telefono_contacto: data.telefono,
      email_contacto: data.email || null,
      prioridad: data.prioridad,
      descripcion: data.descripcion,
      justificacion: data.justificacion || null,
      ubicacion: data.ubicacion || null,
      estado: 'Abierta',
      estatus: 'Activa',
      documentos: data.documentos ? JSON.stringify({ nombres: documentosArray, carpeta: driveFolderUrl }) : '[]',
      numero_secuencia: numeroSecuencia,
      codigo_personalizado: numeroReporte
    };

    console.log("Inserting incident:", incidentData);

    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": authHeader,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(incidentData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Supabase error:", res.status, errorText);
      return NextResponse.json({ error: "Error al guardar la incidencia" }, { status: 500 });
    }

    const result = await res.json();
    console.log("Incident created:", result[0]?.id);

    // Enviar notificaciones por email
    await sendEmailNotifications(data, numeroReporte, fechaEnvio, uploadedFiles);

    console.log("=== Incidencia API completed ===");

    return NextResponse.json({
      success: true,
      message: "Incidencia registrada correctamente",
      incident: result[0],
      numero_reporte: numeroReporte,
      archivos_subidos: uploadedFiles.length > 0,
      archivos_detalles: uploadedFiles,
    });
  } catch (error) {
    console.error("Error en incidencia:", error);
    return NextResponse.json({ error: "Error al procesar la incidencia" }, { status: 500 });
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anno = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anno} ${hora}:${minuto}`;
}

async function sendEmailNotifications(
  data: IncidentData,
  numeroReporte: string,
  fechaEnvio: string,
  uploadedFiles: Array<{ name: string; webViewLink: string }>
) {
  const nodemailer = require("nodemailer");
  
  const smtpUser = process.env.SMTP_USER || "controlfinancierosaas@gmail.com";
  const smtpPass = process.env.SMTP_PASS || "bjed epzg boco cwsl";
  const driveFolderUrl = "https://drive.google.com/drive/folders/1EUuaVuTMwv6Uitj57MZkF0t-UysqO0R_";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPass },
  });

  const prioridadEmoji: Record<string, string> = {
    "Baja": "🟢",
    "Media": "🟡", 
    "Alta": "🟠",
    "Urgente": "🔴",
  };

  // Generar HTML de documentos
  let documentosHtml = "No se adjuntaron documentos.";
  if (uploadedFiles.length > 0) {
    documentosHtml = `<ul style="list-style: none; padding: 0; margin: 0;">
      ${uploadedFiles.map((f) => `<li style="padding: 5px 0;">📎 <a href="${f.webViewLink}" target="_blank">${f.name}</a></li>`).join('')}
    </ul>
    <p style="margin-top: 10px; font-size: 12px;">📁 Carpeta de documentos: <a href="${driveFolderUrl}" target="_blank" style="color: #1a0dab;">${driveFolderUrl}</a></p>`;
  }

  // === EMAIL A LA JUNTA ===
  const htmlJunta = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <p>Estimados miembros de la Junta de Condominio,</p>
        <p>Se ha registrado una nueva incidencia. A continuación los detalles completos:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Fecha de Reporte</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDate(fechaEnvio)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Número de Reporte</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${numeroReporte}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Nombre</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.nombre_completo}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Apartamento</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.apartamento}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Teléfono</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.telefono}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Email</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.email || 'No proporcionado'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Tipo de Incidencia</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.tipo_incidencia}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Descripción</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.descripcion}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Justificación/Observaciones</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.justificacion || 'No se proporcionaron observaciones'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Prioridad</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${prioridadEmoji[data.prioridad] || '🟡'} ${data.prioridad}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Ubicación</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${data.ubicacion || 'N/A'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa; vertical-align: top;">Documentos adjuntos</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${documentosHtml}</td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;">
          Sistema de Gestión de Junta de Condominio - GestiónCondo
        </p>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Sistema de Reporte" <${smtpUser}>`,
    to: "correojago@gmail.com",
    subject: `🚨 Nueva Incidencia Reportada en el Condominio - ${data.tipo_incidencia}`,
    html: htmlJunta,
  });
  console.log("Email enviado a la junta");

  // === EMAIL AL RESIDENTE ===
  if (data.email) {
    const htmlUsuario = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Estimado residente,</p>
          <p>Su reporte ha sido registrado exitosamente:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Fecha de Reporte</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${formatDate(fechaEnvio)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Número de Reporte</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${numeroReporte}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Tipo de Incidencia</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${data.tipo_incidencia}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Descripción</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${data.descripcion}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Justificación/Observaciones</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${data.justificacion || 'No se proporcionaron observaciones'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Prioridad</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${prioridadEmoji[data.prioridad] || '🟡'} ${data.prioridad}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa;">Ubicación</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${data.ubicacion || 'N/A'}</td>
            </tr>
            ${uploadedFiles.length > 0 ? `
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; background-color: #f8f9fa; vertical-align: top;">Documentos adjuntos</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${documentosHtml}</td>
            </tr>
            ` : ''}
          </table>
          
          <p>Su reporte ha sido asignado para revisión por la Junta de Condominio. Nos estaremos comunicando con usted próximamente.</p>
          <p>Gracias por reportar la incidencia,<br>Junta de Condominio</p>
          <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
            <strong>NOTA:</strong> Por favor no responder a este email. Esta dirección es de envío automático y no es monitoreada por ninguna persona.
          </p>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Junta de Condominio" <${smtpUser}>`,
      to: data.email,
      subject: `✅ Su Reporte de Incidencia ha sido Registrado - ${numeroReporte}`,
      html: htmlUsuario,
    });
    console.log("Email enviado al residente:", data.email);
  }
}