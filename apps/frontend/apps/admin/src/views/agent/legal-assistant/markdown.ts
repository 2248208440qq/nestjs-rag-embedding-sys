import { Marked } from 'marked';
import type { RendererObject, Tokens } from 'marked';

const renderer: RendererObject = {
  blockquote({ tokens }: Tokens.Blockquote) {
    return `<blockquote class="agent-md-blockquote">${this.parser.parseInline(tokens)}</blockquote>`;
  },
  code({ lang, text }: Tokens.Code) {
    const language = lang ? escapeHtml(lang) : 'text';
    return [
      '<figure class="agent-md-code">',
      `<figcaption class="agent-md-code-title"><span>${language}</span><span>CODE</span></figcaption>`,
      `<pre class="agent-md-pre"><code>${escapeHtml(text)}</code></pre>`,
      '</figure>',
    ].join('');
  },
  codespan({ text }: Tokens.Codespan) {
    return `<code class="agent-md-codespan">${escapeHtml(text)}</code>`;
  },
  heading({ depth, tokens }: Tokens.Heading) {
    const level = Math.min(depth, 3);
    return `<h${level} class="agent-md-heading agent-md-heading-${level}">${this.parser.parseInline(tokens)}</h${level}>`;
  },
  html({ text }: Tokens.HTML | Tokens.Tag) {
    return escapeHtml(text);
  },
  link({ href, text, title }: Tokens.Link) {
    const safeHref = escapeAttribute(href);
    const safeTitle = title ? ` title="${escapeAttribute(title)}"` : '';
    return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noreferrer" class="agent-md-link">${text}</a>`;
  },
  list(token: Tokens.List) {
    const tag = token.ordered ? 'ol' : 'ul';
    const cls = token.ordered ? 'agent-md-list agent-md-list-ordered' : 'agent-md-list';
    return `<${tag} class="${cls}">${token.items.map((item) => this.listitem(item)).join('')}</${tag}>`;
  },
  paragraph({ tokens }: Tokens.Paragraph) {
    return `<p class="agent-md-paragraph">${this.parser.parseInline(tokens)}</p>`;
  },
  table(token: Tokens.Table) {
    const header = token.header
      .map((cell) => `<th class="agent-md-th">${this.parser.parseInline(cell.tokens)}</th>`)
      .join('');
    const rows = token.rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td class="agent-md-td">${this.parser.parseInline(cell.tokens)}</td>`)
            .join('')}</tr>`,
      )
      .join('');

    return `<div class="agent-md-table-wrap"><table class="agent-md-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
  },
};

const marked = new Marked({
  async: false,
  breaks: true,
  gfm: true,
  renderer,
});

export function renderAgentMarkdown(source: string) {
  return marked.parse(source || '') as string;
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
