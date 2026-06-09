import { sanitizeRichTextForRender } from '@/lib/rich-text';

export function RichTextContent({ html, className = '' }: { html?: string | null; className?: string }) {
  const safeHtml = sanitizeRichTextForRender(html);

  if (!safeHtml) {
    return null;
  }

  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
