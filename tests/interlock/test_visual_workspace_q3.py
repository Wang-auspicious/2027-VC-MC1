from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "visual_workspace_cn" / "index.html"
APP = ROOT / "visual_workspace_cn" / "app.js"
GRAPH = ROOT / "visual_workspace_cn" / "q3-warning-graph.js"
STYLE = ROOT / "visual_workspace_cn" / "q3-warning-graph.css"


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
