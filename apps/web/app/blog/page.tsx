import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronRight, UserRound } from 'lucide-react';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getPosts } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Blog imobiliário',
  path: '/blog',
  description: 'Conteúdo estratégico para investimentos, loteamentos, valorização, financiamento e mercado imobiliário.'
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <section data-theme-block="blog" className="container-base py-20" style={{ background: 'var(--theme-blog-background)' }}>
      <SectionHeader
        eyebrow="Blog"
        title="Conteúdo estratégico para atrair tráfego, educar o lead e fortalecer o SEO"
        subtitle="Artigos imobiliários com visual premium, foco em autoridade digital e apoio à jornada comercial do portal."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={`theme-blog-card group block overflow-hidden transition duration-500 hover:-translate-y-1 hover:no-underline ${index === 0 ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_0.9fr]' : ''}`}
            aria-label={`Abrir artigo ${post.title}`}
          >
            <div className="relative min-h-[320px] overflow-hidden">
              <Image src={post.coverImage} alt={post.title} fill sizes={index === 0 ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 1024px) 100vw, 50vw'} className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08110d] via-[#08110d]/40 to-transparent" />
              <div className="absolute left-6 top-6 z-10 inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] backdrop-blur" style={{ border: '1px solid color-mix(in srgb, var(--theme-blog-button) 30%, transparent)', background: 'color-mix(in srgb, var(--theme-blog-button) 10%, transparent)', color: 'var(--theme-blog-button)' }}>
                {post.category}
              </div>
            </div>

            <div className="flex h-full flex-col justify-between p-7 md:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--theme-blog-text-secondary)' }}>
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={15} style={{ color: 'var(--theme-blog-button)' }} />
                    {post.author}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={15} style={{ color: 'var(--theme-blog-button)' }} />
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-semibold leading-tight md:text-4xl" style={{ color: 'var(--theme-blog-text-primary)' }}>{post.title}</h2>
                <p className="mt-4 text-base leading-7" style={{ color: 'var(--theme-blog-text-secondary)' }}>{post.excerpt}</p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: 'var(--theme-blog-border)' }}>
                <span className="text-sm uppercase tracking-[0.25em]" style={{ color: 'var(--theme-blog-text-secondary)' }}>Leitura estratégica</span>
                <span className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition group-hover:opacity-90" style={{ border: '1px solid color-mix(in srgb, var(--theme-blog-button) 25%, transparent)', background: 'color-mix(in srgb, var(--theme-blog-button) 10%, transparent)', color: 'var(--theme-blog-button)' }}>
                  Ler artigo
                  <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
