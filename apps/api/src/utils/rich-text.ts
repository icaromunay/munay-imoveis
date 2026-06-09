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
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'hr',
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
  div: ['style'],
  p: ['style'],
  h2: ['style'],
  h3: ['style'],
  h4: ['style'],
  mark: ['style', 'data-color'],
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
    'text-align': [/^(left|center|right|justify)$/]
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
