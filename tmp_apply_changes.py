from pathlib import Path
import re

root = Path('/home/user/workspace_891')

# 1) AdminShell: allow optional sidebar content below menu
admin_shell = root / 'apps/web/components/admin/AdminShell.tsx'
text = admin_shell.read_text()
text = text.replace("import { ReactNode } from 'react';", "import { ReactNode } from 'react';")
text = text.replace(
    "export function AdminShell({ children, title }: { children: ReactNode; title: string }) {",
    "export function AdminShell({ children, title, sidebarContent }: { children: ReactNode; title: string; sidebarContent?: ReactNode }) {"
)
text = text.replace(
    "          <nav className=\"mt-5 space-y-2\">\n            {links.map((link) => {",
    "          <nav className=\"mt-5 space-y-2\">\n            {links.map((link) => {"
)
old = """          <nav className=\"mt-5 space-y-2\">\n            {links.map((link) => {\n              const Icon = link.icon;\n              const active =\n                link.href === '/admin/properties'\n                  ? pathname === '/admin/properties'\n                  : pathname === link.href || pathname.startsWith(`${link.href}/`);\n              return (\n                <Link\n                  key={link.href}\n                  href={link.href}\n                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${\n                    active ? 'bg-brand-gold text-[#08110d]' : 'text-zinc-300 hover:bg-white/5 hover:text-white'\n                  }`}\n                >\n                  <Icon size={17} />\n                  <span>{link.label}</span>\n                </Link>\n              );\n            })}\n\n            <button\n              onClick={() => signOut({ redirectTo: '/login' })}\n              className=\"mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white\"\n            >\n              <LogOut size={17} />\n              <span>Sair</span>\n            </button>\n          </nav>\n        </aside>\n"""
new = """          <nav className=\"mt-5 space-y-2\">\n            {links.map((link) => {\n              const Icon = link.icon;\n              const active =\n                link.href === '/admin/properties'\n                  ? pathname === '/admin/properties'\n                  : pathname === link.href || pathname.startsWith(`${link.href}/`);\n              return (\n                <Link\n                  key={link.href}\n                  href={link.href}\n                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${\n                    active ? 'bg-brand-gold text-[#08110d]' : 'text-zinc-300 hover:bg-white/5 hover:text-white'\n                  }`}\n                >\n                  <Icon size={17} />\n                  <span>{link.label}</span>\n                </Link>\n              );\n            })}\n\n            <button\n              onClick={() => signOut({ redirectTo: '/login' })}\n              className=\"mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white\"\n            >\n              <LogOut size={17} />\n              <span>Sair</span>\n            </button>\n          </nav>\n\n          {sidebarContent ? <div className=\"mt-6\">{sidebarContent}</div> : null}\n        </aside>\n"""
if old not in text:
    raise SystemExit('AdminShell block not found')
text = text.replace(old, new)
admin_shell.write_text(text)

# 2) RichTextEditor: stabilize content sync + add font-size controls
rich = root / 'apps/web/components/editor/RichTextEditor.tsx'
text = rich.read_text()
text = text.replace("import { useEffect } from 'react';", "import { useEffect, useMemo, useRef } from 'react';")
text = text.replace("import { EditorContent, useEditor } from '@tiptap/react';", "import { EditorContent, useEditor } from '@tiptap/react';\nimport { Extension } from '@tiptap/core';")
text = text.replace(
    "  AlignRight,\n  Bold,\n  Eraser,",
    "  AlignRight,\n  Bold,\n  ChevronDown,\n  ChevronUp,\n  Eraser,"
)
insert_after = "const quickEmojis = ['🏡', '📍', '💰', '✨', '✅'];\n"
font_extension = """
const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32];

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle']
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const size = element.style.fontSize;
              return size || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`
              };
            }
          }
        }
      }
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        }
    };
  }
});

function normalizeHtmlValue(value: string) {
  const normalized = (value || '').trim();
  return normalized || '<p></p>';
}

function parseFontSize(value?: string | null) {
  const size = Number.parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(size) && size > 0 ? size : 16;
}

function getNextFontSize(currentSize: number, direction: 'up' | 'down') {
  const sorted = [...fontSizes].sort((a, b) => a - b);
  if (direction === 'up') {
    return sorted.find((size) => size > currentSize) ?? sorted[sorted.length - 1];
  }
  return [...sorted].reverse().find((size) => size < currentSize) ?? sorted[0];
}
"""
if font_extension not in text:
    text = text.replace(insert_after, insert_after + font_extension)

text = text.replace("      TextStyle,\n      Color,", "      TextStyle,\n      FontSize,\n      Color,")
text = text.replace("    content: value || '<p></p>',", "    content: normalizeHtmlValue(value),")
text = text.replace(
    "    onUpdate: ({ editor: currentEditor }) => {\n      onChange(currentEditor.getHTML());\n    }",
    "    onUpdate: ({ editor: currentEditor }) => {\n      const html = currentEditor.getHTML();\n      lastEmittedValueRef.current = html;\n      onChange(html);\n    }"
)
text = text.replace(
    "}) {\n  const editor = useEditor({",
    "}) {\n  const lastEmittedValueRef = useRef(normalizeHtmlValue(value));\n\n  const editor = useEditor({"
)
text = text.replace(
    "  useEffect(() => {\n    if (!editor) return;\n    const incoming = value?.trim() ? value : '<p></p>';\n    if (incoming !== editor.getHTML()) {\n      editor.commands.setContent(incoming, { emitUpdate: false });\n    }\n  }, [editor, value]);\n",
    "  useEffect(() => {\n    if (!editor) return;\n    const incoming = normalizeHtmlValue(value);\n    const currentHtml = normalizeHtmlValue(editor.getHTML());\n    if (incoming === normalizeHtmlValue(lastEmittedValueRef.current) || incoming === currentHtml) {\n      lastEmittedValueRef.current = incoming;\n      return;\n    }\n    const { from, to } = editor.state.selection;\n    editor.commands.setContent(incoming, { emitUpdate: false });\n    const nextSize = editor.state.doc.content.size;\n    editor.commands.setTextSelection({ from: Math.min(from, nextSize), to: Math.min(to, nextSize) });\n    lastEmittedValueRef.current = incoming;\n  }, [editor, value]);\n"
)
text = text.replace(
    "  if (!editor) {\n    return <div className=\"min-h-[320px] rounded-[1.5rem] border border-white/10 bg-white/5\" />;\n  }\n\n  return (",
    "  const currentFontSize = useMemo(() => parseFontSize(editor?.getAttributes('textStyle').fontSize), [editor, editor?.state]);\n\n  if (!editor) {\n    return <div className=\"min-h-[320px] rounded-[1.5rem] border border-white/10 bg-white/5\" />;\n  }\n\n  return ("
)
text = text.replace(
    "        <ToolbarButton title=\"Lista com marcadores\" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>\n          <List size={16} />\n        </ToolbarButton>\n",
    "        <ToolbarButton title=\"Diminuir fonte\" onClick={() => editor.chain().focus().setFontSize(`${getNextFontSize(currentFontSize, 'down')}px`).run()}>\n          <ChevronDown size={16} />\n          <span className=\"text-[11px] font-semibold\">A</span>\n        </ToolbarButton>\n        <div className=\"inline-flex min-w-[64px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200\">\n          {currentFontSize}px\n        </div>\n        <ToolbarButton title=\"Aumentar fonte\" onClick={() => editor.chain().focus().setFontSize(`${getNextFontSize(currentFontSize, 'up')}px`).run()}>\n          <ChevronUp size={16} />\n          <span className=\"text-[11px] font-semibold\">A</span>\n        </ToolbarButton>\n        <ToolbarButton title=\"Limpar tamanho da fonte\" onClick={() => editor.chain().focus().unsetFontSize().run()}>\n          <Eraser size={16} />\n          <span className=\"text-[11px] font-semibold\">A</span>\n        </ToolbarButton>\n        <ToolbarButton title=\"Lista com marcadores\" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>\n          <List size={16} />\n        </ToolbarButton>\n"
)
rich.write_text(text)

# 3) Blog admin page: use RichTextEditor for content
posts = root / 'apps/web/app/admin/posts/page.tsx'
text = posts.read_text()
if "RichTextEditor" not in text:
    text = text.replace("import { AdminShell } from '@/components/admin/AdminShell';", "import { AdminShell } from '@/components/admin/AdminShell';\nimport { RichTextEditor } from '@/components/editor/RichTextEditor';")
text = text.replace(
    "          <textarea placeholder=\"Conteúdo completo (HTML ou rich text sanitizado)\" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className=\"w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white\" />",
    "          <div className=\"space-y-2\">\n            <p className=\"text-sm font-medium text-zinc-200\">Conteúdo completo do artigo</p>\n            <RichTextEditor\n              value={form.content}\n              onChange={(value) => setForm((current) => ({ ...current, content: value }))}\n              placeholder=\"Escreva o artigo com títulos, cores, negrito, itálico, links, tabelas e destaques.\"\n            />\n          </div>"
)
posts.write_text(text)

# 4) HomePresentationVideo: simplify to reliable iframe autoplay muted with mask note
home = root / 'apps/web/components/home/HomePresentationVideo.tsx'
home.write_text("""'use client';

import { useMemo } from 'react';
import { getYoutubeThumbnailUrl, parseYoutubeVideo } from '@/lib/youtube';

type HomePresentationVideoProps = {
  title?: string | null;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
};

export function HomePresentationVideo({ title, description, youtubeUrl, thumbnailUrl }: HomePresentationVideoProps) {
  const video = useMemo(() => parseYoutubeVideo(youtubeUrl), [youtubeUrl]);

  if (!video) return null;

  const effectiveTitle = title?.trim() || 'Quem sou';
  const effectiveDescription = description?.trim() || 'Conheça minha trajetória e minha forma de trabalhar.';
  const previewImage = thumbnailUrl?.trim() || getYoutubeThumbnailUrl(video.videoId);
  const autoplayUrl = `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${video.videoId}`;

  return (
    <section className=\"content-auto pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14\" aria-label=\"Vídeo institucional da home\">
      <div className=\"container-base\">
        <div className=\"mx-auto w-full max-w-6xl\">
          <div className=\"mb-7 text-center sm:mb-9\">
            <h2 className=\"text-3xl font-semibold tracking-tight text-white md:text-4xl xl:text-[3.1rem]\">{effectiveTitle}</h2>
            <p className=\"mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base md:leading-8\">{effectiveDescription}</p>
            <div className=\"mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent\" aria-hidden=\"true\" />
          </div>

          <div className=\"relative\">
            <div className=\"pointer-events-none absolute -left-10 top-10 h-28 w-28 rounded-full bg-brand-gold/14 blur-3xl sm:h-40 sm:w-40\" />
            <div className=\"pointer-events-none absolute -bottom-8 right-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl sm:h-44 sm:w-44\" />

            <div className=\"overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-[10px] shadow-[0_28px_120px_rgba(0,0,0,0.36)] sm:p-3\">
              <div className=\"relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#07100c_0%,#040806_100%)]\">
                <div className=\"pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent\" />
                <div className=\"pointer-events-none absolute inset-x-[6%] top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent\" />

                <div className=\"relative aspect-video overflow-hidden bg-black\">
                  {previewImage ? <img src={previewImage} alt={effectiveTitle} className=\"absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-25\" /> : null}

                  <iframe
                    src={autoplayUrl}
                    title={effectiveTitle}
                    className=\"absolute inset-0 h-full w-full scale-[1.02]\"
                    allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"
                    referrerPolicy=\"strict-origin-when-cross-origin\"
                    allowFullScreen
                  />

                  <div className=\"pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(212,175,114,0.16),transparent_26%),radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.07),transparent_18%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.42))]\" />
                  <div className=\"pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 via-black/10 to-transparent\" />
                  <div className=\"pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/72 via-black/26 to-transparent\" />
                  <div className=\"pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-black/24 to-transparent\" />
                  <div className=\"pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black/24 to-transparent\" />
                  <div className=\"pointer-events-none absolute inset-[18px] rounded-[1.6rem] border border-white/10\" />
                  <div className=\"pointer-events-none absolute inset-[28px] rounded-[1.25rem] border border-brand-gold/10\" />

                  <div className=\"pointer-events-none absolute inset-x-6 bottom-6 z-10 flex justify-center\">
                    <div className=\"rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(8,17,15,0.48),rgba(8,17,15,0.82))] px-5 py-3 text-center shadow-[0_24px_60px_rgba(0,0,0,0.36)] backdrop-blur-xl\">
                      <p className=\"text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-100 sm:text-xs\">De Play para Ativar o Som</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
""")

# 5) Property include page: move preview to sidebar, remove search/list blocks, use functional update for editor state
incluir = root / 'apps/web/app/admin/properties/incluir/page.tsx'
text = incluir.read_text()
# safer fullDescription handler
text = text.replace(
    "                <RichTextEditor value={form.fullDescription ?? ''} onChange={(value) => setForm({ ...form, fullDescription: value })} placeholder=\"Monte uma descrição profissional com subtítulos, listas, destaques, localização e condições especiais.\" />",
    "                <RichTextEditor value={form.fullDescription ?? ''} onChange={(value) => setForm((current) => ({ ...current, fullDescription: value }))} placeholder=\"Monte uma descrição profissional com subtítulos, listas, destaques, localização e condições especiais.\" />"
)
text = text.replace(
    "  return (\n    <AdminShell title=\"INCLUIR IMÓVEIS\">\n      <div className=\"grid gap-8 xl:grid-cols-[minmax(0,860px)_minmax(360px,1fr)]\">\n        <form onSubmit={handleSubmit} className=\"space-y-6\">",
    "  const previewSidebar = (\n    <section className=\"card-premium p-5\">\n      <div className=\"flex items-center gap-3\">\n        <Eye size={18} className=\"text-brand-gold\" />\n        <div>\n          <h3 className=\"text-lg font-semibold text-white\">Prévia do card no site</h3>\n          <p className=\"mt-1 text-sm leading-6 text-zinc-400\">A prévia acompanha o preenchimento do formulário em tempo real.</p>\n        </div>\n      </div>\n      <div className=\"mt-5\">\n        <PropertyCardPreview property={previewProperty} />\n      </div>\n    </section>\n  );\n\n  return (\n    <AdminShell title=\"INCLUIR IMÓVEIS\" sidebarContent={previewSidebar}>\n      <div className=\"min-w-0\">\n        <form onSubmit={handleSubmit} className=\"space-y-6\">"
)
# remove right aside block entirely
pattern = re.compile(r"\n\s*<aside className=\"space-y-6\">.*?</aside>\n\s*</div>\n\s*</AdminShell>", re.S)
replacement = "\n      </div>\n    </AdminShell>"
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit('Failed to remove incluir aside block')
incluir.write_text(text)

print('Changes applied successfully.')
