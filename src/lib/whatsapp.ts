/**
 * SERVICIO: whatsapp.ts
 * DESCRIPCIÓN: Gestión de envío de mensajes vía WhatsApp usando Green API, Whapi, Meta Business o CallMeBot.
 * Adaptado del proyecto AGUA y AppScript v4.1.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type WhatsAppService = 'GREENAPI' | 'WHAPI' | 'BUSINESS' | 'CALLMEBOT';

interface WhatsAppCredentials {
  service_type: WhatsAppService;
  instance_id?: string;
  api_token: string;
  api_url?: string;
  phone_number_id?: string; // Para Meta Business
  callmebot_phone?: string;  // Para CallMeBot
}

/**
 * Obtiene las credenciales activas para el servicio de WhatsApp desde la configuración del edificio
 */
async function getActiveCredentials(building_id: string | null): Promise<WhatsAppCredentials | null> {
  if (!building_id) return null;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/edificio_config?edificio_id=eq.${building_id}&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const config = data[0];
    if (!config || !config.whatsapp_enabled) return null;

    const service = config.whatsapp_service as WhatsAppService;
    let api_token = "";
    let api_url = "";

    if (service === 'GREENAPI') {
      api_token = config.greenapi_api_token;
      api_url = 'https://api.green-api.com';
    } else if (service === 'WHAPI') {
      api_token = config.whapi_token;
      api_url = 'https://gate.whapi.cloud';
    } else if (service === 'BUSINESS') {
      api_token = config.wa_business_access_token;
      api_url = 'https://graph.facebook.com/v18.0';
    } else if (service === 'CALLMEBOT') {
      api_token = config.callmebot_apikey;
      api_url = 'https://api.callmebot.com/whatsapp.php';
    }

    return {
      service_type: service,
      instance_id: config.greenapi_id_instance,
      api_token,
      api_url,
      phone_number_id: config.wa_business_phone_number_id,
      callmebot_phone: config.callmebot_phone
    };
  } catch (error) {
    console.error("Error fetching WhatsApp credentials:", error);
    return null;
  }
}

/**
 * Registra el envío en la cola de WhatsApp
 */
async function logToQueue(
  building_id: string | null,
  phone: string,
  message: string,
  status: 'sent' | 'failed',
  error?: string
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/whatsapp_queue`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        building_id,
        recipient_phone: phone,
        message_text: message,
        status,
        error_message: error || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        attempts: 1
      })
    });
  } catch (err) {
    console.error("Error logging to WhatsApp queue:", err);
  }
}

/**
 * Envío vía Green API
 */
async function sendViaGreenApi(creds: WhatsAppCredentials, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const chatId = `${cleanPhone}@c.us`;
  const url = `${creds.api_url}/waInstance${creds.instance_id}/sendMessage/${creds.api_token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.idMessage;
}

/**
 * Envío vía Whapi
 */
async function sendViaWhapi(creds: WhatsAppCredentials, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const chatId = `${cleanPhone}@s.whatsapp.net`;
  const url = `${creds.api_url}/messages/text`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.api_token}`
    },
    body: JSON.stringify({ to: chatId, body: message })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.id || data.sent_message_id;
}

/**
 * Envío vía WhatsApp Business (Meta Graph API)
 */
async function sendViaMeta(creds: WhatsAppCredentials, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `${creds.api_url}/${creds.phone_number_id}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.api_token}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: { body: message }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data.messages[0].id;
}

/**
 * Envío vía CallMeBot
 */
async function sendViaCallmeBot(creds: WhatsAppCredentials, phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  // CallMeBot usualmente envía al número que activó el bot, pero permite especificar phone
  const url = `${creds.api_url}?phone=${cleanPhone}&text=${encodedText}&apikey=${creds.api_token}`;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
  return "CMB-" + Date.now();
}

/**
 * Función principal de envío
 */
export async function sendWhatsApp(
  building_id: string | null,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const creds = await getActiveCredentials(building_id);
    if (!creds) {
      return { success: false, error: "No active WhatsApp credentials found or WhatsApp is disabled for this building" };
    }

    let result;
    if (creds.service_type === 'GREENAPI') {
      result = await sendViaGreenApi(creds, phone, message);
    } else if (creds.service_type === 'WHAPI') {
      result = await sendViaWhapi(creds, phone, message);
    } else if (creds.service_type === 'BUSINESS') {
      result = await sendViaMeta(creds, phone, message);
    } else if (creds.service_type === 'CALLMEBOT') {
      result = await sendViaCallmeBot(creds, phone, message);
    } else {
      throw new Error("Unsupported WhatsApp service type");
    }

    await logToQueue(building_id, phone, message, 'sent');
    return { success: true };
  } catch (error: any) {
    console.error("Error sending WhatsApp:", error);
    await logToQueue(building_id, phone, message, 'failed', error.message || String(error));
    return { success: false, error: error.message || String(error) };
  }
}
