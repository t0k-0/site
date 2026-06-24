from pathlib import Path

content = r'''#!/usr/bin/env python3
"""
generate_series.py

Scans assets/img/series and assets/img/projects and writes a generated
site-data file used by index.html.
"""

import re
import sys
from math import gcd
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install it with:\n\n    pip install pillow\n")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent
SERIES_ROOT = REPO_ROOT / "assets/img/series"
PROJECTS_ROOT = REPO_ROOT / "assets/img/projects"
GENERATED_FILE = REPO_ROOT / "assets/generated/site_data.js"

FOLDER_TO_KEY = {
    "architecture, street": "architecture",
    "nature": "nature",
    "studio": "studio",
    "aviation": "aviation",
}

PROJECT_ORDER = [
    ("alpha", "pl_zpevnik"),
    ("beta", "pilka"),
    ("gamma", "lekar_lkko"),
    ("delta", "smirka_app"),
    ("echo", "radio_dash_lkko"),
    ("foxtrot", "foxtrot"),
]

COMMON_RATIOS = {
    "1/1": 1.0,
    "2/3": 2 / 3,
    "3/2": 3 / 2,
    "3/4": 3 / 4,
    "4/3": 4 / 3,
    "4/5": 4 / 5,
    "5/4": 5 / 4,
    "16/9": 16 / 9,
    "9/16": 9 / 16,
}
RATIO_TOLERANCE = 0.04


def folder_to_key(name: str) -> str:
    if name in FOLDER_TO_KEY:
        return FOLDER_TO_KEY[name]
    cleaned = re.sub(r"[^a-zA-Z0-9]+", " ", name).strip().split(" ")
    return cleaned[0].lower() if cleaned else name.lower()


def humanize(name: str) -> str:
    cleaned = name.replace("_", " ").replace("-", " ")
    words = [w.capitalize() for w in cleaned.split() if w]
    return " ".join(words) or name


def aspect_ratio_string(path: Path) -> str:
    try:
        with Image.open(path) as im:
            w, h = im.size
    except Exception:
        return "1/1"

    ratio = w / h
    for label, value in COMMON_RATIOS.items():
        if abs(ratio - value) / value < RATIO_TOLERANCE:
            return label

    g = gcd(w, h)
    return f"{w // g}/{h // g}"


def list_images(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".svg"}],
        key=lambda p: p.name.lower(),
    )


def web_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def generate_series_block() -> str:
    output = ["const SERIES = {"]
    series_map = {
        "nature": "s1.name",
        "architecture": "s2.name",
        "studio": "s3.name",
        "aviation": "s4.name",
    }

    for folder_name, key in [("nature", "nature"), ("architecture, street", "architecture"), ("studio", "studio"), ("aviation", "aviation")]:
        folder = SERIES_ROOT / folder_name
        if not folder.exists():
            continue
        full_images = list_images(folder)
        output.append(f"  {key}:{{tk:'{series_map[key]}',photos:[")
        for img in full_images:
            output.append(f"    {{src:'{web_path(img)}',ar:'{aspect_ratio_string(img)}'}},")
        output.append("  ]},")

    output.append("};")
    return "\n".join(output)


def generate_projects_block() -> str:
    output = ["const PROJECTS = {"]
    for key, folder_name in PROJECT_ORDER:
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


def write_generated_data() -> None:
    GENERATED_FILE.parent.mkdir(exist_ok=True)
    GENERATED_FILE.write_text("\n\n".join([generate_series_block(), generate_projects_block()]) + "\n", encoding="utf-8")


def main() -> None:
    if not SERIES_ROOT.exists() or not PROJECTS_ROOT.exists():
        print("ERROR: assets/img/series and assets/img/projects must exist.")
        sys.exit(1)

    write_generated_data()
    print(f"Wrote {GENERATED_FILE}")


if __name__ == "__main__":
    main()
'''

Path('D:/Web/repo file - GitHub/generate_series.py').write_text(content, encoding='utf-8')
print('updated')
