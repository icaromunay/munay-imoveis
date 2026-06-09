'use client';

export function WhatsAppButton({ phone, message }: { phone: string; message: string }) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-2xl transition hover:scale-105"
    >
      WhatsApp agora
    </a>
  );
}
