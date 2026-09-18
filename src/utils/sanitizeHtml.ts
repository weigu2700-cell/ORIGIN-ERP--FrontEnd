import DOMPurify from 'dompurify'

export const sanitizeHtml = (html?: string) =>
  DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'blockquote',
      'pre',
      'code',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title'],
  })

export const htmlToText = (html?: string) =>
  DOMPurify.sanitize(html ?? '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\s+/g, ' ')
    .trim()
