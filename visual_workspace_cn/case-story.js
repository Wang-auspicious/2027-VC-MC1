(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CaseStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const REQUIRED_MESSAGES = [
    '20460529_08_012',
    '20460604_12_018',
    '20460605_19_009',
    '20460605_21_020',
    '20460605_21_026',
    '20460605_22_051'
  ];

  function validateStory(data) {
    const ids = new Set((data?.messages || []).map(message => message.message_id));
    return REQUIRED_MESSAGES
      .filter(id => !ids.has(id))
      .map(id => `missing continuous-atlas evidence: ${id}`);
  }

  function destroy() {}

  return { REQUIRED_MESSAGES, validateStory, destroy };
});
