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
  assert.equal(model.rankAgainst(data.incident_vectors, target, { priorOnly: true })[0].event_id, warning);
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
