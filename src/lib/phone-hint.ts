/**
 * Логика как в web `lib/phone/belarus-sms.ts` (без зависимостей от сервера).
 */

export function normalizeDigitsForSms(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('80') && cleaned.length === 11) {
    cleaned = '375' + cleaned.slice(2);
  }
  if (cleaned.length === 9 && !cleaned.startsWith('7')) {
    cleaned = '375' + cleaned;
  }
  return cleaned;
}

export function isBelarusSmsDigits(digits: string): boolean {
  return /^375\d{9}$/.test(digits);
}

/** Подсказка про Telegram, если номер уже явно не +375… */
export function shouldShowNonBelarusSmsHint(phoneRaw: string): boolean {
  const d = normalizeDigitsForSms(phoneRaw);
  if (d.length < 11) return false;
  if (d.startsWith('375') && d.length < 12) return false;
  return !isBelarusSmsDigits(d);
}
