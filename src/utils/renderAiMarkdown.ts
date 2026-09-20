import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

// AI 输出按 Markdown 解析；禁用原始 HTML 与图片，避免回答内容插入页面元素或自动加载外部资源。
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })
markdown.disable('image')

export function renderAiMarkdown(content: string): string {
  return DOMPurify.sanitize(markdown.render(content), {
    ALLOWED_TAGS: [
      'a',
      'blockquote',
      'br',
      'code',
      'del',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'hr',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'title', 'class'],
  })
}
