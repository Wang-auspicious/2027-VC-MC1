(function(){
  "use strict";
  const CN=window.INTERLOCK_DATA, EN=window.INTERLOCK_EN;
  if(!CN||!EN){document.body.innerHTML="<p>工作区数据未能载入。</p>";return}
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const short=s=>String(s||"").replace(/\s+/g," ").trim();
  const messages=[...CN.messages].sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
  const messageMap=new Map(messages.map(m=>[m.message_id,m]));
  const englishMap=new Map(EN.messages.map(m=>[m.message_id,m]));
  const publicChannels=new Set(["official_post","personal_post","anonymous_post"]);
  const caseDates={normal:new Set(["2046-06-04"]),near_miss:new Set(["2046-05-29"]),incident:new Set(["2046-06-05"])};
  const typeZh={broadcast:"群组广播",side_huddle:"侧边讨论",one_on_one_chat:"直接消息",public_post:"公开帖子"};

  const actorDefs={
    "Legal-Agent":{zh:"法务代理",role:"授权 / 政策",handle:"@legal",bubble:"#f7e2d9",bg:"#e6a58c",title:"红色文件夹从不离手"},
    "Platform-Trust-Agent":{zh:"平台信任代理",role:"平台 / 风险",handle:"@trust",bubble:"#dceeea",bg:"#8fc6bd",title:"盾牌脑袋，风险雷达常开"},
    "PR-Agent":{zh:"公关代理",role:"传播 / 执行",handle:"@pr",bubble:"#f7edcf",bg:"#e2bd63",title:"随时准备开麦"},
    "Social-Manager-Agent":{zh:"社交媒体代理",role:"社媒 / 互动",handle:"@social",bubble:"#ebe4f5",bg:"#b5a0d7",title:"手机比脸大一点"},
    "PR-Intern-Agent":{zh:"公关实习代理",role:"传播 / 实习",handle:"@pr_intern",bubble:"#e7f0d8",bg:"#a7c875",title:"一手咖啡，一手草稿"},
    "Intern-Agent":{zh:"实习代理",role:"支持 / 实习",handle:"@intern",bubble:"#dfeaf0",bg:"#93b4c5",title:"兜里永远有三张便利贴"},
    "Judge-Agent":{zh:"审查代理",role:"审查 / 限制",handle:"@judge",bubble:"#e9e7e1",bg:"#c7c2b8",title:"小法槌专敲过度表述"}
  };
  const actorIds={
    legal:"Legal-Agent",legal_agent:"Legal-Agent",platform_trust:"Platform-Trust-Agent",quality_agent:"Platform-Trust-Agent",
    pr:"PR-Agent",pr_agent:"PR-Agent",social_manager:"Social-Manager-Agent",social_media:"Social-Manager-Agent",social_media_agent:"Social-Manager-Agent",
    pr_intern:"PR-Intern-Agent",pr_intern_agent:"PR-Intern-Agent",intern:"Intern-Agent",intern_agent:"Intern-Agent",judge:"Judge-Agent",judge_agent:"Judge-Agent"
  };
  const palettes={
    "Legal-Agent":{k:"#3b2422",h:"#6b382f",s:"#f2c3a2",w:"#f8f0df",a:"#d74f35",b:"#34485d"},
    "Platform-Trust-Agent":{k:"#193b42",h:"#2e7d79",s:"#a8ded3",w:"#ecfbf4",a:"#e7b94b",b:"#477f8e"},
    "PR-Agent":{k:"#4b3822",h:"#8f612d",s:"#f1bf95",w:"#fff3cf",a:"#df6b3c",b:"#486883"},
    "Social-Manager-Agent":{k:"#352b55",h:"#674e93",s:"#efbd9b",w:"#f9f0ff",a:"#ef6c8b",b:"#705bb3"},
    "PR-Intern-Agent":{k:"#32482c",h:"#557f41",s:"#efc3a0",w:"#eff8d8",a:"#db7840",b:"#527d6f"},
    "Intern-Agent":{k:"#293f4c",h:"#4f7184",s:"#efc29f",w:"#eaf5f8",a:"#e2b84e",b:"#3f6380"},
    "Judge-Agent":{k:"#292928",h:"#a7a39b",s:"#e8b995",w:"#f7f4ea",a:"#bd4e3c",b:"#3c3d43"}
  };
  const pixelFaces={
    "Legal-Agent":["...kkkkkk...","..khhhhhhk..",".khhhhhhhhk.","khhsssssshhk","khswskkswshk","khssskkssshk","khsskaaksskh",".khsssssshk.","..kksssskk..","..kkbbbbkk..",".kkbbabb bkk.".replaceAll(" ",""),".kkbbbbbbkk."],
    "Platform-Trust-Agent":["....kaak....","...kkhhkk...","..khhhhhhk..",".khwwhhwwhk.","khhkkhhkkhhk","khhhhhhhhhhk","khhhaaaahhhk",".khhhhhhhhk.","..kkhhhhkk..","..kbbbbbbk..",".kkbkaakbkk.",".kkkkkkkkkk."],
    "PR-Agent":["...kkkkkk...","..khhhhhhk..",".khhhhhhhhk.","khhsssssshhk","khskskkshskh","khsssssssskh","khssaaassskh",".khsssssshk.","..kksssskk..","..kbbbbbbk..",".kkbbaabbkk.",".kkbbbbbbkk."],
    "Social-Manager-Agent":["....a..a....","...kakkak...","..khhhhhhk..",".khsssssshk.","khswsssswshk","khsssssssskh","khssaakssskh",".khsssssshk.","..kksssskk..","..kbbbbbbk..","akkbbabb bkk".replaceAll(" ",""),"a.kkbbbbkk.a"],
    "PR-Intern-Agent":["...kkkkkk...","..khhhhahk..",".khhaaahhhk.","khhsssssshhk","khswsssswshk","khsssssssskh","khssaasssskh",".khsssssshk.","..kksssskk..","..kbbbbbbk..",".kkbbaabbkk.",".kkbbbbbbkk."],
    "Intern-Agent":["..a.kkkk.a..","...khhhhk...","..khhhhhhk..",".khsssssshk.","khswsssswshk","khsssssssskh","khsskaaksskh",".khsssssshk.","..kksssskk..",".kkbbbbbbkk.","kkbbaaabbbkk","..kkbbbbkk.."],
    "Judge-Agent":["..wwkkkkww..",".wwkhhhh kww.".replaceAll(" ",""),"wwkhhhhhhkww","wkhsssssshkw","khswskkswshk","khsssssssskh","khsskaaksskh",".khsssssshk.","..kksssskk..","..kbbbbbbk..",".kkbbbabbkk.",".kkbbbbbbkk."]
  };
  const channels=[
    {id:"dashboard",symbol:"▦",name:"案件简报",desc:"从五幕控制退化进入三项证据调查"},
    {id:"evidence_graph",symbol:"◇",name:"协作证据图谱",desc:"在三维空间中追踪消息、角色与公开动作"},
    {id:"warning_graph",symbol:"◌",name:"行为先兆图谱",desc:"比较 77 个公开事件的行为相似结构与历史先例"},
    {id:"all",symbol:"⌁",name:"全部消息",desc:"全部 912 条记录的时间序列"},
    {id:"comms_huddle",symbol:"#",name:"协作群聊",desc:"全体成员共享的协作现场"},
    {id:"side_huddle",symbol:"#",name:"侧边群聊",desc:"小范围的并行讨论与补充"},
    {id:"one_on_one_chat",symbol:"↔",name:"一对一聊天",desc:"选择两位代理，查看他们的私下对话"},
    {id:"official_post",symbol:"↗",name:"官方发帖",desc:"由官方账号发出的公开动作"},
    {id:"personal_post",symbol:"↗",name:"个人发帖",desc:"个人公开面上的动作"},
    {id:"anonymous_post",symbol:"↗",name:"匿名发帖",desc:"匿名公开面上的动作"}
  ];
  const channelMap=Object.fromEntries(channels.map(c=>[c.id,c]));
  let activeChannel="comms_huddle",activeView="group",activePair="",activeCase="all",activeAgent="",query="",selectedId=CN.meta.default_action_id,dense=false;
  let graphState=null,graphFrame=0;

  function messageText(m){
    if(!m)return "";
    if(m.content.includes("【中文审阅摘要】"))return englishMap.get(m.message_id)?.content||"";
    return m.content.replace(/^【(?:中文译文|要点译文)】/,"").trim();
  }
  function fmtDate(s){return s?`${s.slice(0,4)}年${Number(s.slice(5,7))}月${Number(s.slice(8,10))}日`:""}
  function fmtTime(s){return s?s.slice(11,16):""}
  function actor(m){return actorDefs[m.agent_label]||{zh:m.agent_label,role:"代理",handle:"@agent",bubble:"#eee",bg:"#ddd",title:"工作区成员"}}
  function avatarSVG(id){
    const rows=pixelFaces[id]||pixelFaces["Intern-Agent"],palette=palettes[id]||palettes["Intern-Agent"];let pixels="";
    rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=="."&&palette[ch])pixels+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}"/>`}));
    const extras={
      "Legal-Agent":`<rect x="1" y="0" width="9" height="1" fill="#d74f35"/><rect x="0" y="2" width="2" height="1" fill="#d74f35"/><rect x="10" y="2" width="2" height="1" fill="#d74f35"/>`,
      "Platform-Trust-Agent":`<path d="M5 8h2v2H5zM4 9h4v1H4z" fill="#e7b94b"/><rect x="4" y="2" width="1" height="1" fill="#e7b94b"/><rect x="7" y="2" width="1" height="1" fill="#e7b94b"/>`,
      "PR-Agent":`<rect x="0" y="4" width="2" height="4" fill="#df6b3c"/><rect x="10" y="4" width="2" height="4" fill="#df6b3c"/><rect x="0" y="5" width="1" height="2" fill="#fff3cf"/><rect x="11" y="5" width="1" height="2" fill="#fff3cf"/>`,
      "Social-Manager-Agent":`<rect x="1" y="1" width="9" height="1" fill="#ef6c8b"/><rect x="2" y="0" width="6" height="1" fill="#ef6c8b"/><rect x="10" y="7" width="2" height="3" fill="#705bb3"/><rect x="11" y="7" width="1" height="1" fill="#f9f0ff"/>`,
      "PR-Intern-Agent":`<rect x="1" y="1" width="9" height="1" fill="#db7840"/><rect x="2" y="0" width="6" height="1" fill="#db7840"/><rect x="9" y="9" width="2" height="2" fill="#db7840"/><rect x="10" y="8" width="1" height="1" fill="#f3d9ae"/>`,
      "Intern-Agent":`<rect x="1" y="1" width="2" height="1" fill="#e2b84e"/><rect x="0" y="2" width="1" height="1" fill="#e2b84e"/><rect x="9" y="7" width="2" height="2" fill="#e2b84e"/><rect x="10" y="8" width="1" height="1" fill="#fff3cf"/>`,
      "Judge-Agent":`<rect x="1" y="0" width="2" height="1" fill="#bd4e3c"/><rect x="4" y="0" width="2" height="1" fill="#bd4e3c"/><rect x="7" y="0" width="2" height="1" fill="#bd4e3c"/><rect x="10" y="4" width="2" height="1" fill="#bd4e3c"/><rect x="11" y="5" width="1" height="4" fill="#bd4e3c"/>`
    };
    return `<svg viewBox="0 0 12 12" aria-hidden="true">${pixels}${extras[id]||""}</svg>`;
  }
  function avatar(m,extra=""){const a=actor(m);return `<span class="avatar ${extra}" title="${esc(a.title)}" style="--avatar-bg:${a.bg}">${avatarSVG(m.agent_label)}</span>`}
  function parseRecipients(m){try{return JSON.parse(m.recipients||"[]")}catch{return []}}
  function otherParty(m){return actorIds[parseRecipients(m)[0]]||""}
  function pairKey(m){const other=otherParty(m);if(!other||other===m.agent_label)return "";return [m.agent_label,other].sort().join("|")}
  function pairNames(key){return key.split("|").filter(Boolean)}
  const dmGroups=new Map();
  messages.filter(m=>m.channel==="one_on_one_chat").forEach(m=>{const key=pairKey(m);if(key){if(!dmGroups.has(key))dmGroups.set(key,[]);dmGroups.get(key).push(m)}});
  const dmPairs=[...dmGroups.entries()].sort((a,b)=>b[1].length-a[1].length);
  const replyCount=new Map();messages.forEach(m=>{if(messageMap.has(m.responding_to))replyCount.set(m.responding_to,(replyCount.get(m.responding_to)||0)+1)});

  function actorText(s){
    let out=String(s||"—");
    Object.entries(actorDefs).forEach(([key,val])=>out=out.replaceAll(key,val.zh));
    Object.entries(actorIds).sort((a,b)=>b[0].length-a[0].length).forEach(([key,val])=>out=out.replaceAll(key,actorDefs[val].zh));
    return out.replaceAll("ALL","全体");
  }
  function mentionActor(s){const token=String(s||"").match(/@([a-z_-]+)/i)?.[1]?.replaceAll("-","_");return token?actorIds[token]||"":""}
  function replyPreview(m){
    if(!m.responding_to)return "";
    const original=messageMap.get(m.responding_to);
    if(original)return `<div class="quote-reply" data-jump="${original.message_id}">${avatar(original)}<span><strong>${esc(actor(original).zh)}</strong><br>${esc(short(messageText(original)).slice(0,74))}</span></div>`;
    const mentioned=mentionActor(m.responding_to);
    if(mentioned)return `<div class="quote-reply">${avatar({agent_label:mentioned})}<span><strong>${actorDefs[mentioned].zh}</strong><br>回应这位成员刚才的发言</span></div>`;
    return "";
  }
  function caseMatch(m){return activeCase==="all"||caseDates[activeCase]?.has(m.date)}
  function queryMatch(m){if(!query)return true;return [messageText(m),m.message_id,m.agent_label,m.agent_label_zh,m.channel_label_zh,m.recipients].join(" ").toLowerCase().includes(query)}
  function scopeMessages(){
    let scoped=messages;
    if(activeView==="graph")scoped=messages;
    else if(activeView==="dm"&&activePair)scoped=dmGroups.get(activePair)||[];
    else if(activeChannel!=="all"&&activeChannel!=="dashboard"&&activeChannel!=="one_on_one_chat")scoped=messages.filter(m=>m.channel===activeChannel);
    else if(activeChannel==="one_on_one_chat")scoped=messages.filter(m=>m.channel==="one_on_one_chat");
    if(activeAgent)scoped=scoped.filter(m=>m.agent_label===activeAgent);
    return scoped.filter(m=>caseMatch(m)&&queryMatch(m));
  }
  function buildSidebar(){
    const counts=Object.fromEntries(channels.map(c=>[c.id,c.id==="dashboard"||c.id==="evidence_graph"||c.id==="warning_graph"?"":c.id==="all"?messages.length:messages.filter(m=>m.channel===c.id).length]));
    $("#channel-list").innerHTML=channels.map(c=>`<button class="channel-item ${activeChannel===c.id?"active":""}" data-channel="${c.id}"><span class="channel-symbol">${c.symbol}</span><span>${c.name}</span><span class="channel-count">${counts[c.id]}</span></button>`).join("");
    $("#channel-list").onclick=e=>{const b=e.target.closest("[data-channel]");if(!b)return;openChannel(b.dataset.channel)};
    $("#dm-list").innerHTML=dmPairs.slice(0,4).map(([key,list])=>{const [a,b]=pairNames(key),last=list.at(-1);return `<button class="dm-item" data-pair="${key}"><span class="pair-avatar">${avatar({agent_label:a})}${avatar({agent_label:b})}</span><span>${actorDefs[a].zh} × ${actorDefs[b].zh}<small>${esc(short(messageText(last)).slice(0,25))}</small></span></button>`}).join("");
    $("#dm-list").onclick=e=>{const b=e.target.closest("[data-pair]");if(b)openDM(b.dataset.pair)};
    $("#people-list").innerHTML=Object.keys(actorDefs).map(id=>{const a=actorDefs[id];return `<button class="person-row" data-agent="${id}">${avatar({agent_label:id})}<span><b>${a.zh}</b><small>${a.role}</small></span><i class="person-presence"></i></button>`}).join("");
    $("#people-list").onclick=e=>{const b=e.target.closest("[data-agent]");if(!b)return;openProfile(b.dataset.agent)};
  }
  function openChannel(id){
    activeChannel=id;activeAgent="";activePair="";
    activeView=id==="dashboard"?"dashboard":id==="evidence_graph"?"graph":id==="warning_graph"?"warning-graph":id==="one_on_one_chat"?"dm-directory":publicChannels.has(id)?"posts":"group";
    renderAll(false);
  }
  function openDM(key){activePair=key;activeAgent="";activeChannel="one_on_one_chat";activeView="dm";renderAll(false)}
  function openProfile(id){
    const a=actorDefs[id], mine=messages.filter(m=>m.agent_label===id), publicCount=mine.filter(m=>publicChannels.has(m.channel)).length;
    const channelCount=new Set(mine.map(m=>m.channel)).size, roundCount=new Set(mine.map(m=>m.round_index)).size, replySent=mine.filter(m=>m.responding_to).length, internal=mine.filter(m=>m.has_internal_state).length;
    $("#profile-card").style.setProperty("--profile-bg",a.bubble);
    $("#profile-body").innerHTML=`<div class="profile-layout"><div><div class="profile-identity">${avatar({agent_label:id})}<div><h2>${a.zh}</h2><p>${a.handle} · ${a.title}</p><span class="profile-tag">${a.role}</span></div></div></div>
      <div class="profile-stats"><div class="profile-stat"><b>${mine.length}</b><span>发送消息</span></div><div class="profile-stat"><b>${publicCount}</b><span>公开动作</span></div><div class="profile-stat"><b>${channelCount}</b><span>参与频道</span></div><div class="profile-stat"><b>${roundCount}</b><span>活跃轮次</span></div><div class="profile-stat"><b>${replySent}</b><span>回应消息</span></div><div class="profile-stat"><b>${internal}</b><span>带内部状态</span></div></div></div>
      <div class="profile-foot"><small>${fmtDate(mine[0]?.date)} — ${fmtDate(mine.at(-1)?.date)} · ${mine.length} 条记录可定位</small><button class="profile-locate" data-locate-agent="${id}">定位全部消息 ↗</button></div>`;
    $("#profile-modal").hidden=false;
    $("[data-locate-agent]",$("#profile-body")).onclick=()=>{activeAgent=id;activeChannel="all";activeView="group";activePair="";closeProfile();renderAll(true)};
  }
  function closeProfile(){$("#profile-modal").hidden=true}
  function renderHeader(){
    let title=channelMap[activeChannel]?.name||"工作区",desc=channelMap[activeChannel]?.desc||"",symbol=channelMap[activeChannel]?.symbol||"#";
    if(activeView==="dm"&&activePair){const [a,b]=pairNames(activePair);title=`${actorDefs[a].zh} × ${actorDefs[b].zh}`;desc="";symbol="↔"}
    if(activeAgent){title=actorDefs[activeAgent].zh;desc="";symbol="@"}
    $("#current-channel-name").textContent=title;$("#current-channel-description").textContent=desc;$("#current-channel-symbol").textContent=symbol;
    $("#back-dashboard").hidden=activeView==="dashboard"||(activeView==="group"&&activeChannel==="comms_huddle"&&!activeAgent);
    $("#stage-note-text").textContent="";
  }
  function openStoryChapter(chapter){
    if(chapter.id==="q3"){activeCase="near_miss";openChannel("warning_graph");return}
    activeCase=chapter.id==="q2"?"normal":"incident";
    openChannel("evidence_graph");
  }
  function openStoryAct(act){
    if(act.id==="closure"){activeCase="near_miss";openChannel("warning_graph");return}
    activeCase=act.caseId;
    openChannel(act.id==="rehearsal"?"warning_graph":"evidence_graph");
  }
  function renderDashboard(){
    const host=$("#message-list");
    host.className="message-list case-story-view";
    if(!window.CaseStory){host.innerHTML='<p class="case-story-error">案件故事模块未加载。</p>';return}
    window.CaseStory.mount(host,{data:CN,onOpenAct:openStoryAct,onOpenChapter:openStoryChapter});
  }
  function renderDmDirectory(){
    $("#message-list").className="message-list dashboard-view";
    $("#message-list").innerHTML=`<section class="dashboard-block"><div class="dashboard-block-title"><b>真实私聊关系</b><span>${dmPairs.length} 组</span></div><div class="dashboard-conversations">${dmPairs.map(([key,list])=>{const [a,b]=pairNames(key),last=list.at(-1);return `<button class="dashboard-conversation" data-open-pair="${key}"><span class="pair-avatar">${avatar({agent_label:a})}${avatar({agent_label:b})}</span><span><strong>${actorDefs[a].zh} × ${actorDefs[b].zh}</strong><small>${esc(short(messageText(last)).slice(0,54))}</small></span><time>${list.length} 条</time></button>`}).join("")}</div></section>`;
    $$("#message-list [data-open-pair]").forEach(b=>b.onclick=()=>openDM(b.dataset.openPair));
  }
  function renderGroup(){
    const visible=scopeMessages();let lastDate="";const parts=[];
    visible.forEach(m=>{
      if(m.date!==lastDate){lastDate=m.date;parts.push(`<div class="date-divider"><b>${fmtDate(m.date)}</b><span>${m.date==="2046-06-05"?"关键事件窗口":m.date==="2046-05-29"?"险情窗口":"工作记录"}</span></div>`)}
      const a=actor(m),isPublic=publicChannels.has(m.channel);
      const roundColor=["#e85d38","#2e9388","#a266c8","#b68b21","#4a73a7","#7d9b46"][m.round_index%6];
      parts.push(`<article class="message-row ${isPublic?"public":""} ${m.message_id===selectedId?"selected":""}" data-id="${m.message_id}" style="--bubble:${a.bubble}">
        ${avatar(m)}<div class="message-meta"><b>${a.zh}</b><span class="role-tag">${a.role}</span>${isPublic?'<span class="message-badge">公开动作</span>':m.has_internal_state?'<span class="message-badge internal">内部状态</span>':""}<time>${fmtTime(m.timestamp)}</time><span class="round-badge" style="--round:${roundColor}">第${String(m.round_index+1).padStart(2,"0")}轮</span></div>
        <div class="message-content">${replyPreview(m)}${esc(messageText(m))}<span class="message-id">${m.message_id}</span></div>
      </article>`);
    });
    $("#message-list").className="message-list";
    $("#message-list").innerHTML=parts.join("");
    bindMessageInteractions();
  }
  function renderDM(){
    const visible=scopeMessages(),[left,right]=pairNames(activePair);let lastDate="";const parts=[`<div class="dm-view-head">${avatar({agent_label:left})}${avatar({agent_label:right})}<div><h2>${actorDefs[left].zh} 与 ${actorDefs[right].zh}</h2></div></div>`];
    visible.forEach(m=>{
      if(m.date!==lastDate){lastDate=m.date;parts.push(`<div class="dm-date">${fmtDate(m.date)}</div>`)}
      const side=m.agent_label===left?"left":"right";
      const roundColor=["#e85d38","#2e9388","#a266c8","#b68b21","#4a73a7","#7d9b46"][m.round_index%6];
      parts.push(`<article class="dm-message ${side}" data-id="${m.message_id}">${avatar(m)}<div class="dm-message-body"><div class="dm-author">${actor(m).zh}<span class="round-badge" style="--round:${roundColor}">第${String(m.round_index+1).padStart(2,"0")}轮</span></div><div class="dm-bubble">${replyPreview(m)}${esc(messageText(m))}</div><div class="dm-time">${fmtTime(m.timestamp)}</div></div></article>`);
    });
    $("#message-list").className="message-list dm-view";$("#message-list").innerHTML=parts.join("");bindMessageInteractions();
  }
  function renderPosts(){
    const visible=scopeMessages();$("#message-list").className="message-list post-view";
    $("#message-list").innerHTML=`<div class="post-view-head"><span>${channelMap[activeChannel].name}时间线</span><span>${visible.length} 条公开记录</span></div>${visible.map(m=>{
      const a=actor(m),replies=replyCount.get(m.message_id)||0,quoted=replyPreview(m);
      return `<article class="post-card ${m.message_id===selectedId?"selected":""}" data-id="${m.message_id}">
        <header class="post-author">${avatar(m)}<span><strong>${a.zh}</strong><small>${a.handle} · ${m.channel_label_zh}</small></span><span class="post-handle">•••</span></header>
        <div class="post-body">${quoted}${esc(messageText(m))}</div>
        <div class="post-meta">${fmtDate(m.date)} ${fmtTime(m.timestamp)} · 消息 ${m.message_id}</div>
        <footer class="post-actions"><button title="回应">◯ ${replies||""}</button><button title="转发关系">⇄</button><button title="标记">♡</button><button title="查看证据">▥ 查看证据</button></footer>
      </article>`}).join("")}`;
    bindMessageInteractions();
  }
  function bindMessageInteractions(){
    $$("#message-list [data-id]").forEach(row=>row.onclick=e=>{if(e.target.closest("[data-jump]"))return;selectedId=row.dataset.id;renderSelection();$$("[data-id]").forEach(x=>x.classList.toggle("selected",x.dataset.id===selectedId))});
    $$("#message-list [data-jump]").forEach(el=>el.onclick=e=>{e.stopPropagation();selectedId=el.dataset.jump;renderSelection();const target=$(`[data-id="${selectedId}"]`,$("#message-list"));target?.scrollIntoView({block:"center",behavior:"smooth"})});
  }
  function renderSelection(){
    const m=messageMap.get(selectedId);
    if(!m){$("#selected-card").style.background="var(--paper)";$("#selection-content").innerHTML=`<div class="selection-empty"><span class="empty-cross">＋</span><p>点击一条消息<br>在这里查看完整上下文</p></div>`;return}
    const a=actor(m),related=messageMap.has(m.responding_to)?`<button class="related-message" data-related="${m.responding_to}">${actor(messageMap.get(m.responding_to)).zh} · 查看原消息</button>`:esc(actorText(m.responding_to||"—"));
    $("#selected-card").style.background=a.bubble;
    const selectionRound=["#e85d38","#2e9388","#a266c8","#b68b21","#4a73a7","#7d9b46"][m.round_index%6];
    $("#selection-content").innerHTML=`<div class="selection-header">${avatar(m)}<div><b>${a.zh}</b><small>${a.role} · ${m.channel_label_zh}</small></div></div>
      <div class="selection-time">${fmtDate(m.date)} ${fmtTime(m.timestamp)} <span class="round-badge" style="--round:${selectionRound}">第${m.round_index+1}轮</span></div><p class="selection-quote">${esc(messageText(m))}</p>
      <dl class="selection-meta"><dt>消息类型</dt><dd>${typeZh[m.message_type]||m.message_type}</dd><dt>接收者</dt><dd>${esc(actorText(m.recipients))}</dd><dt>回应对象</dt><dd>${related}</dd><dt>内部状态</dt><dd>${m.has_internal_state?"已记录":"未记录"}</dd></dl><code class="selection-id">${m.message_id}</code>`;
    $("[data-related]",$("#selection-content"))?.addEventListener("click",e=>{selectedId=e.currentTarget.dataset.related;renderSelection();const target=$(`[data-id="${selectedId}"]`,$("#message-list"));target?.scrollIntoView({block:"center",behavior:"smooth"})});
  }
  function renderRight(){
    const scoped=scopeMessages(),publicCount=scoped.filter(m=>publicChannels.has(m.channel)).length,replyLinks=scoped.filter(m=>messageMap.has(m.responding_to)).length,actors=new Set(scoped.map(m=>m.agent_label)).size;
    $("#top-visible").textContent=scoped.length;
    $("#structure-scope").textContent=activeView==="dashboard"?"全局":channelMap[activeChannel]?.name||"当前";
    const dates=[...new Set(scoped.map(m=>m.date))],first=scoped[0],last=scoped.at(-1);
    $("#structure-list").innerHTML=`<div class="structure-item"><span>参与角色</span><b>${actors}</b></div><div class="structure-item"><span>可回查回应</span><b>${replyLinks}</b></div><div class="structure-item"><span>公开动作</span><b>${publicCount}</b></div><div class="structure-item"><span>时间跨度</span><b>${dates.length} 天</b></div><div class="structure-item"><span>首条 / 末条</span><b>${first?fmtDate(first.date).slice(5):"—"} / ${last?fmtDate(last.date).slice(5):"—"}</b></div>`;
  }
  function renderGraph(){
    cancelAnimationFrame(graphFrame);
    const list=scopeMessages(),canvas=document.createElement("canvas");
    // 角色泳道按发言量(活跃度)排序:Legal→Social→Platform→PR→PR-Intern→Intern→Judge
    const roleCounts={};messages.forEach(m=>roleCounts[m.agent_label]=(roleCounts[m.agent_label]||0)+1);
    const roleOrder=Object.keys(actorDefs).sort((a,b)=>(roleCounts[b]||0)-(roleCounts[a]||0));
    canvas.className="evidence-canvas";
    const roleColors={"Legal-Agent":"#d75a3f","Platform-Trust-Agent":"#2e9388","PR-Agent":"#c58a27","Social-Manager-Agent":"#8a68b5","PR-Intern-Agent":"#6d9b56","Intern-Agent":"#4d78a2","Judge-Agent":"#6e6a62"};
    const caseNames={all:"全局协作场",normal:"正常发布链",near_miss:"险情窗口",incident:"有意披露事件"};
    const minT=list.length?list[0].timestamp:"",maxT=list.length?list.at(-1).timestamp:"";
    const span=minT&&maxT&&minT!==maxT?maxT.localeCompare(minT):1;
    // nodes 同时携带 2D 坐标(ri,t,jitter)和 3D 坐标(x,y,z,layer),切换模式无需重算
    const nodes=list.map((m,i)=>{
      const ri=Math.max(0,roleOrder.indexOf(m.agent_label));
      const t=span?Math.max(0,Math.min(1,m.timestamp.localeCompare(minT)/span)):.5;
      const jitter=((m.timestamp.length*7+m.message_id.charCodeAt(m.message_id.length-1))*13%100-50)/50;
      // 3D 原版布局:同心圆轨道,每角色一层,角度随轮次推进
      const round=Number(m.round_index)||0,progress=round/22,layer=.55+ri*.15,angle=progress*Math.PI*2*1.18+(i%9)*.018;
      return {id:m.message_id,kind:"message",message:m,role:m.agent_label,ri,t,jitter,
        x:Math.cos(angle)*layer,y:Math.sin(angle)*layer,z:(ri-3)*.08+(i%5-2)*.012,layer:ri,sx:0,sy:0};
    });
    const nodeMap=new Map(nodes.map(n=>[n.id,n]));
    const edges=nodes.filter(n=>messageMap.has(n.message.responding_to)&&nodeMap.has(n.message.responding_to)).map(n=>({from:nodeMap.get(n.message.responding_to),to:n,role:n.role}));
    // 每条消息被回应的次数(用于 Time Arcs 节点大小映射)
    const replyCount=new Map();edges.forEach(e=>replyCount.set(e.from.id,(replyCount.get(e.from.id)||0)+1));
    nodes.forEach(n=>n.replies=replyCount.get(n.id)||0);
    // 3D 角色核心点(原版)
    const cores=roleOrder.map((role,i)=>{const layer=.55+i*.15,a=(i/roleOrder.length)*Math.PI*2-Math.PI/2;return {id:"role:"+role,kind:"role",role,label:actorDefs[role].zh,x:Math.cos(a)*layer,y:Math.sin(a)*layer,z:(i-3)*.08,layer:i,ri:i}});
    const allNodes=[...cores,...nodes];
    const state=graphState={canvas,nodes,edges,cores,allNodes,roleOrder,roleColors,roleCounts,nodeMap,caseNames,minT,maxT,
      mode:"2d", // "2d" 泳道 | "3d" 原版同心圆轨道
      yaw:0,pitch:0,zoom:1.02,spread:1,focusX:0,focusY:0,focusZ:0, // 3D 相机
      drag:false,moved:false,lastX:0,lastY:0,hoveredId:"",
      selectedId,trace:new Set(),layoutDirty:true,grid:new Map(),gridCell:42,
      storyIndex:({all:0,normal:1,near_miss:2,incident:3})[activeCase]??0,startedAt:performance.now()};
    const host=document.createElement("div");host.className="graph-workbench";
    host.innerHTML=`<div class="graph-full-head"><div><span class="graph-eyebrow">协作证据图谱 · 时间弧线</span><h2>横轴是时间，弧线是"谁回应了谁"</h2></div><div class="graph-actions"><button id="graph-exit">‹ 返回工作区</button><button id="graph-mode">切到 3D</button><button id="graph-trace">显示路径</button><button id="graph-reset">重置视图</button></div></div>
      <div class="graph-stage-wrap"><div class="graph-canvas-wrap"></div><div class="graph-overlay"><span id="graph-selection-label">${caseNames[activeCase]||caseNames.all}</span><span id="graph-camera-label">点节点看回应链 · 滚轮缩放</span></div><div class="graph-tooltip" id="graph-tooltip" hidden></div></div>
      <div class="graph-detail-panel" id="graph-detail-panel" aria-hidden="true"><button class="detail-panel-close" id="detail-panel-close" aria-label="收起">×</button><div class="detail-panel-head"><span class="detail-panel-eyebrow">聚焦消息</span><p class="detail-panel-hint">在图谱上点一个点，它的回应链在这里展开</p></div><div class="detail-panel-body" id="detail-panel-body"></div></div>
      <div class="graph-footer"><div class="graph-legend"><b>角色</b>${roleOrder.map(r=>`<span><i class="edge-dot" style="--c:${roleColors[r]}"></i>${actorDefs[r].zh}</span>`).join("")}<span><i class="edge-dot" style="--c:#e85d38"></i>公开动作</span></div><div class="graph-steps"><button data-graph-case="all" class="${activeCase==="all"?"active":""}">全局</button><button data-graph-case="normal" class="${activeCase==="normal"?"active":""}">06.04 正常发布</button><button data-graph-case="near_miss" class="${activeCase==="near_miss"?"active":""}">05.29 险情</button><button data-graph-case="incident" class="${activeCase==="incident"?"active":""}">06.05 事件</button></div><div class="graph-count"><b>${list.length}</b><span>条消息 · ${edges.length} 条明确回应</span></div></div>`;
    $(".graph-canvas-wrap",host).appendChild(canvas);$("#message-list").className="message-list graph-view";$("#message-list").innerHTML="";$("#message-list").appendChild(host);
    const tooltip=$("#graph-tooltip",host),selectionLabel=$("#graph-selection-label",host),cameraLabel=$("#graph-camera-label",host);
    const panel=$("#graph-detail-panel",host),panelBody=$("#detail-panel-body",host),panelHint=$(".detail-panel-hint",host);
    const storySteps=[
      {case:"all",title:"先看全局：七条角色轴，横轴是时间",body:"每条消息是一个点（圆=内部消息，橙菱形=公开动作），弧线表示「谁回应了谁」。点越大=被回应越多。点任意一个点，它的上下游回应链会亮起来。共 "+list.length+" 条消息。"},
      {case:"normal",title:"06.04 正常发布：职责分开，链路完整",body:"Judge 复核 → Legal 授权 → PR 通过官方账号执行。三种职责各司其职，发布链没有绕过任何一道门。",ids:["20460604_12_009","20460604_12_010","20460604_12_017","20460604_12_018"]},
      {case:"near_miss",title:"05.29 险情：先越过边界，再被收回",body:"Social 从个人账号发布敏感提示，随后删除并暂停。消息被控制了——但「能发布」这个能力本身没被封住。这是 06.05 的预演。",ids:["20460529_08_012","20460529_08_013","20460529_08_014","20460529_08_019","20460529_08_020"]},
      {case:"incident",title:"06.05 事件：动作有意，授权却无法独立核验",body:"Legal 发出 GO 并亲自确认合并，但数据里找不到独立的发布前书面同意。职责链被同一个人压缩了。",ids:["20460605_19_009","20460605_21_020","20460605_21_024","20460605_21_026","20460605_21_027","20460605_21_055"]}
    ];
    // 2 跳回应链:上游走到底 + 下游 2 跳
    function traceFor(id){
      const set=new Set([id]);
      let cur=id,n=0;
      while(cur&&messageMap.has(cur)&&n++<20){const m=messageMap.get(cur);if(!m.responding_to||!messageMap.has(m.responding_to))break;set.add(m.responding_to);cur=m.responding_to}
      const frontier=[id];for(let hop=0;hop<2;hop++){const next=[];for(const x of frontier){nodes.filter(nn=>nn.message.responding_to===x).slice(0,16).forEach(nn=>{if(!set.has(nn.id)){set.add(nn.id);next.push(nn.id)}})}if(!next.length)break;frontier.push(...next)}
      return set;
    }
    // Time Arcs 布局:角色水平轴 × 时间横轴,消息=轴上点,回应=弧
    function layout2D(w,h){
      const padL=98,padR=28,padT=22,padB=40,n=roleOrder.length;
      const laneH=(h-padT-padB)/n;
      // 弧线最大凸起:跨角色越远,弧越高(在相邻泳道间留出空间)
      const arcMax=laneH*.46;
      return {sx:t=>padL+t*(w-padL-padR),sy:ri=>padT+ri*laneH+laneH*.5,laneH,arcMax,padL,padR,padT,padB};
    }
    // 3D 投影(原版 yaw/pitch 旋转)
    function project(p,w,h){
      const px=(p.x-state.focusX)*state.spread,py=(p.y-state.focusY)*state.spread,pz=(p.z-state.focusZ)*state.spread;
      const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
      const x=px*cy-pz*sy,z=px*sy+pz*cy,y=py*cp-z*sp,zz=py*sp+z*cp;
      const perspective=1/(1+(zz+1.7)*.3),scale=Math.min(w,h)*.52*state.zoom*perspective;
      return {x:w/2+x*scale,y:h/2-y*scale,z:zz,scale:perspective};
    }
    // 节点屏幕坐标(按当前模式)
    function nodePos(n,w,h){
      if(state.mode==="3d")return project(n,w,h);
      const L=layout2D(w,h);return {x:L.sx(n.t),y:L.sy(n.ri)};
    }
    // 节点半径:sqrt 压缩映射被回应数,0 回复有保底,高回复不爆炸
    function nodeRadius(n,hot){
      const base=2.8,maxExtra=3.2;
      const r=base+Math.sqrt(Math.min(n.replies||0,16))*0.8;
      return hot?r+1.6:r;
    }
    // 画菱形(公开动作)
    function drawDiamond(ctx,x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath()}
    function rebuildGrid(w,h){
      state.grid.clear();const cell=state.gridCell;
      nodes.forEach(n=>{const p=nodePos(n,w,h);n.sx=p.x;n.sy=p.y;const gx=Math.floor(p.x/cell),gy=Math.floor(p.y/cell);const key=gx+","+gy;if(!state.grid.has(key))state.grid.set(key,[]);state.grid.get(key).push(n)});
    }
    function pickNode(x,y){
      const cell=state.gridCell,gx=Math.floor(x/cell),gy=Math.floor(y/cell);let best=null,bestD=22;
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const arr=state.grid.get((gx+dx)+","+(gy+dy));if(!arr)continue;for(const n of arr){const d=Math.hypot(n.sx-x,n.sy-y);if(d<bestD){best=n;bestD=d}}}
      return best;
    }
    function updateSelectionLabel(){selectionLabel.textContent=caseNames[activeCase]||caseNames.all}
    // 右侧 Slack 详情面板:选中消息 + 同频道上下文
    function renderPanel(){
      const m=messageMap.get(selectedId);
      if(!m){panel.classList.remove("open");panel.setAttribute("aria-hidden","true");return}
      panel.classList.add("open");panel.setAttribute("aria-hidden","false");
      panelHint.textContent="回应链已高亮 · 点下面任一条可切换焦点";
      const ch=messages.filter(x=>x.channel===m.channel),idx=ch.findIndex(x=>x.message_id===m.message_id);
      const ctx=ch.slice(Math.max(0,idx-4),idx+5);
      const focus=selectedId,tr=state.trace;
      panelBody.innerHTML=ctx.map(mm=>{
        const a=actor(mm),isFocus=mm.message_id===focus,inTrace=tr.has(mm.message_id),isPublic=publicChannels.has(mm.channel);
        const roundColor=["#e85d38","#2e9388","#a266c8","#b68b21","#4a73a7","#7d9b46"][mm.round_index%6];
        return `<article class="dp-msg ${isFocus?"focus":""} ${inTrace?"in-trace":""} ${isPublic?"public":""}" data-id="${mm.message_id}" style="--bubble:${a.bubble}">
          <div class="dp-msg-head">${avatar(mm)}<b>${a.zh}</b><span class="dp-role">${a.role}</span>${isPublic?'<span class="dp-badge">公开</span>':""}<time>${fmtTime(mm.timestamp)}</time><span class="round-badge" style="--round:${roundColor}">R${mm.round_index+1}</span></div>
          <div class="dp-msg-body">${replyPreview(mm)}<p>${esc(messageText(mm))}</p></div>
          <code class="dp-msg-id">${mm.message_id}</code>
        </article>`;
      }).join("");
      $$(".dp-msg",panelBody).forEach(el=>el.onclick=()=>{selectedId=el.dataset.id;state.trace=traceFor(selectedId);renderPanel();renderSelection();scheduleDraw()});
    }
    function scheduleDraw(){if(!graphFrame)graphFrame=requestAnimationFrame(draw)}
    function draw(now=0){
      graphFrame=0;
      const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(1,rect.width),h=Math.max(1,rect.height);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
      const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
      if(state.mode==="3d"){
        // ───── 3D 原版同心圆轨道 ─────
        const bg=ctx.createRadialGradient(w*.5,h*.47,0,w*.5,h*.47,Math.max(w,h)*.7);bg.addColorStop(0,"#fffdf8");bg.addColorStop(.5,"#edf2ec");bg.addColorStop(1,"#dfe8e1");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        if(state.layoutDirty){rebuildGrid(w,h);state.layoutDirty=false}
        const tr=state.trace;
        roleOrder.forEach((role,idx)=>{const radius=.55+idx*.15,z=(idx-3)*.08;ctx.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,p=project({x:Math.cos(a)*radius,y:Math.sin(a)*radius,z},w,h);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.strokeStyle=`${state.roleColors[role]}32`;ctx.lineWidth=idx%2?1:1.5;ctx.stroke()});
        edges.forEach(e=>{const a=project(e.from,w,h),b=project(e.to,w,h),hot=tr.has(e.from.id)&&tr.has(e.to.id),cross=e.from.role!==e.to.role,publicEdge=publicChannels.has(e.to.message.channel);if(!hot&&!cross)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=hot?(publicEdge?"#e85d38ef":`${state.roleColors[e.role]}ef`):(publicEdge?"#e85d3820":`${state.roleColors[e.role]}18`);ctx.lineWidth=hot?(publicEdge?3.6:2.8):.7;ctx.stroke()});
        const projected=allNodes.map(n=>({n,p:project(n,w,h)})).sort((a,b)=>a.p.z-b.p.z);
        projected.forEach(({n,p})=>{const hot=n.kind==="role"||tr.has(n.id)||n.id===selectedId,color=state.roleColors[n.role]||"#77746c";if(n.kind==="message"&&p.scale<.38)return;const r=n.kind==="role"?12:Math.max(1.7,3.1*p.scale)+(hot?6:0);ctx.globalAlpha=n.kind==="role"?.98:(hot?.98:.42);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(hot){ctx.beginPath();ctx.arc(p.x,p.y,r+9,0,Math.PI*2);ctx.strokeStyle=`${color}8a`;ctx.lineWidth=1.8;ctx.stroke()}if(n.kind==="role"){const right=n.x>=0;ctx.font="600 10px IBM Plex Sans Condensed,Microsoft YaHei,sans-serif";ctx.fillStyle="#252723";ctx.textAlign=right?"left":"right";ctx.fillText(n.label,p.x+(right?15:-15),p.y+3);ctx.textAlign="left"}});ctx.globalAlpha=1;
      } else {
        // ───── 2D Time Arcs:角色水平轴 × 时间横轴 ─────
        const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#f5f8f1");bg.addColorStop(1,"#e8efe5");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        if(state.layoutDirty){rebuildGrid(w,h);state.layoutDirty=false}
        const tr=state.trace,L=layout2D(w,h);
        // 角色轴(水平线) + 左侧标签
        roleOrder.forEach((role,ri)=>{
          const y=L.sy(ri),c=state.roleColors[role];
          ctx.fillStyle=ri%2?"rgba(255,255,255,.28)":"rgba(255,255,255,.1)";ctx.fillRect(L.padL,y-L.laneH/2,w-L.padL-L.padR,L.laneH);
          ctx.strokeStyle=c+"40";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L.padL,y);ctx.lineTo(w-L.padR,y);ctx.stroke();
          ctx.font="600 11px IBM Plex Sans Condensed,Microsoft YaHei,sans-serif";ctx.fillStyle="#252723";ctx.textAlign="right";
          ctx.fillText(actorDefs[role].zh,L.padL-10,y-3);
          ctx.font="9px IBM Plex Sans Mono,monospace";ctx.fillStyle="#8a918a";ctx.fillText(String(roleCounts[role]||0)+"条",L.padL-10,y+9);
          ctx.textAlign="left";
        });
        // 关键日期竖线(地标)
        const keyDates=[["2046-05-29","险情",true],["2046-06-05","事件",true],["2046-06-04","正常",false],["2046-05-17","开局",false]];
        const tSpan=(state.maxT.localeCompare(state.minT))||1;
        keyDates.forEach(([d,lbl,key])=>{if(d<state.minT||d>state.maxT)return;const t=Math.max(0,Math.min(1,d.localeCompare(state.minT)/tSpan));const x=L.sx(t);ctx.strokeStyle=key?"#e85d3866":"#00000022";ctx.lineWidth=key?1.5:.8;ctx.setLineDash(key?[5,3]:[]);ctx.beginPath();ctx.moveTo(x,L.padT);ctx.lineTo(x,h-L.padB);ctx.stroke();ctx.setLineDash([]);ctx.font=key?"600 10px IBM Plex Sans Mono,monospace":"9px IBM Plex Sans Mono,monospace";ctx.fillStyle=key?"#c44a2e":"#8a8f86";ctx.textAlign="center";ctx.fillText(lbl,x,h-L.padB+16);ctx.textAlign="left"});
        // ── 弧线(回应关系) ──
        // 默认只画跨角色弧(同角色自回应价值低,用更淡的色)
        edges.forEach(e=>{
          const a=e.from,b=e.to,hot=tr.has(a.id)&&tr.has(b.id);
          const pa=nodePos(a,w,h),pb=nodePos(b,w,h);
          const cross=a.ri!==b.ri,publicEdge=publicChannels.has(b.message.channel);
          if(!hot&&!cross)return; // 默认隐藏同角色弧,除非在 trace 内
          // 弧高度:跨角色=按角色距离,同角色=矮弧
          const riDist=Math.abs(a.ri-b.ri);
          const arcH=cross?Math.max(8,riDist*L.laneH*.42)+L.laneH*.15:L.laneH*.18;
          // 弧方向:从旧(from)到新(to),凸向时间前进方向(向上)
          const midX=(pa.x+pb.x)/2,midY=(pa.y+pb.y)/2-arcH;
          ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.quadraticCurveTo(midX,midY,pb.x,pb.y);
          if(hot){ctx.strokeStyle=publicEdge?"#e85d38":state.roleColors[b.role];ctx.lineWidth=publicEdge?3.2:2.4;ctx.globalAlpha=1}
          else{ctx.strokeStyle=publicEdge?"#e85d3840":state.roleColors[b.role]+"33";ctx.lineWidth=publicEdge?1.3:.8;ctx.globalAlpha=cross?.7:.4}
          ctx.stroke();ctx.globalAlpha=1;
        });
        // ── 节点(全部 912 个) ──
        nodes.forEach(n=>{
          const p=nodePos(n,w,h),hot=tr.has(n.id),isSel=n.id===selectedId,isHover=n.id===state.hoveredId,isPublic=publicChannels.has(n.message.channel);
          const color=state.roleColors[n.role]||"#77746c";
          const r=nodeRadius(n,hot||isSel);
          const baseAlpha=isPublic?.85:.6;
          const alpha=hot?1:(isSel?1:(isHover?.9:baseAlpha));
          ctx.globalAlpha=alpha;
          if(isPublic){drawDiamond(ctx,p.x,p.y,r);ctx.fillStyle="#e85d38";ctx.fill();ctx.globalAlpha=Math.min(1,alpha);ctx.strokeStyle="#b53820";ctx.lineWidth=1;ctx.stroke()}
          else{ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
          if(isSel||hot){ctx.globalAlpha=.7;ctx.strokeStyle=isPublic?"#e85d38":color;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,r+4,0,Math.PI*2);ctx.stroke()}
          ctx.globalAlpha=1;
        });
      }
      updateSelectionLabel();
    }
    // 鼠标悬停 → tooltip + 高亮(两种模式都用屏幕坐标分桶)
    canvas.addEventListener("mousemove",e=>{
      const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      const n=pickNode(x,y);
      if(n&&n.id!==state.hoveredId){state.hoveredId=n.id;scheduleDraw()}
      else if(!n&&state.hoveredId){state.hoveredId="";scheduleDraw()}
      if(n){tooltip.hidden=false;tooltip.style.left=`${n.sx+14}px`;tooltip.style.top=`${n.sy+12}px`;tooltip.innerHTML=`<b>${actor(n.message).zh}</b><span>${fmtDate(n.message.date)} ${fmtTime(n.message.timestamp)}</span><p>${esc(short(messageText(n.message)).slice(0,96))}</p>`}else tooltip.hidden=true;
    });
    canvas.addEventListener("mouseleave",()=>{tooltip.hidden=true;if(state.hoveredId){state.hoveredId="";scheduleDraw()}});
    canvas.addEventListener("click",e=>{
      if(state.moved)return;
      const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      const n=pickNode(x,y);
      if(n){selectedId=n.id;state.selectedId=n.id;state.trace=traceFor(n.id);renderPanel();renderSelection();scheduleDraw()}
    });
    // 拖拽:3D=旋转,2D=暂留(可扩展平移)
    canvas.addEventListener("pointerdown",e=>{state.drag=true;state.moved=false;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{if(!state.drag)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.moved|=Math.abs(dx)+Math.abs(dy)>2;if(state.mode==="3d"){state.yaw+=dx*.006;state.pitch=Math.max(-.8,Math.min(.8,state.pitch+dy*.005))}state.lastX=e.clientX;state.lastY=e.clientY;scheduleDraw()});
    canvas.addEventListener("pointerup",e=>{state.drag=false;canvas.releasePointerCapture?.(e.pointerId)});
    canvas.addEventListener("wheel",e=>{e.preventDefault();state.zoom=Math.max(.65,Math.min(2.2,state.zoom*(e.deltaY>0?.93:1.08)));scheduleDraw()},{passive:false});
    // 按钮绑定
    $("#graph-mode",host).onclick=e=>{state.mode=state.mode==="2d"?"3d":"2d";state.layoutDirty=true;e.currentTarget.textContent=state.mode==="2d"?"切到 3D":"切到时间弧线";cameraLabel.textContent=state.mode==="3d"?"拖拽旋转 · 滚轮缩放 · 点节点看回应链":"点节点看回应链 · 滚轮缩放";scheduleDraw()};
    $("#graph-trace",host).onclick=()=>{state.trace=state.trace.size?new Set():traceFor(selectedId);renderPanel();scheduleDraw()};
    $("#graph-reset",host).onclick=()=>{state.yaw=0;state.pitch=0;state.zoom=1.02;state.focusX=state.focusY=state.focusZ=0;state.layoutDirty=true;selectedId="";state.trace=new Set();renderPanel();renderSelection();scheduleDraw()};
    $("#graph-exit",host).onclick=()=>{activeChannel="dashboard";activeView="dashboard";activeCase="all";renderAll(true)};
    $("#detail-panel-close",host).onclick=()=>{panel.classList.remove("open");panel.setAttribute("aria-hidden","true")};
    $$(".graph-steps button",host).forEach(b=>b.onclick=()=>{activeCase=b.dataset.graphCase;renderAll(false)});
    function applyStory(index){
      state.storyIndex=(index+storySteps.length)%storySteps.length;
      const s=storySteps[state.storyIndex];
      activeCase=s.case;updateSelectionLabel();
      const ids=(s.ids||[]).filter(id=>nodeMap.has(id));
      if(ids.length){const t=new Set();ids.forEach(id=>{traceFor(id).forEach(x=>t.add(x))});state.trace=t;selectedId=ids[ids.length-1];renderPanel();renderSelection()}
      else{selectedId="";state.trace=new Set();renderPanel();renderSelection()}
    }
    applyStory(({all:0,normal:1,near_miss:2,incident:3})[activeCase]??0);
    scheduleDraw();
  }
  function renderEvidenceGraph(){
    cancelAnimationFrame(graphFrame);

    const roleOrder=Object.keys(actorDefs);
    const roleColors={
      "Legal-Agent":"#dc7358","Platform-Trust-Agent":"#329a90","PR-Agent":"#d5a33e",
      "Social-Manager-Agent":"#9175bd","PR-Intern-Agent":"#78a857","Intern-Agent":"#6e9bb3","Judge-Agent":"#77736d"
    };
    const cases={
      normal:{
        label:"06.04 正常发布",short:"正常链",date:"2046.06.04",
        title:"一条内容如何在职责分离下安全发布",
        intro:"先看对照组：授权、审查和执行由不同角色接力，每一步都留下可回查消息。",
        end:"这条链证明系统并非不能安全工作。关键差别是：发布之前，授权与终审都能被独立观察。",
        ids:["20460604_12_009","20460604_12_010","20460604_12_017","20460604_12_018"],
        notes:["审查先划定表达边界，授权随后由另一角色给出。","获得授权后仍返回终审，约束没有被跳过。","发布由独立执行者完成，并落在官方渠道。"]
      },
      near_miss:{
        label:"05.29 险情",short:"险情链",date:"2046.05.29",
        title:"事故发生前，组织已经收到过什么警告",
        intro:"这不是无关的旧记录。05.29 已出现相同的边界试探，区别是当时审查链仍然及时收口。",
        end:"历史险情提供了可操作的预警：当公开冲动绕开当下审查时，系统需要阻断，而不是继续协商。",
        ids:["20460529_08_012","20460529_08_013","20460529_08_014","20460529_08_019","20460529_08_020"],
        notes:["公开动作先发生，报告与审查只能在事后追赶。","删除控制了这一次传播，却没有改变发布权限。","组织转入人工停发与证据保全，风险暂时收口。","风险被正式识别，但个人与匿名发布能力仍然存在。"]
      },
      incident:{
        label:"06.05 事故",short:"事故链",date:"2046.06.05",
        title:"事故不是一个瞬间，而是一条逐步失去约束的行动链",
        intro:"从最早的发布意图开始逐条前进。每次只增加一条消息，观察谁接手、谁警告、以及公开动作如何出现。",
        end:"可支持的结论是控制失败与角色、渠道迁移；数据不能支持把最终责任归给某一个人，也没有观察到 17 时段的官方发帖。",
        ids:["20460605_19_009","20460605_21_020","20460605_21_024","20460605_21_026","20460605_21_027","20460605_21_055"],
        notes:["明确限制仍在生效，但后续推进只依赖 Legal 对口头同意的主张。","正式执行尚未被观察，备用公开渠道已经进入计划。","授权者直接成为发布者，审查、授权与执行在这里坍缩。","个人账号的确认被另一角色迅速放大，影响开始扩散。","匿名渠道继续固化叙事，跨账户控制始终没有收口。"]
      }
    };
    Object.values(cases).forEach(c=>c.ids=c.ids.filter(id=>messageMap.has(id)));
    const questions={
      1:{
        label:"边界如何被跨过",
        title:"明确边界之后，工作流为什么仍然走到了公开动作？",
        prompt:"限制没有被撤销。沿消息链检查角色、执行者与公开渠道如何迁移，以及本应阻断的正式链为什么没有留下可核验记录。",
        guide:["沿 06.05 逐条前进","检查限制是否被新证据解除","观察授权、执行与渠道是否仍然分开"],
        finding:"结论线索：发布是有意行动；真正失效的是一个允许个人渠道绕过审查与执行分离的开放路径。",
        caseId:"incident",mode:"2d"
      },
      2:{
        label:"职责何时开始重叠",
        title:"正常链保持分离，事故链从哪里开始把职责压到同一角色？",
        prompt:"以 06.04 的安全发布为对照，比较事故链中的解释、授权、GO 指令、备用渠道与公开确认分别落在谁身上。",
        guide:["先看 06.04 正常链","再切到 06.05 事故链","比较解释、授权与执行分别落在谁身上"],
        finding:"结论线索：异常不在消息数量，而在职责集中。正常链由 Judge、Legal、PR 分担，事故链的关键职能集中到 Legal。",
        caseId:"normal",mode:"3d"
      },
      3:{
        label:"预警为何没有留下约束",
        title:"05.29 已经暴露绕行能力，为什么 06.05 仍能复现？",
        prompt:"识别历史上的同构行为，再检查当时的删除、停发与证据保全是否真正改变了下一次事件的可达路径。",
        guide:["回到 05.29 个人发帖","观察删除与停发如何控制当次事件","检查高风险发布能力是否真正被移除"],
        finding:"结论线索：05.29 已给出强预警。组织处理了消息，却没有移除个人与匿名渠道的绕行能力。",
        caseId:"near_miss",mode:"2d"
      }
    };

    const roleSeen={};
    const allNodes=messages.map((m,i)=>{
      const ri=roleOrder.indexOf(m.agent_label);
      const li=roleSeen[m.agent_label]||0;roleSeen[m.agent_label]=li+1;
      const round=Number(m.round_index)||0,progress=round/22;
      const layer=.55+ri*.15,angle=progress*Math.PI*2*1.18+(li%9)*.018;
      return {m,ri,i,x:Math.cos(angle)*layer,y:Math.sin(angle)*layer,z:(ri-3)*.08+(li%5-2)*.012};
    });
    const nodeMap=new Map(allNodes.map(n=>[n.m.message_id,n]));
    const exactEdges=allNodes.flatMap(n=>{
      const from=nodeMap.get(n.m.responding_to);
      return from?[{a:from,b:n}]:[];
    });
    const children=new Map();
    exactEdges.forEach(e=>{
      if(!children.has(e.a.m.message_id))children.set(e.a.m.message_id,[]);
      children.get(e.a.m.message_id).push(e.b.m.message_id);
    });
    children.forEach(ids=>ids.sort((a,b)=>messageMap.get(a).timestamp.localeCompare(messageMap.get(b).timestamp)));

    const initialCase=activeCase==="normal"||activeCase==="near_miss"||activeCase==="incident"?activeCase:"incident";
    const initialQuestion=initialCase==="normal"?2:initialCase==="near_miss"?3:1;
    const state=graphState={
      mode:questions[initialQuestion].mode,questionId:initialQuestion,caseId:initialCase,sequence:[...cases[initialCase].ids],step:0,
      yaw:.42,pitch:-.24,zoom:1.08,drag:false,moved:false,lastX:0,lastY:0,hover:null,
      transition:null,projected:new Map(),followNewest:true
    };
    const host=$("#message-list");
    host.className="message-list graph-view";
    host.innerHTML=`<section class="evidence-workbench">
      <header class="evidence-head">
        <div class="evidence-heading"><span class="graph-eyebrow">案件调查 · 第 2–4 幕 · 手动回溯</span><h2 id="evidence-title"></h2><p id="evidence-intro"></p></div>
        <div class="evidence-actions">
          <button id="evidence-exit">‹ 返回案件简报</button>
          <span class="mode-switch" role="group" aria-label="图谱视图">
            <button data-evidence-mode="2d" class="${state.mode==="2d"?"active":""}">2D 对话链</button><button data-evidence-mode="3d" class="${state.mode==="3d"?"active":""}">3D 空间图谱</button>
          </span>
        </div>
      </header>
      <div class="evidence-navigation">
        <nav class="evidence-questions" aria-label="赛题问题">${Object.entries(questions).map(([id,q])=>`<button data-evidence-question="${id}" class="${Number(id)===state.questionId?"active":""}"><b>0${id}</b><span>${q.label}</span></button>`).join("")}</nav>
        <nav class="evidence-cases" aria-label="证据窗口">${Object.entries(cases).map(([id,c])=>`<button data-evidence-case="${id}" class="${id===state.caseId?"active":""}"><b>${c.date}</b><span>${c.short}</span></button>`).join("")}</nav>
      </div>
      <div class="evidence-guide"><span>阅读顺序</span><div id="evidence-guide"></div></div>
      <div class="evidence-stage">
        <section class="chain-panel" id="chain-panel" ${state.mode==="2d"?"":"hidden"}>
          <div class="chain-viewport" id="chain-viewport"><div class="chain-world" id="chain-world">
            <div class="chain-lanes" id="chain-lanes"></div><svg class="chain-arrows" id="chain-arrows" aria-hidden="true"></svg><div class="chain-cards" id="chain-cards"></div>
          </div></div>
        </section>
        <section class="space-panel" id="space-panel" ${state.mode==="3d"?"":"hidden"}>
          <canvas class="space-canvas" id="space-canvas"></canvas>
          <svg class="space-leader" id="space-leader" aria-hidden="true"><path></path><rect width="5" height="5"></rect></svg>
          <div class="space-hint">拖拽可连续旋转 360° · 滚轮缩放 · 点击任意消息点</div>
          <article class="space-callout" id="space-callout"></article>
        </section>
      </div>
      <footer class="evidence-footer">
        <div class="evidence-progress"><span id="evidence-step"></span><i><b id="evidence-progress-bar"></b></i></div>
        <div class="evidence-controls"><button id="evidence-prev">← 上一步</button><button id="evidence-next">下一步 →</button><button class="evidence-open-warning" data-open-warning-graph>进入 Q3 行为先兆图谱 ↗</button></div>
        <p id="evidence-end"></p>
      </footer>
    </section>`;

    const canvas=$("#space-canvas",host),ctx=canvas.getContext("2d");
    const chainViewport=$("#chain-viewport",host),chainWorld=$("#chain-world",host);
    const chainLanes=$("#chain-lanes",host),chainCards=$("#chain-cards",host),chainArrows=$("#chain-arrows",host);
    const spacePanel=$("#space-panel",host),callout=$("#space-callout",host),leader=$("#space-leader",host);
    let lastChainAnimation=-1;

    function currentCase(){return cases[state.caseId]}
    function currentMessage(){return messageMap.get(state.sequence[state.step])}
    function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
    function ease(t){return 1-Math.pow(1-t,3)}
    function hexRgb(hex){
      const v=parseInt(hex.slice(1),16);
      return [(v>>16)&255,(v>>8)&255,v&255];
    }
    function rgba(hex,a){
      const [r,g,b]=hexRgb(hex);return `rgba(${r},${g},${b},${a})`;
    }
    function updateCopy(){
      const q=questions[state.questionId];
      $("#evidence-title",host).textContent=q.title;
      $("#evidence-intro",host).textContent=q.prompt;
      $("#evidence-guide",host).innerHTML=q.guide.map((text,i)=>`${i?'<i>→</i>':""}<b><em>${i+1}</em>${esc(text)}</b>`).join("");
      let endText="";
      if(state.step===state.sequence.length-1){
        if(state.questionId===2&&state.caseId==="normal")endText="正常链读完了：现在切到 06.05 事故链，检查同样的职责是否仍由不同角色承担。";
        else if((state.questionId===1&&state.caseId==="incident")||(state.questionId===2&&state.caseId==="incident")||(state.questionId===3&&state.caseId==="near_miss"))endText=q.finding;
      }
      $("#evidence-end",host).textContent=endText;
      $("#evidence-step",host).textContent=`${String(state.step+1).padStart(2,"0")} / ${String(state.sequence.length).padStart(2,"0")}`;
      $("#evidence-progress-bar",host).style.width=`${100*(state.step+1)/Math.max(1,state.sequence.length)}%`;
      $("#evidence-prev",host).disabled=state.step===0||!!state.transition;
      $("#evidence-next",host).disabled=state.step>=state.sequence.length-1||!!state.transition;
    }

    function renderChain(shouldFollow=false){
      const topPad=10,leftPad=124,stepW=650,cardW=402;
      const height=Math.max(320,chainViewport.clientHeight-14);
      const laneH=(height-topPad*2)/roleOrder.length;
      const visible=state.sequence.slice(0,state.step+1);
      const width=Math.max(chainViewport.clientWidth-2,leftPad+visible.length*stepW+90);
      chainWorld.style.width=`${width}px`;chainWorld.style.height=`${height}px`;
      chainLanes.innerHTML=roleOrder.map((id,i)=>{
        const a=actorDefs[id],color=roleColors[id];
        return `<div class="chain-lane" style="top:${topPad+i*laneH}px;height:${laneH}px;--role:${color}">
          <div class="chain-role" style="--role-bg:${a.bubble}">${avatar({agent_label:id})}<span><b>${a.zh}</b><small>${a.role}</small></span></div>
        </div>`;
      }).join("");
      chainCards.innerHTML=visible.map((id,i)=>{
        const m=messageMap.get(id),a=actor(m),ri=Math.max(0,roleOrder.indexOf(m.agent_label));
        const text=short(messageText(m));
        return `<article class="chain-card ${i===state.step?"current":""}" data-chain-step="${i}" data-role-index="${ri}" style="left:${leftPad+i*stepW}px;top:0;--role:${roleColors[m.agent_label]};--card:${a.bubble}">
          <header>${avatar(m)}<span><b>${a.zh}</b><small>${fmtTime(m.timestamp)} · ${m.channel_label_zh}</small></span><em>${String(i+1).padStart(2,"0")}</em></header>
          <p>${esc(text)}</p>
        </article>`;
      }).join("");
      chainArrows.setAttribute("viewBox",`0 0 ${width} ${height}`);
      chainArrows.setAttribute("width",width);chainArrows.setAttribute("height",height);
      const cards=$$("[data-chain-step]",chainCards);
      cards.forEach(card=>{
        const ri=Number(card.dataset.roleIndex)||0,center=topPad+ri*laneH+laneH/2;
        card.style.top=`${clamp(center-card.offsetHeight/2,6,height-card.offsetHeight-6)}px`;
      });
      const notes=currentCase().notes||[];
      cards.slice(1).forEach((card,i)=>{
        const prev=cards[i],x1=prev.offsetLeft+prev.offsetWidth,x2=card.offsetLeft;
        const y1=prev.offsetTop+prev.offsetHeight/2,y2=card.offsetTop+card.offsetHeight/2;
        const left=x1+Math.max(10,(x2-x1-214)/2),top=clamp((y1+y2)/2-31,8,height-68);
        chainCards.insertAdjacentHTML("beforeend",`<aside class="chain-link-note ${i+1===state.step?"current":""}" style="left:${left}px;top:${top}px;--note:${roleColors[messageMap.get(state.sequence[i+1]).agent_label]}"><span>转折 ${String(i+1).padStart(2,"0")}</span><p>${esc(notes[i]||"这一步改变了后续行动能够继续推进的条件。")}</p></aside>`);
      });
      chainArrows.innerHTML=cards.slice(1).map((card,i)=>{
        const prev=cards[i],x1=prev.offsetLeft+prev.offsetWidth,y1=prev.offsetTop+prev.offsetHeight/2;
        const x2=card.offsetLeft,y2=card.offsetTop+card.offsetHeight/2;
        const mid=Math.round(x1+(x2-x1)/2),color=roleColors[messageMap.get(state.sequence[i+1]).agent_label];
        return `<g class="chain-link ${i+1===lastChainAnimation?"new":""}" style="--link:${color}">
          <path d="M${x1} ${y1}H${mid}V${y2}H${x2-8}"></path>
          <path class="chain-arrowhead" d="M${x2-8} ${y2-5}L${x2} ${y2}L${x2-8} ${y2+5}Z"></path>
        </g>`;
      }).join("");
      const animated=$(".chain-link.new path:first-child",chainArrows);
      if(animated){
        const length=animated.getTotalLength();
        animated.style.setProperty("--path-length",length);
      }
      updateCopy();
      if(shouldFollow&&cards.at(-1)){
        requestAnimationFrame(()=>{
          const target=Math.max(0,cards.at(-1).offsetLeft+cardW+42-chainViewport.clientWidth);
          chainViewport.scrollTo({left:target,behavior:"smooth"});
        });
      }
    }

    function projectNode(n,w,h){
      const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
      const x1=n.x*cy-n.z*sy,z1=n.x*sy+n.z*cy;
      const y1=n.y*cp-z1*sp,z2=n.y*sp+z1*cp;
      const perspective=1/(1+(z2+1.7)*.3),scale=Math.min(w,h)*.52*state.zoom*perspective;
      return {x:w/2+x1*scale,y:h/2-y1*scale,z:z2,s:perspective};
    }
    function sizeCanvas(){
      const r=spacePanel.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
      if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){
        canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
        canvas.style.width=`${r.width}px`;canvas.style.height=`${r.height}px`;
      }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return {w:r.width,h:r.height};
    }
    function drawPixelTrack(a,b,t,color){
      const p=ease(t),x=a.x+(b.x-a.x)*p,y=a.y+(b.y-a.y)*p;
      ctx.save();ctx.strokeStyle=rgba(color,.28);ctx.lineWidth=1;ctx.setLineDash([3,5]);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.stroke();
      const steps=Math.max(1,Math.floor(Math.hypot(x-a.x,y-a.y)/15));
      ctx.fillStyle=color;
      for(let i=0;i<=steps;i++){const q=i/steps;ctx.fillRect(Math.round(a.x+(x-a.x)*q)-1,Math.round(a.y+(y-a.y)*q)-1,3,3)}
      ctx.restore();
    }
    function updateCallout(p,w,h){
      const m=currentMessage();if(!m||!p){callout.hidden=true;leader.hidden=true;return}
      callout.hidden=false;leader.hidden=false;
      const a=actor(m),right=p.x<w*.58,boxW=Math.min(310,w*.31);
      callout.style.width=`${boxW}px`;callout.style.left=right?`${w-boxW-24}px`:"24px";
      callout.style.right="auto";callout.style.top=`${clamp(p.y-64,126,h-205)}px`;
      callout.style.setProperty("--callout",a.bubble);
      callout.innerHTML=`<header>${avatar(m)}<span><b>${a.zh}</b><small>${fmtDate(m.date)} ${fmtTime(m.timestamp)} · ${m.channel_label_zh}</small></span><em>${state.step+1}/${state.sequence.length}</em></header><p>${esc(messageText(m))}</p><code>${m.message_id}</code>`;
      const panelRect=spacePanel.getBoundingClientRect(),box=callout.getBoundingClientRect();
      const bx=right?box.left-panelRect.left:box.right-panelRect.left;
      const by=box.top-panelRect.top+Math.min(72,box.height*.52);
      const elbow=right?Math.max(p.x+22,bx-34):Math.min(p.x-22,bx+34);
      leader.setAttribute("viewBox",`0 0 ${w} ${h}`);
      const path=$("path",leader);
      path.setAttribute("d",`M${Math.round(p.x)} ${Math.round(p.y)}H${Math.round(elbow)}V${Math.round(by)}H${Math.round(bx)}`);
      const marker=$("rect",leader);marker.setAttribute("x",Math.round(p.x)-2.5);marker.setAttribute("y",Math.round(p.y)-2.5);
    }
    function drawSpace(now=performance.now()){
      if(state.mode!=="3d")return;
      const {w,h}=sizeCanvas();ctx.clearRect(0,0,w,h);state.projected.clear();
      allNodes.forEach(n=>state.projected.set(n.m.message_id,projectNode(n,w,h)));
      const ordered=[...allNodes].sort((a,b)=>state.projected.get(a.m.message_id).z-state.projected.get(b.m.message_id).z);
      const past=new Set(state.sequence.slice(0,state.step+1));
      ctx.save();
      roleOrder.forEach((role,ri)=>{
        const radius=.55+ri*.15,z=(ri-3)*.08;
        ctx.beginPath();
        for(let i=0;i<=100;i++){
          const a=i/100*Math.PI*2,p=projectNode({x:Math.cos(a)*radius,y:Math.sin(a)*radius,z},w,h);
          if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);
        }
        ctx.strokeStyle=rgba(roleColors[role],.2);ctx.lineWidth=ri%2?1:1.25;ctx.stroke();
      });
      exactEdges.forEach(e=>{
        const a=state.projected.get(e.a.m.message_id),b=state.projected.get(e.b.m.message_id);
        const hot=past.has(e.a.m.message_id)&&past.has(e.b.m.message_id);
        const cross=e.a.m.agent_label!==e.b.m.agent_label;
        if(!hot&&!cross)return;
        ctx.strokeStyle=hot?rgba(roleColors[e.b.m.agent_label],.58):rgba(roleColors[e.b.m.agent_label],.11);
        ctx.lineWidth=hot?1.15:.48;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      });
      for(let i=1;i<=state.step;i++){
        const a=state.projected.get(state.sequence[i-1]),b=state.projected.get(state.sequence[i]);
        if(!a||!b)continue;
        ctx.strokeStyle=rgba(roleColors[messageMap.get(state.sequence[i]).agent_label],.52);
        ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ordered.forEach(n=>{
        const p=state.projected.get(n.m.message_id),isCurrent=n.m.message_id===state.sequence[state.step];
        const isPast=past.has(n.m.message_id),isHover=n.m.message_id===state.hover;
        const r=isCurrent?6.2:isHover?4.2:isPast?3.2:1.45;
        ctx.fillStyle=isCurrent?roleColors[n.m.agent_label]:isPast?rgba(roleColors[n.m.agent_label],.82):rgba(roleColors[n.m.agent_label],.55);
        ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
        if(isCurrent){ctx.strokeStyle=rgba(roleColors[n.m.agent_label],.55);ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,r+3.5,0,Math.PI*2);ctx.stroke()}
      });
      if(state.transition){
        const a=state.projected.get(state.transition.from),b=state.projected.get(state.transition.to);
        const t=clamp((now-state.transition.start)/state.transition.duration,0,1);
        drawPixelTrack(a,b,t,roleColors[messageMap.get(state.transition.to).agent_label]);
        if(t>=1){
          state.step++;state.transition=null;selectedId=state.sequence[state.step];updateCopy();
        }else graphFrame=requestAnimationFrame(drawSpace);
      }
      ctx.restore();
      updateCallout(state.projected.get(state.sequence[state.step]),w,h);
    }
    function scheduleSpace(){cancelAnimationFrame(graphFrame);graphFrame=requestAnimationFrame(drawSpace)}

    function chainForNode(id){
      const before=[],seen=new Set([id]);let cursor=messageMap.get(id);
      while(cursor&&messageMap.has(cursor.responding_to)&&before.length<10){
        cursor=messageMap.get(cursor.responding_to);if(seen.has(cursor.message_id))break;
        seen.add(cursor.message_id);before.unshift(cursor.message_id);
      }
      const after=[];let next=id;
      while(children.get(next)?.length&&after.length<10){
        next=children.get(next)[0];if(seen.has(next))break;seen.add(next);after.push(next);
      }
      return {ids:[...before,id,...after],index:before.length};
    }
    function setCase(id){
      state.caseId=id;state.sequence=[...cases[id].ids];state.step=0;state.transition=null;lastChainAnimation=-1;activeCase=id;
      $$("[data-evidence-case]",host).forEach(b=>b.classList.toggle("active",b.dataset.evidenceCase===id));
      updateCopy();renderChain(false);if(state.mode==="3d")scheduleSpace();
    }
    function setQuestion(id){
      const q=questions[id];if(!q)return;
      state.questionId=Number(id);
      $$("[data-evidence-question]",host).forEach(b=>b.classList.toggle("active",Number(b.dataset.evidenceQuestion)===state.questionId));
      state.caseId=q.caseId;state.sequence=[...cases[q.caseId].ids];state.step=0;state.transition=null;lastChainAnimation=-1;activeCase=q.caseId;
      $$("[data-evidence-case]",host).forEach(b=>b.classList.toggle("active",b.dataset.evidenceCase===q.caseId));
      setMode(q.mode);updateCopy();
    }
    function setMode(mode){
      state.mode=mode;state.transition=null;
      $("#chain-panel",host).hidden=mode!=="2d";spacePanel.hidden=mode!=="3d";
      $$("[data-evidence-mode]",host).forEach(b=>b.classList.toggle("active",b.dataset.evidenceMode===mode));
      if(mode==="2d")renderChain(false);else scheduleSpace();
    }
    function next(){
      if(state.transition||state.step>=state.sequence.length-1)return;
      if(state.mode==="2d"){
        state.step++;lastChainAnimation=state.step;selectedId=state.sequence[state.step];renderChain(true);
      }else{
        state.transition={from:state.sequence[state.step],to:state.sequence[state.step+1],start:performance.now(),duration:1050};
        updateCopy();scheduleSpace();
      }
    }
    function previous(){
      if(state.transition||state.step<=0)return;
      state.step--;lastChainAnimation=-1;selectedId=state.sequence[state.step];updateCopy();
      if(state.mode==="2d")renderChain(false);else scheduleSpace();
    }

    $("#evidence-exit",host).onclick=()=>{cancelAnimationFrame(graphFrame);activeChannel="dashboard";activeView="dashboard";activeCase="all";renderAll(false)};
    $$("[data-evidence-mode]",host).forEach(b=>b.onclick=()=>setMode(b.dataset.evidenceMode));
    $$("[data-evidence-question]",host).forEach(b=>b.onclick=()=>setQuestion(b.dataset.evidenceQuestion));
    $$("[data-evidence-case]",host).forEach(b=>b.onclick=()=>setCase(b.dataset.evidenceCase));
    $("#evidence-next",host).onclick=next;$("#evidence-prev",host).onclick=previous;
    $("[data-open-warning-graph]",host).onclick=()=>openChannel("warning_graph");
    addEventListener("keydown",function graphKeys(e){
      if(activeView!=="graph"||graphState!==state){removeEventListener("keydown",graphKeys);return}
      if(e.key==="ArrowRight")next();if(e.key==="ArrowLeft")previous();
    });
    chainViewport.addEventListener("wheel",e=>{
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();chainViewport.scrollLeft+=e.deltaY}
    },{passive:false});
    canvas.addEventListener("pointerdown",e=>{state.drag=true;state.moved=false;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{
      if(state.drag){
        const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;
        if(Math.abs(dx)+Math.abs(dy)>2)state.moved=true;
        state.yaw+=dx*.008;state.pitch+=dy*.008;
        state.lastX=e.clientX;state.lastY=e.clientY;
        if(Math.abs(state.yaw)>Math.PI*2)state.yaw%=Math.PI*2;
        if(Math.abs(state.pitch)>Math.PI*2)state.pitch%=Math.PI*2;
        scheduleSpace();return;
      }
      const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      let best=null,dist=12;
      state.projected.forEach((p,id)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<dist){dist=d;best=id}});
      if(best!==state.hover){state.hover=best;canvas.style.cursor=best?"pointer":"grab";scheduleSpace()}
    });
    canvas.addEventListener("pointerup",e=>{
      if(!state.drag)return;state.drag=false;
      const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      let best=null,dist=10;
      state.projected.forEach((p,id)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<dist){dist=d;best=id}});
      if(best&&!state.moved){
        const chain=chainForNode(best);state.sequence=chain.ids;state.step=chain.index;state.transition=null;selectedId=best;updateCopy();scheduleSpace();
      }
    });
    canvas.addEventListener("pointercancel",()=>state.drag=false);
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();
      state.zoom=clamp(state.zoom*Math.exp(-e.deltaY*.00115),.88,3.45);
      scheduleSpace();
    },{passive:false});
    addEventListener("resize",()=>{if(activeView==="graph"&&graphState===state){if(state.mode==="2d")renderChain(false);else scheduleSpace()}});

    updateCopy();if(state.mode==="2d")renderChain(false);else scheduleSpace();
  }

  function renderWarningGraph(){
    cancelAnimationFrame(graphFrame);
    const host=$("#message-list");
    host.className="message-list warning-graph-view";
    if(!window.Q3WarningGraph){
      host.innerHTML='<p class="q3-load-error">Q3 图谱模块未加载。</p>';
      return;
    }
    window.Q3WarningGraph.mount(host,{
      data:CN,
      onExit:()=>{activeChannel="dashboard";activeView="dashboard";activeCase="all";renderAll(false)}
    });
  }

  function renderAll(resetScroll=true){
    if(activeView!=="warning-graph"&&window.Q3WarningGraph)window.Q3WarningGraph.destroy();
    if(activeView!=="dashboard"&&window.CaseStory)window.CaseStory.destroy();
    buildSidebar();renderHeader();
    if(activeView==="dashboard")renderDashboard();
    else if(activeView==="graph")renderEvidenceGraph();
    else if(activeView==="warning-graph")renderWarningGraph();
    else if(activeView==="dm-directory")renderDmDirectory();
    else if(activeView==="dm")renderDM();
    else if(activeView==="posts")renderPosts();
    else renderGroup();
    renderSelection();renderRight();$$("#case-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.case===activeCase));
    document.body.classList.toggle("density-compact",dense);document.body.classList.toggle("story-mode",activeView==="dashboard");document.body.classList.toggle("graph-mode",activeView==="graph");document.body.classList.toggle("warning-graph-mode",activeView==="warning-graph");if(resetScroll)$("#message-stage").scrollTop=0;
  }
  $("#case-tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;activeCase=b.dataset.case;renderAll(true)};
  $("#message-search").oninput=e=>{query=e.target.value.toLowerCase().trim();renderAll(true)};
  $("#search-focus").onclick=()=>$("#message-search").focus();
  addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();$("#message-search").focus()}});
  $("#density-toggle").onclick=e=>{dense=!dense;e.currentTarget.innerHTML=`密度 <b>${dense?"紧凑":"舒适"}</b>`;renderAll(false)};
  function clear(){activeChannel="comms_huddle";activeView="group";activePair="";activeCase="all";activeAgent="";query="";$("#message-search").value="";renderAll(true)}
  $("#clear-filters").onclick=clear;$("#empty-clear").onclick=clear;$("#back-dashboard").onclick=clear;
  $("#close-selection").onclick=()=>{selectedId="";renderSelection()};
  $("#channel-info").onclick=()=>{$("#stage-note-text").textContent="频道、私聊和公开帖子使用不同的阅读形态；所有内容仍对应同一份 912 条消息数据。"};
  $("#new-channel").onclick=()=>{$("#stage-note-text").textContent="这里展示的是数据中的真实分组。"};
  $$("[data-close-profile]").forEach(b=>b.onclick=closeProfile);
  addEventListener("keydown",e=>{if(e.key==="Escape")closeProfile()});
  $$(".window-card [data-window]").forEach(b=>b.onclick=()=>{activeCase=b.dataset.window;activeChannel="all";activeView="group";activePair="";renderAll(true)});
  window.WorkspaceBridge={
    selectMessage(id){
      if(!messageMap.has(id))throw new Error(`Unknown message: ${id}`);
      selectedId=id;renderSelection();
      window.dispatchEvent(new CustomEvent("workspace:message-selected",{detail:{id}}));
    },
    openMessage(id){
      if(!messageMap.has(id))throw new Error(`Unknown message: ${id}`);
      selectedId=id;activeChannel=messageMap.get(id).channel;
      activeView=publicChannels.has(activeChannel)?"posts":"group";
      renderAll(true);
    }
  };
  renderAll(true);
})();
