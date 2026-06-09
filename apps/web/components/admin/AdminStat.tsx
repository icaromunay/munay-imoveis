import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function AdminStat({
  label,
  value,
  helper,
  href
}: {
  label: string;
  value: string | number;
  helper?: string;
  href?: string;
}) {
  return (
    <div className="card-premium flex h-full flex-col justify-between p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        {helper ? <p className="mt-2 text-sm leading-6 text-zinc-400">{helper}</p> : null}
      </div>

      {href ? (
        <div className="mt-5">
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-brand-gold transition hover:opacity-85">
            Abrir
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
