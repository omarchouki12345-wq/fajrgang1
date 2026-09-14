export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `212${digits.slice(1)}` : digits;
  const base = `https://wa.me/${intl}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function memberCredentialsMessage(
  name: string,
  whatsapp: string,
  password: string
): string {
  return `السلام عليكم ${name}\nحسابك في فجر جماعة:\nالواتساب: ${whatsapp}\nكلمة المرور: ${password}`;
}
