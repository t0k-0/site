import assert from 'node:assert/strict';
import { parseMarkdownDocument, renderMarkdown } from './markdown.js';

const source = `---
title_cs: Test
---
# Heading

Text with **bold** and [a link](https://example.com).

:::gallery
![Alternative text](assets/img/articles/test/image.webp "Caption")
:::

<script>alert('never')</script>`;

const parsed = parseMarkdownDocument(source);
assert.equal(parsed.attributes.title_cs, 'Test');
const rendered = renderMarkdown(source, { resolveAsset: (path) => `/site/${path}` });
assert.match(rendered, /<strong>bold<\/strong>/);
assert.match(rendered, /class="article-gallery"/);
assert.match(rendered, /src="\/site\/assets\/img\/articles\/test\/image.webp"/);
assert.doesNotMatch(rendered, /<script>/);
assert.match(rendered, /&lt;script&gt;/);

const unsafe = renderMarkdown('[bad](javascript:alert(1))\n\n![bad](data:image/svg+xml,evil)');
assert.doesNotMatch(unsafe, /javascript:|data:image/);

console.log('Markdown renderer smoke test passed.');
