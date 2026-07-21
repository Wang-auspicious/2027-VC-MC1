(function(root) {
  'use strict';

  const MODEL = root.Q3Model;
  const DEFAULT_A = '20460605_21_026';
  const DEFAULT_B = '20460529_08_012';
  const SURFACE = {
    official: { label: '官方', color: '#858a82' },
    personal: { label: '个人', color: '#b18455' },
    anonymous: { label: '匿名', color: '#a65d50' }
  };
  const RADAR_AXES = [
    ['敏感实体', 'sensitive_entity'], ['内容显性', 'content_explicitness'],
    ['渠道暴露', 'channel_exposure'], ['授权缺口', 'approval_gap'],
    ['复核缺口', 'review_gap'], ['持久控制缺口', 'persistent_control_gap']
  ];
  let active = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const shortDate = timestamp => timestamp.slice(5, 10).replace('-', '.');
  const shortTime = timestamp => `${shortDate(timestamp)} ${timestamp.slice(11, 16)}`;
  const truncate = (text, max = 90) => text.length > max ? `${text.slice(0, max).trim()}…` : text;
  const polar = (cx, cy, radius, angle) => [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  const points = list => list.map(point => point.map(v => Number(v.toFixed(1))).join(',')).join(' ');

  function byId(state, id) {
    return state.vectorMap.get(id);
  }

  function deterministicLayout(vectors, edges) {
    const centers = {
      official: [-0.42, -0.02], personal: [0.28, -0.16], anonymous: [0.18, 0.43]
    };
    const grouped = { official: [], personal: [], anonymous: [] };
    vectors.forEach(vector => (grouped[vector.surface] || grouped.official).push(vector));
    const nodes = [];
    Object.entries(grouped).forEach(([surface, group]) => {
      const center = centers[surface];
      group.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.event_id.localeCompare(b.event_id));
      group.forEach((vector, index) => {
        const theta = index * 2.399963 + (surface === 'official' ? .2 : surface === 'personal' ? 1.7 : 3.1);
        const radius = .045 + Math.sqrt(index + 1) * .041;
        nodes.push({
          ...vector,
          x: center[0] + Math.cos(theta) * radius,
          y: center[1] + Math.sin(theta) * radius,
          z: (MODEL.riskProfile(vector).channel_exposure - .5) * .7 + ((index % 7) - 3) * .025,
          vx: 0,
          vy: 0
        });
      });
    });
    const map = new Map(nodes.map(node => [node.event_id, node]));
    for (let iteration = 0; iteration < 115; iteration += 1) {
      const cooling = (1 - iteration / 115) * .008;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const left = nodes[i], right = nodes[j];
          let dx = left.x - right.x, dy = left.y - right.y;
          const d2 = dx * dx + dy * dy + .0008;
          const force = .000035 / d2;
          left.vx += dx * force; left.vy += dy * force;
          right.vx -= dx * force; right.vy -= dy * force;
        }
      }
      edges.forEach(edge => {
        const left = map.get(edge.source), right = map.get(edge.target);
        const dx = right.x - left.x, dy = right.y - left.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || .01;
        const target = .075 + (1 - edge.similarity) * .22;
        const force = (distance - target) * .014 * edge.similarity;
        left.vx += dx / distance * force; left.vy += dy / distance * force;
        right.vx -= dx / distance * force; right.vy -= dy / distance * force;
      });
      nodes.forEach(node => {
        const center = centers[node.surface] || [0, 0];
        node.vx += (center[0] - node.x) * .002;
        node.vy += (center[1] - node.y) * .002;
        node.x += node.vx + cooling * Math.sin(iteration + node.timestamp.length);
        node.y += node.vy;
        node.vx *= .72; node.vy *= .72;
      });
    }
    const extent = Math.max(...nodes.flatMap(node => [Math.abs(node.x), Math.abs(node.y)]), .7);
    nodes.forEach(node => { node.x /= extent * 1.08; node.y /= extent * 1.08; });
    return nodes;
  }

  function graphMarkup() {
    return `<section class="q3-shell" aria-label="Q3 行为先兆图谱">
      <header class="q3-head">
        <div class="q3-heading">
          <span class="q3-kicker">Q3 · BEHAVIORAL PRECURSORS</span>
          <h2>行为先兆图谱</h2>
          <p>从 77 个已观测公开事件中寻找结构相似的历史先例，并检验当时的处置是否形成持久控制。</p>
        </div>
        <div class="q3-head-actions">
          <span class="q3-mode-switch" role="group" aria-label="图谱投影">
            <button type="button" data-q3-mode="2d" class="active">2D</button>
            <button type="button" data-q3-mode="3d">3D</button>
          </span>
          <button type="button" class="q3-exit">返回协作证据图谱</button>
        </div>
      </header>
      <div class="q3-workbench">
        <section class="q3-network-panel">
          <div class="q3-panel-title">
            <div><b>事件行为相似网络</b><span>77 EVENTS · TOP-3 LOCAL LINKS</span></div>
            <div class="q3-legend">
              <i class="official"></i>官方 <i class="personal"></i>个人 <i class="anonymous"></i>匿名
            </div>
          </div>
          <div class="q3-network-wrap">
            <canvas class="q3-network"></canvas>
            <div class="q3-network-labels" aria-hidden="true"></div>
            <article class="q3-tooltip" hidden></article>
            <div class="q3-network-help"><span>点击任意节点设为 B</span><span>拖动 · 缩放 · 悬停查看</span></div>
          </div>
          <div class="q3-pair-strip">
            <article class="q3-pair q3-pair-a"></article>
            <div class="q3-score"><b>—</b><span>行为相似度</span><small>不是因果关系</small></div>
            <article class="q3-pair q3-pair-b"></article>
            <button type="button" class="q3-anchor-button">将 B 设为锚点 A</button>
          </div>
        </section>
        <aside class="q3-insights">
          <section class="q3-chart-card q3-radar-card">
            <header><div><b>行为轮廓重叠</b><span>六维解释量 · 归一化 0–1</span></div><strong class="q3-radar-score">—</strong></header>
            <div class="q3-radar"></div>
          </section>
          <section class="q3-chart-card q3-time-card">
            <header><div><b>历史相似度坐标</b><span>横轴是真实时间 · 纵轴是与 A 的相似度</span></div><strong class="q3-rank">—</strong></header>
            <div class="q3-timeline"></div>
          </section>
          <section class="q3-chart-card q3-control-card">
            <header><div><b>控制覆盖与处置记忆</b><span>内圈：可阻断路径 · 外圈：事件后处置状态</span></div><strong class="q3-route-count">0 / 3</strong></header>
            <div class="q3-control-layout"><div class="q3-controls"></div><div class="q3-control-copy"></div></div>
          </section>
        </aside>
      </div>
      <footer class="q3-footnote"><span>边连接仅来自 10 项已观测行为特征的加权相似度。</span><b>行为相似度，不代表回应关系或因果关系。</b></footer>
    </section>`;
  }

  function destroy() {
    if (!active) return;
    active.abort.abort();
    active.resizeObserver?.disconnect();
    cancelAnimationFrame(active.frame);
    active.host.replaceChildren();
    active = null;
  }

  function mount(host, options = {}) {
    destroy();
    if (!MODEL || !options.data?.incident_vectors) {
      host.innerHTML = '<p class="q3-load-error">Q3 图谱所需的数据模块未加载。</p>';
      return;
    }
    host.innerHTML = graphMarkup();
    const vectors = options.data.incident_vectors;
    const edges = MODEL.buildTopKEdges(vectors, 3);
    const nodes = deterministicLayout(vectors, edges);
    const abort = new AbortController();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = active = {
      host, abort, data: options.data, vectors, vectorMap: new Map(vectors.map(v => [v.event_id, v])),
      edges, nodes, nodeMap: new Map(nodes.map(node => [node.event_id, node])),
      aId: stateId(vectors, DEFAULT_A), bId: stateId(vectors, DEFAULT_B),
      mode: '2d', yaw: .45, pitch: -.28, zoom: 1, panX: 0, panY: 0,
      hoverId: null, drag: false, moved: false, lastX: 0, lastY: 0,
      selectedControls: new Set(), projected: [], reduced, frame: 0, dirty: true
    };
    const canvas = host.querySelector('.q3-network');
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');

    host.querySelector('.q3-exit').addEventListener('click', () => {
      if (typeof options.onExit === 'function') options.onExit();
    }, { signal: abort.signal });
    host.querySelectorAll('[data-q3-mode]').forEach(button => button.addEventListener('click', () => {
      state.mode = button.dataset.q3Mode;
      host.querySelectorAll('[data-q3-mode]').forEach(item => item.classList.toggle('active', item === button));
      state.dirty = true;
      drawNetwork(state);
    }, { signal: abort.signal }));
    host.querySelector('.q3-anchor-button').addEventListener('click', () => {
      state.aId = state.bId;
      state.bId = MODEL.rankAgainst(vectors, state.aId, { priorOnly: true })[0]?.event_id || MODEL.rankAgainst(vectors, state.aId)[0].event_id;
      update(state);
    }, { signal: abort.signal });

    wireCanvas(state);
    state.resizeObserver = new ResizeObserver(() => { state.dirty = true; drawNetwork(state); });
    state.resizeObserver.observe(canvas.parentElement);
    update(state);
  }

  function stateId(vectors, preferred) {
    return vectors.some(vector => vector.event_id === preferred) ? preferred : vectors.at(-1).event_id;
  }

  function update(state) {
    const left = byId(state, state.aId), right = byId(state, state.bId);
    const comparison = MODEL.compareVectors(left, right);
    const rank = MODEL.rankAgainst(state.vectors, state.aId);
    const rankIndex = rank.findIndex(item => item.event_id === state.bId) + 1;
    state.host.querySelector('.q3-pair-a').innerHTML = pairCopy('A · 锚点', left);
    state.host.querySelector('.q3-pair-b').innerHTML = pairCopy('B · 对比', right);
    state.host.querySelector('.q3-score b').textContent = `${Math.round(comparison.similarity * 100)}%`;
    state.host.querySelector('.q3-radar-score').textContent = `${Math.round(comparison.similarity * 100)}% MATCH`;
    state.host.querySelector('.q3-rank').textContent = `B 排名 #${rankIndex || '—'} / 76`;
    renderRadar(state, left, right);
    renderTimeline(state, rank);
    renderControls(state, left, right);
    state.dirty = true;
    drawNetwork(state);
  }

  function pairCopy(label, vector) {
    return `<span>${label}</span><b>${shortTime(vector.timestamp)} · ${esc(SURFACE[vector.surface]?.label || vector.surface)}</b><p>${esc(truncate(vector.text, 72))}</p>`;
  }

  function renderRadar(state, left, right) {
    const a = MODEL.riskProfile(left), b = MODEL.riskProfile(right);
    const w = 360, h = 178, cx = 180, cy = 88, radius = 62;
    const axisPoints = RADAR_AXES.map(([, key], index) => polar(cx, cy, radius, -Math.PI / 2 + index * Math.PI / 3));
    const rings = [.25, .5, .75, 1].map(level => `<polygon points="${points(axisPoints.map(([x, y]) => [cx + (x - cx) * level, cy + (y - cy) * level]))}"/>`).join('');
    const polygon = profile => points(RADAR_AXES.map(([, key], index) => {
      const [x, y] = axisPoints[index];
      return [cx + (x - cx) * profile[key], cy + (y - cy) * profile[key]];
    }));
    const labels = RADAR_AXES.map(([label], index) => {
      const [x, y] = polar(cx, cy, radius + 19, -Math.PI / 2 + index * Math.PI / 3);
      return `<text x="${x}" y="${y}" text-anchor="${x < cx - 5 ? 'end' : x > cx + 5 ? 'start' : 'middle'}">${label}</text>`;
    }).join('');
    state.host.querySelector('.q3-radar').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="事件 A 和 B 的六维行为轮廓雷达图">
      <g class="q3-radar-grid">${rings}${axisPoints.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`).join('')}</g>
      <polygon class="q3-radar-a" points="${polygon(a)}"/><polygon class="q3-radar-b" points="${polygon(b)}"/>
      <g class="q3-radar-labels">${labels}</g>
      <g class="q3-radar-key"><circle cx="11" cy="164" r="4" class="a"/><text x="20" y="168">A 锚点</text><circle cx="82" cy="164" r="4" class="b"/><text x="91" y="168">B 对比</text></g>
    </svg>`;
  }

  function renderTimeline(state, rank) {
    const a = byId(state, state.aId), b = byId(state, state.bId);
    const rows = state.vectors.map(vector => ({
      ...vector,
      similarity: vector.event_id === state.aId ? 1 : MODEL.pairSimilarity(state.vectors, state.aId, vector.event_id),
      time: Date.parse(vector.timestamp),
      jitterX: ((Number(vector.event_id.slice(-3)) % 7) - 3) * .85,
      jitterY: ((Number(vector.event_id.slice(-3)) % 5) - 2) * .7
    }));
    const min = Math.min(...rows.map(row => row.time)), max = Math.max(...rows.map(row => row.time));
    const w = 420, h = 184, left = 38, right = 16, top = 12, bottom = 27;
    const x = value => left + (value - min) / Math.max(1, max - min) * (w - left - right);
    const y = value => top + (1 - value) * (h - top - bottom);
    const priorTop = rank.filter(row => row.timestamp < a.timestamp).slice(0, 5);
    const topIds = new Set(priorTop.map(row => row.event_id));
    const yTicks = [.4, .6, .8, 1];
    const dates = [min, min + (max - min) / 2, max];
    const dots = rows.map(row => {
      const selected = row.event_id === state.aId ? ' a' : row.event_id === state.bId ? ' b' : topIds.has(row.event_id) ? ' prior' : '';
      return `<circle class="q3-time-dot${selected}" data-event="${row.event_id}" cx="${(x(row.time)+row.jitterX).toFixed(1)}" cy="${(y(row.similarity)+row.jitterY).toFixed(1)}" r="${selected ? 4.1 : 2.1}"/>`;
    }).join('');
    const labelGroups = [...priorTop.reduce((groups, row) => {
      const key = `${shortDate(row.timestamp)}|${Math.round(row.similarity * 100)}`;
      const group = groups.get(key) || { ...row, count: 0 };
      group.count += 1; groups.set(key, group); return groups;
    }, new Map()).values()];
    const directLabels = labelGroups.map((row, index) => {
      const px = x(Date.parse(row.timestamp)), py = y(row.similarity);
      const tx = clamp(px + (index % 2 ? 8 : -8), 54, 350);
      const ty = clamp(py + (index % 2 ? 14 : -9), 12, 143);
      const anchor = index % 2 ? 'start' : 'end';
      const count = row.count > 1 ? ` · ${row.count}条` : '';
      return `<line class="q3-label-leader" x1="${px}" y1="${py}" x2="${tx}" y2="${ty-2}"/><text class="q3-prior-label" x="${tx}" y="${ty}" text-anchor="${anchor}">${shortDate(row.timestamp)} · ${Math.round(row.similarity * 100)}%${count}</text>`;
    }).join('');
    state.host.querySelector('.q3-timeline').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="77 个事件随时间分布的行为相似度散点图">
      <rect class="q3-attention-band" x="${left}" y="${y(1)}" width="${w-left-right}" height="${y(.7)-y(1)}"/>
      <text class="q3-band-label" x="${w-right-3}" y="${y(.7)-4}" text-anchor="end">70–100% 高相似区</text>
      ${yTicks.map(tick => `<g class="q3-time-grid"><line x1="${left}" x2="${w-right}" y1="${y(tick)}" y2="${y(tick)}"/><text x="${left-7}" y="${y(tick)+3}" text-anchor="end">${tick*100}</text></g>`).join('')}
      ${dates.map(value => `<text class="q3-date-tick" x="${x(value)}" y="${h-7}" text-anchor="middle">${shortDate(new Date(value).toISOString())}</text>`).join('')}
      <g class="q3-time-dots">${dots}</g><g>${directLabels}</g>
      <line class="q3-b-guide" x1="${x(Date.parse(b.timestamp))}" x2="${x(Date.parse(b.timestamp))}" y1="${top}" y2="${h-bottom}"/>
    </svg>`;
    state.host.querySelectorAll('.q3-time-dot').forEach(dot => dot.addEventListener('click', () => {
      if (dot.dataset.event !== state.aId) { state.bId = dot.dataset.event; update(state); }
    }, { signal: state.abort.signal }));
  }

  function renderControls(state, left, right) {
    const controls = state.data.counterfactual.controls;
    const routes = Object.entries(state.data.counterfactual.baseline_routes);
    const covered = routes.filter(([, route]) => route.blocking_controls.some(id => state.selectedControls.has(id)));
    state.host.querySelector('.q3-route-count').textContent = `${covered.length} / 3 路径已覆盖`;
    const w = 238, h = 190, cx = 119, cy = 94;
    const controlNodes = controls.map((control, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / controls.length;
      const [x, y] = polar(cx, cy, 67, angle);
      return { ...control, x, y, active: state.selectedControls.has(control.id) };
    });
    const routeNodes = routes.map(([id, route], index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 3;
      const [x, y] = polar(cx, cy, 27, angle);
      return { id, ...route, x, y, covered: route.blocking_controls.some(control => state.selectedControls.has(control)) };
    });
    const links = routeNodes.flatMap(route => route.blocking_controls.map(controlId => {
      const control = controlNodes.find(item => item.id === controlId);
      return `<line class="${route.covered && control.active ? 'active' : ''}" x1="${route.x}" y1="${route.y}" x2="${control.x}" y2="${control.y}"/>`;
    })).join('');
    const response = [
      ['已删除', 'deleted'], ['已停发', 'posting_paused'], ['持久控制', 'persistent_control_created']
    ];
    const responseStateA = MODEL.responseState(left), responseStateB = MODEL.responseState(right);
    const ring = response.map(([label, key], index) => {
      const start = -Math.PI / 2 + index * Math.PI * 2 / 3 + .04;
      const end = start + Math.PI * 2 / 3 - .08;
      const arc = (radius, value, cls) => {
        const [sx, sy] = polar(cx, cy, radius, start), [ex, ey] = polar(cx, cy, radius, end);
        return `<path class="q3-response-arc ${cls} ${value === true ? 'yes' : value === false ? 'no' : 'unknown'}" d="M ${sx} ${sy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}"/>`;
      };
      const [tx, ty] = polar(cx, cy, 91, start + (end - start) / 2);
      return `${arc(83, responseStateA[key], 'a')}${arc(88, responseStateB[key], 'b')}<text class="q3-response-label" x="${tx}" y="${ty}">${label}</text>`;
    }).join('');
    state.host.querySelector('.q3-controls').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="五项控制对三条公开路径的阻断覆盖图">
      <g class="q3-control-links">${links}</g>${ring}
      ${routeNodes.map(route => `<g class="q3-route-node ${route.covered ? 'covered' : ''}"><circle cx="${route.x}" cy="${route.y}" r="11"/><text x="${route.x}" y="${route.y+3}">${route.id === 'official' ? '官' : route.id === 'personal' ? '个' : '匿'}</text></g>`).join('')}
      ${controlNodes.map((control, index) => `<g class="q3-control-node ${control.active ? 'active' : ''}" data-control="${control.id}"><circle cx="${control.x}" cy="${control.y}" r="9"/><text x="${control.x}" y="${control.y+3}">${index+1}</text></g>`).join('')}
    </svg>`;
    state.host.querySelector('.q3-control-copy').innerHTML = `<ol>${controlNodes.map((control, index) => `<li class="${control.active ? 'active' : ''}" data-control="${control.id}"><i>${index+1}</i><span>${esc(control.label)}</span></li>`).join('')}</ol><p>${covered.length === 3 ? '三条公开路径均被所选控制覆盖。' : '点击控制，观察官方、个人和匿名路径如何被覆盖。'}<br><b>完整闭环至少需要：正式链路控制 + 跨账号防泄漏。</b></p>`;
    state.host.querySelectorAll('[data-control]').forEach(item => item.addEventListener('click', () => {
      const id = item.dataset.control;
      state.selectedControls.has(id) ? state.selectedControls.delete(id) : state.selectedControls.add(id);
      renderControls(state, byId(state, state.aId), byId(state, state.bId));
    }, { signal: state.abort.signal }));
  }

  function wireCanvas(state) {
    const canvas = state.canvas;
    canvas.addEventListener('pointerdown', event => {
      state.drag = true; state.moved = false; state.lastX = event.clientX; state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    }, { signal: state.abort.signal });
    canvas.addEventListener('pointermove', event => {
      if (state.drag) {
        const dx = event.clientX - state.lastX, dy = event.clientY - state.lastY;
        state.moved ||= Math.abs(dx) + Math.abs(dy) > 3;
        if (state.mode === '3d') { state.yaw += dx * .008; state.pitch = clamp(state.pitch + dy * .006, -1.1, 1.1); }
        else { state.panX += dx; state.panY += dy; }
        state.lastX = event.clientX; state.lastY = event.clientY; state.dirty = true; drawNetwork(state);
      } else {
        const hit = hitNode(state, event);
        const next = hit?.event_id || null;
        if (next !== state.hoverId) { state.hoverId = next; renderTooltip(state, hit, event); state.dirty = true; drawNetwork(state); }
      }
    }, { signal: state.abort.signal });
    canvas.addEventListener('pointerup', event => {
      const hit = hitNode(state, event);
      if (!state.moved && hit && hit.event_id !== state.aId) { state.bId = hit.event_id; update(state); }
      state.drag = false;
    }, { signal: state.abort.signal });
    canvas.addEventListener('pointerleave', () => {
      state.drag = false; state.hoverId = null; renderTooltip(state, null); state.dirty = true; drawNetwork(state);
    }, { signal: state.abort.signal });
    canvas.addEventListener('wheel', event => {
      event.preventDefault(); state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * .001), .62, 2.2); state.dirty = true; drawNetwork(state);
    }, { passive: false, signal: state.abort.signal });
  }

  function hitNode(state, event) {
    const rect = state.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best = null, bestDistance = 14;
    state.projected.forEach(node => {
      const distance = Math.hypot(node.sx - x, node.sy - y);
      if (distance < bestDistance) { best = node; bestDistance = distance; }
    });
    return best;
  }

  function renderTooltip(state, node, event) {
    const tooltip = state.host.querySelector('.q3-tooltip');
    if (!node) { tooltip.hidden = true; return; }
    const rect = state.canvas.getBoundingClientRect();
    tooltip.hidden = false;
    tooltip.style.left = `${clamp(event.clientX - rect.left + 14, 8, rect.width - 244)}px`;
    tooltip.style.top = `${clamp(event.clientY - rect.top + 14, 8, rect.height - 128)}px`;
    tooltip.innerHTML = `<span>${shortTime(node.timestamp)} · ${esc(SURFACE[node.surface]?.label)}</span><b>${esc(node.actor.replace('-Agent', ''))}</b><p>${esc(truncate(node.text, 108))}</p><small>点击设为对比事件 B</small>`;
  }

  function drawNetwork(state) {
    if (!state?.canvas?.isConnected) return;
    const canvas = state.canvas, rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    }
    const ctx = state.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width, height) * .44 * state.zoom;
    const cosY = Math.cos(state.yaw), sinY = Math.sin(state.yaw), cosP = Math.cos(state.pitch), sinP = Math.sin(state.pitch);
    state.projected = state.nodes.map(node => {
      let x = node.x, y = node.y, z = node.z;
      if (state.mode === '3d') {
        const rx = x * cosY - z * sinY, rz = x * sinY + z * cosY;
        const ry = y * cosP - rz * sinP, depth = y * sinP + rz * cosP;
        const perspective = 1 / (1.6 + depth * .32);
        x = rx * perspective * 1.55; y = ry * perspective * 1.55; z = depth;
      }
      return { ...node, sx: width / 2 + state.panX + x * scale, sy: height / 2 + state.panY + y * scale, depth: z };
    }).sort((a, b) => a.depth - b.depth);
    const projectedMap = new Map(state.projected.map(node => [node.event_id, node]));
    const localIds = new Set([state.aId, state.bId, state.hoverId].filter(Boolean));
    state.edges.forEach(edge => {
      const left = projectedMap.get(edge.source), right = projectedMap.get(edge.target);
      const local = localIds.has(edge.source) || localIds.has(edge.target);
      ctx.beginPath(); ctx.moveTo(left.sx, left.sy); ctx.lineTo(right.sx, right.sy);
      ctx.strokeStyle = local ? `rgba(91,79,62,${.24 + edge.similarity * .48})` : `rgba(91,88,78,${.05 + edge.similarity * .16})`;
      ctx.lineWidth = local ? .7 + edge.similarity * 1.15 : .48;
      ctx.stroke();
    });
    state.projected.forEach(node => {
      const isA = node.event_id === state.aId, isB = node.event_id === state.bId, hover = node.event_id === state.hoverId;
      const radius = isA ? 7 : isB ? 6.5 : hover ? 5 : 2.25 + (node.sensitive_entity_present ? .8 : 0);
      if (isA || isB || hover) {
        ctx.beginPath(); ctx.arc(node.sx, node.sy, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = isA ? 'rgba(44,48,43,.08)' : 'rgba(166,93,80,.10)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(node.sx, node.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isA ? '#2f332f' : isB ? '#a65d50' : hover ? SURFACE[node.surface].color : `${SURFACE[node.surface].color}c9`;
      ctx.fill();
      if (isA || isB) { ctx.strokeStyle = '#f7f5ef'; ctx.lineWidth = 2; ctx.stroke(); }
    });
    renderNetworkLabels(state, projectedMap, width, height);
  }

  function renderNetworkLabels(state, map, width, height) {
    const labels = state.host.querySelector('.q3-network-labels');
    const make = (id, cls, prefix) => {
      const node = map.get(id); if (!node) return '';
      const x = clamp(node.sx + 10, 4, width - 170), y = clamp(node.sy - 13, 7, height - 36);
      return `<div class="${cls}" style="transform:translate(${x}px,${y}px)"><b>${prefix}</b><span>${shortTime(node.timestamp)} · ${SURFACE[node.surface].label}</span></div>`;
    };
    labels.innerHTML = make(state.aId, 'a', 'A') + make(state.bId, 'b', 'B');
  }

  root.Q3WarningGraph = { mount, destroy };
})(typeof globalThis !== 'undefined' ? globalThis : window);
