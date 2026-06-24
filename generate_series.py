#!/usr/bin/env python3
"""
generate_series.py
═══════════════════════════════════════════════════════════════════
Scans assets/img/series/<series-name>/ folders and auto-generates:

  1. The SERIES{} JS object (full-resolution photos + aspect ratios)
  2. The <img class="sphoto"> strip HTML (preview thumbnails)

…so that managing the photography galleries becomes:

    1. Drop / remove / rename files in the series folders
    2. Run:  python generate_series.py
    3. Copy the printed blocks into index.html, replacing the old ones

No manual index-counting, no mismatched preview/full pairs.

───────────────────────────────────────────────────────────────────
FOLDER STRUCTURE EXPECTED (matches your repo)
───────────────────────────────────────────────────────────────────
assets/img/series/
├── nature/
│   ├── preview/        ← thumbnails shown in the horizontal strip
│   │   ├── IMG_0769.jpg
│   │   └── ...
│   ├── IMG_3565 - Varianta 1.jpg   ← full-resolution images
│   └── ...
├── architecture, street/
│   ├── preview/
│   └── ...
├── studio/
│   ├── preview/
│   └── ...
└── aviation/
    ├── preview/
    └── ...

───────────────────────────────────────────────────────────────────
HOW MATCHING WORKS
───────────────────────────────────────────────────────────────────
The site's lightbox matches a preview image to its full-res photo by
FILENAME. So if you add "preview/IMG_9999.jpg", make sure
"IMG_9999.jpg" (same name) also exists in the series' main folder —
otherwise the lightbox falls back to showing the first photo in that
series when that preview is clicked.

This script will warn you about any preview images that don't have
a matching full-res file.

───────────────────────────────────────────────────────────────────
SETUP
───────────────────────────────────────────────────────────────────
Requires Pillow (for reading image dimensions to compute aspect ratio):

    pip install pillow

Run from the repo root (same folder as index.html):

    python generate_series.py
═══════════════════════════════════════════════════════════════════
"""

import os
import re
import sys
from math import gcd
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install it with:\n\n    pip install pillow\n")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────
# CONFIG — edit if your folder names / series keys differ
# ─────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent
SERIES_ROOT = REPO_ROOT / "assets/img/series"
PROJECTS_ROOT = REPO_ROOT / "assets/img/projects"
GENERATED_FILE = REPO_ROOT / "assets/generated/site_data.js"
IMAGE_EXTS  = {".jpg", ".jpeg", ".png", ".webp", ".svg"}

# Maps a folder name -> the JS key used in SERIES{} and onclick="openLB(this,'KEY')"
# Add an entry here if a folder name doesn't map cleanly (e.g. has a comma).
FOLDER_TO_KEY = {
    "architecture, street": "architecture",
    "nature":               "nature",
    "studio":               "studio",
    "aviation":             "aviation",
}

# Common aspect ratios to snap to (keeps CSS tidy). If an image's
# computed ratio is within this tolerance of one of these, use it.
COMMON_RATIOS = {
    "1/1":  1.0,
    "2/3":  2/3,
    "3/2":  3/2,
    "3/4":  3/4,
    "4/3":  4/3,
    "4/5":  4/5,
    "5/4":  5/4,
    "16/9": 16/9,
    "9/16": 9/16,
}
RATIO_TOLERANCE = 0.04


def folder_to_key(name: str) -> str:
    if name in FOLDER_TO_KEY:
        return FOLDER_TO_KEY[name]
    # default: lowercase, first alphanumeric word
    cleaned = re.sub(r"[^a-zA-Z0-9]+", " ", name).strip().split(" ")
    return cleaned[0].lower() if cleaned else name.lower()


def aspect_ratio_string(path: Path) -> str:
    try:
        with Image.open(path) as im:
            w, h = im.size
    except Exception as e:
        print(f"  ⚠ couldn't read dimensions for {path.name}: {e}")
        return "1/1"

    ratio = w / h

    # Snap to a common ratio if close enough
    for label, val in COMMON_RATIOS.items():
        if abs(ratio - val) / val < RATIO_TOLERANCE:
            return label

    # Otherwise reduce w:h to lowest terms
    g = gcd(w, h)
    return f"{w // g}/{h // g}"


def list_images(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS],
        key=lambda p: p.name.lower()
    )


def web_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def humanize(name: str) -> str:
    cleaned = name.replace("_", " ").replace("-", " ")
    words = [w.capitalize() for w in cleaned.split() if w]
    return " ".join(words) or name


def generate_series_block() -> str:
    output = ["const SERIES = {"]
    series_map = {"nature": "s1.name", "architecture": "s2.name", "studio": "s3.name", "aviation": "s4.name"}
    series_folders = [("nature", "nature"), ("architecture, street", "architecture"), ("studio", "studio"), ("aviation", "aviation")]
    for folder_name, key in series_folders:
        folder = SERIES_ROOT / folder_name
        if not folder.exists():
            continue
        output.append(f"  {key}:{{tk:'{series_map[key]}',photos:[")
        for img in list_images(folder):
            output.append(f"    {{src:'{web_path(img)}',ar:'{aspect_ratio_string(img)}'}},")
        output.append("  ]},")
    output.append("};")
    return "\n".join(output)


def generate_projects_block() -> str:
    project_order = [
        ("alpha", "pl_zpevnik"),
        ("beta", "pilka"),
        ("gamma", "lekar_lkko"),
        ("delta", "smirka_app"),
        ("echo", "radio_dash_lkko"),
        ("foxtrot", "foxtrot"),
    ]
    output = ["const PROJECTS = {"]
    for key, folder_name in project_order:
        folder = PROJECTS_ROOT / folder_name
        images = list_images(folder)
        if not images:
            images = [folder / "cover.svg"] if (folder / "cover.svg").exists() else []
        title = humanize(folder_name)
        output.append(f"  {key}:{{")
        output.append("    en:{title:'" + title + "',tag:'Project',desc:'Auto-generated project gallery.',longDesc:'Generated from the folder contents.',type:'website',link:'#'},")
        output.append("    cs:{title:'" + title + "',tag:'Projekt',desc:'Automaticky generovaná galerie.',longDesc:'Vytvořeno podle obsahu složky.',type:'website',link:'#'},")
        output.append("    images:[")
        for img in images:
            output.append(f"      '{web_path(img)}',")
        output.append("    ],")
        output.append("    year:'2026'")
        output.append("  },")
    output.append("};")
    return "\n".join(output)


def main():
    if not SERIES_ROOT.exists() or not PROJECTS_ROOT.exists():
        print("ERROR: assets/img/series and assets/img/projects must exist.")
        sys.exit(1)

    GENERATED_FILE.parent.mkdir(exist_ok=True)
    GENERATED_FILE.write_text("\n\n".join([generate_series_block(), generate_projects_block()]) + "\n", encoding="utf-8")
    print(f"Wrote {GENERATED_FILE}")


if __name__ == "__main__":
    main()
