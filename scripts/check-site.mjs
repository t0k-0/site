import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicPages = [
  'index.html',
  'about/index.html',
  'projects/index.html',
  'articles/index.html',
  'photography/index.html',
  'aviation/index.html',
  'contact/index.html',
  'content-policy/index.html',
];
const htmlFiles = [...publicPages];
const errors = [];

function checkPath(sourceFile, reference) {
  if (!reference || /^(https?:|mailto:|tel:|data:|blob:|#|\?)/.test(reference)) return;
  const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
  let target = normalize(join(root, dirname(sourceFile), clean));
  if (clean.endsWith('/')) target = join(target, 'index.html');
  if (!existsSync(target)) errors.push(`${sourceFile}: missing ${reference}`);
}

for (const file of htmlFiles) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    errors.push(`Missing page: ${file}`);
    continue;
  }
  const html = readFileSync(fullPath, 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) checkPath(file, match[1]);
  if (/<img\b[^>]*\bsrc=""/i.test(html)) errors.push(`${file}: image has an empty src attribute`);
}

for (const file of publicPages) {
  const html = readFileSync(join(root, file), 'utf8');
  if (!html.includes('<meta name="description"')) errors.push(`${file}: missing meta description`);
  if (!html.includes('<meta name="robots" content="index,follow')) errors.push(`${file}: missing public robots directive`);
  if (!html.includes('<meta name="tdm-reservation" content="1">')) errors.push(`${file}: missing TDM reservation`);
  if (!html.includes('<link rel="canonical" href="./">')) errors.push(`${file}: missing host-neutral canonical URL`);
  for (const property of ['og:title', 'og:description']) {
    if (!html.includes(`<meta property="${property}"`)) errors.push(`${file}: missing ${property}`);
  }
  if (/github(?:usercontent)?\.com|github\.io|api\.github\.com/i.test(html)) errors.push(`${file}: contains a GitHub dependency or URL`);
}

for (const file of ['robots.txt', '.well-known/tdmrep.json', '_headers']) {
  if (!existsSync(join(root, file))) errors.push(`Missing discovery file: ${file}`);
}

if (existsSync(join(root, 'robots.txt'))) {
  const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
  for (const crawler of ['GPTBot', 'ClaudeBot', 'Google-Extended']) {
    if (!robots.includes(`User-agent: ${crawler}`)) errors.push(`robots.txt: missing ${crawler} policy`);
  }
}

for (const removedPath of ['admin/index.html', 'scripts/admin.js', 'sitemap.xml', 'llms.txt', 'llms-full.txt']) {
  if (existsSync(join(root, removedPath))) errors.push(`Removed GitHub/hosting artifact still exists: ${removedPath}`);
}

const generatedRootArtifacts = readdirSync(root, { withFileTypes: true })
  .map((entry) => entry.name)
  .filter((name) => /^(?:\.verify-|\.tmp-|\.debug-|verify-.*\.png$|current-home.*\.png$)/i.test(name));
if (generatedRootArtifacts.length) errors.push(`Generated root artifacts found: ${generatedRootArtifacts.join(', ')}`);

for (const dataFile of ['data/gallery.json', 'data/projects.json', 'data/articles.json', '.well-known/tdmrep.json']) {
  try { JSON.parse(readFileSync(join(root, dataFile), 'utf8')); }
  catch (error) { errors.push(`${dataFile}: ${error.message}`); }
}

const gallery = JSON.parse(readFileSync(join(root, 'data/gallery.json'), 'utf8'));
for (const series of gallery.series) {
  checkPath('index.html', series.cover);
  for (const photo of series.photos) {
    checkPath('index.html', photo.src);
    checkPath('index.html', photo.thumb);
  }
}

const projects = JSON.parse(readFileSync(join(root, 'data/projects.json'), 'utf8'));
for (const project of projects.projects) {
  if (project.link && !project.external) checkPath('index.html', project.link);
  for (const image of project.images || []) checkPath('index.html', image);
}

const articles = JSON.parse(readFileSync(join(root, 'data/articles.json'), 'utf8'));
for (const article of articles.articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.id)) errors.push(`data/articles.json: invalid article id ${article.id}`);
  if (!['draft', 'published'].includes(article.status)) errors.push(`data/articles.json: invalid status for ${article.id}`);
  checkPath('index.html', article.cover);
  for (const body of Object.values(article.body || {})) checkPath('index.html', body);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Site check passed: ${htmlFiles.length} host-neutral pages, ${gallery.series.length} gallery series, ${gallery.series.reduce((sum, series) => sum + series.photos.length, 0)} photographs, ${projects.projects.length} projects, ${articles.articles.length} articles, and no GitHub publishing surface.`);
