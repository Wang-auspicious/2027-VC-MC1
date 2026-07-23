(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EvidenceAtlasData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const KEY_WINDOWS = Object.freeze({
    near_miss: {
      date: '2046-05-29',
      ids: ['20460529_08_012', '20460529_08_013', '20460529_08_014', '20460529_08_019', '20460529_08_020', '20460529_08_038']
    },
    normal: {
      date: '2046-06-04',
      ids: ['20460604_12_009', '20460604_12_010', '20460604_12_017', '20460604_12_018']
    },
    incident: {
      date: '2046-06-05',
      ids: ['20460605_19_009', '20460605_21_020', '20460605_21_024', '20460605_21_026', '20460605_21_027', '20460605_21_055', '20460605_22_051']
    }
  });

  const ROLE_ORDER = Object.freeze([
    'Legal-Agent',
    'Platform-Trust-Agent',
    'PR-Agent',
    'Social-Manager-Agent',
    'PR-Intern-Agent',
    'Intern-Agent',
    'Judge-Agent'
  ]);

  const ROLE_COLORS = Object.freeze({
    'Legal-Agent': '#a84632',
    'Platform-Trust-Agent': '#497c75',
    'PR-Agent': '#ad7b31',
    'Social-Manager-Agent': '#76618e',
    'PR-Intern-Agent': '#6e8b58',
    'Intern-Agent': '#56788a',
    'Judge-Agent': '#5f5b55'
  });

  const CHANNEL_ORDER = Object.freeze([
    'comms_huddle',
    'side_huddle',
    'one_on_one_chat',
    'official_post',
    'personal_post',
    'anonymous_post'
  ]);

  const DUTY_AXIS = Object.freeze([
    'interpret_policy',
    'assert_authorization_evidence',
    'authorize_action',
    'execute_publication',
    'justify_post_hoc'
  ]);

  const EVIDENCE_CHAINS = Object.freeze([
    {
      id: 'incident-authorization',
      type: 'authorization',
      title: 'Decision and authorization',
      anchors: ['20460605_21_020', '20460605_21_024', '20460605_21_026'],
      ids: ['20460605_15_035', '20460605_19_009', '20460605_21_002', '20460605_21_020', '20460605_21_024', '20460605_22_051']
    },
    {
      id: 'incident-migration',
      type: 'migration',
      title: 'Role, channel, and identity migration',
      anchors: ['20460605_21_020', '20460605_21_026', '20460605_21_027'],
      ids: ['20460605_19_009', '20460605_21_020', '20460605_21_024', '20460605_21_026', '20460605_21_027', '20460605_21_055']
    },
    {
      id: 'incident-public-action',
      type: 'public_action',
      title: 'Public action and subsequent confirmation',
      anchors: ['20460605_21_026', '20460605_21_027', '20460605_21_055'],
      ids: ['20460605_21_020', '20460605_21_024', '20460605_21_026', '20460605_21_027', '20460605_21_050', '20460605_21_055', '20460605_22_051']
    },
    {
      id: 'near-miss-authorization',
      type: 'authorization',
      title: 'Decision and authorization',
      anchors: ['20460529_08_012', '20460529_08_013', '20460529_08_019'],
      ids: ['20460529_08_012', '20460529_08_013', '20460529_08_018', '20460529_08_019']
    },
    {
      id: 'near-miss-migration',
      type: 'migration',
      title: 'Role, channel, and identity migration',
      anchors: ['20460529_08_012', '20460529_08_014', '20460529_08_020'],
      ids: ['20460529_08_012', '20460529_08_013', '20460529_08_014', '20460529_08_019', '20460529_08_020', '20460529_08_038']
    },
    {
      id: 'near-miss-public-action',
      type: 'public_action',
      title: 'Public action and subsequent confirmation',
      anchors: ['20460529_08_012', '20460529_08_014'],
      ids: ['20460529_08_012', '20460529_08_013', '20460529_08_014']
    },
    {
      id: 'normal-authorization',
      type: 'authorization',
      title: 'Decision and authorization',
      anchors: ['20460604_12_009', '20460604_12_010', '20460604_12_017'],
      ids: ['20460604_12_009', '20460604_12_010', '20460604_12_017']
    },
    {
      id: 'normal-migration',
      type: 'migration',
      title: 'Role, channel, and identity migration',
      anchors: ['20460604_12_010', '20460604_12_018'],
      ids: ['20460604_12_009', '20460604_12_010', '20460604_12_017', '20460604_12_018']
    },
    {
      id: 'normal-public-action',
      type: 'public_action',
      title: 'Public action and subsequent confirmation',
      anchors: ['20460604_12_017', '20460604_12_018'],
      ids: ['20460604_12_010', '20460604_12_017', '20460604_12_018']
    }
  ]);

  const EVIDENCE_LEVELS = Object.freeze({
    '20460605_15_035': 'asserted',
    '20460605_19_009': 'observed',
    '20460605_21_002': 'asserted',
    '20460605_21_020': 'asserted',
    '20460605_21_024': 'observed',
    '20460605_21_026': 'observed',
    '20460605_21_027': 'observed',
    '20460605_21_050': 'observed',
    '20460605_21_055': 'observed',
    '20460605_22_051': 'asserted',
    '20460529_08_012': 'observed',
    '20460529_08_013': 'observed',
    '20460529_08_014': 'observed',
    '20460529_08_018': 'observed',
    '20460529_08_019': 'observed',
    '20460529_08_020': 'observed',
    '20460529_08_038': 'observed',
    '20460604_12_009': 'observed',
    '20460604_12_010': 'observed',
    '20460604_12_017': 'observed',
    '20460604_12_018': 'observed'
  });

  const MISSING_EVIDENCE = Object.freeze([
    {
      id: 'missing:civicloom-consent-before-release',
      expectedTime: '2046-06-05T17:19:00',
      track: 'authorization_assertion',
      label: 'Independent CivicLoom consent artifact before release',
      sourceIds: ['20460605_15_035', '20460605_21_020', '20460605_22_051']
    },
    {
      id: 'missing:judge-ack-after-ceiling',
      expectedTime: '2046-06-05T17:19:00',
      track: 'authorization_assertion',
      label: 'Judge-authored acknowledgment superseding the 15:08 ceiling',
      sourceIds: ['20460605_19_009', '20460605_21_020']
    },
    {
      id: 'missing:official-post-17xx',
      expectedTime: '2046-06-05T17:25:00',
      track: 'public_execution',
      label: 'Observed 17:xx official_post following the GO instruction',
      sourceIds: ['20460605_21_024', '20460605_21_026']
    }
  ]);

  const CONTROLS = Object.freeze([
    { id: 'signed_artifact', label: 'Signed authorization artifact' },
    { id: 'current_reviewer_ack', label: 'Current reviewer acknowledgment' },
    { id: 'duty_separation', label: 'Authorization / execution separation' },
    { id: 'cross_surface_gate', label: 'Cross-account and cross-channel capability gate' }
  ]);

  const IGC_PROXIES = Object.freeze({
    near_miss: {
      route_closure: { low: 0.15, high: 0.35, evidence: 'observed', sourceIds: ['20460529_08_012', '20460529_08_014', '20460529_08_019'] },
      transfer_coverage: { low: 0.20, high: 0.42, evidence: 'partial', sourceIds: ['20460529_08_019', '20460529_08_020'] },
      constraint_survival: { low: 0.12, high: 0.30, evidence: 'partial', sourceIds: ['20460529_08_038', '20460605_21_026'] },
      provenance_integrity: { low: 0.42, high: 0.64, evidence: 'observed', sourceIds: ['20460529_08_013', '20460529_08_019'] },
      utility_preservation: { low: 0.62, high: 0.84, evidence: 'partial', sourceIds: ['20460604_12_018'] }
    },
    normal: {
      route_closure: { low: 0.70, high: 0.88, evidence: 'observed', sourceIds: ['20460604_12_009', '20460604_12_017'] },
      transfer_coverage: { low: 0.58, high: 0.78, evidence: 'observed', sourceIds: ['20460604_12_010', '20460604_12_018'] },
      constraint_survival: { low: 0.30, high: 0.58, evidence: 'unobserved', sourceIds: [] },
      provenance_integrity: { low: 0.84, high: 0.96, evidence: 'observed', sourceIds: ['20460604_12_010', '20460604_12_017'] },
      utility_preservation: { low: 0.88, high: 0.98, evidence: 'observed', sourceIds: ['20460604_12_018'] }
    },
    incident: {
      route_closure: { low: 0.02, high: 0.18, evidence: 'observed', sourceIds: ['20460605_21_026', '20460605_21_027', '20460605_21_055'] },
      transfer_coverage: { low: 0.10, high: 0.28, evidence: 'partial', sourceIds: ['20460605_19_009', '20460605_21_020'] },
      constraint_survival: { low: 0.08, high: 0.24, evidence: 'partial', sourceIds: ['20460529_08_038', '20460605_21_026'] },
      provenance_integrity: { low: 0.14, high: 0.34, evidence: 'observed', sourceIds: ['20460605_21_020', '20460605_22_051'] },
      utility_preservation: { low: 0.64, high: 0.86, evidence: 'partial', sourceIds: ['20460604_12_018'] }
    }
  });

  return {
    KEY_WINDOWS,
    ROLE_ORDER,
    ROLE_COLORS,
    CHANNEL_ORDER,
    DUTY_AXIS,
    EVIDENCE_CHAINS,
    EVIDENCE_LEVELS,
    MISSING_EVIDENCE,
    CONTROLS,
    IGC_PROXIES
  };
});
