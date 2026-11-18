import { readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const root = dirname(scriptsDirectory);
const seriesRoot = join(root, 'assets', 'img', 'series');
const output = join(root, 'data', 'gallery.json');
const validExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const definitions = [
  {
    folder: 'nature', id: 'nature',
    name: { cs: 'Příroda', en: 'Nature' },
    description: { cs: 'Zvířata, krajina a tiché chvíle mimo město.', en: 'Wildlife, landscapes, and quiet moments beyond the city.' },
    cover: 'IMG_8738.jpg'
  },
  {
    folder: 'architecture, street', id: 'architecture',
    name: { cs: 'Architektura a ulice', en: 'Architecture & street' },
    description: { cs: 'Geometrie, rytmus a náhodná setkání ve veřejném prostoru.', en: 'Geometry, rhythm, and chance encounters in public space.' },
    cover: 'zIMG_9437.jpg'
  },
  {
    folder: 'studio', id: 'studio',
    name: { cs: 'Studio', en: 'Studio' },
    description: { cs: 'Kontrolované světlo, portrét a obrazové experimenty.', en: 'Controlled light, portraiture, and image experiments.' },
    cover: 'IMG_8156 (2)LAYERS.jpg'
  },
  {
    folder: 'aviation', id: 'aviation',
    name: { cs: 'Letectví', en: 'Aviation' },
    description: { cs: 'Letadla, letiště a život kolem létání.', en: 'Aircraft, airfields, and life around flying.' },
    cover: 'IMG_8016 (1).jpg'
  }
];

const webPath = (...parts) => parts.join('/');
const naturalSort = new Intl.Collator('cs', { numeric: true, sensitivity: 'base' });
const cleanAlt = (filename) => filename
  .replace(extname(filename), '')
  .replace(/\s*-\s*Varianta\s*\d+/gi, '')
  .replace(/\s*\(\d+\)/g, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const series = [];
for (const definition of definitions) {
  const files = (await readdir(join(seriesRoot, definition.folder), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && validExtensions.has(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort(naturalSort.compare);
  const previewFiles = new Set(
    (await readdir(join(seriesRoot, definition.folder, 'preview'), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && validExtensions.has(extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
  );

  const photos = files.map((filename) => ({
    src: webPath('assets', 'img', 'series', definition.folder, filename),
    thumb: webPath('assets', 'img', 'thumbs', definition.folder, `${filename.slice(0, -extname(filename).length)}.jpg`),
    alt: {
      cs: `${definition.name.cs} — ${cleanAlt(filename)}`,
      en: `${definition.name.en} — ${cleanAlt(filename)}`
    },
    ...(previewFiles.has(filename) ? { preview: true } : {})
  }));

  series.push({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    cover: webPath('assets', 'img', 'thumbs', definition.folder, `${definition.cover.slice(0, -extname(definition.cover).length)}.jpg`),
    photos
  });
}

await writeFile(output, `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), series }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${relative(root, output)} with ${series.reduce((sum, item) => sum + item.photos.length, 0)} photos.`);
