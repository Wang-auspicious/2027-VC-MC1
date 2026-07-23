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

test('parallel flows retain observed message ids across four declared dimensions', () => {
  const atlas = model.buildAtlas(cn, en, summaries.SUMMARIES, declared);
  const flows = model.parallelFlows(atlas.nodes.filter(node => ['normal', 'incident'].includes(node.window)));
  assert.deepEqual(flows.dimensions, ['role', 'channel', 'identity', 'function']);
  assert.ok(flows.routes.length >= 6);
  assert.ok(flows.routes.every(route => route.messageIds.length === route.count));
  assert.ok(flows.routes.some(route => route.hazardous && route.values.at(-1) === 'execute_publication'));
  assert.ok(flows.routes.some(route => !route.hazardous && route.values.includes('official')));
});
