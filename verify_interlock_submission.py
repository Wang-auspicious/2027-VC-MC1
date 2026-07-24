"""Verify the offline INTERLOCK submission package and shared evidence counts."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SUBMISSION = ROOT / "submission_final"
VALID_STATES = {"verified_open", "claimed_open", "closed", "bypassed", "unknown"}


def _payload(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").strip()
    prefix = "window.INTERLOCK_DATA="
    if not text.startswith(prefix) or not text.endswith(";"):
        raise ValueError("interlock-data.js is not a single offline payload assignment")
    return json.loads(text[len(prefix):-1])


def _local_references(page: str) -> list[str]:
    values = re.findall(r"(?:src|href)=[\"']([^\"']+)[\"']", page, flags=re.I)
    return [
        value
        for value in values
        if not value.startswith(("#", "data:", "mailto:", "javascript:"))
    ]


def verify_submission(submission: Path = SUBMISSION) -> tuple[list[str], dict]:
    failures: list[str] = []
    if (submission / "app-cn").exists():
        failures.append("review-only Chinese app must not be in official submission: app-cn")
    required = [
        "index.htm",
        "answers.md",
        "video-script.md",
        "app/index.html",
        "app/styles.css",
        "app/evidence-atlas.css",
        "app/evidence-atlas-data.js",
        "app/evidence-atlas-model.js",
        "app/evidence-atlas.js",
        "app/message-summaries.js",
        "app/q3-model.js",
        "app/q3-warning-graph.js",
        "app/app.js",
        "app/data/interlock-data.js",
        "figures/atlas-message-field.png",
        "figures/atlas-q3.png",
        "figures/atlas-q2-3d.png",
        "figures/atlas-q1.png",
        "figures/atlas-igc.png",
        "figures/atlas-prevention.png",
        "video/walkthrough.mp4",
    ]
    for relative in required:
        if not (submission / relative).exists():
            failures.append(f"missing required file: {relative}")

    if failures:
        return failures, {}

    static = (submission / "index.htm").read_text(encoding="utf-8")
    app = (submission / "app" / "index.html").read_text(encoding="utf-8")
    for name, page, base in [
        ("static", static, submission),
        ("app", app, submission / "app"),
    ]:
        for reference in _local_references(page):
            if reference.startswith(("http://", "https://")):
                failures.append(f"external reference in {name}: {reference}")
                continue
            target = (base / reference.split("#", 1)[0]).resolve()
            if not target.exists():
                failures.append(f"broken local reference in {name}: {reference}")

    markers = [
        "Entry Name",
        "Team member",
        "Student team",
        "Tools",
        "96 hours",
        "May be posted to the Visual Analytics Benchmark Repository",
        'id="q1"',
        'id="q2"',
        'id="q3"',
        'href="app/index.html"',
    ]
    for marker in markers:
        if marker not in static:
            failures.append(f"static report missing marker: {marker}")

    incomplete = re.findall(
        r"\b(?:TBD|TODO|PLACEHOLDER)\b|replace this|confirm before",
        static,
        flags=re.I,
    )
    if incomplete:
        failures.append(f"static report contains incomplete markers: {sorted(set(incomplete))}")

    payload = _payload(submission / "app" / "data" / "interlock-data.js")
    cases = payload.get("cases", [])
    gates = [gate for case in cases for gate in case.get("gates", [])]
    if len(payload.get("messages", [])) != 912:
        failures.append("payload message count is not 912")
    if len(cases) != 3:
        failures.append("payload case count is not 3")
    if len(gates) != 12:
        failures.append("payload gate count is not 12")
    illegal = sorted({gate.get("state") for gate in gates} - VALID_STATES)
    if illegal:
        failures.append(f"illegal gate states: {illegal}")
    for gate in gates:
        if gate.get("state") == "verified_open" and not gate.get("evidence_independent"):
            failures.append(f"verified gate lacks independent evidence: {gate.get('gate_id')}")

    known = {message["message_id"] for message in payload.get("messages", [])}
    for anchor in ["20460605_19_009", "20460605_21_020", "20460605_21_026"]:
        if anchor not in known:
            failures.append(f"missing first-screen anchor: {anchor}")

    image_report = {}
    minimum_dimensions = {
        "atlas-message-field.png": (1440, 900),
        "atlas-q3.png": (1440, 900),
        "atlas-q2-3d.png": (1440, 900),
        "atlas-q1.png": (1440, 900),
        "atlas-igc.png": (1440, 900),
        "atlas-prevention.png": (1440, 900),
    }
    for name, (minimum_width, minimum_height) in minimum_dimensions.items():
        with Image.open(submission / "figures" / name) as image:
            width, height = image.size
        image_report[name] = [width, height]
        if width < minimum_width or height < minimum_height:
            failures.append(f"screenshot too small: {name} is {width}x{height}")

    package_bytes = sum(
        path.stat().st_size
        for path in submission.rglob("*")
        if path.is_file() and "video" not in path.parts
    )
    report = {
        "messages": len(payload.get("messages", [])),
        "cases": len(cases),
        "gates": len(gates),
        "future_reply_edges": payload.get("data_quality", {}).get("future_reply_edges"),
        "screenshots": image_report,
        "package_without_video_mb": round(package_bytes / (1024 * 1024), 3),
        "video_present": (submission / "video" / "walkthrough.mp4").exists(),
    }
    return failures, report


def main() -> int:
    failures, report = verify_submission()
    for key, value in report.items():
        print(f"{key}: {value}")
    if failures:
        for failure in failures:
            print("FAIL:", failure)
        return 1
    print("verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
