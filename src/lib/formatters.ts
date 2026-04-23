export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "N/A";
  
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Caracas"
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "N/A";

  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Caracas"
  }).toUpperCase();
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a DD/MM/YYYY para mostrar en inputs de texto
 */
export function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Convierte una fecha en formato DD/MM/YYYY a YYYY-MM-DD para guardar en estado/DB
 */
export function parseDateFromUI(val: string): string {
  if (!val) return "";
  const parts = val.split('/');
  if (parts.length !== 3) return val;
  // Asegurar que tengan el padding correcto
  const d = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  const y = parts[2];
  if (y.length === 2) return `20${y}-${m}-${d}`; // Manejar años de 2 dígitos si el usuario los ingresa
  return `${y}-${m}-${d}`;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  
  // Si no tiene código de país y parece ser de Venezuela (comienza con 04, 02 o tiene 10 dígitos)
  if (cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith("0"))) {
      if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
      cleaned = "58" + cleaned;
  }
  
  if (cleaned.startsWith("58") && cleaned.length === 12) {
      return `+58-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  }
  
  return phone; // Return original if it doesn't match expected pattern
}
