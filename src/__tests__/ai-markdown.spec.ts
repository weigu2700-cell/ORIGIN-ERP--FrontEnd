import { describe, expect, it } from 'vitest'
import { renderAiMarkdown } from '@/utils/renderAiMarkdown'

describe('renderAiMarkdown', () => {
  it('将常见 AI 回答格式转成可阅读的 HTML', () => {
    const html = renderAiMarkdown(
      '# 库存建议\n\n- 核对数量\n- 检查批次\n\n| 仓库 | 数量 |\n| --- | ---: |\n| A | 12 |\n\n```sql\nSELECT 1;\n```',
    )

    expect(html).toContain('<h1>库存建议</h1>')
    expect(html).toContain('<li>核对数量</li>')
    expect(html).toContain('<table>')
    expect(html).toContain('<pre><code')
    expect(html).toContain('SELECT 1;')
  })

  it('不把回答里的原始 HTML、脚本链接或远程图片插入页面', () => {
    const html = renderAiMarkdown(
      '<script>alert(1)</script>\n\n[点此](javascript:alert(1))\n\n![远程图片](https://example.com/track.png)',
    )

    expect(html).not.toContain('<script')
    expect(html).not.toContain('href="javascript:')
    expect(html).not.toContain('<img')
  })
})
