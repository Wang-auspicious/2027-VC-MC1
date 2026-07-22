# MC1 Case Story Reframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic workspace dashboard with a five-act evidence story that routes directly into the existing Q1/Q2/Q3 interactive analyses.

**Architecture:** Add a self-contained `CaseStory` browser module for the landing-page content and interactions. Keep `app.js` as the router, and make only targeted narrative-copy changes to the existing evidence and Q3 graph modules.

**Tech Stack:** Vanilla JavaScript, HTML templates, CSS, Node test runner, pytest static contracts, Playwright browser verification.

---

### Task 1: Story model and landing lifecycle

**Files:**
- Create: `visual_workspace_cn/case-story.js`
- Create: `visual_workspace_cn/case-story.css`
- Create: `tests/js/case-story.test.js`

- [ ] Write a failing Node test requiring five ordered acts, two bounded verdicts, three chapters, and referenced evidence IDs.
- [ ] Run `node --test tests/js/case-story.test.js` and confirm the module-missing failure.
- [ ] Implement a UMD `CaseStory` module exporting `STORY`, `validateStory`, `mount`, and `destroy`.
- [ ] Render the core question, dual verdict, five-act rail, chapter launchers, and counterfactual closure.
- [ ] Run the Node test and confirm it passes.

### Task 2: Workspace routing and story mode

**Files:**
- Modify: `visual_workspace_cn/index.html`
- Modify: `visual_workspace_cn/app.js`
- Modify: `tests/interlock/test_visual_workspace_q3.py`

- [ ] Extend the static test to require story assets, story mode, the three chapter routes, and the new chapter labels.
- [ ] Run the static test and confirm it fails on missing integration.
- [ ] Load `case-story.css` and `case-story.js` before `app.js`.
- [ ] Rename dashboard to “案件简报”; replace `renderDashboard` with `CaseStory.mount` and callback routing for Q1/Q2/Q3 and acts.
- [ ] Toggle `story-mode` only for the dashboard and destroy the story module on other views.
- [ ] Run the static test and JavaScript syntax checks.

### Task 3: Narrative alignment inside Q1/Q2/Q3

**Files:**
- Modify: `visual_workspace_cn/app.js`
- Modify: `visual_workspace_cn/q3-warning-graph.js`
- Modify: `visual_workspace_cn/q3-warning-graph.css`

- [ ] Change evidence question labels to “边界如何被跨过 / 职责何时开始重叠 / 预警为何没有留下约束”.
- [ ] Add act context to evidence-graph headings without changing node, edge, or 3D behavior.
- [ ] Reframe Q3 title and subchart descriptions as “像在哪里 / 何时出现 / 为什么没有留下约束”.
- [ ] Run model, static, and syntax tests.

### Task 4: Browser behavior and visual verification

**Files:**
- Create: `tests/e2e/case-story-smoke.js`
- Create: `tests/e2e/case-story-visual.js`

- [ ] Write a Playwright smoke test for five acts, dual verdict, Q1/Q2/Q3 routing, 2D/3D preservation, and the 77-event Q3 view.
- [ ] Run the smoke test against the pre-implementation page and confirm the expected selector failure.
- [ ] Run it after implementation and confirm all routes pass without console errors.
- [ ] Capture 1366×768, 1440×900, and 1920×1080 screenshots and assert no horizontal overflow.
- [ ] Visually inspect the 1440×900 story landing and one linked evidence page.

### Task 5: Full regression

**Files:**
- No production changes expected.

- [ ] Run `node --test tests/js/model.test.js tests/js/q3-model.test.js tests/js/case-story.test.js`.
- [ ] Run `python -m pytest tests/interlock -q --basetemp .pytest-story-final-20260722-1`.
- [ ] Run the existing Q3 smoke and visual matrix.
- [ ] Run the new story smoke and visual matrix.
- [ ] Commit only the story-related source, tests, specification, and plan.

