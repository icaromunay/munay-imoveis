import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'mark',
  'span',
  'div',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'hr',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td'
] as const;

const allowedAttributes: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  span: ['style'],
  div: ['style', 'class'],
  p: ['style', 'class'],
  blockquote: ['style', 'class'],
  h1: ['style', 'class'],
  h2: ['style', 'class'],
  h3: ['style', 'class'],
  h4: ['style', 'class'],
  h5: ['style', 'class'],
  h6: ['style', 'class'],
  mark: ['style', 'data-color'],
  img: ['src', 'alt', 'title', 'style', 'width', 'height', 'loading', 'class'],
  figure: ['style', 'class'],
  figcaption: ['style', 'class'],
  table: ['style'],
  thead: ['style'],
  tbody: ['style'],
  tr: ['style'],
  th: ['style', 'colspan', 'rowspan'],
  td: ['style', 'colspan', 'rowspan']
};

const colorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$|^rgb\((?:\s*\d{1,3}\s*,){2}\s*\d{1,3}\s*\)$|^rgba\((?:\s*\d{1,3}\s*,){3}\s*(?:0|1|0?\.\d+)\s*\)$/;

const allowedStyles: sanitizeHtml.IOptions['allowedStyles'] = {
  '*': {
    color: [colorPattern],
    'background-color': [colorPattern],
    'text-align': [/^(left|center|right|justify)$/],
    width: [/^[\d.]+(%|px)$/],
    'max-width': [/^[\d.]+(%|px)$/],
    height: [/^(auto|[\d.]+(%|px))$/],
    margin: [/^[\d\s.%pxauto-]+$/],
    'margin-left': [/^(auto|[\d.]+(%|px))$/],
    'margin-right': [/^(auto|[\d.]+(%|px))$/],
    display: [/^(block|inline-block)$/],
    'border-radius': [/^[\d.]+px$/]
  }
};

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapePlainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapePlainText(block).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function sanitizeRichTextHtml(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const source = hasHtmlMarkup(raw) ? raw : plainTextToHtml(raw);

  return sanitizeHtml(source, {
    allowedTags: [...allowedTags],
    allowedAttributes,
    allowedStyles,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'nofollow noopener noreferrer'
      }, true)
    }
  }).trim();
}

export function getRichTextPlainText(value: string) {
  return sanitizeHtml(value || '', { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
