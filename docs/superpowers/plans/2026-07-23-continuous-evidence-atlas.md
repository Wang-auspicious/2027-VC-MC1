# Continuous Evidence Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the card-led case brief with a continuous Q3 → Q2 → Q1 visual narrative that begins with the existing chat workspace, preserves message identity across coordinated views, derives IGC after the challenge answers, and ends with a data-driven prevention simulator.

**Architecture:** Keep the existing chat workspace as the first viewport and mount a separate evidence-atlas application below it. A pure UMD model builds validated message nodes, observed and analytical edges, deterministic layouts, evidence chains, IGC proxies, and counterfactual route states. Canvas renders the 912-message graph, SVG renders the almanac, duty strips, parallel sets, evidence tracks, and radar, and the existing 3D canvas logic is adapted to the shared state.

**Tech Stack:** Static HTML/CSS, browser JavaScript, Canvas 2D, native SVG, Node.js `node:test`, Python `pytest`, Playwright with local Chrome.

---

## File map

### Create

- `visual_workspace_cn/message-summaries.js` — one reviewed 8–18 word English summary for every message ID.
- `visual_workspace_cn/evidence-atlas-data.js` — declared windows, evidence chains, evidence tiers, controls, role palette, and IGC rubric.
- `visual_workspace_cn/evidence-atlas-model.js` — pure validation, edge building, layouts, chain lookup, evidence and counterfactual calculations.
- `visual_workspace_cn/evidence-atlas.js` — atlas lifecycle, shared state, Canvas/SVG renderers, scroll and manual interactions.
- `visual_workspace_cn/evidence-atlas.css` — continuous editorial layout and coordinated-view styling.
- `tests/js/message-summaries.test.js` — summary coverage, length, language, and source-ID checks.
- `tests/js/evidence-atlas-model.test.js` — model, edge, layout, evidence, and counterfactual tests.
- `tests/e2e/evidence-atlas-smoke.js` — complete interaction-path smoke test.
- `tests/e2e/evidence-atlas-visual.js` — responsive screenshots and bounding-box assertions.

### Modify

- `visual_workspace_cn/index.html` — keep the chat workspace first, append atlas mount point, load new assets.
- `visual_workspace_cn/styles.css` — enable document scrolling and make the chat shell a stable first viewport.
- `visual_workspace_cn/app.js` — default to the real chat view, expose message-selection bridge, retire the card-led dashboard route.
- `visual_workspace_cn/case-story.js` — remove prohibited phrasing and leave the retired module valid for historical tests until its tests are migrated.
- `tests/interlock/test_visual_workspace_q3.py` — assert asset order, opening chat route, and atlas mount contract.
- `tests/e2e/case-story-smoke.js` — replace old case-card expectations with opening-chat and atlas-entry expectations.

## Task 1: Establish the atlas shell and opening-chat contract

**Files:**
- Modify: `visual_workspace_cn/index.html`
- Modify: `visual_workspace_cn/styles.css`
- Modify: `visual_workspace_cn/app.js`
- Modify: `tests/interlock/test_visual_workspace_q3.py`
- Modify: `tests/e2e/case-story-smoke.js`

- [ ] **Step 1: Write the failing static tests**

Add these assertions to `tests/interlock/test_visual_workspace_q3.py`:

```python
def test_workspace_opens_with_chat_and_appends_continuous_atlas():
    html = INDEX.read_text(encoding="utf-8")
    app = APP.read_text(encoding="utf-8")
    assert 'id="evidence-atlas"' in html
    assert 'id="atlas-entry"' in html
    assert 'let activeChannel="comms_huddle",activeView="group"' in app
    assert 'window.WorkspaceBridge' in app
```

- [ ] **Step 2: Run the static test and verify failure**

Run:

```powershell
pytest tests/interlock/test_visual_workspace_q3.py -q
```

Expected: FAIL because the atlas assets and mount point do not exist and the app still opens the dashboard.

- [ ] **Step 3: Add the first-viewport and atlas HTML structure**

In `visual_workspace_cn/index.html`, add after `</main>`:

```html
<button class="atlas-entry" id="atlas-entry" type="button" aria-controls="evidence-atlas">
  Continue to the evidence atlas <span>↓</span>
</button>
<section id="evidence-atlas" class="evidence-atlas-host" aria-label="Continuous evidence atlas"></section>
```

Do not load atlas assets yet. Tasks 2 and 3 create the data dependencies, and Task 4 loads the complete renderer without leaving the page in an intermediate 404 state.

- [ ] **Step 4: Make the existing workspace the opening view**

In `visual_workspace_cn/app.js`, initialize:

```javascript
let activeChannel="comms_huddle",activeView="group",activePair="",activeCase="all",activeAgent="",query="",selectedId=CN.meta.default_action_id,dense=false;
```

Expose a bridge before the final `renderAll(true)`:

```javascript
window.WorkspaceBridge = {
  selectMessage(id) {
    if (!messageMap.has(id)) throw new Error(`Unknown message: ${id}`);
    selectedId = id;
    renderSelection();
    window.dispatchEvent(new CustomEvent("workspace:message-selected", { detail: { id } }));
  },
  openMessage(id) {
    if (!messageMap.has(id)) throw new Error(`Unknown message: ${id}`);
    selectedId = id;
    activeChannel = messageMap.get(id).channel;
    activeView = publicChannels.has(activeChannel) ? "posts" : "group";
    renderAll(true);
  }
};
```

In `styles.css`, change the document contract:

```css
html{scroll-behavior:smooth}
body{padding:clamp(12px,2.4vw,32px);overflow-x:hidden;overflow-y:auto}
.workspace-shell{height:calc(100vh - clamp(24px,4.8vw,64px))}
.atlas-entry{display:flex;margin:10px auto 28px;border:0;background:transparent;color:#5f5a53;font:10px var(--mono);letter-spacing:.08em;gap:10px;align-items:center}
.atlas-entry span{color:var(--orange);font-size:16px}
```

Bind the entry control in `evidence-atlas.js` during Task 4.

- [ ] **Step 5: Update the Playwright opening assertion**

Replace the old case-card assertions in `tests/e2e/case-story-smoke.js` with:

```javascript
await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
await page.locator('.message-row').first().waitFor();
assert.match(await page.locator('#current-channel-name').textContent(), /协作群聊/);
assert.equal(await page.locator('.case-verdict').count(), 0);
assert.equal(await page.locator('#evidence-atlas').count(), 1);
```

- [ ] **Step 6: Re-run the static test**

Run:

```powershell
pytest tests/interlock/test_visual_workspace_q3.py -q
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add visual_workspace_cn/index.html visual_workspace_cn/styles.css visual_workspace_cn/app.js tests/interlock/test_visual_workspace_q3.py tests/e2e/case-story-smoke.js
git commit -m "feat: make chat the continuous atlas entry"
```

## Task 2: Author and validate all message summaries

**Files:**
- Create: `visual_workspace_cn/message-summaries.js`
- Create: `tests/js/message-summaries.test.js`

- [ ] **Step 1: Write the failing coverage test**

Create `tests/js/message-summaries.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const summaries = require('../../visual_workspace_cn/message-summaries.js');

function loadData(path) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path, 'utf8'), context);
  return context.window.INTERLOCK_DATA;
}

const data = loadData('interlock_app/data/interlock-data.js');
const ids = data.messages.map(message => message.message_id);

test('every source message has exactly one static English summary', () => {
  assert.equal(ids.length, 912);
  assert.equal(Object.keys(summaries.SUMMARIES).length, 912);
  assert.deepEqual(Object.keys(summaries.SUMMARIES).sort(), [...ids].sort());
});

test('summaries are concise English action statements', () => {
  for (const [id, summary] of Object.entries(summaries.SUMMARIES)) {
    const words = summary.trim().split(/\s+/);
    assert.ok(words.length >= 8 && words.length <= 18, `${id}: ${words.length} words`);
    assert.match(summary, /^[A-Z]/, id);
    assert.match(summary, /[.!?]$/, id);
    assert.doesNotMatch(summary, /【|】|[\u4e00-\u9fff]/, id);
  }
});

test('runtime validator rejects missing and unknown summary ids', () => {
  assert.deepEqual(summaries.validateSummaries(data.messages), []);
  assert.match(
    summaries.validateSummaries(data.messages.slice(1))[0],
    /unknown summary id|missing summary/i
  );
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
node --test tests/js/message-summaries.test.js
```

Expected: FAIL because `message-summaries.js` does not exist.

- [ ] **Step 3: Create the static summary module**

Use this exact module wrapper in `visual_workspace_cn/message-summaries.js`:

```javascript
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MessageSummaries = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  "use strict";

  const SUMMARIES = Object.freeze({
    "20460517_00_001": "Legal opens the Q2 planning session and prioritizes compliance before the board risk summary.",
    "20460517_00_002": "Platform Trust offers current operational metrics before the group turns to the risk review.",
    "20460517_00_003": "Platform Trust requests an operational baseline before framing regulatory exposure for the board."
  });

  function validateSummaries(messages) {
    const failures = [];
    const ids = new Set(messages.map(message => message.message_id));
    for (const id of ids) if (!Object.hasOwn(SUMMARIES, id)) failures.push(`missing summary: ${id}`);
    for (const id of Object.keys(SUMMARIES)) if (!ids.has(id)) failures.push(`unknown summary id: ${id}`);
    return failures;
  }

  return { SUMMARIES, validateSummaries };
});
```

- [ ] **Step 4: Author the remaining 909 summaries in source order**

Read messages from `interlock_app/data/interlock-data.js` in batches of 40. For each message, write one distinct 8–18 word English sentence that states the message's contextual action. Preserve message IDs exactly. Do not use truncation, first-sentence extraction, templates, or runtime generation.

After every batch, run:

```powershell
node --test tests/js/message-summaries.test.js
```

Expected during drafting: only the coverage test remains failing, and its missing count decreases by the batch size. Expected after the final batch: all three tests PASS.

- [ ] **Step 5: Review high-risk windows against full English source**

Manually compare every summary on 2046-05-29, 2046-06-04, and 2046-06-05 to the complete English message. Correct any summary that changes modality, authorization status, actor, channel, or temporal order.

Run:

```powershell
node --test tests/js/message-summaries.test.js
```

Expected: PASS with 912 summaries and no length or language failures.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/message-summaries.js tests/js/message-summaries.test.js
git commit -m "data: add reviewed summaries for every message"
```

## Task 3: Build the pure atlas data and model layer

**Files:**
- Create: `visual_workspace_cn/evidence-atlas-data.js`
- Create: `visual_workspace_cn/evidence-atlas-model.js`
- Create: `tests/js/evidence-atlas-model.test.js`

- [ ] **Step 1: Write failing model tests**

Create `tests/js/evidence-atlas-model.test.js` with:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../../visual_workspace_cn/evidence-atlas-model.js');
const declared = require('../../visual_workspace_cn/evidence-atlas-data.js');
const summaries = require('../../visual_workspace_cn/message-summaries.js');

function load(path) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path, 'utf8'), context);
  return context.window.INTERLOCK_DATA;
}

const cn = load('review_cn/data/interlock-data.js');
const en = load('interlock_app/data/interlock-data.js');

test('builds one stable node per English message', () => {
  const atlas = model.buildAtlas(cn, en, summaries.SUMMARIES, declared);
  assert.equal(atlas.nodes.length, 912);
  assert.equal(new Set(atlas.nodes.map(node => node.id)).size, 912);
  assert.equal(atlas.nodes.find(node => node.id === '20460529_08_012').window, 'near_miss');
});

test('separates observed and analytical edges', () => {
  const atlas = model.buildAtlas(cn, en, summaries.SUMMARIES, declared);
  assert.ok(atlas.edges.some(edge => edge.kind === 'observed'));
  assert.ok(atlas.edges.some(edge => edge.kind === 'analytical'));
  assert.ok(atlas.edges.filter(edge => edge.kind === 'analytical').every(edge => edge.method && edge.strength > 0));
});

test('layouts are deterministic and bounded', () => {
  const atlas = model.buildAtlas(cn, en, summaries.SUMMARIES, declared);
  for (const mode of ['time', 'role', 'channel']) {
    const first = model.layout(atlas.nodes, mode);
    const second = model.layout(atlas.nodes, mode);
    assert.deepEqual(first, second);
    Object.values(first).forEach(point => {
      assert.ok(point.x >= 0 && point.x <= 1);
      assert.ok(point.y >= 0 && point.y <= 1);
    });
  }
});

test('key points expose three valid candidate evidence chains', () => {
  const chains = model.chainsFor('20460605_21_026', declared);
  assert.deepEqual(chains.map(chain => chain.type), ['authorization', 'migration', 'public_action']);
  chains.flatMap(chain => chain.ids).forEach(id => assert.ok(en.messages.some(message => message.message_id === id)));
});

test('controls close hazardous routes while retaining the legitimate route', () => {
  const baseline = model.simulateControls([]);
  const repaired = model.simulateControls(declared.CONTROLS.map(control => control.id));
  assert.ok(baseline.hazardousOpen.length > 0);
  assert.deepEqual(repaired.hazardousOpen, []);
  assert.equal(repaired.legitimateOfficialOpen, true);
  assert.ok(repaired.igc.route_closure > baseline.igc.route_closure);
});

test('observational evidence never becomes an exact experimental score', () => {
  const proxy = model.igcProxy('incident', declared);
  assert.equal(proxy.exact, false);
  Object.values(proxy.dimensions).forEach(item => {
    assert.ok(item.low <= item.high);
    assert.ok(['observed', 'partial', 'unobserved'].includes(item.evidence));
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
node --test tests/js/evidence-atlas-model.test.js
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Declare evidence, chain, control, and IGC data**

Create `visual_workspace_cn/evidence-atlas-data.js` as a UMD module exporting:

```javascript
const KEY_WINDOWS = Object.freeze({
  near_miss: { date: "2046-05-29", ids: ["20460529_08_012", "20460529_08_013", "20460529_08_014", "20460529_08_019", "20460529_08_020", "20460529_08_038"] },
  normal: { date: "2046-06-04", ids: ["20460604_12_009", "20460604_12_010", "20460604_12_017", "20460604_12_018"] },
  incident: { date: "2046-06-05", ids: ["20460605_19_009", "20460605_21_020", "20460605_21_024", "20460605_21_026", "20460605_21_027", "20460605_21_055", "20460605_22_051"] }
});

const CONTROLS = Object.freeze([
  { id: "signed_artifact", label: "Signed authorization artifact" },
  { id: "current_reviewer_ack", label: "Current reviewer acknowledgment" },
  { id: "duty_separation", label: "Authorization / execution separation" },
  { id: "cross_surface_gate", label: "Cross-account and cross-channel capability gate" }
]);
```

Also export:

- `ROLE_COLORS` for all seven agents;
- `EVIDENCE_CHAINS` keyed by the three key event IDs and chain type;
- `EVIDENCE_LEVELS` keyed by existing message ID with `observed` or `asserted`;
- `MISSING_EVIDENCE` entries with synthetic IDs, expected timestamp, action track, description, and supporting process source;
- `DUTY_AXIS` in the five-function order;
- `IGC_PROXIES` for `near_miss`, `normal`, and `incident`, each containing low/high/evidence values and source IDs.

Every declared message ID must occur in the English message data. Synthetic missing-evidence IDs must begin with `missing:` and must never be inserted into the source-message index.

- [ ] **Step 4: Implement the pure model**

Create `visual_workspace_cn/evidence-atlas-model.js` with these exported functions:

```javascript
function buildAtlas(cn, en, summaries, declared) {}
function buildObservedEdges(nodesById) {}
function buildAnalyticalEdges(nodes) {}
function layout(nodes, mode) {}
function chainsFor(messageId, declared) {}
function simulateControls(controlIds) {}
function igcProxy(caseId, declared) {}
function validateAtlas(atlas, declared) {}
```

Implementation rules:

- observed edges come only from valid `responding_to` IDs;
- analytical `event` edges connect adjacent messages in the same key window;
- analytical `duty` edges connect adjacent messages sharing a declared duty function;
- analytical `semantic` edges use token Jaccard similarity, compare only messages on the same date, keep at most two neighbors per node, require score `>= 0.34`, and record `method: "token_jaccard"` and `strength`;
- deterministic jitter uses a stable string hash of `message_id`;
- time layout places key dates without removing background dates;
- role and channel layouts use fixed declared orders;
- counterfactual simulation keeps the June 4 official route open and closes hazardous incident routes according to the four control rules;
- IGC proxies always return ranges and evidence levels with `exact: false`.

- [ ] **Step 5: Run model tests**

Run:

```powershell
node --test tests/js/evidence-atlas-model.test.js
```

Expected: all six tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas-data.js visual_workspace_cn/evidence-atlas-model.js tests/js/evidence-atlas-model.test.js
git commit -m "feat: add continuous atlas evidence model"
```

## Task 4: Implement the shared atlas shell and dense message graph

**Files:**
- Create: `visual_workspace_cn/evidence-atlas.js`
- Create: `visual_workspace_cn/evidence-atlas.css`
- Modify: `visual_workspace_cn/index.html`
- Create: `tests/e2e/evidence-atlas-smoke.js`

- [ ] **Step 1: Write the failing shell smoke test**

Create `tests/e2e/evidence-atlas-smoke.js`:

```javascript
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#atlas-entry').click();
  await page.locator('.atlas-stage').waitFor();
  assert.equal(await page.locator('.atlas-message-canvas').count(), 1);
  assert.equal(await page.locator('[data-atlas-layout]').count(), 3);
  assert.match(await page.locator('.atlas-status').textContent(), /912 messages/i);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Evidence atlas shell smoke test passed.');
})().catch(error => { console.error(error); process.exit(1); });
```

- [ ] **Step 2: Run the smoke test and verify failure**

Start the existing local server or:

```powershell
python -m http.server 8765
```

In another terminal:

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: FAIL because `.atlas-stage` is not mounted.

- [ ] **Step 3: Create the atlas lifecycle and shared state**

In `evidence-atlas.js`, expose:

```javascript
window.EvidenceAtlas = {
  mount(host, options) {},
  destroy() {},
  selectMessage(id) {},
  setLayout(mode) {},
  setChapter(id) {},
  setControls(ids) {}
};
```

The mounted state must contain:

```javascript
{
  chapter: "universe",
  layout: "time",
  selectedId: "",
  selectedPair: ["20460605_21_026", "20460529_08_012"],
  chainType: "",
  mode3d: false,
  controls: new Set(),
  positions: new Map(),
  targetPositions: new Map()
}
```

Mount one sticky visual stage plus narrative sections with these IDs:

```text
atlas-universe
atlas-q3
atlas-q2
atlas-q1
atlas-igc
atlas-prevention
```

- [ ] **Step 4: Load the complete atlas asset chain**

Add this static test to `tests/interlock/test_visual_workspace_q3.py`:

```python
def test_atlas_assets_load_in_dependency_order():
    html = INDEX.read_text(encoding="utf-8")
    assert 'href="evidence-atlas.css"' in html
    assert html.index('src="message-summaries.js"') < html.index('src="evidence-atlas-data.js"')
    assert html.index('src="evidence-atlas-data.js"') < html.index('src="evidence-atlas-model.js"')
    assert html.index('src="evidence-atlas-model.js"') < html.index('src="evidence-atlas.js"')
    assert html.index('src="evidence-atlas.js"') < html.index('src="app.js"')
```

In `visual_workspace_cn/index.html`, load `evidence-atlas.css` after `styles.css`, and load:

```html
<script src="message-summaries.js"></script>
<script src="evidence-atlas-data.js"></script>
<script src="evidence-atlas-model.js"></script>
<script src="evidence-atlas.js"></script>
```

after both INTERLOCK data files and before `app.js`.

At the end of `evidence-atlas.js`, mount from the same immutable data:

```javascript
const host = document.querySelector("#evidence-atlas");
const atlas = window.EvidenceAtlasModel.buildAtlas(
  window.INTERLOCK_DATA,
  window.INTERLOCK_EN,
  window.MessageSummaries.SUMMARIES,
  window.EvidenceAtlasData
);
window.EvidenceAtlas.mount(host, { atlas, declared: window.EvidenceAtlasData });
```

- [ ] **Step 5: Render the 912-message graph on Canvas**

Implement:

```javascript
function drawMessageGraph(context, atlas, state, viewport) {}
function hitTestMessage(x, y, state) {}
function animatePositions(now) {}
function renderMessagePopover(node) {}
function renderChainChooser(messageId) {}
function renderEvidenceChain(chain) {}
```

Rendering requirements:

- role color is stable;
- dark red appears only on selected hazardous paths;
- observed edges use solid strokes;
- analytical edges use thinner lower-alpha strokes;
- node radius remains between 1.7 and 4.8 CSS pixels;
- selected points receive one restrained outer ring;
- all nodes remain present when changing layout;
- selected nodes expose full English text;
- selected candidate chains place full key messages and static summaries in the right evidence rail.

- [ ] **Step 6: Add scroll and manual layout controls**

Use `IntersectionObserver` with threshold `0.55` to call `setChapter(section.dataset.chapter)`. Add three typographic buttons:

```html
<button data-atlas-layout="time">Time</button>
<button data-atlas-layout="role">Role</button>
<button data-atlas-layout="channel">Channel</button>
```

Bind `#atlas-entry`:

```javascript
document.querySelector("#atlas-entry").addEventListener("click", () => {
  document.querySelector("#evidence-atlas").scrollIntoView({ behavior: "smooth" });
});
```

- [ ] **Step 7: Implement the editorial CSS**

`evidence-atlas.css` must define:

- warm-white full-width document sections;
- a sticky stage without card containers;
- a 60/40 graph and evidence-rail split;
- restrained typographic controls;
- no gradients, box shadows, rounded cards, or pill buttons;
- a single dark focus theme activated only by `.atlas-stage[data-chapter="q1"]`;
- responsive behavior at 1366, 1440, and 1920 widths;
- reduced-motion rules.

- [ ] **Step 8: Run the static and smoke tests**

Run:

```powershell
pytest tests/interlock/test_visual_workspace_q3.py -q
node tests/e2e/evidence-atlas-smoke.js
```

Expected: both commands PASS.

- [ ] **Step 9: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas.css visual_workspace_cn/index.html tests/interlock/test_visual_workspace_q3.py tests/e2e/evidence-atlas-smoke.js
git commit -m "feat: render the shared continuous message graph"
```

## Task 5: Implement Q3 historical almanac and carryover coverage

**Files:**
- Modify: `visual_workspace_cn/evidence-atlas.js`
- Modify: `visual_workspace_cn/evidence-atlas.css`
- Modify: `tests/e2e/evidence-atlas-smoke.js`
- Modify: `tests/js/evidence-atlas-model.test.js`

- [ ] **Step 1: Add failing Q3 assertions**

Add to the smoke test:

```javascript
await page.locator('#atlas-q3').scrollIntoViewIfNeeded();
await page.locator('.atlas-event-almanac').waitFor();
assert.equal(await page.locator('.atlas-event-column').count(), 77);
await page.locator('[data-event-id="20460529_08_012"]').click();
assert.equal(await page.locator('.atlas-fingerprint path').count(), 2);
assert.match(await page.locator('.atlas-q3-conclusion').textContent(), /May 29/i);
```

- [ ] **Step 2: Run the smoke test and verify failure**

Run:

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: FAIL because the almanac does not exist.

- [ ] **Step 3: Implement the SVG event almanac**

Render one narrow aligned column for each `incident_vector`. Reuse `Q3Model.compareVectors`, `rankAgainst`, `riskProfile`, and `responseState`. Feature rows must share one scale. Keep the incident reference fixed and visually reveal the May 29 warning through the feature match before displaying `83.3333%`.

- [ ] **Step 4: Implement the overlay fingerprint and coverage matrix**

The fingerprint overlays the six bounded `riskProfile` values for the selected pair with transparent fill and readable axis ticks. The coverage matrix uses rows:

```text
role
channel
identity
publication capability
```

and columns:

```text
reported
deleted
paused
independent authorization artifact
cross-surface gate
```

Only observed response fields receive filled marks. Unknown cells remain empty and expose “unobserved” on focus.

- [ ] **Step 5: Run model and smoke tests**

```powershell
node --test tests/js/q3-model.test.js tests/js/evidence-atlas-model.test.js
node tests/e2e/evidence-atlas-smoke.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas.css tests/e2e/evidence-atlas-smoke.js tests/js/evidence-atlas-model.test.js
git commit -m "feat: add Q3 event almanac and coverage view"
```

## Task 6: Implement Q2 duty distributions, parallel sets, and 3D

**Files:**
- Modify: `visual_workspace_cn/evidence-atlas.js`
- Modify: `visual_workspace_cn/evidence-atlas-model.js`
- Modify: `visual_workspace_cn/evidence-atlas.css`
- Modify: `tests/js/evidence-atlas-model.test.js`
- Modify: `tests/e2e/evidence-atlas-smoke.js`

- [ ] **Step 1: Add failing Q2 assertions**

Add:

```javascript
await page.locator('#atlas-q2').scrollIntoViewIfNeeded();
await page.locator('.atlas-duty-strips').waitFor();
assert.equal(await page.locator('.atlas-duty-strip').count(), 2);
assert.equal(await page.locator('.atlas-parallel-set').count(), 1);
await page.locator('[data-atlas-3d]').click();
assert.equal(await page.locator('.atlas-3d-canvas').count(), 1);
assert.match(await page.locator('.atlas-stage').getAttribute('data-mode'), /3d/);
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: FAIL because Q2 views are absent.

- [ ] **Step 3: Build the paired duty distributions**

Map existing `duty_functions` onto the five declared functions. Reuse the original message points. Place June 4 above June 5 with aligned axes and stable role color. Add a thin concentration contour around roles without enclosing the view in boxes.

- [ ] **Step 4: Build the parallel sets**

Add a pure model function:

```javascript
function parallelFlows(nodes, dimensions = ["role", "channel", "identity", "function"]) {}
```

Aggregate band width by observed message count. Retain role color through every stage. Use dark red only when the terminal function is a hazardous public action. Clicking a band selects its source message IDs and updates the evidence rail.

- [ ] **Step 5: Adapt the existing 3D graph**

Move the reusable projection, pointer rotation, hit-test, and draw logic from `app.js` into atlas-local functions. Replace concentric decorative rings with three depth planes:

```text
role plane
channel plane
identity plane
```

Message points interpolate between their 2D selection and 3D targets. Do not render small text inside the 3D canvas. Provide a one-click return to 2D and preserve `selectedId`, selected chain, and active date.

- [ ] **Step 6: Run tests**

```powershell
node --test tests/js/evidence-atlas-model.test.js
node tests/e2e/evidence-atlas-smoke.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas-model.js visual_workspace_cn/evidence-atlas.css tests/js/evidence-atlas-model.test.js tests/e2e/evidence-atlas-smoke.js
git commit -m "feat: add Q2 duty flow and cross-layer 3D"
```

## Task 7: Implement the Q1 evidence-focus view

**Files:**
- Modify: `visual_workspace_cn/evidence-atlas.js`
- Modify: `visual_workspace_cn/evidence-atlas-data.js`
- Modify: `visual_workspace_cn/evidence-atlas.css`
- Modify: `tests/e2e/evidence-atlas-smoke.js`

- [ ] **Step 1: Add failing evidence-level assertions**

Add:

```javascript
await page.locator('#atlas-q1').scrollIntoViewIfNeeded();
await page.locator('.atlas-evidence-tracks').waitFor();
assert.equal(await page.locator('.atlas-evidence-track').count(), 6);
assert.ok(await page.locator('[data-evidence-level="observed"]').count() > 0);
assert.ok(await page.locator('[data-evidence-level="asserted"]').count() > 0);
assert.ok(await page.locator('[data-evidence-level="missing"]').count() > 0);
assert.match(await page.locator('.atlas-q1-boundary').textContent(), /independently verified/i);
```

- [ ] **Step 2: Run and verify failure**

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: FAIL because the Q1 focus view is absent.

- [ ] **Step 3: Render six time-aligned action tracks**

Create SVG tracks for:

```text
policy interpretation
authorization assertion
GO instruction
public execution
public confirmation
post-hoc documentation
```

Place nodes at absolute timestamps. Connect only valid observed or explicitly declared analytical relations.

- [ ] **Step 4: Apply the three evidence levels**

- `observed`: filled marks and solid strokes;
- `asserted`: hollow marks and lighter strokes;
- `missing`: negative space, interrupted scales, and text anchored to the expected time position.

The 17:xx missing `official_post`, independent CivicLoom consent artifact, and post-15:08 Judge acknowledgment must remain absent evidence positions. Do not render them as messages.

- [ ] **Step 5: Coordinate the right-side chain**

Selecting any evidence mark updates the right rail. Key items show full English content. Ordinary context uses the static summary. Each item displays its evidence level and source ID.

- [ ] **Step 6: Run the smoke test**

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas-data.js visual_workspace_cn/evidence-atlas.css tests/e2e/evidence-atlas-smoke.js
git commit -m "feat: add Q1 temporal evidence focus"
```

## Task 8: Implement IGC synthesis and prevention simulation

**Files:**
- Modify: `visual_workspace_cn/evidence-atlas.js`
- Modify: `visual_workspace_cn/evidence-atlas-model.js`
- Modify: `visual_workspace_cn/evidence-atlas.css`
- Modify: `tests/js/evidence-atlas-model.test.js`
- Modify: `tests/e2e/evidence-atlas-smoke.js`

- [ ] **Step 1: Add failing IGC and prevention assertions**

Add:

```javascript
await page.locator('#atlas-igc').scrollIntoViewIfNeeded();
assert.equal(await page.locator('.atlas-igc-radar [data-case]').count(), 3);
assert.equal(await page.locator('.atlas-igc-exact-score').count(), 0);
await page.locator('#atlas-prevention').scrollIntoViewIfNeeded();
const before = await page.locator('.atlas-open-hazard-count').textContent();
for (const control of await page.locator('[data-control]').all()) await control.click();
const after = await page.locator('.atlas-open-hazard-count').textContent();
assert.notEqual(before, after);
assert.match(after, /^0$/);
assert.match(await page.locator('.atlas-legitimate-route').textContent(), /open/i);
```

- [ ] **Step 2: Run and verify failure**

```powershell
node tests/e2e/evidence-atlas-smoke.js
```

Expected: FAIL because the IGC and prevention views are absent.

- [ ] **Step 3: Render the uncertainty-aware IGC radar**

Draw low/high ranges for the five dimensions:

```text
route closure
transfer coverage
constraint survival
provenance integrity
utility preservation
```

Overlay near-miss, controlled, and incident profiles with transparent fill. Add evidence-coverage ticks and “observed / partial / unobserved” labels. Do not display a single exact composite score.

- [ ] **Step 4: Bind controls to real model state**

Render the four controls as typographic check controls. On change:

```javascript
const simulation = AtlasModel.simulateControls([...state.controls]);
renderCounterfactualGraph(simulation);
renderCounterfactualParallelSets(simulation);
renderIgcState(simulation.igc);
```

The graph must update edge reachability and opacity. The parallel sets must update band width or terminal state. The June 4 official route remains visible and open.

- [ ] **Step 5: Run model and smoke tests**

```powershell
node --test tests/js/evidence-atlas-model.test.js
node tests/e2e/evidence-atlas-smoke.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas-model.js visual_workspace_cn/evidence-atlas.css tests/js/evidence-atlas-model.test.js tests/e2e/evidence-atlas-smoke.js
git commit -m "feat: add IGC synthesis and prevention simulation"
```

## Task 9: Remove retired card-led language and prohibited copy

**Files:**
- Modify: `visual_workspace_cn/app.js`
- Modify: `visual_workspace_cn/case-story.js`
- Modify: `visual_workspace_cn/case-story.css`
- Modify: `visual_workspace_cn/styles.css`
- Modify: `tests/js/case-story.test.js`
- Modify: `tests/e2e/case-story-smoke.js`

- [ ] **Step 1: Add a failing copy and style audit**

Add to `tests/interlock/test_visual_workspace_q3.py`:

```python
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
```

- [ ] **Step 2: Run and verify failure**

```powershell
pytest tests/interlock/test_visual_workspace_q3.py -q
```

Expected: FAIL on the retired case-story markup and prohibited copy.

- [ ] **Step 3: Retire the old dashboard route**

Remove `dashboard`, `evidence_graph`, and `warning_graph` from the visible channel list. Keep the existing functions temporarily if required by the atlas migration, but make the new continuous page the only main analytical route. Remove `CaseStory.mount` from active rendering.

Reduce `case-story.js` to a compatibility module exporting `validateStory()` and an empty `destroy()` until old imports and tests are deleted in a later cleanup. Remove all obsolete card markup and copy.

- [ ] **Step 4: Remove obsolete card styling**

Delete active `.case-verdict`, `.case-chapter-grid`, `.dashboard-*`, and duplicated graph-card rules that no remaining selector uses. Preserve chat, profile, message, and atlas styles.

- [ ] **Step 5: Run static and JavaScript tests**

```powershell
pytest tests/interlock/test_visual_workspace_q3.py -q
node --test tests/js/*.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/app.js visual_workspace_cn/case-story.js visual_workspace_cn/case-story.css visual_workspace_cn/styles.css tests/js/case-story.test.js tests/e2e/case-story-smoke.js tests/interlock/test_visual_workspace_q3.py
git commit -m "refactor: retire the card-led case brief"
```

## Task 10: Complete responsive and visual verification

**Files:**
- Create: `tests/e2e/evidence-atlas-visual.js`
- Modify: `visual_workspace_cn/evidence-atlas.css`
- Modify: `visual_workspace_cn/evidence-atlas.js`

- [ ] **Step 1: Create the visual verification script**

Create `tests/e2e/evidence-atlas-visual.js`:

```javascript
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:8765';
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const out = path.resolve('artifacts/evidence-atlas');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${base}/visual_workspace_cn/index.html`, { waitUntil: 'networkidle' });
    await page.locator('#atlas-entry').click();
    await page.locator('.atlas-stage').waitFor();
    for (const id of ['atlas-universe', 'atlas-q3', 'atlas-q2', 'atlas-q1', 'atlas-igc', 'atlas-prevention']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const stage = await page.locator('.atlas-stage').boundingBox();
      const rail = await page.locator('.atlas-evidence-rail').boundingBox();
      assert.ok(stage && stage.width > viewport.width * 0.72);
      assert.ok(rail && rail.x + rail.width <= viewport.width + 1);
      await page.screenshot({ path: path.join(out, `${viewport.width}x${viewport.height}-${id}.png`), fullPage: false });
    }
    await page.close();
  }
  await browser.close();
  console.log('Evidence atlas visual verification passed at 1366, 1440, and 1920 widths.');
})().catch(error => { console.error(error); process.exit(1); });
```

- [ ] **Step 2: Run the complete automated suite**

```powershell
node --test tests/js/*.test.js
pytest tests/interlock -q
node tests/e2e/case-story-smoke.js
node tests/e2e/evidence-atlas-smoke.js
node tests/e2e/evidence-atlas-visual.js
```

Expected: all commands exit 0.

- [ ] **Step 3: Inspect every generated screenshot**

Open all 18 images in `artifacts/evidence-atlas/` and check:

- opening chat remains visually intact;
- graph density remains legible;
- selected points and evidence rails remain within bounds;
- almanac columns and feature rows align;
- Q2 duty strips, parallel sets, and 3D are readable;
- Q1 uses the only dark focus transition;
- radar ranges remain visible without implying exact scores;
- controls update graph and flows without card styling;
- no label collisions or excessive dark red;
- the page contains no retired contrast construction.

Apply targeted CSS or layout fixes, rerun the visual script, and re-inspect affected screenshots.

- [ ] **Step 4: Verify the four-minute narrative**

Starting from a fresh load, follow the scroll narrative without opening optional evidence chains. Confirm that Q3, Q2, Q1, IGC, and prevention can be understood in under four minutes. Then verify manual exploration still supports:

- any-message inspection;
- three chain choices at key points;
- manual time/role/channel re-layout;
- Q2 2D/3D switching;
- counterfactual control changes.

- [ ] **Step 5: Run final source audits**

```powershell
$sources = Get-Content -Raw -Encoding UTF8 visual_workspace_cn\index.html,visual_workspace_cn\app.js,visual_workspace_cn\evidence-atlas.js,visual_workspace_cn\case-story.js
if ($sources -match '\u4e0d\u662f.{0,40}\u800c\u662f') { throw 'Prohibited construction found' }
git diff --check
```

Expected: no output from `git diff --check` and no exception.

- [ ] **Step 6: Commit**

```powershell
git add visual_workspace_cn/evidence-atlas.js visual_workspace_cn/evidence-atlas.css tests/e2e/evidence-atlas-visual.js artifacts/evidence-atlas
git commit -m "test: verify continuous atlas across target viewports"
```
