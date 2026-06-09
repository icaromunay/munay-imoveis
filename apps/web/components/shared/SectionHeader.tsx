export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-12 max-w-4xl">
      <p className="theme-chip inline-flex px-4 py-2 text-[11px] uppercase tracking-[0.34em]">{eyebrow}</p>
      <h2 className="section-title mt-5 text-balance">{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
    </div>
  );
}
