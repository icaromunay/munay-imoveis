'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutTemplate, Mail, Settings2 } from 'lucide-react';

const links = [
  { href: '/admin/settings', label: 'Geral', icon: Settings2 },
  { href: '/admin/settings/smtp', label: 'SMTP', icon: Mail },
  { href: '/admin/settings/email-templates', label: 'Modelos de E-mail', icon: LayoutTemplate }
];

export function AdminSettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition ${
              active
                ? 'bg-brand-gold text-[#08110d]'
                : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-brand-gold/35 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
