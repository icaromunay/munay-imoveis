'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <section className="container-base py-24">
          <div className="card-premium mx-auto max-w-2xl p-10 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Ops</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Algo saiu do esperado</h1>
            <p className="mt-4 text-zinc-300">Houve uma falha temporária ao carregar esta página. Tente novamente.</p>
            <button onClick={reset} className="mt-8 rounded-full bg-brand-gold px-6 py-3 font-semibold text-[#08110d]">
              Tentar novamente
            </button>
          </div>
        </section>
      </body>
    </html>
  );
}
