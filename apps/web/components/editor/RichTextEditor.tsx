'use client';

import { useEffect, useMemo, useRef } from 'react';
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
  Minus,
  MousePointer2,
  PaintBucket,
  Quote,
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
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

const textColors = ['#F7F3EA', '#D4AF72', '#22C55E', '#60A5FA', '#F97316', '#EF4444'];
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
      title: { default: null }
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const existingStyle = String(HTMLAttributes.style || '').trim();
    const imageStyle = [
      'display:block',
      'width:100%',
      'height:auto',
      'max-width:100%',
      'margin:16px 0',
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
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: options });
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ToolbarButton({
  active = false,
  onClick,
  title,
  children
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm transition ${
        active ? 'border-brand-gold bg-brand-gold text-[#08110d]' : 'border-white/10 bg-white/5 text-white hover:border-brand-gold/40 hover:text-brand-gold'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o artigo com estrutura editorial profissional...'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const lastEmittedValueRef = useRef(normalizeHtmlValue(value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
    content: normalizeHtmlValue(value),
    editorProps: {
      attributes: {
        class:
          'rich-text-editor min-h-[420px] rounded-b-[1.5rem] border-x border-b border-white/10 bg-[#08110d]/70 px-5 py-5 text-white focus:outline-none'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedValueRef.current = html;
      onChange(html);
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
  const currentHeadingValue = useMemo(() => {
    if (!editor) return '0';
    const activeLevel = [1, 2, 3, 4, 5, 6].find((level) => editor.isActive('heading', { level }));
    return activeLevel ? String(activeLevel) : '0';
  }, [editor, editor?.state]);

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
    return <div className="min-h-[420px] rounded-[1.5rem] border border-white/10 bg-white/5" />;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08110d]/50">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/[0.04] p-3">
        <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
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
            className="h-10 bg-transparent text-sm text-white outline-none"
          >
            {headingOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#08110d] text-white">
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
        <ToolbarButton title="Inserir imagem" onClick={handleInsertImage}>
          <ImagePlus size={16} />
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

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="inline-flex min-w-[64px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200">
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

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <PaintBucket size={14} />
          Cor do texto
        </div>
        <div className="flex flex-wrap gap-2">
          {textColors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar cor ${color}`}
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

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <Highlighter size={14} />
          Destaque
        </div>
        <div className="flex flex-wrap gap-2">
          {highlightColors.map((color) => (
            <button
              key={color}
              type="button"
              title={`Aplicar destaque ${color}`}
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

      <EditorContent editor={editor} />
    </div>
  );
}
