"""Verify the exact expanded and zipped VAST MC1 package."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import zipfile
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image

from package_final_submission import ARCHIVE, EXPANDED, FIGURES, PACKAGE_NAME


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.assets: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if key in {"href", "src"} and value and not value.startswith(("#", "data:", "mailto:")):
                self.assets.append(value)


def _relative_assets(path: Path) -> list[str]:
    parser = AssetParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.assets


def _probe_video(path: Path) -> dict:
    command = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate",
        "-of", "json", str(path),
    ]
    result = subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")
    return json.loads(result.stdout)


def verify(root: Path, archive: Path) -> dict:
    failures: list[str] = []
    required = [
        root / "index.htm",
        root / "answers.md",
        root / "video-script.md",
        root / "app" / "index.html",
        root / "video" / "walkthrough.mp4",
        *(root / "figures" / name for name in FIGURES),
    ]
    for path in required:
        if not path.is_file():
            failures.append(f"missing file: {path.relative_to(root)}")

    links: list[tuple[str, str]] = []
    for page in [root / "index.htm", root / "app" / "index.html"]:
        if not page.is_file():
            continue
        for asset in _relative_assets(page):
            links.append((str(page.relative_to(root)), asset))
            if re.match(r"^[a-z]+://", asset, flags=re.I):
                failures.append(f"external asset: {page.relative_to(root)} -> {asset}")
            elif not (page.parent / asset).resolve().is_file():
                failures.append(f"broken link: {page.relative_to(root)} -> {asset}")

    report = (root / "index.htm").read_text(encoding="utf-8") if (root / "index.htm").is_file() else ""
    for phrase in [
        "Entry Name",
        "Junzhe Zhao",
        "Zhejiang Gongshang University",
        "Student team",
        "Question 1",
        "Question 2",
        "Question 3",
        "Inter-Agent Governance Carryover",
        "no 17:xx",
    ]:
        if phrase not in report:
            failures.append(f"report missing phrase: {phrase}")

    for page in [root / "index.htm", *(root / "app").glob("*")]:
        if page.is_file() and page.suffix.lower() in {".html", ".htm", ".js", ".css"}:
            text = page.read_text(encoding="utf-8")
            if re.search(r"[\u3400-\u9fff]", text):
                failures.append(f"Chinese interface text remains: {page.relative_to(root)}")
            if "\ufffd" in text or "鈥" in text or "锟" in text:
                failures.append(f"encoding artifact: {page.relative_to(root)}")

    image_sizes: dict[str, tuple[int, int]] = {}
    for name in FIGURES:
        path = root / "figures" / name
        if path.is_file():
            with Image.open(path) as image:
                image_sizes[name] = image.size
                if image.size != (1440, 900):
                    failures.append(f"unexpected figure size: {name} {image.size}")

    video = _probe_video(root / "video" / "walkthrough.mp4") if (root / "video" / "walkthrough.mp4").is_file() else {}
    duration = float(video.get("format", {}).get("duration", 0))
    streams = video.get("streams", [])
    codecs = {(item.get("codec_type"), item.get("codec_name")) for item in streams}
    if not 1 < duration < 240:
        failures.append(f"video duration outside (1, 240): {duration}")
    if ("video", "h264") not in codecs:
        failures.append("video is not H.264")
    if ("audio", "aac") not in codecs:
        failures.append("audio is not AAC")

    archive_mb = archive.stat().st_size / 1024 / 1024 if archive.is_file() else 0
    if not archive.is_file():
        failures.append("ZIP missing")
    elif archive_mb >= 50:
        failures.append(f"ZIP exceeds 50 MB: {archive_mb:.3f}")
    else:
        with zipfile.ZipFile(archive) as package:
            names = package.namelist()
            if not names or any(not name.startswith(f"{PACKAGE_NAME}/") for name in names):
                failures.append("ZIP root directory is incorrect")
            if f"{PACKAGE_NAME}/index.htm" not in names:
                failures.append("ZIP report missing")
            with tempfile.TemporaryDirectory(prefix="vast-mc1-verify-") as temporary:
                package.extractall(temporary)
                extracted = Path(temporary) / PACKAGE_NAME
                for path in extracted.rglob("*"):
                    if path.is_file() and path.stat().st_size == 0:
                        failures.append(f"empty extracted file: {path.relative_to(extracted)}")

    result = {
        "failures": failures,
        "relative_links": len(links),
        "figures": image_sizes,
        "video_duration_seconds": round(duration, 3),
        "video_codecs": sorted(f"{kind}:{codec}" for kind, codec in codecs),
        "zip_mb": round(archive_mb, 3),
        "zip_files": len(zipfile.ZipFile(archive).namelist()) if archive.is_file() else 0,
    }
    return result


def main() -> int:
    result = verify(EXPANDED, ARCHIVE)
    print(json.dumps(result, indent=2))
    return 1 if result["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
