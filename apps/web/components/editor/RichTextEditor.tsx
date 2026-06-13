'use client';

import { type CSSProperties, type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minus,
  Minimize2,
  MousePointer2,
  PaintBucket,
  Quote,
  Rows3,
  Table2,
  Underline as UnderlineIcon,
  Unlink
} from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    imageBlock: {
      setImage: (options: { src: string; alt?: string; title?: string; width?: string; align?: 'left' | 'center' | 'right' }) => ReturnType;
      updateImageLayout: (options: { width?: string; align?: 'left' | 'center' | 'right' }) => ReturnType;
    };
  }
}

const textColors = ['#0F172A', '#B45309', '#15803D', '#2563EB', '#C2410C', '#DC2626'];
const highlightColors = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FECACA'];
const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32];
const headingOptions = [
  { label: 'Parágrafo', value: '0' },
  { label: 'Título H1', value: '1' },
  { label: 'Título H2', value: '2' },
  { label: 'Título H3', value: '3' },
  { label: 'Título H4', value: '4' },
  { label: 'Título H5', value: '5' },
  { label: 'Título H6', value: '6' }
] as const;

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
            parseHTML: (element) => element.style.fontSize || null,
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
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
    };
  }
});

const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  draggable: true,
  selectable: true,
  isolating: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: null },
      width: { default: '100%' },
      align: { default: 'center' }
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const width = String(HTMLAttributes.width || '100%').trim() || '100%';
    const align = String(HTMLAttributes.align || 'center').trim() || 'center';
    const existingStyle = String(HTMLAttributes.style || '').trim();
    const alignmentStyle =
      align === 'left'
        ? 'margin:16px auto 16px 0'
        : align === 'right'
          ? 'margin:16px 0 16px auto'
          : 'margin:16px auto';
    const imageStyle = [
      'display:block',
      `width:${width}`,
      'height:auto',
      'max-width:100%',
      alignmentStyle,
      'border-radius:24px'
    ].join(';');

    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        loading: 'lazy',
        style: existingStyle ? `${imageStyle};${existingStyle}` : imageStyle
      })
    ];
  },
  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { width: '100%', align: 'center', ...options } }),
      updateImageLayout:
        (options) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, options)
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const lightEditorTheme: CSSProperties = {
  ['--theme-institutional-text-primary' as string]: '#0F172A',
  ['--theme-institutional-text-secondary' as string]: '#334155',
  ['--theme-institutional-border' as string]: '#CBD5E1',
  ['--theme-institutional-surface' as string]: '#F8FAFC',
  ['--theme-accent' as string]: '#B45309',
  ['--theme-button-primary-bg' as string]: '#F59E0B',
  ['--theme-button-primary-text' as string]: '#0F172A'
};

const darkEditorTheme: CSSProperties = {
  ['--theme-institutional-text-primary' as string]: '#F8FAFC',
  ['--theme-institutional-text-secondary' as string]: '#CBD5E1',
  ['--theme-institutional-border' as string]: 'rgba(255,255,255,0.1)',
  ['--theme-institutional-surface' as string]: '#08110D',
  ['--theme-accent' as string]: '#D4AF72',
  ['--theme-button-primary-bg' as string]: '#D4AF72',
  ['--theme-button-primary-text' as string]: '#08110D'
};

function ToolbarButton({
  active = false,
  onClick,
  title,
  children,
  disabled = false
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm transition ${
        active
          ? 'border-amber-500 bg-amber-400 text-slate-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o artigo com estrutura editorial profissional...',
  onUploadImage,
  theme = 'dark'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<{ url: string; alt?: string; title?: string; width?: number; height?: number }>;
  theme?: 'light' | 'dark';
}) {
  const onChangeRef = useRef(onChange);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastEmittedValueRef = useRef(normalizeHtmlValue(value));
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isLightTheme = theme === 'light';
  const wrapperClassName = isLightTheme
    ? 'overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white'
    : 'overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08110d]';
  const loadingClassName = isLightTheme
    ? 'min-h-[420px] rounded-[1.5rem] border border-slate-200 bg-white'
    : 'min-h-[420px] rounded-[1.5rem] border border-white/10 bg-[#08110d]';
  const toolbarContainerClassName = isLightTheme
    ? 'flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3'
    : 'flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[0.03] p-3';
  const controlSelectWrapperClassName = isLightTheme
    ? 'inline-flex items-center rounded-xl border border-slate-200 bg-white px-3'
    : 'inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3';
  const controlSelectClassName = isLightTheme ? 'h-10 bg-transparent text-sm text-slate-700 outline-none' : 'h-10 bg-transparent text-sm text-zinc-100 outline-none';
  const controlOptionClassName = isLightTheme ? 'bg-white text-slate-900' : 'bg-[#08110d] text-white';
  const fontToolbarClassName = isLightTheme
    ? 'flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3'
    : 'flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3';
  const fontValueClassName = isLightTheme
    ? 'inline-flex min-w-[64px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700'
    : 'inline-flex min-w-[64px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200';
  const paletteToolbarClassName = isLightTheme
    ? 'flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3'
    : 'flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3';
  const paletteLabelClassName = isLightTheme
    ? 'flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500'
    : 'flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400';
  const imageToolbarClassName = isLightTheme
    ? 'flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500'
    : 'flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-400';
  const editorSurfaceTheme = isLightTheme ? lightEditorTheme : darkEditorTheme;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] }
      }),
      Underline,
      TextStyle,
      FontSize,
      ImageBlock,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'nofollow noopener noreferrer',
          target: '_blank'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right', 'justify']
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder })
    ],
    [placeholder]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: normalizeHtmlValue(value),
    editorProps: {
      attributes: {
        class: isLightTheme
          ? 'rich-text-editor min-h-[420px] rounded-b-[1.5rem] border-x border-b border-slate-200 bg-white px-5 py-5 text-slate-900 focus:outline-none'
          : 'rich-text-editor min-h-[420px] rounded-b-[1.5rem] border-x border-b border-white/10 bg-[#08110d] px-5 py-5 text-zinc-100 focus:outline-none'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedValueRef.current = html;
      onChangeRef.current(html);
    }
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = normalizeHtmlValue(value);
    const currentHtml = normalizeHtmlValue(editor.getHTML());

    if (incoming === normalizeHtmlValue(lastEmittedValueRef.current) || incoming === currentHtml) {
      lastEmittedValueRef.current = incoming;
      return;
    }

    const { from, to } = editor.state.selection;
    editor.commands.setContent(incoming, { emitUpdate: false });
    const nextSize = editor.state.doc.content.size;
    editor.commands.setTextSelection({ from: Math.min(from, nextSize), to: Math.min(to, nextSize) });
    lastEmittedValueRef.current = incoming;
  }, [editor, value]);

  const currentFontSize = parseFontSize(editor?.getAttributes('textStyle').fontSize);
  const currentHeadingValue = !editor
    ? '0'
    : String([1, 2, 3, 4, 5, 6].find((level) => editor.isActive('heading', { level })) || 0);
  const activeImageAttributes = editor?.getAttributes('imageBlock') as { width?: string; align?: 'left' | 'center' | 'right' } | undefined;
  const activeImageWidth = String(activeImageAttributes?.width || '100%');
  const activeImageAlign = (activeImageAttributes?.align || 'center') as 'left' | 'center' | 'right';
  const isImageSelected = Boolean(editor?.isActive('imageBlock'));

  async function handleImageFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !editor) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploaded = onUploadImage
        ? await onUploadImage(file)
        : { url: URL.createObjectURL(file), alt: file.name.replace(/\.[a-z0-9]+$/i, '') };

      editor
        .chain()
        .focus()
        .setImage({
          src: uploaded.url,
          alt: uploaded.alt || file.name.replace(/\.[a-z0-9]+$/i, ''),
          title: uploaded.title,
          width: '100%',
          align: 'center'
        })
        .run();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar a imagem selecionada.';
      window.alert(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleLink() {
    if (!editor) return;
    const previousUrl = String(editor.getAttributes('link').href || 'https://');
    const url = window.prompt('Informe a URL do link', previousUrl);

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  function handleInsertImage() {
    if (onUploadImage) {
      fileInputRef.current?.click();
      return;
    }

    if (!editor) return;
    const src = window.prompt('Informe a URL da imagem', 'https://');
    if (!src || !src.trim()) return;
    const alt = window.prompt('Texto alternativo da imagem', '') || '';
    editor.chain().focus().setImage({ src: src.trim(), alt: alt.trim() }).run();
  }

  function handleInsertButton() {
    if (!editor) return;
    const label = window.prompt('Texto do botão', 'Saiba mais');
    if (!label || !label.trim()) return;
    const url = window.prompt('URL do botão', 'https://');
    if (!url || !url.trim()) return;

    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${escapeHtml(url.trim())}" target="_blank" rel="nofollow noopener noreferrer" style="display:inline-block;margin:12px 0;padding:12px 22px;border-radius:999px;background:#d4af72;color:#08110d;font-weight:700;text-decoration:none;">${escapeHtml(label.trim())}</a></p>`
      )
      .run();
  }

  if (!editor) {
    return <div className={loadingClassName} style={editorSurfaceTheme} />;
  }

  return (
    <div className={wrapperClassName} style={editorSurfaceTheme}>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageFileSelection} />

      <div className={toolbarContainerClassName}>
        <div className={controlSelectWrapperClassName}>
          <select
            aria-label="Formato do texto"
            value={currentHeadingValue}
            onChange={(event) => {
              const nextLevel = Number(event.target.value);
              if (nextLevel === 0) {
                editor.chain().focus().setParagraph().run();
                return;
              }
              editor.chain().focus().setHeading({ level: nextLevel as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            }}
            className={controlSelectClassName}
          >
            {headingOptions.map((option) => (
              <option key={option.value} value={option.value} className={controlOptionClassName}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <ToolbarButton title="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Sublinhado" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton title="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={handleLink}>
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Remover link" onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink size={16} />
        </ToolbarButton>
        <ToolbarButton title={onUploadImage ? 'Inserir imagem do computador' : 'Inserir imagem'} onClick={handleInsertImage} disabled={isUploadingImage}>
          {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </ToolbarButton>
        <ToolbarButton title="Inserir botão" onClick={handleInsertButton}>
          <MousePointer2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton title="Inserir tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Alinhar à esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Centralizar" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Alinhar à direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={16} />
        </ToolbarButton>
      </div>

      <div className={fontToolbarClassName}>
        <div className={fontValueClassName}>
          {currentFontSize}px
        </div>
        <ToolbarButton title="Diminuir fonte" onClick={() => editor.chain().focus().setFontSize(`${getNextFontSize(currentFontSize, 'down')}px`).run()}>
          <ChevronDown size={16} />
        </ToolbarButton>
        <ToolbarButton title="Aumentar fonte" onClick={() => editor.chain().focus().setFontSize(`${getNextFontSize(currentFontSize, 'up')}px`).run()}>
          <ChevronUp size={16} />
        </ToolbarButton>
        <ToolbarButton title="Limpar tamanho da fonte" onClick={() => editor.chain().focus().unsetFontSize().run()}>
          <Eraser size={16} />
        </ToolbarButton>
      </div>

      <div className={paletteToolbarClassName}>
        <div className={paletteLabelClassName}>
          <PaintBucket size={14} />
          Cor do texto
        </div>
        <div className="flex flex-wrap gap-2">
          {textColors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar cor ${color}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="h-7 w-7 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
          <ToolbarButton title="Limpar cor" onClick={() => editor.chain().focus().unsetColor().run()}>
            <Eraser size={14} />
          </ToolbarButton>
        </div>
      </div>

      <div className={paletteToolbarClassName}>
        <div className={paletteLabelClassName}>
          <Highlighter size={14} />
          Destaque
        </div>
        <div className="flex flex-wrap gap-2">
          {highlightColors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar destaque ${color}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              className="h-7 w-7 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
          <ToolbarButton title="Remover destaque" onClick={() => editor.chain().focus().unsetHighlight().run()}>
            <Eraser size={14} />
          </ToolbarButton>
        </div>
      </div>

      <div className={imageToolbarClassName}>
        <div className="flex items-center gap-2">
          <Rows3 size={14} />
          Imagem selecionada
        </div>
        <ToolbarButton title="Imagem menor" active={isImageSelected && activeImageWidth === '50%'} onClick={() => editor.chain().focus().updateImageLayout({ width: '50%' }).run()} disabled={!isImageSelected}>
          <Minimize2 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Imagem média" active={isImageSelected && activeImageWidth === '75%'} onClick={() => editor.chain().focus().updateImageLayout({ width: '75%' }).run()} disabled={!isImageSelected}>
          <Rows3 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Imagem ampla" active={isImageSelected && activeImageWidth === '100%'} onClick={() => editor.chain().focus().updateImageLayout({ width: '100%' }).run()} disabled={!isImageSelected}>
          <Maximize2 size={14} />
        </ToolbarButton>
        <ToolbarButton title="Alinhar imagem à esquerda" active={isImageSelected && activeImageAlign === 'left'} onClick={() => editor.chain().focus().updateImageLayout({ align: 'left' }).run()} disabled={!isImageSelected}>
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton title="Centralizar imagem" active={isImageSelected && activeImageAlign === 'center'} onClick={() => editor.chain().focus().updateImageLayout({ align: 'center' }).run()} disabled={!isImageSelected}>
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton title="Alinhar imagem à direita" active={isImageSelected && activeImageAlign === 'right'} onClick={() => editor.chain().focus().updateImageLayout({ align: 'right' }).run()} disabled={!isImageSelected}>
          <AlignRight size={14} />
        </ToolbarButton>
        {isUploadingImage ? <span className="ml-auto text-brand-gold">Enviando imagem...</span> : null}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
