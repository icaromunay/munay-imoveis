import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, Tag, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RichTextContent } from '@/components/content/RichTextContent';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { getPost } from '@/lib/api';
import { buildBlogMetadata, buildBlogSchemas, siteUrl } from '@/lib/seo';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Artigo não encontrado',
      alternates: { canonical: `${siteUrl}/blog/${slug}` }
    };
  }

  return buildBlogMetadata(post);
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const schemas = buildBlogSchemas(post);
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <article data-theme-block="blog" className="container-base py-16 md:py-20" style={{ background: 'var(--theme-blog-background)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }} />

      <div className="mx-auto max-w-5xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80" style={{ color: 'var(--theme-blog-text-secondary)' }}>
          <ChevronLeft size={16} />
          Voltar ao blog
        </Link>

        <div className="theme-blog-card mt-8 p-7 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em]" style={{ color: 'var(--theme-blog-button)' }}>
            <span className="rounded-full px-4 py-2" style={{ border: '1px solid color-mix(in srgb, var(--theme-blog-button) 25%, transparent)', background: 'color-mix(in srgb, var(--theme-blog-button) 10%, transparent)' }}>
              {post.category}
            </span>
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight md:text-6xl" style={{ color: 'var(--theme-blog-text-primary)' }}>{post.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8" style={{ color: 'var(--theme-blog-text-secondary)' }}>{post.excerpt}</p>

          <div className="mt-7 flex flex-wrap items-center gap-5 text-sm" style={{ color: 'var(--theme-blog-text-secondary)' }}>
            <span className="inline-flex items-center gap-2">
              <UserRound size={16} style={{ color: 'var(--theme-blog-button)' }} />
              {post.author}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} style={{ color: 'var(--theme-blog-button)' }} />
              Publicado em {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Tag size={16} style={{ color: 'var(--theme-blog-button)' }} />
              Atualizado em {formatDate(post.updatedAt || post.createdAt)}
            </span>
          </div>
        </div>

        <div className="relative mt-8 h-[300px] overflow-hidden rounded-[2rem] md:h-[520px]">
          <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />
        </div>

        <div className="theme-blog-card mt-8 p-6 md:p-8">
          <div className="flex flex-col gap-6 border-b pb-6 md:flex-row md:items-center md:justify-between" style={{ borderColor: 'var(--theme-blog-border)' }}>
            <div>
              <p className="text-sm uppercase tracking-[0.25em]" style={{ color: 'var(--theme-blog-text-secondary)' }}>Compartilhamento</p>
              <p className="mt-2 text-base" style={{ color: 'var(--theme-blog-text-secondary)' }}>Distribua este conteúdo no WhatsApp, Facebook, LinkedIn ou copie o link.</p>
            </div>
            <ShareButtons title={post.title} url={canonicalUrl} />
          </div>

          <RichTextContent html={post.content} className="mt-8 text-lg leading-8" />
        </div>
      </div>
    </article>
  );
}
