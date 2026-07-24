"""Create the exact VAST MC1 deliverable directory and ZIP."""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from build_final_submission import DESTINATION, ROOT, build_answers, build_app, build_report


DELIVERABLES = ROOT / "deliverables"
PACKAGE_NAME = "ZJGSU-Zhao-MC1"
EXPANDED = DELIVERABLES / PACKAGE_NAME
ARCHIVE = DELIVERABLES / f"{PACKAGE_NAME}.zip"

FIGURES = (
    "atlas-message-field.png",
    "atlas-q3.png",
    "atlas-q2-3d.png",
    "atlas-q1.png",
    "atlas-igc.png",
    "atlas-prevention.png",
)


def _validated_target(path: Path) -> Path:
    resolved = path.resolve()
    root = DELIVERABLES.resolve()
    if resolved.parent != root or resolved.name != PACKAGE_NAME:
        raise RuntimeError(f"Refusing unexpected package target: {resolved}")
    return resolved


def build_package() -> tuple[Path, Path]:
    build_app()
    build_answers()
    build_report()

    required = [
        DESTINATION / "index.htm",
        DESTINATION / "answers.md",
        DESTINATION / "video-script.md",
        DESTINATION / "video" / "walkthrough.mp4",
        *(DESTINATION / "figures" / name for name in FIGURES),
    ]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing submission artifacts:\n" + "\n".join(missing))

    DELIVERABLES.mkdir(parents=True, exist_ok=True)
    target = _validated_target(EXPANDED)
    if target.exists():
        shutil.rmtree(target)
    target.mkdir()

    shutil.copy2(DESTINATION / "index.htm", target / "index.htm")
    shutil.copy2(DESTINATION / "answers.md", target / "answers.md")
    shutil.copy2(DESTINATION / "video-script.md", target / "video-script.md")
    shutil.copytree(DESTINATION / "app", target / "app")
    (target / "figures").mkdir()
    for name in FIGURES:
        shutil.copy2(DESTINATION / "figures" / name, target / "figures" / name)
    (target / "video").mkdir()
    shutil.copy2(DESTINATION / "video" / "walkthrough.mp4", target / "video" / "walkthrough.mp4")

    if ARCHIVE.exists():
        ARCHIVE.unlink()
    with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(target.rglob("*")):
            if path.is_file():
                archive.write(path, Path(PACKAGE_NAME) / path.relative_to(target))
    return target, ARCHIVE


if __name__ == "__main__":
    expanded, archive = build_package()
    print(f"expanded={expanded}")
    print(f"archive={archive}")
    print(f"archive_mb={archive.stat().st_size / 1024 / 1024:.3f}")
