from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "visual_workspace_cn" / "index.html"
APP = ROOT / "visual_workspace_cn" / "app.js"
GRAPH = ROOT / "visual_workspace_cn" / "q3-warning-graph.js"
STYLE = ROOT / "visual_workspace_cn" / "q3-warning-graph.css"
STORY = ROOT / "visual_workspace_cn" / "case-story.js"
STORY_STYLE = ROOT / "visual_workspace_cn" / "case-story.css"


def test_q3_assets_are_loaded_before_the_workspace_app():
    html = INDEX.read_text(encoding="utf-8")
    assert 'href="q3-warning-graph.css"' in html
    assert html.index('src="q3-model.js"') < html.index('src="q3-warning-graph.js"')
    assert html.index('src="q3-warning-graph.js"') < html.index('src="app.js"')


def test_workspace_keeps_legacy_graphs_out_of_the_visible_channel_list():
    app = APP.read_text(encoding="utf-8")
    channel_block = app.split("const channels=[", 1)[1].split("];", 1)[0]
    assert '{id:"warning_graph"' not in channel_block
    assert '{id:"evidence_graph"' not in channel_block
    assert '{id:"dashboard"' not in channel_block
    assert '{id:"comms_huddle"' in channel_block


def test_warning_graph_exposes_mount_and_destroy_lifecycle():
    graph = GRAPH.read_text(encoding="utf-8")
    assert "function mount(" in graph
    assert "function destroy(" in graph
    assert "root.Q3WarningGraph" in graph
    assert STYLE.exists()


def test_case_story_is_loaded_before_the_workspace_app():
    html = INDEX.read_text(encoding="utf-8")
    assert 'href="case-story.css"' in html
    assert html.index('src="case-story.js"') < html.index('src="app.js"')
    assert STORY.exists()
    assert STORY_STYLE.exists()


def test_retired_case_story_has_no_active_render_route():
    app = APP.read_text(encoding="utf-8")
    story = STORY.read_text(encoding="utf-8")
    assert "CaseStory.mount" not in app
    assert 'classList.toggle("story-mode"' not in app
    assert "function mount(" not in story
    assert "function validateStory(" in story
    assert "function destroy()" in story


def test_workspace_opens_with_chat_and_appends_continuous_atlas():
    html = INDEX.read_text(encoding="utf-8")
    app = APP.read_text(encoding="utf-8")
    assert 'id="evidence-atlas"' in html
    assert 'id="atlas-entry"' in html
    assert 'let activeChannel="comms_huddle",activeView="group"' in app
    assert "window.WorkspaceBridge" in app


def test_atlas_assets_load_in_dependency_order():
    html = INDEX.read_text(encoding="utf-8")
    assert 'href="evidence-atlas.css"' in html
    assert html.index('src="message-summaries.js"') < html.index('src="evidence-atlas-data.js"')
    assert html.index('src="evidence-atlas-data.js"') < html.index('src="evidence-atlas-model.js"')
    assert html.index('src="evidence-atlas-model.js"') < html.index('src="evidence-atlas.js"')
    assert html.index('src="evidence-atlas.js"') < html.index('src="app.js"')


def test_active_workspace_avoids_retired_card_story_and_prohibited_copy():
    sources = [
        INDEX.read_text(encoding="utf-8"),
        APP.read_text(encoding="utf-8"),
        (ROOT / "visual_workspace_cn" / "evidence-atlas.js").read_text(encoding="utf-8"),
        (ROOT / "visual_workspace_cn" / "evidence-atlas.css").read_text(encoding="utf-8"),
        STORY.read_text(encoding="utf-8"),
    ]
    combined = "\n".join(sources)
    assert "case-story-verdicts" not in combined
    assert "case-chapter-grid" not in combined
    assert not __import__("re").search(r"\u4e0d\u662f.{0,40}\u800c\u662f", combined)
