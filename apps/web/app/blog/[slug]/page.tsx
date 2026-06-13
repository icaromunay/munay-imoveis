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
    <article className="container-base bg-white py-16 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }} />

      <div className="mx-auto max-w-5xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
          <ChevronLeft size={16} />
          Voltar ao blog
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 p-7 md:p-10">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-amber-700">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2">{post.category}</span>
            </div>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{post.excerpt}</p>

            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <UserRound size={16} className="text-amber-700" />
                {post.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-amber-700" />
                Publicado em {formatDate(post.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Tag size={16} className="text-amber-700" />
                Atualizado em {formatDate(post.updatedAt || post.createdAt)}
              </span>
            </div>
          </div>

          <div className="relative h-[300px] overflow-hidden border-b border-slate-200 bg-slate-100 md:h-[520px]">
            <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />
          </div>

          <div className="p-6 md:p-8">
            <RichTextContent html={post.content} className="text-lg leading-8" />

            <div className="mt-10 border-t border-slate-200 pt-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Compartilhamento</p>
              <p className="mt-2 text-base text-slate-600">Distribua este conteúdo no WhatsApp, Facebook, LinkedIn ou copie o link.</p>
              <div className="mt-5">
                <ShareButtons title={post.title} url={canonicalUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
