(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EvidenceAtlas = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  'use strict';

  let active = null;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const CHAPTERS = [
    {
      id: 'universe',
      kicker: 'MESSAGE UNIVERSE',
      title: '每个点都是一条消息',
      copy: '完整组织通信首先按时间展开。三个高密度时期会在同一片消息场中逐渐显现。',
      layout: 'time'
    },
    {
      id: 'q3',
      kicker: 'Q3 · EARLY WARNING',
      title: '预警曾经出现',
      copy: '5 月 29 日将从全部历史事件中被识别，并继续追踪当时的处置有没有留下持续约束。',
      layout: 'time'
    },
    {
      id: 'q2',
      kicker: 'Q2 · DUTY MIGRATION',
      title: '职责与频道开始迁移',
      copy: '相同消息点按角色和频道重新聚集，比较健康职责分离与事故中的职能集中。',
      layout: 'role'
    },
    {
      id: 'q1',
      kicker: 'Q1 · REACHABLE PATH',
      title: '公开路径仍然可达',
      copy: '最终行动按真实时间收束，同时区分直接事实、对话主张和数据中未观察到的证据。',
      layout: 'time'
    },
    {
      id: 'igc',
      kicker: 'INTER-AGENT GOVERNANCE CARRYOVER',
      title: '三问共同指向治理承接性',
      copy: '路径闭合、跨表面传递、时间存活、来源完整和合法效用将在此汇合。',
      layout: 'role'
    },
    {
      id: 'prevention',
      kicker: 'COUNTERFACTUAL PREVENTION',
      title: '控制措施如何改变未来路径',
      copy: '同一消息图谱和流向视图将检验危险路径关闭后，合法官方发布能否继续完成。',
      layout: 'channel'
    }
  ];

  function chapterMarkup(chapter, index) {
    return `<section class="atlas-chapter" id="atlas-${chapter.id}" data-chapter="${chapter.id}">
      <div class="atlas-chapter-copy">
        <span>${String(index + 1).padStart(2, '0')} · ${chapter.kicker}</span>
        <h2>${esc(chapter.title)}</h2>
        <p>${esc(chapter.copy)}</p>
      </div>
    </section>`;
  }

  function shellMarkup(atlas) {
    return `<article class="atlas-document">
      <header class="atlas-intro">
        <div>
          <span>VAST MC1 · CONTINUOUS EVIDENCE ATLAS</span>
          <h1>从 912 条消息中追踪一次治理约束如何失去承接</h1>
        </div>
        <p>同一批消息点将依次回答预警、职责迁移与最终路径。每个判断都可以回到英文原文。</p>
      </header>
      <div class="atlas-scrolly">
        <div class="atlas-stage" data-chapter="universe" data-layout="time" data-mode="2d">
          <header class="atlas-stage-head">
            <div>
              <span class="atlas-stage-kicker">MESSAGE UNIVERSE</span>
              <strong class="atlas-stage-title">全部通信 · 时间布局</strong>
            </div>
            <div class="atlas-layout-switch" aria-label="Message graph layout">
              <button type="button" data-atlas-layout="time" class="active">Time</button>
              <button type="button" data-atlas-layout="role">Role</button>
              <button type="button" data-atlas-layout="channel">Channel</button>
            </div>
            <span class="atlas-status">${atlas.nodes.length} messages · ${atlas.observedEdges.length} observed connections</span>
          </header>
          <div class="atlas-stage-body">
            <div class="atlas-visual">
              <canvas class="atlas-message-canvas" aria-label="Dense message relationship graph"></canvas>
              <svg class="atlas-svg-layer" aria-hidden="true"></svg>
              <div class="atlas-tooltip" hidden></div>
              <div class="atlas-view-caption">
                <span class="atlas-caption-index">01</span>
                <div><b>每个点都是一条消息</b><small>悬停查看摘要，点击核验英文原文。</small></div>
              </div>
            </div>
            <aside class="atlas-evidence-rail" aria-live="polite">
              <div class="atlas-rail-empty">
                <span>MESSAGE EVIDENCE</span>
                <p>选择任意消息点查看英文原文。关键节点还会提供三条候选证据链。</p>
              </div>
            </aside>
          </div>
          <footer class="atlas-stage-foot">
            <div class="atlas-legend">
              <span><i class="atlas-edge-sample observed"></i>Observed reply / reference</span>
              <span><i class="atlas-edge-sample analytical"></i>Analytical relation</span>
              <span><i class="atlas-node-sample"></i>Message</span>
              <span><i class="atlas-node-sample risk"></i>Selected hazardous path</span>
            </div>
            <span class="atlas-mode-note">Scroll continues the analysis · controls remain available for replay</span>
          </footer>
        </div>
        <div class="atlas-chapters">${CHAPTERS.map(chapterMarkup).join('')}</div>
      </div>
    </article>`;
  }

  function roleColor(node, declared) {
    return declared.ROLE_COLORS[node.role] || '#6f6b64';
  }

  function positionToScreen(position, width, height) {
    return {
      x: 30 + position.x * Math.max(1, width - 60),
      y: 26 + position.y * Math.max(1, height - 52)
    };
  }

  function resizeCanvas(state) {
    const rectangle = state.canvas.getBoundingClientRect();
    const ratio = root.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rectangle.width));
    const height = Math.max(1, Math.round(rectangle.height));
    if (state.canvas.width !== Math.round(width * ratio) || state.canvas.height !== Math.round(height * ratio)) {
      state.canvas.width = Math.round(width * ratio);
      state.canvas.height = Math.round(height * ratio);
    }
    state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height };
  }

  function activeChainIds(state) {
    return new Set(state.activeChain ? state.activeChain.ids : []);
  }

  function drawGraph(state) {
    state.frame = 0;
    const { width, height } = resizeCanvas(state);
    const context = state.context;
    const chainIds = activeChainIds(state);
    const selected = state.selectedId;
    context.clearRect(0, 0, width, height);
    context.fillStyle = state.chapter === 'q1' ? '#171917' : '#f7f5ef';
    context.fillRect(0, 0, width, height);

    let moving = false;
    for (const node of state.atlas.nodes) {
      const current = state.positions.get(node.id);
      const target = state.targetPositions.get(node.id);
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.0005) moving = true;
      current.x += dx * 0.11;
      current.y += dy * 0.11;
      const screen = positionToScreen(current, width, height);
      node.screenX = screen.x;
      node.screenY = screen.y;
    }

    const edgeLimit = state.atlas.edges.length;
    for (let index = 0; index < edgeLimit; index += 1) {
      const edge = state.atlas.edges[index];
      const source = state.atlas.nodesById.get(edge.source);
      const target = state.atlas.nodesById.get(edge.target);
      if (!source || !target) continue;
      const hot = chainIds.has(source.id) && chainIds.has(target.id);
      const selectedEdge = source.id === selected || target.id === selected;
      context.beginPath();
      context.moveTo(source.screenX, source.screenY);
      const midX = (source.screenX + target.screenX) / 2;
      const lift = Math.min(34, Math.abs(source.screenX - target.screenX) * 0.055);
      context.quadraticCurveTo(midX, (source.screenY + target.screenY) / 2 - lift, target.screenX, target.screenY);
      if (hot) {
        context.strokeStyle = '#9d382b';
        context.lineWidth = 1.45;
        context.globalAlpha = 0.88;
        context.setLineDash([]);
      } else if (edge.kind === 'observed') {
        context.strokeStyle = state.chapter === 'q1' ? '#c9cbc2' : '#605f59';
        context.lineWidth = selectedEdge ? 1.05 : 0.55;
        context.globalAlpha = selectedEdge ? 0.62 : 0.17;
        context.setLineDash([]);
      } else {
        context.strokeStyle = state.chapter === 'q1' ? '#8f958c' : '#7f857e';
        context.lineWidth = 0.45;
        context.globalAlpha = selectedEdge ? 0.48 : 0.10 + edge.strength * 0.08;
        context.setLineDash([1.5, 2.8]);
      }
      context.stroke();
    }
    context.setLineDash([]);
    context.globalAlpha = 1;

    for (const node of state.atlas.nodes) {
      const isSelected = node.id === selected;
      const isHover = node.id === state.hoveredId;
      const inChain = chainIds.has(node.id);
      const isKey = node.window !== 'background';
      const color = inChain ? '#a33c2e' : roleColor(node, state.declared);
      const radius = isSelected ? 4.8 : inChain ? 3.7 : isHover ? 3.4 : isKey ? 2.65 : 1.8;
      context.globalAlpha = isSelected || inChain ? 1 : isKey ? 0.86 : 0.56;
      context.beginPath();
      context.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      if (isSelected) {
        context.beginPath();
        context.arc(node.screenX, node.screenY, radius + 5.5, 0, Math.PI * 2);
        context.strokeStyle = state.chapter === 'q1' ? '#f3d9d1' : '#953829';
        context.lineWidth = 1.2;
        context.globalAlpha = 0.74;
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    state.viewport = { width, height };
    if (moving) scheduleDraw(state);
  }

  function scheduleDraw(state) {
    if (!state.frame) state.frame = requestAnimationFrame(() => drawGraph(state));
  }

  function hitTest(state, x, y) {
    let best = null;
    let distance = 14;
    for (const node of state.atlas.nodes) {
      const candidate = Math.hypot(node.screenX - x, node.screenY - y);
      if (candidate < distance) {
        best = node;
        distance = candidate;
      }
    }
    return best;
  }

  function roleLabel(role) {
    return String(role || '').replace(/-Agent$/, '').replaceAll('-', ' ');
  }

  function channelLabel(channel) {
    return String(channel || '').replaceAll('_', ' ');
  }

  function messageMarkup(node) {
    return `<article class="atlas-message-detail" data-evidence-level="${esc(node.evidenceLevel)}">
      <span class="atlas-detail-kicker">${esc(roleLabel(node.role))} · ${esc(channelLabel(node.channel))}</span>
      <time>${esc(node.timestamp.replace('T', ' ').slice(0, 16))}</time>
      <p>${esc(node.content)}</p>
      <code>${esc(node.id)}</code>
    </article>`;
  }

  const Q3_ANCHOR_ID = '20460605_21_026';
  const Q3_WARNING_ID = '20460529_08_012';
  const Q3_FEATURES = [
    ['sensitive_entity_present', 'Sensitive entity'],
    ['content_strength', 'Content strength'],
    ['surface', 'Public surface'],
    ['publisher_function', 'Publisher function'],
    ['independent_approval_present', 'Independent approval'],
    ['current_review_present', 'Current review'],
    ['external_engagement_present', 'External engagement'],
    ['deleted', 'Deleted'],
    ['posting_paused', 'Posting paused'],
    ['persistent_control_created', 'Persistent control']
  ];

  function q3FeatureValue(vector, name) {
    if (name === 'content_strength') return ({ generic: 0.08, hint: 0.55, explicit: 1 })[vector[name]] ?? 0;
    if (name === 'surface') return ({ official: 0.18, personal: 0.68, anonymous: 1 })[vector[name]] ?? 0;
    if (name === 'publisher_function') return ({ pr: 0.2, social_media: 0.55, legal: 0.85 })[vector[name]] ?? 0.42;
    return vector[name] === true ? 1 : vector[name] === false ? 0 : 0.45;
  }

  function polygonPath(profile, centerX = 90, centerY = 84, radius = 56) {
    const values = Object.values(profile);
    const points = values.map((value, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length;
      return `${(centerX + Math.cos(angle) * radius * value).toFixed(1)},${(centerY + Math.sin(angle) * radius * value).toFixed(1)}`;
    });
    return `M${points.join('L')}Z`;
  }

  function fingerprintMarkup(state, selected) {
    const anchor = state.q3Model.byId(state.q3Vectors, Q3_ANCHOR_ID);
    const anchorProfile = state.q3Model.riskProfile(anchor);
    const selectedProfile = state.q3Model.riskProfile(selected);
    const labels = ['Entity', 'Explicit', 'Surface', 'Approval gap', 'Review gap', 'Control gap'];
    const axes = labels.map((label, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length;
      const x = 90 + Math.cos(angle) * 65;
      const y = 84 + Math.sin(angle) * 65;
      const tx = 90 + Math.cos(angle) * 75;
      const ty = 84 + Math.sin(angle) * 75;
      return `<line x1="90" y1="84" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${label}</text>`;
    }).join('');
    return `<svg class="atlas-fingerprint" viewBox="0 0 180 172" role="img" aria-label="Overlay fingerprint comparing the selected event with June 5">
      <g class="atlas-fingerprint-grid">${axes}<circle cx="90" cy="84" r="28"></circle><circle cx="90" cy="84" r="56"></circle></g>
      <path class="atlas-fingerprint-anchor" d="${polygonPath(anchorProfile)}"></path>
      <path class="atlas-fingerprint-selected" d="${polygonPath(selectedProfile)}"></path>
    </svg>`;
  }

  function coverageMatrixMarkup(state, vector) {
    const response = state.q3Model.responseState(vector);
    const observed = value => value === true ? 'filled' : value === false ? 'observed-zero' : 'unknown';
    const rows = [
      ['Role', [true, null, response.posting_paused, vector.independent_approval_present, null]],
      ['Channel', [true, response.deleted, response.posting_paused, null, vector.persistent_control_created]],
      ['Identity', [true, response.deleted, null, vector.independent_approval_present, null]],
      ['Publication capability', [true, response.deleted, response.posting_paused, null, vector.persistent_control_created]]
    ];
    const columns = ['Reported', 'Deleted', 'Paused', 'Authorization artifact', 'Cross-surface gate'];
    return `<div class="atlas-coverage" role="table" aria-label="Observed response coverage">
      <div class="atlas-coverage-row atlas-coverage-head" role="row"><b></b>${columns.map(column => `<span title="${esc(column)}">${esc(column)}</span>`).join('')}</div>
      ${rows.map(([label, values]) => `<div class="atlas-coverage-row" role="row"><b>${esc(label)}</b>${values.map(value => {
        const status = observed(value);
        const title = status === 'unknown' ? 'unobserved' : status === 'filled' ? 'observed present' : 'observed absent';
        return `<i class="${status}" title="${title}" aria-label="${title}"></i>`;
      }).join('')}</div>`).join('')}
    </div>`;
  }

  function renderQ3Rail(state, eventId) {
    const selected = state.q3Model.byId(state.q3Vectors, eventId);
    const comparison = state.q3Model.compareVectors(state.q3Model.byId(state.q3Vectors, Q3_ANCHOR_ID), selected);
    const priorRank = state.q3Model.rankAgainst(state.q3Vectors, Q3_ANCHOR_ID, { priorOnly: true })
      .findIndex(item => item.event_id === eventId) + 1;
    state.q3SelectedId = eventId;
    state.rail.innerHTML = `<header class="atlas-q3-rail-head">
      <span>EVENT FINGERPRINT · ${esc(selected.timestamp.slice(0, 10))}</span>
      <b>${(comparison.similarity * 100).toFixed(4)}%</b>
      <small>${priorRank > 0 ? `#${priorRank} prior analogue` : 'selected comparison'} · June 5 reference held fixed</small>
    </header>
    ${fingerprintMarkup(state, selected)}
    <div class="atlas-fingerprint-key"><span class="anchor">June 5 incident</span><span class="selected">Selected event</span></div>
    <p class="atlas-q3-conclusion">May 29 already carried the same exposed surface, sensitive entity signal, approval gap and review gap. Its post was removed; the publication route remained available.</p>
    <section class="atlas-coverage-wrap">
      <header><span>RESPONSE COVERAGE</span><small>Empty marks stay unobserved</small></header>
      ${coverageMatrixMarkup(state, selected)}
    </section>`;
  }

  function renderQ3Almanac(state) {
    if (!state.q3Vectors?.length || !state.q3Model) return;
    const width = 1000;
    const left = 144;
    const right = 24;
    const top = 52;
    const rowGap = 43;
    const plotWidth = width - left - right;
    const ranked = new Map(state.q3Model.rankAgainst(state.q3Vectors, Q3_ANCHOR_ID).map((item, index) => [item.event_id, { rank: index + 1, similarity: item.similarity }]));
    const columns = state.q3Vectors.map((vector, index) => {
      const x = left + index * plotWidth / Math.max(1, state.q3Vectors.length - 1);
      const values = Q3_FEATURES.map(([name], row) => {
        const value = q3FeatureValue(vector, name);
        const y = top + row * rowGap;
        return `<circle cx="${x.toFixed(2)}" cy="${y}" r="${(1.8 + value * 2.5).toFixed(2)}" opacity="${(0.18 + value * 0.76).toFixed(2)}"></circle>`;
      }).join('');
      const rankedItem = ranked.get(vector.event_id);
      const classes = [
        vector.event_id === Q3_ANCHOR_ID ? 'reference' : '',
        vector.event_id === state.q3SelectedId ? 'selected' : '',
        vector.event_id === Q3_WARNING_ID ? 'warning' : ''
      ].filter(Boolean).join(' ');
      return `<g class="atlas-event-column ${classes}" data-event-id="${esc(vector.event_id)}" tabindex="0" role="button" aria-label="${esc(vector.timestamp.slice(0, 10))}, ${rankedItem ? `${(rankedItem.similarity * 100).toFixed(1)} percent similar` : 'reference event'}">
        <line x1="${x.toFixed(2)}" y1="${top - 12}" x2="${x.toFixed(2)}" y2="${top + (Q3_FEATURES.length - 1) * rowGap + 14}"></line>
        ${values}
      </g>`;
    }).join('');
    const labels = Q3_FEATURES.map(([, label], row) => `<text class="atlas-almanac-label" x="${left - 14}" y="${top + row * rowGap + 3}" text-anchor="end">${esc(label)}</text>`).join('');
    const dateTicks = state.q3Vectors
      .map((vector, index) => ({ vector, index }))
      .filter(({ vector }, index, items) => index === 0 || vector.timestamp.slice(0, 10) !== items[index - 1].vector.timestamp.slice(0, 10))
      .map(({ vector, index }) => {
        const x = left + index * plotWidth / Math.max(1, state.q3Vectors.length - 1);
        return `<text class="atlas-almanac-date" x="${x.toFixed(2)}" y="22" transform="rotate(-35 ${x.toFixed(2)} 22)">${esc(vector.timestamp.slice(5, 10))}</text>`;
      }).join('');
    state.svg.setAttribute('viewBox', `0 0 ${width} ${top + Q3_FEATURES.length * rowGap + 30}`);
    state.svg.setAttribute('role', 'img');
    state.svg.setAttribute('aria-label', 'All 77 observed public events aligned by ten shared features');
    state.svg.innerHTML = `<g class="atlas-event-almanac">${dateTicks}${labels}${columns}</g>`;
    $$('.atlas-event-column', state.svg).forEach(column => {
      const choose = () => {
        $$('.atlas-event-column', state.svg).forEach(item => item.classList.toggle('selected', item === column));
        renderQ3Rail(state, column.dataset.eventId);
        if (state.atlas.nodesById.has(column.dataset.eventId)) selectMessage(state, column.dataset.eventId, true, false);
      };
      column.addEventListener('click', choose, { signal: state.abort.signal });
      column.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') choose();
      }, { signal: state.abort.signal });
    });
    renderQ3Rail(state, state.q3SelectedId || Q3_WARNING_ID);
  }

  function clearChapterOverlay(state) {
    state.svg.replaceChildren();
    state.svg.removeAttribute('viewBox');
    state.svg.removeAttribute('role');
    state.svg.removeAttribute('aria-label');
  }

  function renderEvidenceChain(state, chain) {
    state.activeChain = chain;
    const keyIds = new Set(Object.values(state.declared.KEY_WINDOWS).flatMap(window => window.ids));
    state.rail.innerHTML = `<header class="atlas-rail-head">
      <span>${esc(chain.title)}</span>
      <button type="button" data-close-chain aria-label="Close evidence chain">×</button>
    </header>
    <div class="atlas-chain-list">${chain.ids.map((id, index) => {
      const node = state.atlas.nodesById.get(id);
      if (!node) return '';
      const body = keyIds.has(id)
        ? `<p>${esc(node.content)}</p>`
        : `<p class="atlas-context-summary">${esc(node.summary)}</p>`;
      return `<article class="atlas-chain-item" data-chain-message="${esc(id)}" data-evidence-level="${esc(node.evidenceLevel)}">
        <span class="atlas-chain-index">${String(index + 1).padStart(2, '0')}</span>
        <div><b>${esc(roleLabel(node.role))}</b><time>${esc(node.timestamp.slice(11, 16))} · ${esc(channelLabel(node.channel))}</time>${body}<code>${esc(id)}</code></div>
      </article>`;
    }).join('')}</div>`;
    $('[data-close-chain]', state.rail).addEventListener('click', () => {
      state.activeChain = null;
      renderSelection(state);
      scheduleDraw(state);
    });
    $$('[data-chain-message]', state.rail).forEach(item => item.addEventListener('click', () => {
      selectMessage(state, item.dataset.chainMessage, false);
    }));
    scheduleDraw(state);
  }

  function renderSelection(state) {
    const node = state.atlas.nodesById.get(state.selectedId);
    if (!node) {
      state.rail.innerHTML = `<div class="atlas-rail-empty"><span>MESSAGE EVIDENCE</span><p>选择任意消息点查看英文原文。关键节点还会提供三条候选证据链。</p></div>`;
      return;
    }
    const chains = root.EvidenceAtlasModel.chainsFor(node.id, state.declared);
    state.rail.innerHTML = `${messageMarkup(node)}
      ${chains.length ? `<div class="atlas-chain-chooser"><span>AVAILABLE EVIDENCE CHAINS</span>${chains.map(chain =>
        `<button type="button" data-chain-id="${esc(chain.id)}"><b>${esc(chain.title)}</b><small>${chain.ids.length} messages</small></button>`
      ).join('')}</div>` : `<p class="atlas-no-chain">No declared evidence chain begins at this message. Its observed and analytical neighbors remain visible in the graph.</p>`}`;
    $$('[data-chain-id]', state.rail).forEach(button => button.addEventListener('click', () => {
      const chain = chains.find(item => item.id === button.dataset.chainId);
      if (chain) renderEvidenceChain(state, chain);
    }));
  }

  function selectMessage(state, id, notifyWorkspace = true, renderRail = true) {
    if (!state.atlas.nodesById.has(id)) throw new Error(`Unknown atlas message: ${id}`);
    state.selectedId = id;
    state.activeChain = null;
    if (renderRail) renderSelection(state);
    scheduleDraw(state);
    if (notifyWorkspace && root.WorkspaceBridge) root.WorkspaceBridge.selectMessage(id);
  }

  function setLayout(state, mode) {
    const target = root.EvidenceAtlasModel.layout(state.atlas.nodes, mode);
    state.layout = mode;
    state.targetPositions = new Map(Object.entries(target).map(([id, point]) => [id, { ...point }]));
    state.stage.dataset.layout = mode;
    $$('[data-atlas-layout]', state.host).forEach(button => button.classList.toggle('active', button.dataset.atlasLayout === mode));
    const labels = { time: '全部通信 · 时间布局', role: '全部通信 · 角色聚类', channel: '全部通信 · 频道聚类' };
    state.stageTitle.textContent = labels[mode];
    scheduleDraw(state);
  }

  function setChapter(state, id) {
    const chapter = CHAPTERS.find(item => item.id === id);
    if (!chapter || state.chapter === id) return;
    state.chapter = id;
    state.stage.dataset.chapter = id;
    state.stageKicker.textContent = chapter.kicker;
    state.captionIndex.textContent = String(CHAPTERS.indexOf(chapter) + 1).padStart(2, '0');
    state.captionTitle.textContent = chapter.title;
    state.captionCopy.textContent = chapter.copy;
    $$('.atlas-chapter', state.host).forEach(section => section.classList.toggle('active', section.dataset.chapter === id));
    setLayout(state, chapter.layout);
    if (id === 'q3') {
      state.stageTitle.textContent = '77 个公开事件 · 共同特征历书';
      renderQ3Almanac(state);
    } else {
      clearChapterOverlay(state);
    }
  }

  function pointerCoordinates(canvas, event) {
    const rectangle = canvas.getBoundingClientRect();
    return { x: event.clientX - rectangle.left, y: event.clientY - rectangle.top };
  }

  function bindInteractions(state) {
    $$('[data-atlas-layout]', state.host).forEach(button => button.addEventListener('click', () => setLayout(state, button.dataset.atlasLayout), { signal: state.abort.signal }));
    state.canvas.addEventListener('pointermove', event => {
      const point = pointerCoordinates(state.canvas, event);
      const node = hitTest(state, point.x, point.y);
      const id = node ? node.id : '';
      if (id !== state.hoveredId) {
        state.hoveredId = id;
        scheduleDraw(state);
      }
      if (!node) {
        state.tooltip.hidden = true;
        return;
      }
      state.tooltip.hidden = false;
      state.tooltip.style.left = `${Math.min(state.viewport.width - 270, node.screenX + 12)}px`;
      state.tooltip.style.top = `${Math.max(8, node.screenY - 18)}px`;
      state.tooltip.innerHTML = `<b>${esc(roleLabel(node.role))}</b><span>${esc(node.timestamp.slice(0, 16).replace('T', ' '))} · ${esc(channelLabel(node.channel))}</span><p>${esc(node.summary)}</p>`;
    }, { signal: state.abort.signal });
    state.canvas.addEventListener('pointerleave', () => {
      state.hoveredId = '';
      state.tooltip.hidden = true;
      scheduleDraw(state);
    }, { signal: state.abort.signal });
    state.canvas.addEventListener('click', event => {
      const point = pointerCoordinates(state.canvas, event);
      const node = hitTest(state, point.x, point.y);
      if (node) selectMessage(state, node.id);
    }, { signal: state.abort.signal });

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible) setChapter(state, visible.target.dataset.chapter);
    }, { threshold: [0.35, 0.55, 0.75] });
    $$('.atlas-chapter', state.host).forEach(section => observer.observe(section));
    state.observer = observer;

    root.addEventListener('resize', () => scheduleDraw(state), { signal: state.abort.signal });
    root.addEventListener('workspace:message-selected', event => {
      const id = event.detail?.id;
      if (id && state.atlas.nodesById.has(id) && id !== state.selectedId) selectMessage(state, id, false);
    }, { signal: state.abort.signal });
  }

  function mount(host, options = {}) {
    destroy();
    if (!host) throw new Error('Evidence atlas host is required');
    if (!options.atlas || !options.declared) throw new Error('Evidence atlas model and declarations are required');
    const abort = new AbortController();
    host.innerHTML = shellMarkup(options.atlas);
    const initial = root.EvidenceAtlasModel.layout(options.atlas.nodes, 'time');
    const state = {
      host,
      abort,
      atlas: options.atlas,
      declared: options.declared,
      chapter: 'universe',
      layout: 'time',
      selectedId: '',
      activeChain: null,
      hoveredId: '',
      q3Vectors: options.q3Vectors || [],
      q3Model: options.q3Model,
      q3SelectedId: Q3_WARNING_ID,
      positions: new Map(Object.entries(initial).map(([id, point]) => [id, { ...point }])),
      targetPositions: new Map(Object.entries(initial).map(([id, point]) => [id, { ...point }])),
      frame: 0,
      viewport: { width: 1, height: 1 }
    };
    state.stage = $('.atlas-stage', host);
    state.canvas = $('.atlas-message-canvas', host);
    state.context = state.canvas.getContext('2d');
    state.svg = $('.atlas-svg-layer', host);
    state.tooltip = $('.atlas-tooltip', host);
    state.rail = $('.atlas-evidence-rail', host);
    state.stageKicker = $('.atlas-stage-kicker', host);
    state.stageTitle = $('.atlas-stage-title', host);
    state.captionIndex = $('.atlas-caption-index', host);
    state.captionTitle = $('.atlas-view-caption b', host);
    state.captionCopy = $('.atlas-view-caption small', host);
    active = state;
    bindInteractions(state);
    scheduleDraw(state);
    return state;
  }

  function destroy() {
    if (!active) return;
    active.abort.abort();
    active.observer?.disconnect();
    if (active.frame) cancelAnimationFrame(active.frame);
    active.host.replaceChildren();
    active = null;
  }

  const api = {
    mount,
    destroy,
    selectMessage(id) {
      if (!active) throw new Error('Evidence atlas is not mounted');
      selectMessage(active, id);
    },
    setLayout(mode) {
      if (!active) throw new Error('Evidence atlas is not mounted');
      setLayout(active, mode);
    },
    setChapter(id) {
      if (!active) throw new Error('Evidence atlas is not mounted');
      setChapter(active, id);
    },
    setControls(ids) {
      if (!active) throw new Error('Evidence atlas is not mounted');
      active.controls = new Set(ids || []);
    }
  };

  if (root && root.document) {
    const start = () => {
      const host = root.document.querySelector('#evidence-atlas');
      if (!host || !root.INTERLOCK_DATA || !root.INTERLOCK_EN || !root.MessageSummaries || !root.EvidenceAtlasData || !root.EvidenceAtlasModel) return;
      const atlas = root.EvidenceAtlasModel.buildAtlas(
        root.INTERLOCK_DATA,
        root.INTERLOCK_EN,
        root.MessageSummaries.SUMMARIES,
        root.EvidenceAtlasData
      );
      mount(host, {
        atlas,
        declared: root.EvidenceAtlasData,
        q3Vectors: root.INTERLOCK_DATA.incident_vectors,
        q3Model: root.Q3Model
      });
      root.document.querySelector('#atlas-entry')?.addEventListener('click', () => {
        host.scrollIntoView({ behavior: 'smooth' });
      });
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  return api;
});
