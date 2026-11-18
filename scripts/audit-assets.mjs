import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const normalize = (value) => value.replaceAll('\\', '/');
const referenced = new Set([
  'assets/sitelogo_darkmode.svg',
  'assets/sitelogo_lightmode.svg',
]);

const gallery = JSON.parse(readFileSync(join(root, 'data/gallery.json'), 'utf8'));
for (const series of gallery.series) {
  referenced.add(series.cover);
  for (const photo of series.photos) {
    referenced.add(photo.src);
    referenced.add(photo.thumb);
  }
}

const projects = JSON.parse(readFileSync(join(root, 'data/projects.json'), 'utf8'));
for (const project of projects.projects) {
  if (project.link && !project.external) referenced.add(project.link);
  for (const image of project.images || []) referenced.add(image);
}

const articles = JSON.parse(readFileSync(join(root, 'data/articles.json'), 'utf8'));
for (const article of articles.articles) {
  if (article.cover) referenced.add(article.cover);
  for (const bodyPath of Object.values(article.body || {})) {
    const markdown = readFileSync(join(root, bodyPath), 'utf8');
    for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)) {
      if (match[1].startsWith('assets/')) referenced.add(match[1]);
    }
  }
}

const htmlFiles = ['index.html', 'about/index.html', 'articles/index.html', 'aviation/index.html', 'contact/index.html', 'content-policy/index.html', 'photography/index.html', 'projects/index.html'];
for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const path = decodeURIComponent(match[1].split(/[?#]/)[0]).replace(/^\.\.\//, '');
    if (path.startsWith('assets/')) referenced.add(path);
  }
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [normalize(relative(root, path))];
  });
}

const allAssets = walk(join(root, 'assets'));
const pipelineInputs = allAssets.filter((path) => /\/preview\//.test(path));
const unused = allAssets.filter((path) => !referenced.has(path) && !pipelineInputs.includes(path));

console.log(`Referenced public assets: ${referenced.size}`);
console.log(`Retained preview-selection inputs: ${pipelineInputs.length}`);
if (unused.length) {
  console.log(`Unreferenced asset candidates (${unused.length}):`);
  unused.forEach((path) => console.log(`- ${path}`));
} else {
  console.log('No unreferenced asset candidates found.');
}
