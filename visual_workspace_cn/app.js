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
    {id:"dashboard",symbol:"▦",name:"仪表盘",desc:""},
    {id:"evidence_graph",symbol:"◇",name:"协作证据图谱",desc:"在三维空间中追踪消息、角色与公开动作"},
    {id:"all",symbol:"⌁",name:"全部消息",desc:"全部 912 条记录的时间序列"},
    {id:"comms_huddle",symbol:"#",name:"协作群聊",desc:"全体成员共享的协作现场"},
    {id:"side_huddle",symbol:"#",name:"侧边群聊",desc:"小范围的并行讨论与补充"},
    {id:"one_on_one_chat",symbol:"↔",name:"一对一聊天",desc:"选择两位代理，查看他们的私下对话"},
    {id:"official_post",symbol:"↗",name:"官方发帖",desc:"由官方账号发出的公开动作"},
    {id:"personal_post",symbol:"↗",name:"个人发帖",desc:"个人公开面上的动作"},
    {id:"anonymous_post",symbol:"↗",name:"匿名发帖",desc:"匿名公开面上的动作"}
  ];
  const channelMap=Object.fromEntries(channels.map(c=>[c.id,c]));
  let activeChannel="dashboard",activeView="dashboard",activePair="",activeCase="all",activeAgent="",query="",selectedId=CN.meta.default_action_id,dense=false;
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
    const counts=Object.fromEntries(channels.map(c=>[c.id,c.id==="dashboard"||c.id==="evidence_graph"?"":c.id==="all"?messages.length:messages.filter(m=>m.channel===c.id).length]));
    $("#channel-list").innerHTML=channels.map(c=>`<button class="channel-item ${activeChannel===c.id?"active":""}" data-channel="${c.id}"><span class="channel-symbol">${c.symbol}</span><span>${c.name}</span><span class="channel-count">${counts[c.id]}</span></button>`).join("");
    $("#channel-list").onclick=e=>{const b=e.target.closest("[data-channel]");if(!b)return;openChannel(b.dataset.channel)};
    $("#dm-list").innerHTML=dmPairs.slice(0,4).map(([key,list])=>{const [a,b]=pairNames(key),last=list.at(-1);return `<button class="dm-item" data-pair="${key}"><span class="pair-avatar">${avatar({agent_label:a})}${avatar({agent_label:b})}</span><span>${actorDefs[a].zh} × ${actorDefs[b].zh}<small>${esc(short(messageText(last)).slice(0,25))}</small></span></button>`}).join("");
    $("#dm-list").onclick=e=>{const b=e.target.closest("[data-pair]");if(b)openDM(b.dataset.pair)};
    $("#people-list").innerHTML=Object.keys(actorDefs).map(id=>{const a=actorDefs[id];return `<button class="person-row" data-agent="${id}">${avatar({agent_label:id})}<span><b>${a.zh}</b><small>${a.role}</small></span><i class="person-presence"></i></button>`}).join("");
    $("#people-list").onclick=e=>{const b=e.target.closest("[data-agent]");if(!b)return;openProfile(b.dataset.agent)};
  }
  function openChannel(id){
    activeChannel=id;activeAgent="";activePair="";
    activeView=id==="dashboard"?"dashboard":id==="evidence_graph"?"graph":id==="one_on_one_chat"?"dm-directory":publicChannels.has(id)?"posts":"group";
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
    $("#back-dashboard").hidden=activeView==="dashboard";
    $("#stage-note-text").textContent="";
  }
  function renderDashboard(){
    const groups=["comms_huddle","side_huddle"].map(id=>{const list=messages.filter(m=>m.channel===id),last=list.at(-1),c=channelMap[id];return `<button class="dashboard-conversation" data-open-channel="${id}"><span class="workspace-icon">${c.symbol}</span><span><strong>${c.name}</strong><small>${esc(short(messageText(last)).slice(0,52))}</small></span><time>${fmtDate(last.date).replace("2046年","")}</time></button>`}).join("");
    const dms=dmPairs.slice(0,6).map(([key,list])=>{const [a,b]=pairNames(key),last=list.at(-1);return `<button class="dashboard-conversation" data-open-pair="${key}"><span class="pair-avatar">${avatar({agent_label:a})}${avatar({agent_label:b})}</span><span><strong>${actorDefs[a].zh} × ${actorDefs[b].zh}</strong><small>${esc(short(messageText(last)).slice(0,52))}</small></span><time>${fmtTime(last.timestamp)}</time></button>`}).join("");
    const posts=messages.filter(m=>publicChannels.has(m.channel)).slice(-4).reverse().map(m=>`<button class="dashboard-post" data-open-post="${m.message_id}">${avatar(m)}<span><strong>${actor(m).zh} · ${m.channel_label_zh}</strong><p>${esc(short(messageText(m)).slice(0,105))}</p></span><time>${fmtTime(m.timestamp)}</time></button>`).join("");
    $("#message-list").className="message-list dashboard-view";
    $("#message-list").innerHTML=`<section class="reading-route"><span>从这里开始</span><h2>这不是“有没有泄漏”，而是“谁让内容被发布，谁能证明授权存在”。</h2><div class="reading-steps"><button data-guide="incident"><b>01 · 还原现场</b><small>Q1：沿 06.05 消息确认行动与授权证据</small></button><button data-guide="graph"><b>02 · 看见职责变化</b><small>Q2：比较正常链与事件中的角色分工</small></button><button data-guide="near_miss"><b>03 · 回看历史近失</b><small>Q3：检验 05.29 是否提供了预警</small></button></div></section>
      <section class="dashboard-block"><div class="dashboard-block-title"><b>群组会话</b><span>2 个活跃空间</span></div><div class="dashboard-conversations">${groups}</div></section>
      <section class="dashboard-block"><div class="dashboard-block-title"><b>最近私聊</b><span>${dmPairs.length} 组真实关系</span></div><div class="dashboard-conversations">${dms}</div></section>
      <section class="dashboard-block"><div class="dashboard-block-title"><b>公开动态</b><span>4 条</span></div><div class="dashboard-posts">${posts}</div></section>`;
    $$("#message-list [data-open-channel]").forEach(b=>b.onclick=()=>openChannel(b.dataset.openChannel));
    $$("#message-list [data-open-pair]").forEach(b=>b.onclick=()=>openDM(b.dataset.openPair));
    $$("#message-list [data-open-post]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.openPost;activeChannel=messageMap.get(selectedId).channel;activeView="posts";renderAll(false)});
    $$("#message-list [data-guide]").forEach(b=>b.onclick=()=>{if(b.dataset.guide==="incident"){activeCase="incident";activeChannel="all";activeView="group";renderAll(true)}else if(b.dataset.guide==="near_miss"){activeCase="near_miss";openChannel("evidence_graph")}else openChannel("evidence_graph")});
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
    const list=scopeMessages(),canvas=document.createElement("canvas"),roleOrder=Object.keys(actorDefs);
    canvas.className="evidence-canvas";
    const roleColors={"Legal-Agent":"#d75a3f","Platform-Trust-Agent":"#2e9388","PR-Agent":"#c58a27","Social-Manager-Agent":"#8a68b5","PR-Intern-Agent":"#6d9b56","Intern-Agent":"#4d78a2","Judge-Agent":"#6e6a62"};
    const caseNames={all:"全局协作场",normal:"正常发布链",near_miss:"险情窗口",incident:"有意披露事件"};
    const nodes=list.map((m,i)=>{
      const ri=Math.max(0,roleOrder.indexOf(m.agent_label)),round=Number(m.round_index)||0,progress=round/22,layer=.55+ri*.15,angle=progress*Math.PI*2*1.18+(i%9)*.018;
      return {id:m.message_id,kind:"message",message:m,role:m.agent_label,x:Math.cos(angle)*layer,y:Math.sin(angle)*layer,z:(ri-3)*.08+(i%5-2)*.012,layer:ri};
    });
    const nodeMap=new Map(nodes.map(n=>[n.id,n])),edges=nodes.filter(n=>messageMap.has(n.message.responding_to)&&nodeMap.has(n.message.responding_to)).map(n=>({from:nodeMap.get(n.message.responding_to),to:n,role:n.role}));
    const cores=roleOrder.map((role,i)=>{const layer=.55+i*.15,a=(i/roleOrder.length)*Math.PI*2-Math.PI/2;return {id:"role:"+role,kind:"role",role,label:actorDefs[role].zh,x:Math.cos(a)*layer,y:Math.sin(a)*layer,z:(i-3)*.08,layer:i}});
    const allNodes=[...cores,...nodes],state=graphState={canvas,nodes,edges,cores,allNodes,roleColors,yaw:0,pitch:0,zoom:1.02,spread:1,focusX:0,focusY:0,focusZ:0,drag:false,moved:false,lastX:0,lastY:0,playing:false,playbackDelay:6500,lastTick:0,storyIndex:0,stepCase:"all",trace:[],storyLinks:[],startedAt:performance.now()};
    const host=document.createElement("div");host.className="graph-workbench";
    host.innerHTML=`<div class="graph-full-head"><div><span class="graph-eyebrow">协作证据场 · 三维回溯</span><h2>消息如何从协作中心扩散成公开动作</h2></div><div class="graph-actions"><button id="graph-exit">‹ 返回工作区</button><button id="graph-play" class="graph-primary">▶ 分镜播放</button><button id="graph-speed">速度 6.5s</button><button id="graph-trace">显示路径</button><button id="graph-reset">重置镜头</button></div></div>
      <div class="graph-stage-wrap"><div class="graph-canvas-wrap"></div><div class="graph-overlay"><span id="graph-selection-label">${caseNames[activeCase]||caseNames.all}</span><span id="graph-camera-label">拖拽旋转 · 滚轮缩放</span></div><div class="graph-story" id="graph-story"></div><div class="graph-detail" id="graph-detail"></div><div class="graph-tooltip" id="graph-tooltip" hidden></div></div>
      <div class="graph-footer"><div class="graph-legend"><b>轨迹颜色</b><span><i class="edge-dot" style="--c:#d75a3f"></i>法务</span><span><i class="edge-dot" style="--c:#2e9388"></i>平台</span><span><i class="edge-dot" style="--c:#8a68b5"></i>社媒</span><span><i class="edge-dot" style="--c:#c58a27"></i>公关</span><span><i class="edge-dot dashed"></i>分镜顺序</span></div><div class="graph-steps"><button data-graph-case="all" class="${activeCase==="all"?"active":""}">全局</button><button data-graph-case="normal" class="${activeCase==="normal"?"active":""}">06.04 正常发布</button><button data-graph-case="near_miss" class="${activeCase==="near_miss"?"active":""}">05.29 险情</button><button data-graph-case="incident" class="${activeCase==="incident"?"active":""}">06.05 事件</button></div><div class="graph-count"><b>${list.length}</b><span>条消息 · ${edges.length} 条明确回应</span></div></div>`;
    $(".graph-canvas-wrap",host).appendChild(canvas);$("#message-list").className="message-list graph-view";$("#message-list").innerHTML="";$("#message-list").appendChild(host);
    const tooltip=$("#graph-tooltip",host),selectionLabel=$("#graph-selection-label",host),detail=$("#graph-detail",host);
    const storySteps=[
      {case:"all",title:"先看全局：七个角色，各自占据一层轨道",body:"这里不是一团随机连线。每一层只放一个角色的消息，跨层连线才表示一次可回查的回应。",messageIds:[]},
      {case:"normal",title:"06.04 正常发布：职责保持分开",body:"Judge 复核，Legal 授权，PR 通过官方账号执行。三种职责分开，发布链没有绕开门。",messageIds:["20460604_12_009","20460604_12_010","20460604_12_017","20460604_12_018"]},
      {case:"near_miss",title:"05.29 险情：先越过边界，再被收回",body:"Social 从个人账号发布敏感提示，随后删除并暂停发布。消息被控制了，但发布能力没有被封住。",messageIds:["20460529_08_012","20460529_08_013","20460529_08_014","20460529_08_019","20460529_08_020"]},
      {case:"incident",title:"06.05 事件：动作是有意的，授权无法独立验证",body:"Legal 发出 GO 并亲自确认合并，但数据里没有独立可核验的发布前书面同意。",messageIds:["20460605_19_009","20460605_21_020","20460605_21_024","20460605_21_026","20460605_21_027","20460605_21_055"]},
      {case:"all",title:"为什么只看这三段？因为它们构成一条证据链",body:"06.04 是控制组，05.29 是最接近的历史险情，06.05 是赛题事件。三段对照，才能看出日常、近失与失控的差别。",messageIds:[]}
    ];
    function traceFor(id){const set=new Set(),walk=x=>{let n=0;while(x&&messageMap.has(x)&&n++<18&&!set.has(x)){set.add(x);x=messageMap.get(x).responding_to}};walk(id);nodes.filter(n=>n.message.responding_to===id).slice(0,14).forEach(n=>set.add(n.id));return set}
    function project(p,w,h){
      const px=(p.x-state.focusX)*state.spread,py=(p.y-state.focusY)*state.spread,pz=(p.z-state.focusZ)*state.spread,cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),x=px*cy-pz*sy,z=px*sy+pz*cy,y=py*cp-z*sp,zz=py*sp+z*cp;
      const perspective=1/(1+(zz+1.7)*.3),scale=Math.min(w,h)*.52*state.zoom*perspective;
      return {x:w/2+x*scale,y:h/2-y*scale,z:zz,scale:perspective};
    }
    function updateStory(){
      const s=storySteps[state.storyIndex%storySteps.length];
      $("#graph-story",host).innerHTML=`<div class="story-index">${String(state.storyIndex+1).padStart(2,"0")} / ${String(storySteps.length).padStart(2,"0")}</div><div class="story-copy"><b>${s.title}</b><p>${s.body}</p></div><div class="story-controls"><button id="graph-prev" aria-label="上一段">←</button><button id="graph-next" aria-label="下一段">→</button></div>`;
      activeCase=s.case;state.stepCase=s.case;selectionLabel.textContent=caseNames[s.case]||caseNames.all;
    }
    function updateDetail(){
      const m=messageMap.get(selectedId);if(!m){detail.innerHTML="";return}const a=actor(m),traceSize=state.trace.length||traceFor(selectedId).size;detail.innerHTML=`<span class="detail-kicker">${a.zh} · ${m.channel_label_zh}</span><b>${fmtDate(m.date)} ${fmtTime(m.timestamp)} · 第${Number(m.round_index)+1}轮</b><p>${esc(short(messageText(m)).slice(0,130))}</p><em>${traceSize} 个节点在这条路径上</em>`;
    }
    function applyStory(index){
      state.storyIndex=(index+storySteps.length)%storySteps.length;
      const s=storySteps[state.storyIndex],ids=(s.messageIds||[]).filter(id=>nodeMap.has(id));
      if(ids.length){state.focusX=state.focusY=state.focusZ=0;state.zoom=.9;selectedId=ids.at(-1);state.trace=ids;state.storyLinks=ids.slice(1).map((id,i)=>({from:nodeMap.get(ids[i]),to:nodeMap.get(id)}));renderSelection()}else{state.focusX=state.focusY=state.focusZ=0;state.zoom=1.02;selectedId="";state.trace=[];state.storyLinks=[];renderSelection()}
      updateStory();updateDetail();
    }
    function nextPlayback(now){
      if(!state.playing)return;
      applyStory(state.storyIndex+1);
      state.lastTick=now;
    }
    function scheduleDraw(){if(!graphFrame)graphFrame=requestAnimationFrame(draw)}
    function draw(now=0){
      graphFrame=0;
      const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(1,rect.width),h=Math.max(1,rect.height);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
      const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
      const bg=ctx.createRadialGradient(w*.5,h*.47,0,w*.5,h*.47,Math.max(w,h)*.7);bg.addColorStop(0,"#fffdf8");bg.addColorStop(.5,"#edf2ec");bg.addColorStop(1,"#dfe8e1");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      if(state.playing){const elapsed=now-state.startedAt;state.yaw=Math.sin(elapsed*.00012)*.13;state.pitch=Math.sin(elapsed*.00009)*.025;state.zoom=1.02+Math.sin(elapsed*.0001)*.04;if(now-state.lastTick>state.playbackDelay)nextPlayback(now)}
      const trace=state.trace.length?new Set(state.trace):traceFor(selectedId);state.trace=[...trace];
      roleOrder.forEach((role,idx)=>{const radius=.55+idx*.15,z=(idx-3)*.08;ctx.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,p=project({x:Math.cos(a)*radius,y:Math.sin(a)*radius,z},w,h);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.strokeStyle=`${state.roleColors[role]}32`;ctx.lineWidth=idx%2?1:1.5;ctx.stroke()});
      edges.forEach(e=>{const a=project(e.from,w,h),b=project(e.to,w,h),hot=trace.has(e.from.id)&&trace.has(e.to.id),cross=e.from.role!==e.to.role,publicEdge=publicChannels.has(e.to.message.channel);if(!hot&&!cross)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=hot?(publicEdge?"#e85d38ef":`${state.roleColors[e.role]}ef`):(publicEdge?"#e85d3820":`${state.roleColors[e.role]}18`);ctx.lineWidth=hot?(publicEdge?3.6:2.8):.7;ctx.stroke()});
      if(state.storyLinks.length){ctx.save();ctx.setLineDash([6,5]);state.storyLinks.forEach((e,i)=>{const a=project(e.from,w,h),b=project(e.to,w,h);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=i===state.storyLinks.length-1?"#e85d38":"#263a34";ctx.lineWidth=2.6;ctx.stroke()});ctx.restore()}
      const projected=allNodes.map(n=>({n,p:project(n,w,h)})).sort((a,b)=>a.p.z-b.p.z);
      projected.forEach(({n,p})=>{const hot=n.kind==="role"||trace.has(n.id)||n.id===selectedId,color=state.roleColors[n.role]||"#77746c";if(n.kind==="message"&&p.scale<.38)return;const r=n.kind==="role"?12:Math.max(1.7,3.1*p.scale)+(hot?6:0);ctx.globalAlpha=n.kind==="role"?.98:(hot?.98:.22);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(hot){ctx.beginPath();ctx.arc(p.x,p.y,r+9,0,Math.PI*2);ctx.strokeStyle=`${color}8a`;ctx.lineWidth=1.8;ctx.stroke()}if(n.kind==="role"){const right=n.x>=0;ctx.font="600 10px IBM Plex Sans Condensed,Microsoft YaHei,sans-serif";ctx.fillStyle="#252723";ctx.textAlign=right?"left":"right";ctx.fillText(n.label,p.x+(right?15:-15),p.y+3);ctx.textAlign="left"}});ctx.globalAlpha=1;
      selectionLabel.textContent=state.playing?`${caseNames[state.stepCase]||caseNames.all} · 分镜播放中`:(caseNames[activeCase]||caseNames.all);if(state.playing)graphFrame=requestAnimationFrame(draw);
    }
    canvas.addEventListener("pointerdown",e=>{state.drag=true;state.moved=false;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{if(!state.drag)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.moved|=Math.abs(dx)+Math.abs(dy)>2;state.yaw+=dx*.006;state.pitch=Math.max(-.8,Math.min(.8,state.pitch+dy*.005));state.lastX=e.clientX;state.lastY=e.clientY;scheduleDraw()});
    canvas.addEventListener("pointerup",e=>{state.drag=false;canvas.releasePointerCapture?.(e.pointerId)});
    canvas.addEventListener("wheel",e=>{e.preventDefault();state.zoom=Math.max(.65,Math.min(1.55,state.zoom*(e.deltaY>0?.93:1.07)));scheduleDraw()},{passive:false});
    canvas.addEventListener("mousemove",e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,dist=18;nodes.forEach(n=>{const p=project(n,r.width,r.height),d=Math.hypot(p.x-x,p.y-y);if(d<dist){best={n,p};dist=d}});if(best){tooltip.hidden=false;tooltip.style.left=`${best.p.x+16}px`;tooltip.style.top=`${best.p.y+12}px`;tooltip.innerHTML=`<b>${actor(best.n.message).zh}</b><span>${fmtDate(best.n.message.date)} ${fmtTime(best.n.message.timestamp)}</span><p>${esc(short(messageText(best.n.message)).slice(0,98))}</p>`}else tooltip.hidden=true});
    canvas.addEventListener("click",e=>{if(state.moved)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,dist=20;nodes.forEach(n=>{const p=project(n,r.width,r.height),d=Math.hypot(p.x-x,p.y-y);if(d<dist){best=n;dist=d}});if(best){selectedId=best.id;state.trace=[...traceFor(selectedId)];state.storyLinks=[];renderSelection();updateDetail();scheduleDraw()}});
    $("#graph-play",host).onclick=()=>{state.playing=!state.playing;state.startedAt=performance.now();state.lastTick=state.startedAt;$("#graph-play",host).textContent=state.playing?"Ⅱ 暂停分镜":"▶ 分镜播放";scheduleDraw()};
    $("#graph-speed",host).onclick=e=>{const speeds=[9000,6500,4000],i=(speeds.indexOf(state.playbackDelay)+1)%speeds.length;state.playbackDelay=speeds[i];e.currentTarget.textContent=`速度 ${state.playbackDelay/1000}s`};
    $("#graph-trace",host).onclick=()=>{state.trace=state.trace.length?[]:[...traceFor(selectedId)];scheduleDraw()};
    $("#graph-reset",host).onclick=()=>{state.yaw=0;state.pitch=0;state.zoom=1.02;state.focusX=state.focusY=state.focusZ=0;scheduleDraw()};
    $("#graph-exit",host).onclick=()=>{activeChannel="dashboard";activeView="dashboard";activeCase="all";renderAll(true)};
    $$(".graph-steps button",host).forEach(b=>b.onclick=()=>{activeCase=b.dataset.graphCase;renderAll(false)});
    applyStory(({all:0,normal:1,near_miss:2,incident:3})[activeCase]??0);
    $("#graph-prev",host).onclick=()=>{state.playing=false;$("#graph-play",host).textContent="▶ 分镜播放";applyStory(state.storyIndex-1);scheduleDraw()};
    $("#graph-next",host).onclick=()=>{state.playing=false;$("#graph-play",host).textContent="▶ 分镜播放";applyStory(state.storyIndex+1);scheduleDraw()};
    draw(performance.now());
  }
  function renderAll(resetScroll=true){
    buildSidebar();renderHeader();
    if(activeView==="dashboard")renderDashboard();
    else if(activeView==="graph")renderGraph();
    else if(activeView==="dm-directory")renderDmDirectory();
    else if(activeView==="dm")renderDM();
    else if(activeView==="posts")renderPosts();
    else renderGroup();
    renderSelection();renderRight();$$("#case-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.case===activeCase));
    document.body.classList.toggle("density-compact",dense);document.body.classList.toggle("graph-mode",activeView==="graph");if(resetScroll)$("#message-stage").scrollTop=0;
  }
  $("#case-tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;activeCase=b.dataset.case;renderAll(true)};
  $("#message-search").oninput=e=>{query=e.target.value.toLowerCase().trim();renderAll(true)};
  $("#search-focus").onclick=()=>$("#message-search").focus();
  addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();$("#message-search").focus()}});
  $("#density-toggle").onclick=e=>{dense=!dense;e.currentTarget.innerHTML=`密度 <b>${dense?"紧凑":"舒适"}</b>`;renderAll(false)};
  function clear(){activeChannel="dashboard";activeView="dashboard";activePair="";activeCase="all";activeAgent="";query="";$("#message-search").value="";renderAll(true)}
  $("#clear-filters").onclick=clear;$("#empty-clear").onclick=clear;$("#back-dashboard").onclick=clear;
  $("#close-selection").onclick=()=>{selectedId="";renderSelection()};
  $("#channel-info").onclick=()=>{$("#stage-note-text").textContent="频道、私聊和公开帖子使用不同的阅读形态；所有内容仍对应同一份 912 条消息数据。"};
  $("#new-channel").onclick=()=>{$("#stage-note-text").textContent="这里展示的是数据中的真实分组。"};
  $$("[data-close-profile]").forEach(b=>b.onclick=closeProfile);
  addEventListener("keydown",e=>{if(e.key==="Escape")closeProfile()});
  $$(".window-card [data-window]").forEach(b=>b.onclick=()=>{activeCase=b.dataset.window;activeChannel="all";activeView="group";activePair="";renderAll(true)});
  renderAll(true);
})();
