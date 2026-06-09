'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin, MessageCircle } from 'lucide-react';

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const items = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: MessageCircle
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: Facebook
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: Linkedin
    }
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-brand-gold/35 hover:text-brand-gold"
          >
            <Icon size={16} />
            {item.label}
          </a>
        );
      })}

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 text-sm font-medium text-brand-gold transition hover:opacity-90"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
    </div>
  );
}
