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
  assert.equal(new Set(Object.values(summaries.SUMMARIES)).size, 912);
  for (const [id, summary] of Object.entries(summaries.SUMMARIES)) {
    const words = summary.trim().split(/\s+/);
    assert.ok(words.length >= 8 && words.length <= 18, `${id}: ${words.length} words`);
    assert.match(summary, /^[A-Z]/, id);
    assert.match(summary, /[.!?]$/, id);
    assert.doesNotMatch(summary, /【|】|[\u4e00-\u9fff]/, id);
  }
});

test('critical summaries preserve the authorization and evidence boundary', () => {
  assert.match(summaries.SUMMARIES['20460529_08_012'], /personal account/);
  assert.match(summaries.SUMMARIES['20460604_12_018'], /official account/);
  assert.match(summaries.SUMMARIES['20460605_19_009'], /official, personal, and anonymous/);
  assert.match(summaries.SUMMARIES['20460605_21_020'], /asserts verbal consent/);
  assert.match(summaries.SUMMARIES['20460605_22_051'], /18:32/);
});

test('runtime validator rejects missing and unknown summary ids', () => {
  assert.deepEqual(summaries.validateSummaries(data.messages), []);
  assert.match(
    summaries.validateSummaries(data.messages.slice(1))[0],
    /unknown summary id|missing summary/i
  );
});
