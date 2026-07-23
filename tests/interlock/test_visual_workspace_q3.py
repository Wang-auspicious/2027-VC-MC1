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


def test_workspace_routes_to_a_dedicated_warning_graph_view():
    app = APP.read_text(encoding="utf-8")
    assert '{id:"warning_graph"' in app
    assert 'id==="warning_graph"?"warning-graph"' in app
    assert 'activeView==="warning-graph"' in app
    assert 'Q3WarningGraph.mount' in app
    assert 'data-open-warning-graph' in app


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


def test_workspace_routes_case_story_chapters_into_visual_investigations():
    app = APP.read_text(encoding="utf-8")
    assert "CaseStory.mount" in app
    assert 'classList.toggle("story-mode"' in app
    assert 'chapter.id==="q3"' in app
    assert 'act.id==="closure"' in app
    assert "边界如何被跨过" in app
    assert "职责何时开始重叠" in app
    assert "预警为何没有留下约束" in app


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
