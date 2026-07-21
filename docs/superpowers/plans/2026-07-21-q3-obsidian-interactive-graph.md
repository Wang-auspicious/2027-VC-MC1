# Q3 Obsidian Interactive Warning Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append a warm-white, Obsidian-style interactive Q3 warning graph to `visual_workspace_cn`, with arbitrary event-pair comparison and synchronized animated radar, readable similarity timeline, and control-coverage views.

**Architecture:** Keep the current vanilla JavaScript application and its existing 2D/3D evidence page intact. Add a testable UMD data model (`q3-model.js`) and a self-contained view module (`q3-warning-graph.js`) mounted by the existing `app.js`; Canvas renders the dense 2D/3D graph, while SVG renders the three coordinated subcharts from one shared A/B state.

**Tech Stack:** Vanilla JavaScript, Canvas 2D, inline SVG, existing `window.INTERLOCK_DATA`, Node.js `node:test`, Playwright, Python static HTTP server, pytest static checks.

---

## File map

- Create `visual_workspace_cn/q3-model.js`: pure similarity, ranking, edge, radar-profile, and response-state functions; browser global plus CommonJS export.
- Create `visual_workspace_cn/q3-warning-graph.js`: page markup, shared state, Canvas graph, SVG subcharts, animation, cleanup, and responsive redraw.
- Create `visual_workspace_cn/q3-warning-graph.css`: warm-white page layout and visualization-specific styles.
- Modify `visual_workspace_cn/index.html`: load the new stylesheet and scripts in dependency order.
- Modify `visual_workspace_cn/app.js`: add the appended page route, navigation entry, mount/unmount lifecycle, and body mode class.
- Create `tests/js/q3-model.test.js`: deterministic model tests.
- Create `tests/e2e/q3-warning-graph-smoke.js`: browser interaction and console-error test.
- Create `tests/interlock/test_visual_workspace_q3.py`: static asset and evidence-boundary checks.

The existing modified files `visual_workspace_cn/app.js` and `visual_workspace_cn/styles.css` must be inspected before every patch. Preserve all unrelated working-tree changes.

All network edges in this plan come exclusively from `incident_vectors` and the declared ten-feature similarity model. The implementation must not read `responding_to` when constructing this page, because those references are not reliable enough to support causal or similarity edges.

### Task 1: Build the pairwise Q3 model with tests

**Files:**
- Create: `tests/js/q3-model.test.js`
- Create: `visual_workspace_cn/q3-model.js`

- [ ] **Step 1: Write the failing model tests**

Create `tests/js/q3-model.test.js` with the real default IDs and synthetic edge cases:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../../visual_workspace_cn/q3-model.js');

function loadData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync('review_cn/data/interlock-data.js', 'utf8'),
    context
  );
  return context.window.INTERLOCK_DATA;
}

const data = loadData();
const target = '20460605_21_026';
const warning = '20460529_08_012';

test('loads exactly 77 observed public-event vectors', () => {
  assert.equal(data.incident_vectors.length, 77);
});

test('default warning remains an 83.3333 percent match', () => {
  assert.equal(model.pairSimilarity(data.incident_vectors, target, warning), 0.833333);
});

test('pair similarity is symmetric and excludes self from ranking', () => {
  assert.equal(
    model.pairSimilarity(data.incident_vectors, target, warning),
    model.pairSimilarity(data.incident_vectors, warning, target)
  );
  assert.equal(model.rankAgainst(data.incident_vectors, target)[0].event_id, warning);
  assert.equal(model.rankAgainst(data.incident_vectors, target).some(d => d.event_id === target), false);
});

test('top-k edges are deterministic and contain no self loops', () => {
  const first = model.buildTopKEdges(data.incident_vectors, 3);
  const second = model.buildTopKEdges(data.incident_vectors, 3);
  assert.deepEqual(first, second);
  assert.equal(first.some(edge => edge.source === edge.target), false);
  assert.equal(new Set(first.map(edge => `${edge.source}|${edge.target}`)).size, first.length);
});

test('risk profile returns six bounded explanatory dimensions', () => {
  const vector = data.incident_vectors.find(d => d.event_id === target);
  const profile = model.riskProfile(vector);
  assert.deepEqual(Object.keys(profile), [
    'sensitive_entity', 'content_explicitness', 'channel_exposure',
    'approval_gap', 'review_gap', 'persistent_control_gap'
  ]);
  Object.values(profile).forEach(value => assert.ok(value >= 0 && value <= 1));
});

test('missing response fields remain unknown', () => {
  assert.deepEqual(model.responseState({ deleted: true }), {
    deleted: true,
    posting_paused: null,
    persistent_control_created: null
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run:

```powershell
node --test tests/js/q3-model.test.js
```

Expected: FAIL with `Cannot find module '../../visual_workspace_cn/q3-model.js'`.

- [ ] **Step 3: Implement the UMD model**

Create `visual_workspace_cn/q3-model.js` with these exact public functions:

```js
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Q3Model = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const FEATURES = [
    'sensitive_entity_present', 'content_strength', 'surface',
    'publisher_function', 'independent_approval_present',
    'current_review_present', 'external_engagement_present',
    'deleted', 'posting_paused', 'persistent_control_created'
  ];
  const WEIGHTS = {
    sensitive_entity_present: 2,
    content_strength: 1,
    surface: 2,
    publisher_function: 0.5,
    independent_approval_present: 2,
    current_review_present: 2,
    external_engagement_present: 1,
    deleted: 0.5,
    posting_paused: 0.5,
    persistent_control_created: 0.5
  };
  const STRENGTH = { generic: 0, hint: 1, explicit: 2 };
  const EXPOSURE = { official: 0.25, personal: 0.7, anonymous: 1 };

  function byId(vectors, id) {
    const item = vectors.find(vector => vector.event_id === id);
    if (!item) throw new Error(`Unknown public event: ${id}`);
    return item;
  }

  function featureDistance(left, right, name) {
    if (name === 'content_strength') {
      return Math.abs(STRENGTH[left] - STRENGTH[right]) / 2;
    }
    return left === right ? 0 : 1;
  }

  function compareVectors(left, right) {
    const denominator = FEATURES.reduce((sum, name) => sum + WEIGHTS[name], 0);
    const contributions = {};
    let weighted = 0;
    FEATURES.forEach(name => {
      const value = featureDistance(left[name], right[name], name) * WEIGHTS[name];
      contributions[name] = Number(value.toFixed(4));
      weighted += value;
    });
    return {
      similarity: Number((1 - weighted / denominator).toFixed(6)),
      distance: Number((weighted / denominator).toFixed(6)),
      contributions
    };
  }

  function pairSimilarity(vectors, leftId, rightId) {
    return compareVectors(byId(vectors, leftId), byId(vectors, rightId)).similarity;
  }

  function rankAgainst(vectors, anchorId, options = {}) {
    const anchor = byId(vectors, anchorId);
    const priorOnly = Boolean(options.priorOnly);
    return vectors
      .filter(vector => vector.event_id !== anchorId)
      .filter(vector => !priorOnly || vector.timestamp.slice(0, 10) < anchor.timestamp.slice(0, 10))
      .map(vector => ({
        ...vector,
        ...compareVectors(anchor, vector)
      }))
      .sort((a, b) =>
        b.similarity - a.similarity ||
        a.timestamp.localeCompare(b.timestamp) ||
        a.event_id.localeCompare(b.event_id)
      );
  }

  function buildTopKEdges(vectors, k = 3) {
    const unique = new Map();
    vectors.forEach(anchor => {
      rankAgainst(vectors, anchor.event_id).slice(0, k).forEach(candidate => {
        const pair = [anchor.event_id, candidate.event_id].sort();
        const key = pair.join('|');
        const edge = { source: pair[0], target: pair[1], similarity: candidate.similarity };
        if (!unique.has(key) || unique.get(key).similarity < edge.similarity) unique.set(key, edge);
      });
    });
    return [...unique.values()].sort((a, b) =>
      a.source.localeCompare(b.source) || a.target.localeCompare(b.target)
    );
  }

  function riskProfile(vector) {
    return {
      sensitive_entity: vector.sensitive_entity_present ? 1 : 0,
      content_explicitness: STRENGTH[vector.content_strength] / 2,
      channel_exposure: EXPOSURE[vector.surface] ?? 0,
      approval_gap: vector.independent_approval_present ? 0 : 1,
      review_gap: vector.current_review_present ? 0 : 1,
      persistent_control_gap: vector.persistent_control_created ? 0 : 1
    };
  }

  function responseState(vector) {
    const value = name => Object.hasOwn(vector, name) ? Boolean(vector[name]) : null;
    return {
      deleted: value('deleted'),
      posting_paused: value('posting_paused'),
      persistent_control_created: value('persistent_control_created')
    };
  }

  return {
    FEATURES, WEIGHTS, byId, compareVectors, pairSimilarity,
    rankAgainst, buildTopKEdges, riskProfile, responseState
  };
});
```

- [ ] **Step 4: Run the model tests**

Run:

```powershell
node --test tests/js/q3-model.test.js
```

Expected: 6 tests, 6 PASS.

- [ ] **Step 5: Commit the model slice**

```powershell
git add visual_workspace_cn/q3-model.js tests/js/q3-model.test.js
git commit -m "feat: add pairwise Q3 event model"
```

### Task 2: Append the new page route without disturbing existing views

**Files:**
- Modify: `visual_workspace_cn/index.html`
- Modify: `visual_workspace_cn/app.js:48-60,115-132,151-166,812-880`
- Create: `visual_workspace_cn/q3-warning-graph.css`
- Create: `visual_workspace_cn/q3-warning-graph.js`

- [ ] **Step 1: Add a failing static integration test**

Create `tests/interlock/test_visual_workspace_q3.py`:

```python
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_q3_assets_are_loaded_in_dependency_order():
    html = (ROOT / "visual_workspace_cn" / "index.html").read_text(encoding="utf-8")
    assert "q3-warning-graph.css" in html
    assert html.index("q3-model.js") < html.index("q3-warning-graph.js") < html.index("app.js")


def test_q3_route_is_appended_and_3d_is_preserved():
    app = (ROOT / "visual_workspace_cn" / "app.js").read_text(encoding="utf-8")
    assert 'id:"warning_graph"' in app
    assert 'id==="warning_graph"?"warning-graph"' in app
    assert "renderWarningGraph" in app
    assert "3D 空间图谱" in app


def test_q3_copy_keeps_similarity_noncausal():
    view = (ROOT / "visual_workspace_cn" / "q3-warning-graph.js").read_text(encoding="utf-8")
    assert "行为相似度，不代表因果关系" in view
```

- [ ] **Step 2: Run the static test and verify failure**

Run:

```powershell
python -m pytest tests/interlock/test_visual_workspace_q3.py -q
```

Expected: FAIL because the Q3 assets and route do not exist.

- [ ] **Step 3: Load the new assets**

In `visual_workspace_cn/index.html`, add the stylesheet after `styles.css`:

```html
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="q3-warning-graph.css">
```

Load scripts at the end in this order:

```html
<script src="../interlock_app/data/interlock-data.js"></script>
<script>window.INTERLOCK_EN=window.INTERLOCK_DATA;</script>
<script src="../review_cn/data/interlock-data.js"></script>
<script src="q3-model.js"></script>
<script src="q3-warning-graph.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 4: Create the mountable page module contract**

Create `visual_workspace_cn/q3-warning-graph.js` with a complete lifecycle shell:

```js
(function(root, factory) {
  root.Q3WarningGraph = factory(root.Q3Model);
})(window, function(Model) {
  'use strict';
  const DEFAULT_ANCHOR = '20460605_21_026';
  const DEFAULT_COMPARE = '20460529_08_012';

  function mount(host, data, options = {}) {
    if (!Model) throw new Error('Q3Model is required');
    if (!host) throw new Error('Q3 warning graph host is required');
    const state = {
      anchorId: DEFAULT_ANCHOR,
      compareId: DEFAULT_COMPARE,
      graphMode: '2d',
      graphScope: 'local',
      hoverId: '',
      destroyed: false
    };
    host.innerHTML = pageMarkup();
    const onBack = options.onBack || function() {};
    host.querySelector('[data-q3-back]').addEventListener('click', onBack);
    host.querySelector('[data-q3-reset]').addEventListener('click', function() {
      state.anchorId = DEFAULT_ANCHOR;
      state.compareId = DEFAULT_COMPARE;
      update();
    });
    function update() {
      host.dataset.anchorId = state.anchorId;
      host.dataset.compareId = state.compareId;
    }
    update();
    return {
      state,
      destroy() {
        state.destroyed = true;
        host.replaceChildren();
      }
    };
  }

  function pageMarkup() {
    return `<section class="q3-warning-page">
      <header class="q3-warning-head">
        <div><span>INTERLOCK / Q3 · EARLY WARNING</span>
        <h2>6 月 5 日的发布是否可以提前预见？</h2></div>
        <div class="q3-warning-actions">
          <button data-q3-back>‹ 返回上一页</button>
          <button data-q3-reset>恢复 Q3</button>
        </div>
      </header>
      <div class="q3-warning-layout">
        <section class="q3-graph-pane"><canvas data-q3-graph></canvas></section>
        <aside class="q3-linked-views">
          <section data-q3-radar></section>
          <section data-q3-timeline></section>
          <section data-q3-controls></section>
        </aside>
      </div>
      <p class="q3-evidence-boundary">边表示行为相似度，不代表因果关系。</p>
    </section>`;
  }

  return { mount, DEFAULT_ANCHOR, DEFAULT_COMPARE };
});
```

- [ ] **Step 5: Wire the appended route in `app.js`**

Make only targeted additions:

```js
const channels=[
  {id:"dashboard",symbol:"▦",name:"仪表盘",desc:""},
  {id:"evidence_graph",symbol:"◇",name:"协作证据图谱",desc:"在三维空间中追踪消息、角色与公开动作"},
  {id:"warning_graph",symbol:"∴",name:"Q3 预警图谱",desc:"比较历史公开事件与持久控制缺口"},
  // retain every existing channel entry unchanged
];

let q3View = null;

function openChannel(id){
  activeChannel=id;activeAgent="";activePair="";
  activeView=id==="dashboard"?"dashboard":
    id==="evidence_graph"?"graph":
    id==="warning_graph"?"warning-graph":
    id==="one_on_one_chat"?"dm-directory":
    publicChannels.has(id)?"posts":"group";
  renderAll(false);
}

function renderWarningGraph(){
  if (graphFrame) cancelAnimationFrame(graphFrame);
  $("#message-list").className="message-list q3-warning-host";
  $("#message-list").innerHTML="";
  q3View?.destroy();
  q3View=window.Q3WarningGraph.mount($("#message-list"),CN,{
    onBack(){openChannel("evidence_graph")}
  });
}
```

Add `else if(activeView==="warning-graph")renderWarningGraph();` to `renderAll`, include `warning-graph` in the body mode toggle, and call `q3View?.destroy()` before leaving the page.

At the end of the existing evidence page markup, add:

```html
<button class="evidence-continue" data-open-warning-graph>
  继续：查看历史预警图谱 →
</button>
```

Bind it with `openChannel("warning_graph")`.

- [ ] **Step 6: Add the base warm-white layout CSS**

Create `visual_workspace_cn/q3-warning-graph.css` with scoped selectors:

```css
.q3-warning-host{height:100%;padding:0!important}
.q3-warning-page{height:100%;display:flex;flex-direction:column;background:#faf8f3;color:#252723}
.q3-warning-head{min-height:66px;display:flex;justify-content:space-between;align-items:center;padding:12px 22px;border-bottom:1px solid #252723}
.q3-warning-head span{color:#2e9388;font:9px var(--mono);letter-spacing:.1em}
.q3-warning-head h2{margin:4px 0 0;font:600 20px/1.2 Georgia,"Noto Serif SC",serif}
.q3-warning-actions{display:flex;gap:6px}.q3-warning-actions button{border:1px solid #cac6bd;background:transparent;color:#252723;padding:7px 9px;font-size:10px}
.q3-warning-layout{min-height:0;flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(390px,32%)}
.q3-graph-pane{position:relative;min-width:0;border-right:1px solid #cac6bd;overflow:hidden}
.q3-graph-pane canvas{position:absolute;inset:0;width:100%;height:100%}
.q3-linked-views{min-width:0;padding:0 20px;overflow:auto}
.q3-linked-views>section{padding:17px 0;border-bottom:1px solid #cac6bd}
.q3-evidence-boundary{margin:0;padding:6px 22px;border-top:1px solid #cac6bd;color:#77756e;font:9px var(--mono)}
@media(max-width:1100px){.q3-warning-page{height:auto}.q3-warning-layout{grid-template-columns:1fr}.q3-graph-pane{height:620px;border-right:0;border-bottom:1px solid #cac6bd}}
@media(prefers-reduced-motion:reduce){.q3-warning-page *{scroll-behavior:auto!important;transition-duration:0s!important;animation-duration:0s!important}}
```

- [ ] **Step 7: Run static integration tests**

Run:

```powershell
python -m pytest tests/interlock/test_visual_workspace_q3.py -q
node --test tests/js/q3-model.test.js
```

Expected: all PASS.

- [ ] **Step 8: Commit the route and shell**

```powershell
git add visual_workspace_cn/index.html visual_workspace_cn/app.js visual_workspace_cn/q3-warning-graph.css visual_workspace_cn/q3-warning-graph.js tests/interlock/test_visual_workspace_q3.py
git commit -m "feat: append Q3 warning graph page"
```

### Task 3: Render the stable Obsidian-style 2D graph

**Files:**
- Modify: `visual_workspace_cn/q3-warning-graph.js`
- Modify: `visual_workspace_cn/q3-warning-graph.css`
- Modify: `tests/e2e/q3-warning-graph-smoke.js`

- [ ] **Step 1: Write the initial Playwright graph test**

Create `tests/e2e/q3-warning-graph-smoke.js`:

```js
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = process.env.VISUAL_WORKSPACE_URL ||
  'http://127.0.0.1:8765/visual_workspace_cn/index.html';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Q3 预警图谱' }).click();
    await page.locator('.q3-warning-page').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-q3-graph]').count(), 1);
    assert.equal(await page.locator('.q3-warning-page').getAttribute('data-node-count'), '77');
    assert.deepEqual(errors, []);
    console.log('q3_warning_graph: PASS');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Run the browser test and verify the graph assertion fails**

In terminal 1:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

In terminal 2:

```powershell
$env:VISUAL_WORKSPACE_URL='http://127.0.0.1:8765/visual_workspace_cn/index.html'
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: FAIL because the page does not yet expose the rendered 77-node state.

- [ ] **Step 3: Add deterministic graph geometry and rendering**

Inside `mount`, derive nodes and edges once:

```js
const vectors = data.incident_vectors;
const vectorMap = new Map(vectors.map(vector => [vector.event_id, vector]));
const edges = Model.buildTopKEdges(vectors, 3);
const nodes = vectors.map(vector => ({
  ...vector,
  x: seededCoordinate(vector.event_id, 0),
  y: seededCoordinate(vector.event_id, 1),
  vx: 0,
  vy: 0
}));
host.querySelector('.q3-warning-page').dataset.nodeCount = String(nodes.length);
```

Implement these named functions in the module and call them from `update()`:

```js
function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededCoordinate(id, axis) {
  return ((hashText(`${id}:${axis}`) % 10000) / 10000) * 2 - 1;
}

function selectedNeighborhood(edges, anchorId, compareId) {
  const active = new Set([anchorId, compareId]);
  edges.forEach(edge => {
    if (edge.source === anchorId || edge.target === anchorId ||
        edge.source === compareId || edge.target === compareId) {
      active.add(edge.source);
      active.add(edge.target);
    }
  });
  return active;
}
```

Use a bounded force tick with link attraction, inverse-square repulsion, weak centering, velocity damping, and collision radius. Run at most 90 initial ticks and 30 ticks after an anchor change; never run a permanent animation loop.

The draw order must be: neutral edges, selected edge/neighborhood edges, neutral nodes, neighborhood nodes, B, A, then at most three labels. Use `devicePixelRatio` canvas scaling and keep ordinary nodes between 2 and 4 CSS pixels.

- [ ] **Step 4: Add hit testing and A/B interactions**

Bind pointer handlers to the canvas:

```js
canvas.addEventListener('pointermove', event => {
  state.hoverId = hitNode(event, nodes, canvas)?.event_id || '';
  drawGraph();
});
canvas.addEventListener('pointerleave', () => {
  state.hoverId = '';
  drawGraph();
});
canvas.addEventListener('click', event => {
  const node = hitNode(event, nodes, canvas);
  if (!node || node.event_id === state.anchorId) return;
  state.compareId = node.event_id;
  update('compare');
});
```

Add visible controls for `GLOBAL · 77`, `LOCAL · 1`, `DEPTH 2`, `2D`, and `3D`. Only global/local, 2D/3D, reset, set-as-anchor, and back are interactive; `DEPTH 2` may change graph scope but must not invent new edges.

- [ ] **Step 5: Run the browser smoke test**

```powershell
$env:VISUAL_WORKSPACE_URL='http://127.0.0.1:8765/visual_workspace_cn/index.html'
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: `q3_warning_graph: PASS`, `console_errors: 0` or no console-error output.

- [ ] **Step 6: Commit the graph renderer**

```powershell
git add visual_workspace_cn/q3-warning-graph.js visual_workspace_cn/q3-warning-graph.css tests/e2e/q3-warning-graph-smoke.js
git commit -m "feat: render stable Q3 event graph"
```

### Task 4: Add the radar and readable focus-plus-context timeline

**Files:**
- Modify: `visual_workspace_cn/q3-warning-graph.js`
- Modify: `visual_workspace_cn/q3-warning-graph.css`
- Modify: `tests/e2e/q3-warning-graph-smoke.js`

- [ ] **Step 1: Extend the Playwright assertions before implementation**

After opening the Q3 page, add:

```js
assert.match(await page.locator('[data-q3-radar]').textContent(), /83\.3%/);
assert.match(await page.locator('[data-q3-timeline]').textContent(), /70%.*预警带/);
assert.equal(await page.locator('[data-q3-timeline] [data-event-point]').count(), 77);
assert.equal(await page.locator('[data-q3-timeline] [data-top-rank]').count(), 5);
```

- [ ] **Step 2: Run the browser test and verify the chart assertions fail**

Run the same Playwright command as Task 3.

Expected: FAIL because radar and timeline content are not rendered.

- [ ] **Step 3: Render the six-axis radar with direct A/B labels**

Implement `renderRadar(container, state, vectors, animate)` using `Model.riskProfile`. The SVG must contain four neutral rings, six axes, direct labels, two low-opacity polygons, vertex dots, and a separate similarity value:

```js
const dimensions = [
  ['sensitive_entity', '敏感实体'],
  ['content_explicitness', '披露明确度'],
  ['channel_exposure', '渠道暴露'],
  ['approval_gap', '独立批准缺口'],
  ['review_gap', '当下复核缺口'],
  ['persistent_control_gap', '持久控制缺口']
];
const pair = Model.compareVectors(
  Model.byId(vectors, state.anchorId),
  Model.byId(vectors, state.compareId)
);
```

The header must read `A · 06.05 Legal vs B · selected event`, show `${(pair.similarity * 100).toFixed(1)}%`, and include the sentence `雷达为解释性风险轮廓；相似度来自十特征模型`.

- [ ] **Step 4: Replace the swarm with a legible timeline**

Implement `renderTimeline(container, state, vectors, animate)` with:

```js
const ranked = Model.rankAgainst(vectors, state.anchorId);
const rankMap = new Map(ranked.map((event, index) => [event.event_id, index + 1]));
const topFivePrior = Model.rankAgainst(vectors, state.anchorId, { priorOnly: true }).slice(0, 5);
```

Use a fixed viewBox of `0 0 430 180`, margins `{top:24,right:18,bottom:28,left:42}`, a UTC time x-scale, and a linear y-scale from 0 to 1. Draw 40%, 60%, 80%, and 100% y ticks. Draw the 70%–100% band with a very light neutral fill and a direct `70%–100% 预警带` label.

Render every event as a circle with `data-event-point="EVENT_ID"`. Directly label only the five prior top-ranked marks and the current B. Use a greedy vertical collision pass that enforces 13 px between label baselines and keeps all labels inside the plot.

When A changes, preserve one SVG circle per event ID and animate only `cy` over 450 ms with cubic easing. When B changes, preserve point positions and update the selection ring, date guide, direct label, and displayed rank.

- [ ] **Step 5: Make timeline points update B**

Each event circle must be a real SVG button-equivalent target:

```js
circle.setAttribute('role', 'button');
circle.setAttribute('aria-label', `${formatEvent(vector)}，与基准相似度 ${percent}%`);
circle.addEventListener('click', () => {
  if (vector.event_id !== state.anchorId) {
    state.compareId = vector.event_id;
    update('compare');
  }
});
```

- [ ] **Step 6: Run model and browser tests**

```powershell
node --test tests/js/q3-model.test.js
$env:VISUAL_WORKSPACE_URL='http://127.0.0.1:8765/visual_workspace_cn/index.html'
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: all PASS and no page/console errors.

- [ ] **Step 7: Commit the linked comparison charts**

```powershell
git add visual_workspace_cn/q3-warning-graph.js visual_workspace_cn/q3-warning-graph.css tests/e2e/q3-warning-graph-smoke.js
git commit -m "feat: add linked Q3 radar and timeline"
```

### Task 5: Add radial control coverage and full shared-state updates

**Files:**
- Modify: `visual_workspace_cn/q3-warning-graph.js`
- Modify: `visual_workspace_cn/q3-warning-graph.css`
- Modify: `tests/e2e/q3-warning-graph-smoke.js`

- [ ] **Step 1: Add failing control and pair-change assertions**

Add to the Playwright test:

```js
assert.match(await page.locator('[data-q3-controls]').textContent(), /正式链控制.*DLP.*3 条路径/s);
const initialCompare = await page.locator('.q3-warning-page').getAttribute('data-compare-id');
await page.locator('[data-q3-timeline] [data-event-point]').nth(3).click();
const changedCompare = await page.locator('.q3-warning-page').getAttribute('data-compare-id');
assert.notEqual(changedCompare, initialCompare);
assert.equal(await page.locator('[data-q3-radar]').getAttribute('data-compare-id'), changedCompare);
assert.equal(await page.locator('[data-q3-controls]').getAttribute('data-compare-id'), changedCompare);
```

- [ ] **Step 2: Run the test and verify failure**

Expected: FAIL because control coverage and synchronized data attributes are absent.

- [ ] **Step 3: Render the three-sector radial coverage view**

Implement `renderControls(container, state, data)` from `data.counterfactual`:

```js
const routeOrder = ['official', 'personal', 'anonymous'];
const controls = data.counterfactual.controls;
const coverage = new Map(controls.map(control => [
  control.id,
  routeOrder.filter(route =>
    data.counterfactual.baseline_routes[route].blocking_controls.includes(control.id)
  )
]));
const response = Model.responseState(Model.byId(data.incident_vectors, state.compareId));
```

Draw one ring per control and one sector per route. Fill only covered sectors. Add an outer response ring with three directly labeled segments: deleted, posting paused, persistent control. Render `unknown` as an outlined segment, `false` as neutral, and `true` as teal.

The conclusion text must be exactly: `任一正式链控制 + DLP，才能关闭全部 3 条路径。`

- [ ] **Step 4: Centralize the update transaction**

Replace partial updates with one function:

```js
function update(reason = 'state') {
  const page = host.querySelector('.q3-warning-page');
  page.dataset.anchorId = state.anchorId;
  page.dataset.compareId = state.compareId;
  page.dataset.graphMode = state.graphMode;
  page.dataset.graphScope = state.graphScope;
  drawGraph();
  renderRadar(radarHost, state, vectors, reason !== 'initial');
  renderTimeline(timelineHost, state, vectors, reason !== 'initial');
  renderControls(controlsHost, state, data);
  updatePairHeader();
}
```

Add `设为基准` so current B becomes A and the highest-ranked other event becomes B:

```js
setAnchorButton.addEventListener('click', () => {
  state.anchorId = state.compareId;
  state.compareId = Model.rankAgainst(vectors, state.anchorId)[0].event_id;
  settleGraph(30);
  update('anchor');
});
```

- [ ] **Step 5: Run all Q3 tests**

```powershell
node --test tests/js/q3-model.test.js
python -m pytest tests/interlock/test_visual_workspace_q3.py -q
$env:VISUAL_WORKSPACE_URL='http://127.0.0.1:8765/visual_workspace_cn/index.html'
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: all PASS.

- [ ] **Step 6: Commit synchronized right-side updates**

```powershell
git add visual_workspace_cn/q3-warning-graph.js visual_workspace_cn/q3-warning-graph.css tests/e2e/q3-warning-graph-smoke.js
git commit -m "feat: synchronize Q3 control coverage"
```

### Task 6: Preserve 3D and add restrained transition motion

**Files:**
- Modify: `visual_workspace_cn/q3-warning-graph.js`
- Modify: `tests/e2e/q3-warning-graph-smoke.js`

- [ ] **Step 1: Add failing 3D state-preservation assertions**

Add:

```js
const selectedBefore3d = await page.locator('.q3-warning-page').getAttribute('data-compare-id');
await page.getByRole('button', { name: '3D' }).click();
assert.equal(await page.locator('.q3-warning-page').getAttribute('data-graph-mode'), '3d');
assert.equal(await page.locator('.q3-warning-page').getAttribute('data-compare-id'), selectedBefore3d);
await page.getByRole('button', { name: '2D' }).click();
assert.equal(await page.locator('.q3-warning-page').getAttribute('data-graph-mode'), '2d');
```

- [ ] **Step 2: Run the E2E test and verify failure**

Expected: FAIL because the new Q3 graph does not yet support 3D projection.

- [ ] **Step 3: Add a projection-only 3D mode over the same graph state**

Keep one node/edge dataset. Add camera state `{yaw:-0.35,pitch:0.18,zoom:1}` and project node positions:

```js
function project3d(node, camera, width, height) {
  const cy = Math.cos(camera.yaw), sy = Math.sin(camera.yaw);
  const cp = Math.cos(camera.pitch), sp = Math.sin(camera.pitch);
  const x1 = node.x * cy - node.z * sy;
  const z1 = node.x * sy + node.z * cy;
  const y1 = node.y * cp - z1 * sp;
  const z2 = node.y * sp + z1 * cp;
  const perspective = 1 / Math.max(0.55, 1 + z2 * 0.35);
  return {
    x: width / 2 + x1 * camera.zoom * perspective,
    y: height / 2 + y1 * camera.zoom * perspective,
    scale: perspective,
    depth: z2
  };
}
```

Derive deterministic `z` from the event ID hash. In 3D mode, support pointer drag for yaw/pitch and wheel for zoom. Sort nodes by projected depth before drawing. Use the same click hit-testing, anchor, compare, neighborhood, and right-side state.

- [ ] **Step 4: Add transition discipline and reduced-motion behavior**

Use one `animate(duration, render)` helper based on `requestAnimationFrame`. It must return immediately at progress 1 when `matchMedia('(prefers-reduced-motion: reduce)').matches` is true. Cancel the prior animation before starting a new selection transition.

No animation may run after `destroy()`. Store and cancel the resize listener, pointer handlers, and animation frame.

- [ ] **Step 5: Run E2E twice, including reduced motion**

Normal:

```powershell
node tests/e2e/q3-warning-graph-smoke.js
```

Then extend the test to create a second page with `page.emulateMedia({ reducedMotion: 'reduce' })` and repeat the A/B and 2D/3D assertions.

Expected: both modes PASS with no console errors.

- [ ] **Step 6: Commit 3D and motion**

```powershell
git add visual_workspace_cn/q3-warning-graph.js tests/e2e/q3-warning-graph-smoke.js
git commit -m "feat: preserve Q3 selection across 3D mode"
```

### Task 7: Full regression, visual QA, and handoff

**Files:**
- Modify if needed: `visual_workspace_cn/q3-warning-graph.js`
- Modify if needed: `visual_workspace_cn/q3-warning-graph.css`
- Modify if needed: `tests/e2e/q3-warning-graph-smoke.js`
- Create: `visual_workspace_cn/audit_q3_warning_1440.png`
- Create: `visual_workspace_cn/audit_q3_warning_1366.png`
- Create: `visual_workspace_cn/audit_q3_warning_1920.png`

- [ ] **Step 1: Run the full existing automated suite**

```powershell
node --test tests/js/model.test.js tests/js/q3-model.test.js
python -m pytest tests/interlock -q
$env:VISUAL_WORKSPACE_URL='http://127.0.0.1:8765/visual_workspace_cn/index.html'
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: every test PASS. If a pre-existing unrelated test fails, record its exact command and output before changing anything outside the Q3 files.

- [ ] **Step 2: Capture the three required desktop breakpoints**

Use Playwright or headless Chrome after opening the Q3 page and waiting for the graph to settle:

```powershell
node scripts/capture_walkthrough_frames.js
```

If that script does not expose arbitrary viewport capture, use the existing Playwright dependency to capture exactly:

- 1366×768 → `visual_workspace_cn/audit_q3_warning_1366.png`
- 1440×900 → `visual_workspace_cn/audit_q3_warning_1440.png`
- 1920×1080 → `visual_workspace_cn/audit_q3_warning_1920.png`

Expected visual state: warm-white page; one dense neutral graph with 77 small nodes; only A/B/hover labels; readable radar axes; explicit 40/60/80/100 timeline axis; five non-overlapping top labels; radial route labels; no clipped controls.

- [ ] **Step 3: Manually exercise the interaction sequence**

At 1440×900:

1. Open the appended page from the previous evidence page.
2. Hover at least three graph nodes and confirm only temporary neighborhoods highlight.
3. Click five different nodes and confirm all three right views update each time.
4. Click a timeline point and confirm the same B selection appears on the graph.
5. Set B as A and confirm ranking, timeline y positions, and graph edges update.
6. Switch 2D → 3D → 2D and confirm A/B is preserved.
7. Restore Q3 and confirm A/B returns to `20460605_21_026` / `20460529_08_012` at 83.3%.
8. Return to the previous page and confirm the existing evidence graph still supports its own 2D/3D switch.

- [ ] **Step 4: Inspect screenshot collisions and fix only verified defects**

Check radar labels, Top-5 timeline labels, selected event annotation, radial sector labels, action buttons, and narrow-screen stacking. Make scoped CSS or label-placement changes only where a screenshot demonstrates overlap or clipping.

- [ ] **Step 5: Re-run automated tests after visual fixes**

```powershell
node --test tests/js/model.test.js tests/js/q3-model.test.js
python -m pytest tests/interlock -q
node tests/e2e/q3-warning-graph-smoke.js
```

Expected: all PASS, zero console/page errors.

- [ ] **Step 6: Commit the verified page**

```powershell
git add visual_workspace_cn/q3-model.js visual_workspace_cn/q3-warning-graph.js visual_workspace_cn/q3-warning-graph.css visual_workspace_cn/index.html visual_workspace_cn/app.js tests/js/q3-model.test.js tests/e2e/q3-warning-graph-smoke.js tests/interlock/test_visual_workspace_q3.py visual_workspace_cn/audit_q3_warning_1366.png visual_workspace_cn/audit_q3_warning_1440.png visual_workspace_cn/audit_q3_warning_1920.png
git commit -m "feat: complete interactive Q3 warning graph"
```

Do not copy the page into `submission_final`, rebuild the deliverable ZIP, or update the four-minute video in this plan. Those actions require a separate post-acceptance delivery task after the Chinese prototype is visually approved.
