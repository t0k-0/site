from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent
SERIES_ROOT = REPO_ROOT / 'assets/img/series'
PROJECTS_ROOT = REPO_ROOT / 'assets/img/projects'
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.svg'}


def count_images(path: Path) -> int:
    return len([x for x in path.iterdir() if x.is_file() and x.suffix.lower() in IMAGE_EXTS]) if path.exists() else 0


print('SERIES SUMMARY')
for series in sorted(SERIES_ROOT.iterdir()):
    if not series.is_dir():
        continue
    print(f' - {series.name}: full={count_images(series)}, preview={count_images(series / "preview")}')

print('\nPROJECT SUMMARY')
for project in sorted(PROJECTS_ROOT.iterdir()):
    if project.is_dir():
        print(f' - {project.name}: images={count_images(project)}')

