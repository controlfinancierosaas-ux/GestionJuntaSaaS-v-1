import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic';

// Estatus que se consideran "Pendientes"
const ESTATUS_PENDIENTES = ["Activa", "En Evaluación", "En Ejecución", "Asignada"];

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configuración de base de datos faltante" }, { status: 500 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/incidencias?order=created_at.asc`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });

    if (!res.ok) throw new Error("Error al obtener incidencias");
    const incidencias = await res.json();

    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);

    // --- CÁLCULO DE MÉTRICAS ---
    const casosPendientes = incidencias.filter((inc: any) => ESTATUS_PENDIENTES.includes(inc.estatus || "Activa"));
    const inconsistencias = incidencias.filter((inc: any) => inc.estatus === "Resuelta" && !inc.fecha_resolucion);
    
    const nuevasEstaSemana = incidencias.filter((inc: any) => new Date(inc.created_at) >= hace7Dias).length;
    const resueltasEstaSemana = incidencias.filter((inc: any) => inc.estatus === "Resuelta" && inc.fecha_resolucion && new Date(inc.fecha_resolucion) >= hace7Dias).length;
    
    const casosCriticos = casosPendientes.filter((inc: any) => ["Urgente", "Alta"].includes(inc.prioridad)).length;
    const casosAntiguos = casosPendientes.filter((inc: any) => new Date(inc.created_at) < hace15Dias).length;

    // Agrupación por Área (Top 3)
    const areasMap: Record<string, number> = {};
    casosPendientes.forEach((inc: any) => {
      areasMap[inc.area_afectada] = (areasMap[inc.area_afectada] || 0) + 1;
    });
    const topAreas = Object.entries(areasMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Agrupación por Responsable
    const grupos: Record<string, any[]> = {};
    casosPendientes.forEach((inc: any) => {
      const responsable = inc.responsable_gestion || "Sin Asignar";
      if (!grupos[responsable]) grupos[responsable] = [];
      grupos[responsable].push(inc);
    });

    const html = generarReporteHTML({
      grupos, 
      inconsistencias,
      stats: {
        totalPendientes: casosPendientes.length,
        nuevasEstaSemana,
        resueltasEstaSemana,
        casosCriticos,
        casosAntiguos,
        topAreas
      }
    });

    // --- OBTENER DESTINATARIOS DE LA BASE DE DATOS ---
    const destinatarios = new Set<string>();
    destinatarios.add("correojago@gmail.com"); // Siempre enviar copia al desarrollador/admin global

    try {
      // 1. Emails de administradores
      const usersRes = await fetch(`${supabaseUrl}/rest/v1/usuarios?rol=eq.admin&select=email`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => u.email && destinatarios.add(u.email));
      }

      // 2. Emails de la junta en configuración
      const configRes = await fetch(`${supabaseUrl}/rest/v1/edificio_config?select=email_junta`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
      });
      if (configRes.ok) {
        const configs = await configRes.json();
        configs.forEach((c: any) => c.email_junta && destinatarios.add(c.email_junta));
      }
    } catch (e) {
      console.error("Error al obtener destinatarios:", e);
    }

    await enviarEmailReporte(html, Array.from(destinatarios));

    return NextResponse.json({ 
      success: true, 
      destinatarios: Array.from(destinatarios),
      stats: { totalPendientes: casosPendientes.length } 
    });

  } catch (error: any) {
    console.error("Error en reporte semanal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generarReporteHTML({ grupos, inconsistencias, stats }: any) {
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-VE', { 
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
  });
  
  const obtenerColorPrioridad = (prioridad: string) => {
    const prio = (prioridad || "").toLowerCase();
    if (prio.includes('urgente')) return '#b91c1c'; // Rojo oscuro
    if (prio.includes('alta')) return '#dc2626'; // Rojo
    if (prio.includes('media')) return '#d97706'; // Naranja
    return '#059669'; // Verde
  };

  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #374151; line-height: 1.5; }
      .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      .header { background: #064e3b; color: white; padding: 32px; text-align: center; }
      .section { padding: 24px 32px; border-bottom: 1px solid #f3f4f6; }
      .grid { display: table; width: 100%; border-spacing: 10px; }
      .card { display: table-cell; padding: 16px; border-radius: 8px; text-align: center; width: 25%; }
      .table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .table th { background: #f9fafb; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
      .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
      .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: white; }
    </style>
  </head>
  <body style="background-color: #f3f4f6; padding: 20px;">
    <div class="container">
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">REPORTE DE CONTROL DE GESTIÓN</h1>
        <p style="margin: 8px 0 0; opacity: 0.8;">Bitácora de Incidentes - ${fechaFormateada}</p>
      </div>

      <div class="section">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827;">🚀 Resumen de Desempeño</h2>
        <div class="grid">
          <div class="card" style="background: #eff6ff; border: 1px solid #3b82f6;">
            <div style="font-size: 24px; font-weight: 800; color: #1d4ed8;">${stats.totalPendientes}</div>
            <div style="font-size: 11px; color: #1d4ed8; font-weight: 600;">PENDIENTES TOTAL</div>
          </div>
          <div class="card" style="background: #fef2f2; border: 1px solid #ef4444;">
            <div style="font-size: 24px; font-weight: 800; color: #b91c1c;">${stats.casosCriticos}</div>
            <div style="font-size: 11px; color: #b91c1c; font-weight: 600;">CRÍTICOS (ALTA/URG)</div>
          </div>
          <div class="card" style="background: #fffbeb; border: 1px solid #f59e0b;">
            <div style="font-size: 24px; font-weight: 800; color: #b45309;">${stats.casosAntiguos}</div>
            <div style="font-size: 11px; color: #b45309; font-weight: 600;">+15 DÍAS ABIERTOS</div>
          </div>
          <div class="card" style="background: #ecfdf5; border: 1px solid #10b981;">
            <div style="font-size: 24px; font-weight: 800; color: #047857;">${stats.resueltasEstaSemana}</div>
            <div style="font-size: 11px; color: #047857; font-weight: 600;">RESUELTAS (7D)</div>
          </div>
        </div>
      </div>

      <div class="section" style="background: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="width: 48%;">
             <h3 style="font-size: 14px; margin-bottom: 8px;">📊 Áreas con más reportes:</h3>
             <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
               ${stats.topAreas.map(([area, cant]: any) => `<li>${area}: <strong>${cant}</strong></li>`).join('')}
             </ul>
          </div>
          <div style="width: 48%; border-left: 1px solid #ddd; padding-left: 20px;">
             <h3 style="font-size: 14px; margin-bottom: 8px;">📅 Movimiento Semanal:</h3>
             <p style="margin: 0; font-size: 13px;">Entrantes: <span style="color: #ef4444; font-weight: bold;">+${stats.nuevasEstaSemana}</span></p>
             <p style="margin: 0; font-size: 13px;">Salientes: <span style="color: #10b981; font-weight: bold;">-${stats.resueltasEstaSemana}</span></p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 style="margin: 0 0 20px; font-size: 18px; color: #111827;">👥 Distribución por Responsable</h2>
        ${Object.keys(grupos).sort().map(responsable => `
          <div style="margin-bottom: 24px;">
            <div style="background: #f3f4f6; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 12px;">
              👤 ${responsable} (${grupos[responsable].length} casos)
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Incidencia / Reporta</th>
                  <th>Prioridad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${grupos[responsable].map((inc: any) => `
                  <tr>
                    <td style="white-space: nowrap; color: #6b7280;">${new Date(inc.created_at).toLocaleDateString('es-VE')}</td>
                    <td>
                      <div style="font-weight: 600;">${inc.area_afectada}</div>
                      <div style="font-size: 11px; color: #6b7280;">${inc.unidad_codigo} - ${inc.reportado_por}</div>
                    </td>
                    <td><span class="badge" style="background: ${obtenerColorPrioridad(inc.prioridad)}">${inc.prioridad || 'MEDIA'}</span></td>
                    <td style="color: #4b5563;">${inc.descripcion.substring(0, 100)}${inc.descripcion.length > 100 ? '...' : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>

      ${inconsistencias.length > 0 ? `
      <div class="section" style="background: #fffbeb;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #92400e;">⚠️ Inconsistencias de Datos</h2>
        <p style="font-size: 12px; color: #b45309; margin-bottom: 12px;">Los siguientes casos están "Resueltos" pero no tienen registrada la fecha de cierre:</p>
        <div style="font-size: 12px;">
          ${inconsistencias.map((inc: any) => `• ID: <strong>${inc.id.slice(0,8)}</strong> - ${inc.area_afectada} (${inc.reportado_por})`).join('<br>')}
        </div>
      </div>
      ` : ''}

      <div class="section" style="text-align: center; padding: 40px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/admin/incidencias" 
           style="background: #064e3b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
          Gestionar en Panel Administrativo
        </a>
      </div>
    </div>
  </body>
  </html>
  `;
  return html;
}

async function enviarEmailReporte(html: string, destinatarios: string[]) {
  const smtpUser = process.env.SMTP_USER || "controlfinancierosaas@gmail.com";
  const smtpPass = process.env.SMTP_PASS || "bjed epzg boco cwsl";
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: smtpUser, pass: smtpPass } });
  const fecha = new Date().toLocaleDateString('es-VE');

  if (destinatarios.length === 0) {
    console.warn("No hay destinatarios para el reporte semanal.");
    return;
  }

  await transporter.sendMail({
    from: `"GestiónCondo Control" <${smtpUser}>`,
    to: destinatarios.join(", "),
    subject: `📊 CONTROL DE GESTIÓN: Reporte Semanal - ${fecha}`,
    html: html,
  });
}
