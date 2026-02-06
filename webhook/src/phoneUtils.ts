/**
 * Normaliza um número de telefone removendo formatação e código do país.
 * Retorna apenas os últimos 10-11 dígitos para matching flexível.
 */
export function normalizePhone(phone: string): string {
  // Remove tudo que não é dígito
  const digits = phone.replace(/\D/g, '');

  // Retorna últimos 11 dígitos (padrão BR: DDD + 9 dígitos)
  // ou últimos 10 se for fixo
  if (digits.length >= 11) {
    return digits.slice(-11);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Extrai o número de telefone do remoteJid do WhatsApp.
 * Format: "5511999999999@s.whatsapp.net"
 */
export function extractPhoneFromJid(jid: string): string {
  return jid.split('@')[0];
}

/**
 * Verifica se dois números de telefone são equivalentes
 * comparando os últimos dígitos significativos.
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const n1 = normalizePhone(phone1);
  const n2 = normalizePhone(phone2);

  if (n1 === n2) return true;

  // Comparar últimos 10 dígitos
  const last10_1 = n1.slice(-10);
  const last10_2 = n2.slice(-10);

  return last10_1 === last10_2;
}
