(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EvidenceAtlasModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const STOPWORDS = new Set([
    'about', 'after', 'again', 'against', 'also', 'and', 'are', 'because', 'been',
    'before', 'being', 'but', 'can', 'could', 'did', 'does', 'for', 'from', 'have',
    'here', 'into', 'its', 'just', 'more', 'not', 'our', 'out', 'should', 'that',
    'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'through',
    'today', 'was', 'were', 'what', 'when', 'where', 'which', 'will', 'with', 'would',
    'you', 'your'
  ]);

  function clamp(value, low = 0, high = 1) {
    return Math.max(low, Math.min(high, value));
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function identityFor(channel) {
    if (channel === 'official_post') return 'official';
    if (channel === 'personal_post') return 'personal';
    if (channel === 'anonymous_post') return 'anonymous';
    return 'internal';
  }

  function windowFor(date, declared) {
    for (const [name, window] of Object.entries(declared.KEY_WINDOWS)) {
      if (window.date === date) return name;
    }
    return 'background';
  }

  function dutyIndex(cn) {
    const index = new Map();
    for (const duty of cn.duty_functions || []) {
      for (const id of duty.message_ids || []) {
        if (!index.has(id)) index.set(id, []);
        index.get(id).push({
          caseId: duty.case_id,
          actor: duty.actor,
          function: duty.function,
          label: duty.label
        });
      }
    }
    return index;
  }

  function buildObservedEdges(nodesById) {
    const edges = [];
    for (const node of nodesById.values()) {
      const parent = node.message.responding_to;
      if (!parent || !nodesById.has(parent)) continue;
      edges.push({
        id: `observed:${parent}:${node.id}`,
        source: parent,
        target: node.id,
        kind: 'observed',
        method: 'reply_reference',
        strength: 1
      });
    }
    return edges;
  }

  function tokenize(content) {
    return new Set(
      String(content || '')
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[^a-z0-9#@'-]+/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 3 && !STOPWORDS.has(token))
    );
  }

  function jaccard(left, right) {
    if (!left.size || !right.size) return 0;
    let intersection = 0;
    for (const token of left) if (right.has(token)) intersection += 1;
    return intersection / (left.size + right.size - intersection);
  }

  function buildAnalyticalEdges(nodes) {
    const edges = [];
    const edgeKeys = new Set();
    const add = (source, target, method, strength) => {
      if (source === target) return;
      const pair = [source, target].sort();
      const key = `${method}:${pair[0]}:${pair[1]}`;
      if (edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edges.push({
        id: `analytical:${key}`,
        source: pair[0],
        target: pair[1],
        kind: 'analytical',
        method,
        strength: Number(clamp(strength).toFixed(4))
      });
    };

    const keyWindows = new Map();
    for (const node of nodes) {
      if (node.window === 'background') continue;
      if (!keyWindows.has(node.window)) keyWindows.set(node.window, []);
      keyWindows.get(node.window).push(node);
    }
    for (const group of keyWindows.values()) {
      group.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
      for (let index = 1; index < group.length; index += 1) {
        add(group[index - 1].id, group[index].id, 'event_adjacency', 0.68);
      }
    }

    const duties = new Map();
    for (const node of nodes) {
      for (const duty of node.duties) {
        if (!duties.has(duty.function)) duties.set(duty.function, []);
        duties.get(duty.function).push(node);
      }
    }
    for (const group of duties.values()) {
      group.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
      for (let index = 1; index < group.length; index += 1) {
        add(group[index - 1].id, group[index].id, 'shared_duty', 0.82);
      }
    }

    const byDate = new Map();
    for (const node of nodes) {
      if (!byDate.has(node.date)) byDate.set(node.date, []);
      byDate.get(node.date).push(node);
    }
    for (const group of byDate.values()) {
      const tokens = new Map(group.map(node => [node.id, tokenize(node.content)]));
      for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
        const left = group[leftIndex];
        const neighbors = [];
        for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
          const right = group[rightIndex];
          const strength = jaccard(tokens.get(left.id), tokens.get(right.id));
          if (strength >= 0.34) neighbors.push({ right, strength });
        }
        neighbors
          .sort((a, b) => b.strength - a.strength || a.right.id.localeCompare(b.right.id))
          .slice(0, 2)
          .forEach(candidate => add(left.id, candidate.right.id, 'token_jaccard', candidate.strength));
      }
    }

    return edges.sort((a, b) => a.id.localeCompare(b.id));
  }

  function validateAtlas(atlas, declared) {
    const failures = [];
    const ids = new Set(atlas.nodes.map(node => node.id));
    if (ids.size !== atlas.nodes.length) failures.push('duplicate message node id');
    for (const edge of atlas.edges) {
      if (!ids.has(edge.source)) failures.push(`unknown edge source: ${edge.source}`);
      if (!ids.has(edge.target)) failures.push(`unknown edge target: ${edge.target}`);
      if (edge.kind === 'analytical' && (!edge.method || !(edge.strength > 0))) {
        failures.push(`invalid analytical edge: ${edge.id}`);
      }
    }
    for (const chain of declared.EVIDENCE_CHAINS) {
      for (const id of [...chain.anchors, ...chain.ids]) {
        if (!ids.has(id)) failures.push(`unknown evidence chain message: ${id}`);
      }
    }
    for (const item of declared.MISSING_EVIDENCE) {
      if (!item.id.startsWith('missing:')) failures.push(`invalid missing evidence id: ${item.id}`);
      if (ids.has(item.id)) failures.push(`missing evidence collides with message: ${item.id}`);
    }
    return [...new Set(failures)];
  }

  function buildAtlas(cn, en, summaries, declared) {
    if (!cn || !en || !declared) throw new Error('Atlas data dependencies are required');
    const duties = dutyIndex(cn);
    const nodes = [...en.messages]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.message_id.localeCompare(b.message_id))
      .map(message => ({
        id: message.message_id,
        timestamp: message.timestamp,
        date: message.date,
        time: message.time,
        role: message.agent_label,
        channel: message.channel,
        identity: identityFor(message.channel),
        window: windowFor(message.date, declared),
        content: message.content,
        summary: summaries[message.message_id],
        duties: duties.get(message.message_id) || [],
        evidenceLevel: declared.EVIDENCE_LEVELS[message.message_id] || 'observed',
        message
      }));
    const nodesById = new Map(nodes.map(node => [node.id, node]));
    const observed = buildObservedEdges(nodesById);
    const analytical = buildAnalyticalEdges(nodes);
    const atlas = {
      nodes,
      nodesById,
      edges: [...observed, ...analytical],
      observedEdges: observed,
      analyticalEdges: analytical
    };
    const failures = validateAtlas(atlas, declared);
    if (failures.length) throw new Error(failures.join('; '));
    return atlas;
  }

  function normalizedTime(nodes, node) {
    const first = Date.parse(nodes[0].timestamp);
    const last = Date.parse(nodes.at(-1).timestamp);
    const current = Date.parse(node.timestamp);
    if (!Number.isFinite(first) || !Number.isFinite(last) || first === last) return 0.5;
    return clamp((current - first) / (last - first));
  }

  function clusterPosition(node, center, scale = 0.12) {
    const hash = stableHash(node.id);
    const angle = ((hash % 10000) / 10000) * Math.PI * 2;
    const radius = (0.18 + ((hash >>> 8) % 1000) / 1250) * scale;
    return {
      x: clamp(center.x + Math.cos(angle) * radius),
      y: clamp(center.y + Math.sin(angle) * radius)
    };
  }

  function layout(nodes, mode) {
    if (!['time', 'role', 'channel'].includes(mode)) throw new Error(`Unknown atlas layout: ${mode}`);
    const positions = {};
    const roles = [...new Set(nodes.map(node => node.role))].sort();
    const channels = [...new Set(nodes.map(node => node.channel))].sort();
    const sequence = new Map(nodes.map((node, index) => [node.id, index / Math.max(1, nodes.length - 1)]));
    for (const node of nodes) {
      const hash = stableHash(node.id);
      if (mode === 'time') {
        const roleIndex = Math.max(0, roles.indexOf(node.role));
        const elapsed = normalizedTime(nodes, node);
        const chronologicalRank = sequence.get(node.id);
        const roleDrift = (roleIndex / Math.max(1, roles.length - 1) - 0.5) * 0.18;
        const cloudJitter = (((hash >>> 8) % 1000) / 1000 - 0.5) * 0.60;
        const wave = Math.sin(chronologicalRank * Math.PI * 7 + (hash % 17) * 0.07) * 0.075;
        positions[node.id] = {
          x: clamp(0.04 + (elapsed * 0.30 + chronologicalRank * 0.70) * 0.92),
          y: clamp(0.50 + roleDrift + cloudJitter + wave)
        };
        continue;
      }
      const groups = mode === 'role' ? roles : channels;
      const value = mode === 'role' ? node.role : node.channel;
      const index = Math.max(0, groups.indexOf(value));
      const columns = Math.ceil(Math.sqrt(groups.length));
      const row = Math.floor(index / columns);
      const column = index % columns;
      const rows = Math.ceil(groups.length / columns);
      positions[node.id] = clusterPosition(node, {
        x: columns === 1 ? 0.5 : 0.14 + (column / (columns - 1)) * 0.72,
        y: rows === 1 ? 0.5 : 0.18 + (row / (rows - 1)) * 0.64
      }, mode === 'role' ? 0.72 : 0.66);
    }
    return positions;
  }

  function parallelFlows(nodes, dimensions = ['role', 'channel', 'identity', 'function']) {
    const supported = new Set(['role', 'channel', 'identity', 'function']);
    for (const dimension of dimensions) {
      if (!supported.has(dimension)) throw new Error(`Unknown parallel flow dimension: ${dimension}`);
    }
    const aggregated = new Map();
    for (const node of nodes) {
      for (const duty of node.duties || []) {
        const record = {
          role: node.role,
          channel: node.channel,
          identity: node.identity,
          function: duty.function
        };
        const values = dimensions.map(dimension => record[dimension]);
        const key = values.join('\u001f');
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            id: `flow:${stableHash(key).toString(16)}`,
            values,
            messageIds: new Set(),
            caseIds: new Set(),
            hazardous: ['personal', 'anonymous'].includes(record.identity) && duty.function === 'execute_publication'
          });
        }
        const route = aggregated.get(key);
        route.messageIds.add(node.id);
        route.caseIds.add(duty.caseId);
      }
    }
    const routes = [...aggregated.values()].map(route => ({
      ...route,
      messageIds: [...route.messageIds].sort(),
      caseIds: [...route.caseIds].sort(),
      count: route.messageIds.size
    })).sort((left, right) => right.count - left.count || left.values.join('|').localeCompare(right.values.join('|')));
    return {
      dimensions: [...dimensions],
      routes,
      totalMessages: new Set(routes.flatMap(route => route.messageIds)).size
    };
  }

  function chainsFor(messageId, declared) {
    const order = ['authorization', 'migration', 'public_action'];
    const chains = declared.EVIDENCE_CHAINS
      .filter(chain => chain.anchors.includes(messageId))
      .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    return chains.map(chain => ({ ...chain, ids: [...chain.ids], anchors: [...chain.anchors] }));
  }

  function simulateControls(controlIds) {
    const known = new Set(['signed_artifact', 'current_reviewer_ack', 'duty_separation', 'cross_surface_gate']);
    const selected = new Set(controlIds || []);
    for (const id of selected) if (!known.has(id)) throw new Error(`Unknown control: ${id}`);
    const formalClosed = ['signed_artifact', 'current_reviewer_ack', 'duty_separation'].some(id => selected.has(id));
    const crossSurfaceClosed = selected.has('cross_surface_gate');
    const routes = {
      official: { open: !formalClosed, blockers: formalClosed ? [...selected].filter(id => id !== 'cross_surface_gate') : [] },
      personal: { open: !crossSurfaceClosed, blockers: crossSurfaceClosed ? ['cross_surface_gate'] : [] },
      anonymous: { open: !crossSurfaceClosed, blockers: crossSurfaceClosed ? ['cross_surface_gate'] : [] }
    };
    const hazardousOpen = Object.entries(routes).filter(([, route]) => route.open).map(([name]) => name);
    const routeClosure = (3 - hazardousOpen.length) / 3;
    const coverage = selected.size / known.size;
    return {
      selected: [...selected],
      routes,
      hazardousOpen,
      legitimateOfficialOpen: true,
      igc: {
        route_closure: Number(routeClosure.toFixed(4)),
        transfer_coverage: Number(coverage.toFixed(4)),
        constraint_survival: Number((0.18 + coverage * 0.72).toFixed(4)),
        provenance_integrity: Number((0.22 + (selected.has('signed_artifact') ? 0.48 : 0) + (selected.has('current_reviewer_ack') ? 0.22 : 0)).toFixed(4)),
        utility_preservation: 1
      }
    };
  }

  function igcProxy(caseId, declared) {
    const dimensions = declared.IGC_PROXIES[caseId];
    if (!dimensions) throw new Error(`Unknown IGC proxy case: ${caseId}`);
    return {
      caseId,
      exact: false,
      dimensions: Object.fromEntries(
        Object.entries(dimensions).map(([name, value]) => [name, {
          low: clamp(value.low),
          high: clamp(value.high),
          evidence: value.evidence,
          sourceIds: [...value.sourceIds]
        }])
      )
    };
  }

  return {
    stableHash,
    buildAtlas,
    buildObservedEdges,
    buildAnalyticalEdges,
    layout,
    parallelFlows,
    chainsFor,
    simulateControls,
    igcProxy,
    validateAtlas
  };
});
