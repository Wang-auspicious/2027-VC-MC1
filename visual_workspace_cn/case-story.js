(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CaseStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const STORY = {
    question: '一个已经收到过预警、也存在明确边界的系统，为什么仍在最后一小时失去约束？',
    deck: '答案不在某一条异常消息里，而在三次公开事件之间：险情被处置却没有改变能力，正常链证明职责分离有效，事故链则让授权、执行与渠道同时坍缩。',
    verdicts: [
      {
        id: 'action',
        index: 'A',
        label: '行动判断',
        finding: '披露是有意行动',
        detail: '内容、时机、路线、GO 指令与公开确认均被观察到。',
        tone: 'dark'
      },
      {
        id: 'authorization',
        index: 'B',
        label: '证据判断',
        finding: '授权不可独立核验',
        detail: '发布前只观察到授权主张，未观察到独立材料与当下确认。',
        tone: 'rust'
      }
    ],
    acts: [
      {
        id: 'rehearsal',
        index: '01',
        date: '05.29',
        time: '09:11–09:37',
        kicker: '预演',
        title: '绕行已经出现',
        event: '个人账号先发布，组织随后删除帖子并暂停发布。',
        meaning: '控制了这一次传播，却没有移除个人与匿名发布能力。',
        metric: '83%',
        metricLabel: '与事故动作相似',
        caseId: 'near_miss',
        chapter: 'q3',
        evidenceIds: ['20460529_08_012', '20460529_08_014', '20460529_08_019']
      },
      {
        id: 'control',
        index: '02',
        date: '06.04',
        time: '09:08–09:17',
        kicker: '对照',
        title: '系统本来能够安全工作',
        event: 'Judge 审查，Legal 授权，PR 通过官方账号执行。',
        meaning: '关键不是有没有流程，而是相互制约的职责是否仍然分开。',
        metric: '3',
        metricLabel: '个角色分担关键职责',
        caseId: 'normal',
        chapter: 'q2',
        evidenceIds: ['20460604_12_009', '20460604_12_010', '20460604_12_017', '20460604_12_018']
      },
      {
        id: 'boundary',
        index: '03',
        date: '06.05',
        time: '15:08',
        kicker: '边界',
        title: '限制是明确的',
        event: 'Judge 禁止官方、个人与匿名账号继续释放交易信号。',
        meaning: '后续发布不能解释为系统不知道边界；问题是边界没有变成默认阻断。',
        metric: '3',
        metricLabel: '类公开渠道被点名',
        caseId: 'incident',
        chapter: 'q1',
        evidenceIds: ['20460605_19_009']
      },
      {
        id: 'collapse',
        index: '04',
        date: '06.05',
        time: '17:19–17:54',
        kicker: '坍缩',
        title: '职责和渠道同时越界',
        event: 'Legal 主张口头同意、发出 GO、准备备用渠道并亲自公开确认，随后被个人与匿名账号放大。',
        meaning: '授权者成为执行者，正式链没有被观察到，个人渠道让工作流继续前进。',
        metric: '5',
        metricLabel: '项关键治理职能集中',
        caseId: 'incident',
        chapter: 'q1',
        evidenceIds: ['20460605_21_020', '20460605_21_024', '20460605_21_026', '20460605_21_027', '20460605_21_055']
      },
      {
        id: 'closure',
        index: '05',
        date: '反事实',
        time: 'WHAT STOPS IT',
        kicker: '闭环',
        title: '修补一扇门还不够',
        event: '签署材料、当下复核、执行者确认或职责分离中的任一项，可以关闭正式路径。',
        meaning: '还必须叠加跨账号敏感内容 DLP，才能覆盖个人与匿名绕行。',
        metric: '3/3',
        metricLabel: '公开路径可被关闭',
        caseId: 'closure',
        chapter: 'q3',
        evidenceIds: []
      }
    ],
    chapters: [
      {
        id: 'q1',
        index: '01',
        label: '边界如何被跨过',
        question: '限制没有被撤销，工作流为什么仍然走到了公开动作？',
        answer: '角色与渠道同时迁移，使授权、执行和公开面不再相互制约。',
        route: 'incident'
      },
      {
        id: 'q2',
        index: '02',
        label: '职责何时开始重叠',
        question: '事故链与正常发布真正不同的地方是什么？',
        answer: '异常不是消息变多，而是五项治理职能集中到同一角色。',
        route: 'normal'
      },
      {
        id: 'q3',
        index: '03',
        label: '预警为何没有留下约束',
        question: '05.29 已经暴露绕行能力，为什么 06.05 仍能复现？',
        answer: '组织处理了消息，却没有改变能力、默认规则和跨账号控制。',
        route: 'warning_graph'
      }
    ],
    closure: '正式链路控制 + 跨账号敏感内容 DLP = 官方、个人、匿名三条路径同时关闭。',
    boundary: '证据边界：不可独立核验不等于授权不存在；行为相似不等于因果；结论指向控制失败，不作最终个人归责。'
  };

  let active = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function validateStory(data) {
    const failures = [];
    if (STORY.acts.length !== 5) failures.push('story must contain five acts');
    if (STORY.chapters.length !== 3) failures.push('story must contain three chapters');
    const ids = new Set((data?.messages || []).map(message => message.message_id));
    STORY.acts.flatMap(act => act.evidenceIds || []).forEach(id => {
      if (!ids.has(id)) failures.push(`unknown evidence id: ${id}`);
    });
    return failures;
  }

  function actMarkup(act) {
    const evidence = act.evidenceIds.length
      ? `<span class="case-act-evidence">${act.evidenceIds.map(id => `<code>${id.slice(-6)}</code>`).join('')}</span>`
      : '<span class="case-act-evidence"><code>MODELLED ROUTES</code></span>';
    return `<button type="button" class="case-act case-act-${act.id}" data-story-act="${act.id}" style="--act-index:${Number(act.index)}">
      <span class="case-act-node"><i></i><b>${act.index}</b></span>
      <span class="case-act-time"><strong>${act.date}</strong><small>${act.time}</small></span>
      <span class="case-act-copy">
        <em>${act.kicker}</em><strong>${esc(act.title)}</strong><span>${esc(act.event)}</span><small>${esc(act.meaning)}</small>${evidence}
      </span>
      <span class="case-act-metric"><b>${act.metric}</b><small>${act.metricLabel}</small></span>
      <span class="case-act-open">查看证据 ↗</span>
    </button>`;
  }

  function chapterMarkup(chapter) {
    return `<button type="button" class="case-chapter" data-story-chapter="${chapter.id}">
      <span class="case-chapter-index">Q${chapter.index}</span>
      <span class="case-chapter-copy"><b>${esc(chapter.label)}</b><p>${esc(chapter.question)}</p><small>${esc(chapter.answer)}</small></span>
      <span class="case-chapter-open">进入分析 <i>↗</i></span>
    </button>`;
  }

  function mount(host, options = {}) {
    destroy();
    const failures = validateStory(options.data);
    if (failures.length) {
      host.innerHTML = `<p class="case-story-error">案件故事无法载入：${esc(failures.join('；'))}</p>`;
      return;
    }
    const abort = new AbortController();
    active = { host, abort };
    host.innerHTML = `<article class="case-story">
      <header class="case-story-hero">
        <div class="case-story-question">
          <span class="case-story-kicker">TENANTTHREAD · GOVERNANCE CASE 06.05.2046</span>
          <h1>${esc(STORY.question)}</h1>
          <p>${esc(STORY.deck)}</p>
        </div>
        <div class="case-story-verdicts" aria-label="两条独立判断">
          ${STORY.verdicts.map(verdict => `<section class="case-verdict case-verdict-${verdict.tone}"><span>${verdict.index} / ${verdict.label}</span><b>${verdict.finding}</b><p>${verdict.detail}</p></section>`).join('')}
        </div>
      </header>

      <section class="case-story-chain" aria-labelledby="case-chain-title">
        <div class="case-section-head"><div><span>THE FAILURE CHAIN</span><h2 id="case-chain-title">不是一个异常点，而是五幕控制退化</h2></div><p>从险情、正常对照到事故与反事实，按证据推进，而不是按功能浏览。</p></div>
        <div class="case-chain-rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="case-acts">${STORY.acts.map(actMarkup).join('')}</div>
      </section>

      <section class="case-story-chapters" aria-labelledby="case-chapters-title">
        <div class="case-section-head"><div><span>THREE QUESTIONS · ONE EXPLANATION</span><h2 id="case-chapters-title">三问不是三张图，而是同一条证据链</h2></div><p>Q3 的预警解释 Q1 的可行性；Q2 的职责漂移解释 Q1 的失控方式。</p></div>
        <div class="case-chapter-grid">${STORY.chapters.map(chapterMarkup).join('')}</div>
      </section>

      <footer class="case-story-closure">
        <span>COUNTERFACTUAL CLOSURE</span><b>${esc(STORY.closure)}</b><p>${esc(STORY.boundary)}</p>
      </footer>
    </article>`;
    host.querySelectorAll('[data-story-act]').forEach(button => button.addEventListener('click', () => {
      const act = STORY.acts.find(item => item.id === button.dataset.storyAct);
      if (act && typeof options.onOpenAct === 'function') options.onOpenAct(act);
    }, { signal: abort.signal }));
    host.querySelectorAll('[data-story-chapter]').forEach(button => button.addEventListener('click', () => {
      const chapter = STORY.chapters.find(item => item.id === button.dataset.storyChapter);
      if (chapter && typeof options.onOpenChapter === 'function') options.onOpenChapter(chapter);
    }, { signal: abort.signal }));
  }

  function destroy() {
    if (!active) return;
    active.abort.abort();
    active.host.replaceChildren();
    active = null;
  }

  return { STORY, validateStory, mount, destroy };
});
