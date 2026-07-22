const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const story = require('../../visual_workspace_cn/case-story.js');

function loadData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('review_cn/data/interlock-data.js', 'utf8'), context);
  return context.window.INTERLOCK_DATA;
}

const data = loadData();

test('story poses one question and preserves two independent verdict axes', () => {
  assert.match(story.STORY.question, /为什么仍在最后一小时失去约束/);
  assert.deepEqual(story.STORY.verdicts.map(item => item.id), ['action', 'authorization']);
  assert.match(story.STORY.verdicts[0].finding, /有意/);
  assert.match(story.STORY.verdicts[1].finding, /不可独立核验/);
});

test('story contains five ordered acts and three challenge chapters', () => {
  assert.equal(story.STORY.acts.length, 5);
  assert.deepEqual(story.STORY.acts.map(act => act.id), [
    'rehearsal', 'control', 'boundary', 'collapse', 'closure'
  ]);
  assert.deepEqual(story.STORY.chapters.map(chapter => chapter.id), ['q1', 'q2', 'q3']);
});

test('every referenced story evidence id exists in the observed messages', () => {
  const messageIds = new Set(data.messages.map(message => message.message_id));
  const evidenceIds = story.STORY.acts.flatMap(act => act.evidenceIds || []);
  evidenceIds.forEach(id => assert.ok(messageIds.has(id), `missing story evidence ${id}`));
});

test('story validator accepts the current data and closure is explicit', () => {
  assert.deepEqual(story.validateStory(data), []);
  assert.match(story.STORY.closure, /正式链路控制/);
  assert.match(story.STORY.closure, /跨账号/);
});
