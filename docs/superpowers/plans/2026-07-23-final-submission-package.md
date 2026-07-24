# VAST MC1 Final Submission Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the English interactive application, report, walkthrough video, answer files, and final ZIP from the approved continuous evidence atlas.

**Architecture:** Generate an offline English atlas from the reviewed source, capture its canonical views, assemble an official-structure HTML report, record deterministic interaction segments with synchronized narration, and package only verified artifacts.

**Tech Stack:** Static HTML/CSS/JavaScript, Python, Node.js, Playwright, PowerShell, System.Speech, FFmpeg, pytest.

---

### Task 1: English application

**Files:**
- Create: `build_final_submission.py`
- Generate: `submission_final/app/**`
- Test: `tests/interlock/test_final_package.py`

- [ ] Add a deterministic copy-and-translation build with a fail-closed scan for untranslated interface text.
- [ ] Copy the English source-message dataset and rewrite all local asset paths.
- [ ] Assert the chat entry, 912 messages, Q3, Q2, Q1, 3D, IGC, and prevention modules are present.
- [ ] Run the static and JavaScript test suites.

### Task 2: Report and figures

**Files:**
- Generate: `submission_final/index.htm`
- Generate: `submission_final/answers.md`
- Generate: `submission_final/figures/*.png`

- [ ] Capture five canonical English atlas states at 1440×900.
- [ ] Build the official answer-sheet front matter and the Q1/Q2/Q3 evidence narrative.
- [ ] Keep IGC and prevention after the challenge answers.
- [ ] Verify report rendering, relative links, image dimensions, and evidence IDs.

### Task 3: Walkthrough video

**Files:**
- Create: `scripts/record_atlas_walkthrough.js`
- Generate: `submission_final/video-script.md`
- Generate: `submission_final/video/walkthrough.mp4`

- [ ] Write six concise evidence-bounded narration segments.
- [ ] Record deterministic interactions from the English application.
- [ ] Synthesize narration and assemble H.264/AAC video.
- [ ] Verify duration is below 240 seconds and inspect representative frames.

### Task 4: Final package

**Files:**
- Generate: `deliverables/ZJGSU-Zhao-MC1/**`
- Generate: `deliverables/ZJGSU-Zhao-MC1.zip`

- [ ] Rebuild the package from `submission_final`.
- [ ] Extract into a temporary verification directory and validate all relative links.
- [ ] Run app smoke checks against the extracted copy.
- [ ] Verify size, contents, video metadata, report language, and required files.
- [ ] Commit and push the final material with explicit paths only.
