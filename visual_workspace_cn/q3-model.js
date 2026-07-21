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
