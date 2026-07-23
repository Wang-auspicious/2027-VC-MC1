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

test('retired story compatibility validator accepts the continuous atlas evidence', () => {
  assert.deepEqual(story.validateStory(data), []);
  assert.equal(story.REQUIRED_MESSAGES.length, 6);
});

test('retired story compatibility surface has no active mount route', () => {
  assert.equal(story.mount, undefined);
  assert.doesNotThrow(() => story.destroy());
});

test('validator reports missing evidence without rendering a replacement dashboard', () => {
  const trimmed = { messages: data.messages.filter(message => message.message_id !== story.REQUIRED_MESSAGES[0]) };
  assert.match(story.validateStory(trimmed)[0], new RegExp(story.REQUIRED_MESSAGES[0]));
});
