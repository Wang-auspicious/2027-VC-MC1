from pathlib import Path

from build_final_submission import build_answers, build_app, build_report


def test_english_atlas_build_is_offline_and_complete(tmp_path: Path):
    app = build_app(tmp_path)
    index = (app / "index.html").read_text(encoding="utf-8")
    combined = "\n".join(
        path.read_text(encoding="utf-8")
        for path in app.iterdir()
        if path.suffix in {".html", ".js", ".css"}
    )
    assert 'lang="en"' in index
    assert "../interlock_app" not in index
    assert "../review_cn" not in index
    assert "Trace how a governance constraint lost carryover" in combined
    assert "Switch to 3D" in combined
    assert "Counterfactual controls" in combined
    assert (app / "data" / "interlock-data.js").stat().st_size > 900_000


def test_report_uses_official_fields_current_figures_and_relative_links(tmp_path: Path):
    build_answers(tmp_path)
    report = build_report(tmp_path).read_text(encoding="utf-8")
    for phrase in [
        "Entry Name",
        "Student team",
        "Tools",
        "Question 1",
        "Question 2",
        "Question 3",
        "Inter-Agent Governance Carryover",
        'href="app/index.html"',
        'href="video/walkthrough.mp4"',
        'href="answers.md"',
        "atlas-message-field.png",
        "atlas-q3.png",
        "atlas-q2-3d.png",
        "atlas-q1.png",
        "atlas-igc.png",
        "atlas-prevention.png",
    ]:
        assert phrase in report
    assert "http://" not in report
    assert "https://" not in report
    assert "zjz652158@outlook.com" in report


def test_answers_preserve_evidence_boundary(tmp_path: Path):
    answers = build_answers(tmp_path).read_text(encoding="utf-8")
    assert "no 17:xx `official_post` is observed" in answers
    assert "does not support final personal culpability or malicious intent" in answers
    assert "20460605_19_009" in answers
    assert "20460605_22_051" in answers
