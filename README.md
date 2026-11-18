# TK personal site

A dependency-free, bilingual portfolio for photography, aviation, articles, and personal projects. The site uses native HTML, CSS, and JavaScript without a framework, package installation, or build step.

## Run locally

Requirements: Node.js 18 or newer.

On Windows PowerShell:

```powershell
npm.cmd start
```

On macOS or Linux:

```sh
npm start
```

Open <http://localhost:4173/> and press `Ctrl+C` in the terminal to stop the server.

Do not open the HTML files directly with `file://`. The site loads JSON and Markdown with `fetch`, so it needs the included local HTTP server.

If port 4173 is already occupied, choose another port:

```powershell
$env:PORT = 4174
npm.cmd start
```

## Checks

Run the complete integrity and Markdown-safety check:

```powershell
npm.cmd run check
```

Review asset files that are not referenced by public content or the image pipeline:

```powershell
npm.cmd run audit:assets
```

## Site structure

- `/` — visual index and introduction
- `/about/` — biography and current interests
- `/projects/` — project index; `?id=…` opens a detail view
- `/articles/` — article index; `?id=…` renders Markdown
- `/photography/` — series index; `?series=…` opens a gallery
- `/aviation/` — flight experience and aircraft
- `/contact/` — contact form
- `/content-policy/` — content-use and text/data-mining reservation
- `data/` — public gallery, project, and article manifests
- `content/articles/` — Czech and optional English article Markdown
- `styles/site.css` and `scripts/app.js` — shared design and behaviour

The site contains no browser-based publishing panel, remote-repository API, embedded credentials, or hosting-provider dependency.

## Edit content locally

### Photography

1. Add original photographs to the appropriate folder below `assets/img/series/`.
2. Put the selected film-strip preview copies in that series' `preview/` folder.
3. Rebuild thumbnails and the gallery manifest:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/generate-thumbnails.ps1 -Force
node scripts/generate-gallery.mjs
```

### Articles

1. Add Czech Markdown as `content/articles/<slug>.cs.md`; English is optional as `<slug>.en.md`.
2. Add article images below `assets/img/articles/<slug>/`.
3. Add or update the article record in `data/articles.json`.
4. Use `:::gallery`, `:::note`, or `:::warning` blocks for the custom interactive article components.

Raw HTML in Markdown is escaped deliberately.

### Projects

Edit `data/projects.json` and place local downloads or images below the relevant `assets/` directories. A project link set to `"#"` is displayed without an external action button.

## Deployment notes

The canonical and Open Graph paths are host-neutral. After selecting a production domain, add a domain-specific sitemap and confirm that social-preview tools resolve the relative Open Graph image paths correctly.

`robots.txt`, `.well-known/tdmrep.json`, the per-page TDM meta tags, and `_headers` retain the site's crawler and content-use controls. `_headers` is supported by compatible static hosting providers; other providers may require the same headers in their dashboard or server configuration.
