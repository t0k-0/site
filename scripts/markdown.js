const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function safeUrl(value, { image = false, resolveAsset = (path) => path } = {}) {
  const raw = String(value || '').trim();
  if (!raw || /^(?:javascript|vbscript|data):/i.test(raw)) return '';
  if (raw.startsWith('asset:')) return resolveAsset(raw);
  if (/^(?:https?:|mailto:|#)/i.test(raw)) return raw;
  if (raw.startsWith('/') || !/^[a-z][a-z\d+.-]*:/i.test(raw)) return resolveAsset(raw);
  if (image && raw.startsWith('blob:')) return raw;
  return '';
}

function inline(text, options = {}) {
  const code = [];
  let output = escapeHtml(text).replace(/`([^`]+)`/g, (_, value) => {
    const token = `\u0000CODE${code.length}\u0000`;
    code.push(`<code>${value}</code>`);
    return token;
  });

  output = output
    .replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+(?:&quot;|&#39;)(.*?)(?:&quot;|&#39;))?\)/g, (_, alt, source, title) => {
      const url = safeUrl(source, { ...options, image: true });
      if (!url) return '';
      const caption = title ? ` data-caption="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(url)}" alt="${alt}" loading="lazy" decoding="async"${caption}>`;
    })
    .replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+(?:&quot;|&#39;)(.*?)(?:&quot;|&#39;))?\)/g, (_, label, target, title) => {
      const url = safeUrl(target, options);
      if (!url) return label;
      const external = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return output.replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)]);
}

export function parseMarkdownDocument(markdown = '') {
  const normalized = String(markdown).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) return { attributes: {}, body: normalized };
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) return { attributes: {}, body: normalized };
  const attributes = {};
  normalized.slice(4, end).split('\n').forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) attributes[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2').trim();
  });
  return { attributes, body: normalized.slice(end + 5) };
}

export function renderMarkdown(markdown = '', options = {}) {
  const { body } = parseMarkdownDocument(markdown);
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const result = [];
  let paragraph = [];
  let listType = '';
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];
  let directive = '';
  let directiveLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    result.push(`<p>${inline(paragraph.join(' '), options)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    result.push(`</${listType}>`);
    listType = '';
  };
  const renderDirective = () => {
    if (directive === 'gallery') {
      const images = directiveLines.map((line) => inline(line.trim(), options)).filter((line) => line.includes('<img'));
      result.push(`<div class="article-gallery" data-article-gallery>${images.map((image) => `<figure>${image}${/data-caption="([^"]+)"/.test(image) ? `<figcaption>${image.match(/data-caption="([^"]+)"/)[1]}</figcaption>` : ''}</figure>`).join('')}</div>`);
    } else {
      const title = directive === 'warning' ? ['Pozor', 'Warning'] : ['Poznámka', 'Note'];
      result.push(`<aside class="article-callout article-callout--${directive || 'note'}"><strong data-cs="${title[0]}" data-en="${title[1]}">${title[options.lang === 'en' ? 1 : 0]}</strong>${renderMarkdown(directiveLines.join('\n'), options)}</aside>`);
    }
    directive = '';
    directiveLines = [];
  };

  lines.forEach((line) => {
    if (inCode) {
      if (/^```/.test(line)) {
        result.push(`<pre><code${codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false; codeLanguage = ''; codeLines = [];
      } else codeLines.push(line);
      return;
    }
    if (directive) {
      if (line.trim() === ':::') renderDirective();
      else directiveLines.push(line);
      return;
    }
    const directiveStart = line.match(/^:::(gallery|note|warning)\s*$/);
    if (directiveStart) {
      flushParagraph(); closeList(); directive = directiveStart[1]; return;
    }
    const fence = line.match(/^```\s*([\w-]*)/);
    if (fence) {
      flushParagraph(); closeList(); inCode = true; codeLanguage = fence[1]; return;
    }
    if (!line.trim()) { flushParagraph(); closeList(); return; }
    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) { flushParagraph(); closeList(); result.push('<hr>'); return; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph(); closeList();
      const level = heading[1].length;
      const id = heading[2].replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
      result.push(`<h${level} id="${escapeHtml(id)}">${inline(heading[2], options)}</h${level}>`);
      return;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { flushParagraph(); closeList(); result.push(`<blockquote><p>${inline(quote[1], options)}</p></blockquote>`); return; }
    const item = line.match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if (item) {
      flushParagraph();
      const type = item[2] ? 'ol' : 'ul';
      if (listType !== type) { closeList(); result.push(`<${type}>`); listType = type; }
      result.push(`<li>${inline(item[3], options)}</li>`);
      return;
    }
    if (/^!\[[^\]]*\]\(/.test(line.trim())) {
      flushParagraph(); closeList();
      const rendered = inline(line.trim(), options);
      const caption = rendered.match(/data-caption="([^"]+)"/);
      result.push(`<figure class="article-image">${rendered}${caption ? `<figcaption>${caption[1]}</figcaption>` : ''}</figure>`);
      return;
    }
    paragraph.push(line.trim());
  });

  if (inCode) result.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  if (directive) renderDirective();
  flushParagraph(); closeList();
  return result.join('\n');
}
