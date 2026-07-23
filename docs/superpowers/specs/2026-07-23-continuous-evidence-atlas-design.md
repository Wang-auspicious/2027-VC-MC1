# VAST MC1 Continuous Evidence Atlas Design

Date: 2026-07-23
Status: user-approved design, pending written-spec review
Scope: Chinese review workspace first; English submission and video remain outside this implementation cycle unless separately authorized.

## 1. Product objective

The experience must answer the three official questions with a continuous, evidence-verifiable visual narrative. The competition data remains the center of the work. A broader Agent2Agent security concept appears only after the three answers have been established visually.

The primary success priorities are:

1. clarity of the Q3 → Q2 → Q1 analytical progression;
2. evidence traceability;
3. freedom to explore;
4. visual originality and refinement in service of the first three priorities.

The main narrative must take no more than four minutes to follow. Messages, candidate evidence chains, 3D structure, and counterfactual controls must provide at least ten minutes of optional exploration.

## 2. Hard visual and writing constraints

- Preserve the existing chat UI as the opening data context.
- Use a warm-white editorial background, charcoal typography, low-saturation role colors, and one restrained dark-red accent.
- Do not use KPI cards, card grids, pill-heavy controls, gradients, heavy shadows, or slogan-scale opening typography.
- Do not use simple flowcharts, decorative HTML circles and connectors, or schematic “cut path” demonstrations.
- Every major view must be a genuine data visualization driven by project data.
- Use the reference video's visual principles: dense small multiples, structural networks, parallel sets, almanac-like comparison, dark focus insets, and coordinated multi-view transitions.
- Preserve 3D. Its primary analytical purpose is the Q2 role–channel–identity cross-layer structure.
- The complete work must avoid the contrast construction explicitly prohibited by the user.
- Prose must be restrained, affirmative, evidence-led, and free from combative or promotional framing.

## 3. Experience architecture

The experience is one continuous scroll narrative without a fixed number of visibly boxed chapters.

### 3.1 Opening: existing chat UI

The current chat interface is retained as the opening screen. Reviewers can explore it freely and learn the data environment before encountering any analytical abstraction.

Scrolling downward leads naturally into the message graph. The opening chat is not repeatedly reopened later.

### 3.2 Shared message universe

Every message becomes a small point in a dense graph covering all dates and all messages. Three periods form visually legible high-density clusters:

- 2046-05-29 near-miss;
- 2046-06-04 controlled comparison;
- 2046-06-05 incident.

The default layout is temporal. During the narrative, the same message points reorganize into role, channel, identity, function, and evidence views.

### 3.3 Narrative order

The main analytical order is:

1. Q3: identify the warning and determine whether the system learned;
2. Q2: locate where governance carryover failed across roles, channels, and identities;
3. Q1: reconstruct the final reachable action path and its authorization evidence boundary;
4. derive Inter-Agent Governance Carryover;
5. test prevention controls with coordinated counterfactual views.

Official question labels remain visible so the reordered causal sequence does not obscure challenge coverage.

## 4. Core message graph

### 4.1 Nodes and color

- One point equals one message.
- Low-saturation node color consistently represents role.
- Restrained dark red identifies hazardous functions, selected incident paths, and control failures.
- Labels remain hidden in the resting state and appear only through hover, selection, or evidence-chain expansion.

### 4.2 Edge classes

All valid observed relationships and all declared analytical relationships are visualized with strict separation:

- observed reply, quotation, and conversation relationships use clear solid strokes;
- semantic similarity, shared-event, and shared-duty relationships use thinner, lighter analytical strokes;
- every analytical edge exposes its type, score or rule, and supporting message IDs.

Observed and inferred relationships must never share an indistinguishable visual treatment.

### 4.3 Layout transitions

The resting layout organizes messages by time. Scroll-driven narrative transitions reorganize the graph by role and channel. Manual view controls remain available for replay and exploration.

Transitions preserve object constancy:

- selected nodes keep their color and emphasis;
- layouts use stable seeds or deterministic targets;
- nodes move continuously instead of disappearing and being replaced;
- camera and scale changes preserve recognizable neighborhoods.

### 4.4 Message inspection

Clicking a point reveals:

- sender;
- timestamp;
- channel;
- complete English message text.

Clicking a key point also offers three evidence-chain candidates:

1. decision and authorization;
2. role, channel, and identity migration;
3. public action and subsequent confirmation.

After selection, the chosen chain appears vertically on the right. Key messages show their complete English text. Ordinary context messages show individually authored English summaries.

## 5. Complete message-summary contract

Every message in the graph receives an individually written static English summary.

Summary requirements:

- approximately 8–18 words;
- one natural, concrete sentence;
- state what the message does in context;
- avoid repeated templates, generic risk labels, and generated-at-runtime phrasing;
- retain a direct link to the source message ID;
- undergo manual review for meaning and evidence fidelity.

The application does not call an LLM at runtime. Summary coverage must be complete before the redesigned graph is considered deliverable.

## 6. Q3 design: did the system learn?

### 6.1 Historical event almanac

The shared message graph contracts into an almanac-like small-multiple comparison of all historical public events. Each event occupies a narrow aligned column and uses the same feature scales, including:

- time pressure;
- role combination;
- channel migration;
- authorization language;
- public-action behavior;
- declared similarity-model features.

The 2046-06-05 event remains the reference. The 2046-05-29 event emerges visually from comparison before its rank is stated in prose.

### 6.2 Pair comparison

Selecting the two events creates a high-transparency overlaid fingerprint. Exact differences remain readable through aligned feature scales and source messages. The overlay supports comparison and does not replace the underlying evidence.

### 6.3 Response and coverage

The May 29 message points expand to show:

- report;
- deletion;
- publication hold;
- risk escalation.

A control-coverage dot matrix then checks which roles, channels, identities, and publication capabilities were covered. Unobserved coverage remains visibly absent.

The supported conclusion is that May 29 supplied a strong warning and the subsequent controls left observable coverage gaps.

## 7. Q2 design: where did the lesson disappear?

### 7.1 Paired duty distributions

June 4 and June 5 appear as vertically aligned duty-distribution strips. The horizontal function axis contains:

- policy interpretation;
- authorization-evidence assertion;
- authorization;
- execution;
- post-hoc explanation.

Each mark remains an actual message point. June 4 distributes functions across Judge, Legal, and PR. June 5 visibly concentrates functions within Legal.

### 7.2 Parallel sets

The same messages transition into:

`role → channel → identity → action function`

Band width derives from observed messages and declared function coding. Role color remains stable. Dark red highlights flows that reach hazardous public-action functions.

### 7.3 3D cross-layer view

The primary 3D view represents role, channel, and identity as depth layers. Dense message points and relationships reveal cross-layer routes and local clusters.

- 2D remains the default precise reading surface.
- 3D is optional and shares all selections, filters, evidence chains, and time state.
- 3D does not carry small explanatory text.
- Understanding the result must not require camera rotation.

## 8. Q1 design: which final path remained reachable?

The hazardous public-result flow selected in Q2 enters a dark focus view inspired by the reference video.

### 8.1 Temporal action tracks

The horizontal axis uses absolute time. Six vertical behavior tracks contain:

1. policy interpretation;
2. authorization assertion;
3. GO instruction;
4. public execution;
5. public confirmation;
6. post-hoc documentation.

Relevant messages retain their node identity and observed connections.

### 8.2 Three evidence levels

Evidence encoding is consistent across the graph, parallel sets, focus view, and right-side chain:

1. directly observed facts: clear solid strokes and filled marks;
2. claims made in conversation without independent corroboration: lighter strokes and hollow marks;
3. expected evidence not observed in the dataset: negative space, interrupted scales, or explicit missing positions.

The view must not turn absent evidence into proof of falsity.

### 8.3 Supported conclusion

The public action path can be reconstructed. The authorization evidence cannot be fully and independently verified within the dataset. The analysis does not infer final individual intent or personal culpability.

## 9. IGC synthesis

Inter-Agent Governance Carryover is named only after Q3, Q2, and Q1 have been completed.

The preceding evidence maps into five dimensions:

- route closure;
- transfer coverage;
- constraint survival;
- provenance integrity;
- utility preservation.

An overlaid radar provides a compact synthesis of:

- May 29 response;
- June 4 controlled chain;
- June 5 incident.

The VAST logs support observational proxies rather than exact experimental IGC scores. The radar therefore displays ordinal ranges, evidence coverage, and uncertainty. Clicking any axis returns the reviewer to source messages and the supporting view.

## 10. Prevention simulator

The simulator tests four controls:

1. signed authorization artifact;
2. current reviewer acknowledgment;
3. authorization and execution separation;
4. cross-account and cross-channel capability gate.

Controls use restrained typographic selectors integrated with the visualization. They do not appear as cards or diagram nodes.

Changing a control recomputes:

- hazardous path reachability in the complete message graph;
- role/channel/identity/function flow in the parallel sets;
- the lightweight IGC five-dimension state.

The June 4 controlled chain supplies the legitimate-task counterfactual. A successful control configuration closes hazardous routes while retaining a valid official publication route.

Graph and parallel-sets views remain coordinated throughout the simulation.

## 11. State and data architecture

Every view reads from a shared ID-addressable data model with six layers:

1. source messages and metadata;
2. observed reply, quote, and conversation edges;
3. semantic, event, and duty analytical edges;
4. manually authored English summaries;
5. candidate evidence chains and evidence levels;
6. control rules, reachability results, and legitimate counterfactuals.

Shared interaction state includes:

- current time or narrative progress;
- selected message;
- selected event pair;
- active evidence chain;
- temporal/role/channel layout;
- 2D/3D mode;
- active prevention controls.

Dense graph rendering must use Canvas or WebGL. Views requiring precise axes, typography, and low mark counts must use SVG. The 3D view consumes the same nodes, edges, and shared state.

## 12. Error and ambiguity handling

- Missing source data remains missing.
- Unknown edge scores do not generate analytical edges.
- Invalid or unresolved message IDs fail validation before build.
- Empty evidence chains do not appear as selectable candidates.
- Unavailable 3D rendering falls back to the complete 2D view without losing selection state.
- Reduced-motion users receive deterministic direct transitions.
- Any inferred relationship reveals its analytical basis.
- Any IGC proxy with insufficient evidence displays uncertainty or “unobserved,” never a fabricated value.

## 13. Verification requirements

### 13.1 Data verification

- Every graph node resolves to one source message.
- Every observed edge resolves to valid source IDs.
- Every analytical edge has a declared method and strength.
- Every message has one manually reviewed English summary.
- Every candidate chain contains valid, ordered message IDs.
- Evidence levels are consistent across all coordinated views.

### 13.2 Analytical verification

- Q3 comparison reproduces the declared historical-event model and exclusions.
- Q2 functions reproduce the encoded June 4 and June 5 duty assignments.
- Q1 preserves the observed-action versus unverified-authorization boundary.
- Prevention controls close only the paths declared by their rule definitions.
- Legal official publication remains possible under a valid control configuration.

### 13.3 Interaction and visual verification

- Test 1366×768, 1440×900, and 1920×1080.
- Test all scroll transitions and manual replay controls.
- Verify point identity and selection persistence between views.
- Verify right-side evidence-chain readability and complete message access.
- Verify 2D/3D synchronization and 3D fallback.
- Check label collisions, accidental card styling, excess dark-red usage, and prohibited Chinese sentence construction.
- Verify the main narrative can be followed in four minutes.

## 14. Out of scope for this cycle

- Rewriting the final English submission.
- Re-recording or replacing the competition video.
- Claiming a validated universal IGC benchmark score from observational VAST logs.
- Adding unrelated dashboards or generic agent-security modules.
- Refactoring project components that do not affect this visual narrative.
