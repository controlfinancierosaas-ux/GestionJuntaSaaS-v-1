/**
 * SERVICIO: whatsapp.ts
 * DESCRIPCIÓN: Gestión de envío de mensajes vía WhatsApp usando Green API o Whapi.
 * Adaptado del proyecto AGUA.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type WhatsAppService = 'GREENAPI' | 'WHAPI';

interface WhatsAppCredentials {
  service_type: WhatsAppService;
  instance_id?: string;
  api_token: string;
  api_url?: string;
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

    return {
      service_type: config.whatsapp_service as WhatsAppService,
      instance_id: config.greenapi_id_instance,
      api_token: config.whatsapp_service === 'GREENAPI' ? config.greenapi_api_token : config.whapi_token,
      api_url: config.whatsapp_service === 'GREENAPI' ? 'https://api.green-api.com' : 'https://gate.whapi.cloud'
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
