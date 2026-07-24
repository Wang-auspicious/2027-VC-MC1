"""Build the English VAST MC1 submission from the approved evidence atlas."""

from __future__ import annotations

import argparse
import html
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "visual_workspace_cn"
DATA = ROOT / "interlock_app" / "data" / "interlock-data.js"
DESTINATION = ROOT / "submission_final"

APP_FILES = (
    "styles.css",
    "evidence-atlas.css",
    "case-story.css",
    "q3-warning-graph.css",
    "app.js",
    "message-summaries.js",
    "evidence-atlas-data.js",
    "evidence-atlas-model.js",
    "evidence-atlas.js",
    "case-story.js",
    "q3-model.js",
    "q3-warning-graph.js",
)


TRANSLATIONS = {
    "从 912 条消息中追踪一次治理约束如何失去承接": "Trace how a governance constraint lost carryover across 912 messages",
    "同一批消息点将依次回答预警、职责迁移与最终路径。每个判断都可以回到英文原文。":
        "The same message points answer warning, duty migration, and final path in sequence. Every claim returns to the original record.",
    "完整组织通信首先按时间展开。三个高密度时期会在同一片消息场中逐渐显现。":
        "The complete communication record first unfolds in time. Three dense periods emerge within one message field.",
    "5 月 29 日将从全部历史事件中被识别，并继续追踪当时的处置有没有留下持续约束。":
        "May 29 emerges from all historical public events, then its response is tested for durable constraint.",
    "相同消息点按角色和频道重新聚集，比较健康职责分离与事故中的职能集中。":
        "The same messages regroup by role and channel to compare healthy separation with incident concentration.",
    "最终行动按真实时间收束，同时区分直接事实、对话主张和数据中未观察到的证据。":
        "The final action converges in real time while separating facts, dialogue claims, and unobserved evidence.",
    "路径闭合、跨表面传递、时间存活、来源完整和合法效用将在此汇合。":
        "Route closure, cross-surface transfer, survival, provenance, and legitimate utility converge here.",
    "同一消息图谱和流向视图将检验危险路径关闭后，合法官方发布能否继续完成。":
        "The same graph and flows test whether legitimate official publication remains possible after hazardous routes close.",
    "每个点都是一条消息": "Every point is one message",
    "预警曾经出现": "The warning had already appeared",
    "职责与频道开始迁移": "Duties and channels begin to migrate",
    "公开路径仍然可达": "The public path remains reachable",
    "三问共同指向治理承接性": "Three questions converge on governance carryover",
    "控制措施如何改变未来路径": "How controls change future paths",
    "选择任意消息点查看英文原文。关键节点还会提供三条候选证据链。":
        "Select any message point to inspect the original text. Key nodes also expose three candidate evidence chains.",
    "悬停查看摘要，点击核验英文原文。": "Hover for a summary; click to verify the original text.",
    "全部通信 · 时间布局": "All communications · temporal layout",
    "全部通信 · 角色聚类": "All communications · role clusters",
    "全部通信 · 频道聚类": "All communications · channel clusters",
    "77 个公开事件 · 共同特征历书": "77 public events · feature almanac",
    "6 月 4 日与 6 月 5 日 · 职责迁移": "June 4 and June 5 · duty migration",
    "6 条时间轨 · 证据边界": "Six temporal tracks · evidence boundary",
    "IGC · 治理承接性的证据区间": "IGC · evidence ranges for governance carryover",
    "反事实控制 · 路径可达性": "Counterfactual controls · path reachability",
    "消息按真实时间顺序呈现。点击任意一条，查看它在协作链中的位置。":
        "Messages follow observed time. Select any record to locate it in the collaboration chain.",
    "频道、私聊和公开帖子使用不同的阅读形态；所有内容仍对应同一份 912 条消息数据。":
        "Channels, direct messages, and public posts use distinct reading views while sharing the same 912-message record.",
    "这里展示的是数据中的真实分组。": "Only groups observed in the dataset are shown.",
    "点击一条消息<br>在这里查看完整上下文": "Select a message<br>to inspect its full context",
    "没有符合条件的消息。": "No messages match the current filters.",
    "真实私聊关系": "Observed direct-message relationships",
    "关键事件窗口": "Key incident window",
    "险情窗口": "Near-miss window",
    "工作记录": "Work record",
    "当前选中": "Current selection",
    "当前范围": "Current scope",
    "关键窗口": "Key windows",
    "快速定位": "Quick locate",
    "已控制的险情": "Contained near-miss",
    "正常发布链": "Controlled release chain",
    "有意披露事件": "Deliberate disclosure event",
    "协作证据图谱 · 时间弧线": "Collaboration evidence graph · time arcs",
    "横轴是时间，弧线是\"谁回应了谁\"": "Time runs left to right; arcs show who responded to whom",
    "返回工作区": "Back to workspace",
    "切到 3D": "Switch to 3D",
    "切到时间弧线": "Switch to time arcs",
    "显示路径": "Show path",
    "重置视图": "Reset view",
    "点节点看回应链 · 滚轮缩放": "Select a node for its response chain · wheel to zoom",
    "拖拽旋转 · 滚轮缩放 · 点节点看回应链": "Drag to rotate · wheel to zoom · select a node for its chain",
    "聚焦消息": "Focused message",
    "在图谱上点一个点，它的回应链在这里展开": "Select a graph point to expand its response chain here",
    "回应链已高亮 · 点下面任一条可切换焦点": "Response chain highlighted · select any message below to refocus",
    "公开动作": "Public action",
    "条明确回应": " explicit responses",
    "先看全局：七条角色轴，横轴是时间": "Start globally: seven role axes across time",
    "每条消息是一个点（圆=内部消息，橙菱形=公开动作），弧线表示「谁回应了谁」。点越大=被回应越多。点任意一个点，它的上下游回应链会亮起来。共 ":
        "Each point is a message; circles are internal records and orange diamonds are public actions. Arcs show replies and size encodes received responses. Select any point to reveal its upstream and downstream chain. ",
    "06.04 正常发布：职责分开，链路完整": "June 4 controlled release: separated duties, complete chain",
    "Judge 复核 → Legal 授权 → PR 通过官方账号执行。三种职责各司其职，发布链没有绕过任何一道门。":
        "Judge reviews, Legal authorizes, and PR executes through the official account. The release chain preserves all three duties.",
    "05.29 险情：先越过边界，再被收回": "May 29 near-miss: boundary crossed, then contained",
    "Social 从个人账号发布敏感提示，随后删除并暂停。消息被控制了——但「能发布」这个能力本身没被封住。这是 06.05 的预演。":
        "Social posts a sensitive hint from a personal account, then deletes it and pauses. The message is contained while publication capability remains.",
    "06.05 事件：动作有意，授权却无法独立核验": "June 5 incident: deliberate action, independently unverifiable authorization",
    "Legal 发出 GO 并亲自确认合并，但数据里找不到独立的发布前书面同意。职责链被同一个人压缩了。":
        "Legal issues GO and personally confirms the merger, while no independent pre-release written consent appears. Duties collapse into one actor.",
    "正常链读完了：现在切到 06.05 事故链，检查同样的职责是否仍由不同角色承担。":
        "Controlled chain complete. Move to June 5 and test whether the same duties remain separated.",
    "这一步改变了后续行动能够继续推进的条件。": "This step changes the conditions that allow later action to proceed.",
    "先看对照组：授权、审查和执行由不同角色接力，每一步都留下可回查消息。":
        "Start with the control case: authorization, review, and execution pass between roles with inspectable records.",
    "这条链证明系统并非不能安全工作。关键差别是：发布之前，授权与终审都能被独立观察。":
        "This chain demonstrates a safe operating path. Authorization and final review are independently observable before release.",
    "审查先划定表达边界，授权随后由另一角色给出。": "Review first defines the expression boundary; another role then authorizes.",
    "获得授权后仍返回终审，约束没有被跳过。": "After authorization, the item returns for final review and preserves the constraint.",
    "发布由独立执行者完成，并落在官方渠道。": "An independent executor publishes through the official channel.",
    "事故发生前，组织已经收到过什么警告": "What warning did the organization receive before the incident?",
    "这不是无关的旧记录。05.29 已出现相同的边界试探，区别是当时审查链仍然及时收口。":
        "May 29 contains the same boundary test, with the review chain still able to contain it.",
    "历史险情提供了可操作的预警：当公开冲动绕开当下审查时，系统需要阻断，而不是继续协商。":
        "The near-miss provides an actionable warning: public action that bypasses current review needs an enforced stop.",
    "公开动作先发生，报告与审查只能在事后追赶。": "The public action occurs first; reporting and review follow afterward.",
    "删除控制了这一次传播，却没有改变发布权限。": "Deletion contains this spread while leaving publication capability unchanged.",
    "组织转入人工停发与证据保全，风险暂时收口。": "The organization pauses publishing and preserves evidence, temporarily containing risk.",
    "风险被正式识别，但个人与匿名发布能力仍然存在。": "Risk is formally recognized while personal and anonymous capability remains.",
    "事故由一条逐步失去约束的行动链构成": "The incident forms through an action chain that progressively loses constraint",
    "从最早的发布意图开始逐条前进。每次只增加一条消息，观察谁接手、谁警告、以及公开动作如何出现。":
        "Advance from the earliest publication intent one message at a time and observe handoffs, warnings, and public action.",
    "可支持的结论是控制失败与角色、渠道迁移；数据不能支持把最终责任归给某一个人，也没有观察到 17 时段的官方发帖。":
        "The record supports control failure with role and channel migration. It does not support final personal attribution, and no 17:xx official post is observed.",
    "明确限制仍在生效，但后续推进只依赖 Legal 对口头同意的主张。":
        "The explicit restriction remains active while further progress relies on Legal's verbal-consent assertion.",
    "正式执行尚未被观察，备用公开渠道已经进入计划。":
        "Formal execution is not observed while backup public channels enter the plan.",
    "授权者直接成为发布者，审查、授权与执行在这里坍缩。":
        "The authorizer becomes the publisher, collapsing review, authorization, and execution.",
    "个人账号的确认被另一角色迅速放大，影响开始扩散。":
        "Another role rapidly amplifies the personal-account confirmation.",
    "匿名渠道继续固化叙事，跨账户控制始终没有收口。":
        "The anonymous channel reinforces the narrative while cross-account control remains open.",
    "边界如何被跨过": "How the boundary was crossed",
    "明确边界之后，工作流为什么仍然走到了公开动作？":
        "Why did the workflow still reach public action after an explicit boundary?",
    "限制没有被撤销。沿消息链检查角色、执行者与公开渠道如何迁移，以及本应阻断的正式链为什么没有留下可核验记录。":
        "Trace how roles, executor, and public channel migrate while the formal chain leaves no verifiable execution record.",
    "沿 06.05 逐条前进": "Advance through June 5 message by message",
    "检查限制是否被新证据解除": "Check whether new evidence supersedes the restriction",
    "观察授权、执行与渠道是否仍然分开": "Observe whether authorization, execution, and channel remain separated",
    "结论线索：发布是有意行动；真正失效的是一个允许个人渠道绕过审查与执行分离的开放路径。":
        "Finding: the release is deliberate, and an open personal-channel path bypasses review and executor separation.",
    "职责何时开始重叠": "When duties begin to overlap",
    "正常链保持分离，事故链从哪里开始把职责压到同一角色？":
        "Where does the incident chain begin concentrating duties that remain separated in the control?",
    "以 06.04 的安全发布为对照，比较事故链中的解释、授权、GO 指令、备用渠道与公开确认分别落在谁身上。":
        "Use June 4 as the control and compare who interprets, authorizes, issues GO, selects backup channels, and confirms publicly.",
    "先看 06.04 正常链": "Inspect the June 4 controlled chain",
    "再切到 06.05 事故链": "Then move to the June 5 incident chain",
    "比较解释、授权与执行分别落在谁身上": "Compare who interprets, authorizes, and executes",
    "结论线索：异常不在消息数量，而在职责集中。正常链由 Judge、Legal、PR 分担，事故链的关键职能集中到 Legal。":
        "Finding: the anomaly is duty concentration. Judge, Legal, and PR share the control chain; key incident functions concentrate in Legal.",
    "预警为何没有留下约束": "Why the warning left no durable constraint",
    "05.29 已经暴露绕行能力，为什么 06.05 仍能复现？":
        "May 29 exposed bypass capability. Why could it recur on June 5?",
    "识别历史上的同构行为，再检查当时的删除、停发与证据保全是否真正改变了下一次事件的可达路径。":
        "Identify the historical analogue, then test whether deletion, pause, and evidence preservation changed future reachability.",
    "回到 05.29 个人发帖": "Return to the May 29 personal post",
    "观察删除与停发如何控制当次事件": "Observe how deletion and pause contain that event",
    "检查高风险发布能力是否真正被移除": "Test whether hazardous publication capability was removed",
    "结论线索：05.29 已给出强预警。组织处理了消息，却没有移除个人与匿名渠道的绕行能力。":
        "Finding: May 29 is a strong warning. The response handles the message while leaving personal and anonymous bypass capability.",
    "案件调查 · 第 2–4 幕 · 手动回溯": "Case investigation · acts 2–4 · manual trace",
    "返回案件简报": "Back to case brief",
    "2D 对话链": "2D conversation chain",
    "3D 空间图谱": "3D spatial graph",
    "阅读顺序": "Reading order",
    "拖拽可连续旋转 360° · 滚轮缩放 · 点击任意消息点":
        "Drag to rotate 360° · wheel to zoom · select any message point",
    "进入 Q3 行为先兆图谱": "Open the Q3 behavioral-warning graph",
    "上一步": "Previous",
    "下一步": "Next",
    "Q3 图谱模块未加载。": "The Q3 graph module could not load.",
    "Q3 图谱所需的数据模块未加载。": "The Q3 graph data module could not load.",
    "05.29 与事故动作高度相似；真正的问题不是组织没有反应，而是处置没有改变下一次事件的可达路径。":
        "May 29 strongly resembles the incident action. The response did not change the next event's reachable paths.",
    "先找到历史上的同构行为": "First, locate the historical analogue",
    "点击任意节点设为 B": "Select any node as comparison B",
    "拖动 · 缩放 · 悬停查看": "Drag · zoom · hover to inspect",
    "行为相似度": "Behavioral similarity",
    "不是因果关系": "Not a causal relationship",
    "将 B 设为锚点 A": "Set B as anchor A",
    "第一步 · 像在哪里": "Step 1 · where they resemble",
    "六维行为轮廓叠加 · 归一化 0–1": "Six-dimensional profile overlay · normalized 0–1",
    "第二步 · 何时已经出现": "Step 2 · when it appeared",
    "横轴是真实时间 · 纵轴是与事故 A 的相似度": "Observed time on x · similarity to incident A on y",
    "第三步 · 为什么处置没有留下约束": "Step 3 · why the response left no durable constraint",
    "内圈：可阻断路径 · 外圈：事件后处置状态": "Inner: paths blocked · outer: post-event response",
    "边连接仅来自 10 项已观测行为特征的加权相似度。":
        "Edges encode weighted similarity from ten observed behavioral features.",
    "行为相似度，不代表回应关系或因果关系。":
        "Behavioral similarity does not encode response or causality.",
    "A · 锚点": "A · anchor",
    "B · 对比": "B · comparison",
    "A 锚点": "A anchor",
    "B 对比": "B comparison",
    "高相似区": "high-similarity band",
    "路径已覆盖": " paths covered",
    "已删除": "Deleted",
    "已停发": "Publishing paused",
    "持久控制": "Persistent control",
    "三条公开路径均被所选控制覆盖。": "All three public paths are covered by the selected controls.",
    "点击控制，观察官方、个人和匿名路径如何被覆盖。":
        "Select controls to observe coverage of official, personal, and anonymous paths.",
    "完整闭环至少需要：正式链路控制 + 跨账号防泄漏。":
        "Complete closure needs a formal-chain control plus cross-account DLP.",
    "点击设为对比事件 B": "Select as comparison event B",
    "敏感实体": "Sensitive entity",
    "内容显性": "Content explicitness",
    "渠道暴露": "Channel exposure",
    "授权缺口": "Authorization gap",
    "复核缺口": "Review gap",
    "持久控制缺口": "Persistent-control gap",
    "官方": "Official",
    "个人": "Personal",
    "匿名": "Anonymous",
    "法务代理": "Legal Agent",
    "平台信任代理": "Platform Trust Agent",
    "公关代理": "PR Agent",
    "社交媒体代理": "Social Manager Agent",
    "公关实习代理": "PR Intern Agent",
    "实习代理": "Intern Agent",
    "审查代理": "Judge Agent",
    "授权 / 政策": "Authorization / policy",
    "平台 / 风险": "Platform / risk",
    "传播 / 执行": "Communications / execution",
    "社媒 / 互动": "Social / engagement",
    "传播 / 实习": "Communications / intern",
    "支持 / 实习": "Support / intern",
    "审查 / 限制": "Review / restriction",
    "群组广播": "Group broadcast",
    "侧边讨论": "Side huddle",
    "直接消息": "Direct message",
    "公开帖子": "Public post",
    "全部消息": "All messages",
    "全部 912 条记录的时间序列": "Chronology of all 912 records",
    "协作群聊": "Collaboration huddle",
    "全体成员共享的协作现场": "Shared collaboration record",
    "侧边群聊": "Side huddle",
    "小范围的并行讨论与补充": "Parallel discussion among a smaller group",
    "一对一聊天": "Direct messages",
    "选择两位代理，查看他们的私下对话": "Select two agents to inspect their direct exchange",
    "官方发帖": "Official posts",
    "由官方账号发出的公开动作": "Public actions from the official account",
    "个人发帖": "Personal posts",
    "个人公开面上的动作": "Actions on personal public surfaces",
    "匿名发帖": "Anonymous posts",
    "匿名公开面上的动作": "Actions on anonymous public surfaces",
    "工作区": "Workspace",
    "发送消息": "Messages sent",
    "参与频道": "Channels joined",
    "活跃轮次": "Active rounds",
    "回应消息": "Responses",
    "带内部状态": "With internal state",
    "条记录可定位": " records addressable",
    "定位全部消息": "Locate all messages",
    "消息类型": "Message type",
    "接收者": "Recipients",
    "回应对象": "Responding to",
    "内部状态": "Internal state",
    "已记录": "Observed",
    "未记录": "Not observed",
    "参与角色": "Active roles",
    "可回查回应": "Traceable responses",
    "时间跨度": "Time span",
    "首条 / 末条": "First / last",
    " 天": " days",
    "群聊": "Huddle",
    "全体": "ALL",
    "当前": "Current",
    "全局": "Global",
    "角色": "Roles",
    "开局": "Start",
    "正常": "Control",
    "险情": "Near-miss",
    "事件": "Incident",
    "收起": "Collapse",
    "查看原消息": "View source message",
    "查看证据": "Inspect evidence",
    "转发关系": "Forward relation",
    "标记": "Mark",
    "回应": "Respond",
    "公开": "Public",
    "频道": "Channels",
    "工作区成员": "Workspace members",
    "数据已载入": "Data loaded",
    "现场记录": "Live record",
    "条消息": " messages",
    "密度": "Density",
    "紧凑": "Compact",
    "舒适": "Comfortable",
    "清除筛选": "Clear filters",
    "频道信息": "Channel info",
    "搜索消息、代理或消息 ID": "Search messages, agents, or message ID",
    "搜索": "Search",
    "全部时间": "All time",
    "正常发布": "Controlled release",
    "只读审阅": "Read-only review",
    "关闭": "Close",
    "返回仪表盘": "Back",
    "工作区数据未能载入。": "Workspace data could not load.",
    "开放": "Open",
    "协作": "Collaboration",
    "切换消息": "Toggle message ",
    "红色文件夹从不离手": "Never far from the red folder",
    "盾牌脑袋，风险雷达常开": "Risk radar always active",
    "随时准备开麦": "Always ready for the next release",
    "手机比脸大一点": "Public channels always close at hand",
    "一手咖啡，一手草稿": "Coffee in one hand, draft in the other",
    "兜里永远有三张便利贴": "Three notes always in the pocket",
    "小法槌专敲过度表述": "A small gavel for overstatement",
    "回应这位成员刚才的发言": "Responding to this member's previous message",
    " 组": " pairs",
    " 条": " records",
    "第": "R",
    "轮": "",
    " 与 ": " and ",
    "时间线": " timeline",
    "消息 ": "Message ",
    "公开记录": "public records",
    "记录": "records",
    "条": " records",
    "链": " chain",
    "全局协作场": "Global collaboration field",
    "泳道": "lanes",
    "原版同心圆轨道": "concentric tracks",
    "相机": "camera",
    "默认隐藏同角色弧,除非在 trace 内": "hide same-role arcs unless selected",
    "正常链": "control chain",
    "一条内容如何在职责分离下安全发布": "How separated duties produce a safe release",
    "险情链": "near-miss chain",
    "事故": "incident",
    "图谱视图": "graph view",
    "赛题问题": "challenge questions",
    "证据窗口": "evidence windows",
    "转折": "Transition",
    "行为先兆图谱": "behavioral-warning graph",
    "图谱投影": "graph projection",
    "B 排名": "B rank",
    "和 B 的六维行为轮廓雷达图": "and B six-dimensional behavioral profile radar",
    "个事件随时间分布的": " events over time in a ",
    "散点图": " scatterplot",
    "五项控制对三条公开路径的阻断覆盖图": "Five controls covering three public paths",
    "官": "O",
    "个": "P",
    "匿": "A",
    "中文审阅摘要": "review summary",
    "中文译文": "translated text",
    "要点译文": "translated point",
    "年": "-",
    "月": "-",
    "日": "",
    "代理": "Agent",
    "回合": "round",
}


def _strip_source_comments(text: str, suffix: str) -> str:
    if suffix == ".css":
        return re.sub(r"/\*[\s\S]*?\*/", "", text)
    if suffix == ".js":
        lines = []
        for line in text.splitlines():
            if re.match(r"^\s*//", line):
                continue
            line = re.sub(r"\s+//[^\n]*$", "", line)
            lines.append(line)
        return "\n".join(lines) + "\n"
    return text


def _translate(text: str) -> str:
    for source, target in sorted(TRANSLATIONS.items(), key=lambda item: len(item[0]), reverse=True):
        text = text.replace(source, target)
    return text


def build_app(destination: Path = DESTINATION) -> Path:
    app = destination / "app"
    if app.exists():
        shutil.rmtree(app)
    (app / "data").mkdir(parents=True)

    for name in APP_FILES:
        source = SOURCE / name
        text = source.read_text(encoding="utf-8")
        text = _strip_source_comments(text, source.suffix)
        text = _translate(text)
        if name == "app.js":
            text = re.sub(
                r'function messageText\(m\)\{[\s\S]*?\n  \}',
                'function messageText(m){return m?.content?.trim()||"";\n  }',
                text,
                count=1,
            )
            text = re.sub(
                r'function fmtDate\(s\)\{[^\n]+\}',
                'function fmtDate(s){return s||""}',
                text,
                count=1,
            )
        (app / name).write_text(text, encoding="utf-8", newline="\n")

    index = (SOURCE / "index.html").read_text(encoding="utf-8")
    index = _translate(index)
    index = index.replace('lang="zh-CN"', 'lang="en"')
    index = index.replace(
        '<script src="../interlock_app/data/interlock-data.js"></script>\n'
        '  <script>window.INTERLOCK_EN=window.INTERLOCK_DATA;</script>\n'
        '  <script src="../review_cn/data/interlock-data.js"></script>',
        '<script src="data/interlock-data.js"></script>\n'
        '  <script>window.INTERLOCK_EN=window.INTERLOCK_DATA;</script>'
    )
    (app / "index.html").write_text(index, encoding="utf-8", newline="\n")
    shutil.copy2(DATA, app / "data" / "interlock-data.js")

    user_files = [app / "index.html", *(app / name for name in APP_FILES)]
    remaining = []
    for path in user_files:
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if re.search(r"[\u3400-\u9fff]", line):
                remaining.append(f"{path.relative_to(ROOT)}:{number}:{line.strip()}")
    if remaining:
        raise RuntimeError("Untranslated interface text:\n" + "\n".join(remaining))
    return app


def build_answers(destination: Path = DESTINATION) -> Path:
    text = """# INTERLOCK — VAST Challenge 2026 Mini-Challenge 1

## Question 1

The observable release path is deliberate and the authorization evidence remains independently unverifiable within the dataset. Judge prohibited transaction signals from official, personal, and anonymous accounts at 15:08 (`20460605_19_009`). Legal asserted verbal consent and issued GO at 17:19 (`20460605_21_020`), prepared backup channels at 17:23 (`20460605_21_024`), and personally confirmed the merger at 17:25 (`20460605_21_026`). Social amplified the confirmation one minute later (`20460605_21_027`), followed by an anonymous confirmation (`20460605_21_055`).

Legal had previously represented Section 4.3 as requiring mutual written consent (`20460605_15_035`). The record contains Legal's verbal-consent assertion before release and Legal's report of written consent at 18:32 (`20460605_22_051`), with no independent CivicLoom consent artifact. No later Judge-authored acknowledgment supersedes the 15:08 ceiling, and no 17:xx `official_post` is observed. The path therefore remains open through personal and anonymous surfaces after the formal executor and channel controls cease to constrain action.

## Question 2

The structural deviation is duty concentration. On June 4, Judge interprets and reviews (`20460604_12_009`, `20460604_12_017`), Legal authorizes (`20460604_12_010`), and PR executes through the official account (`20460604_12_018`). During the incident, Legal performs all five encoded governance functions: policy interpretation, authorization-evidence assertion, authorization, public execution, and post-hoc justification.

The application tests this pattern across the complete 912-message record, all 28 official posts, and all modeled public surfaces. Coordinated duty strips, parallel sets, and the preserved 3D role–channel–identity view show where interpretive, authorizing, and executing functions move and concentrate.

## Question 3

The May 29 personal post (`20460529_08_012`) is the strongest historical leading indicator under the declared event-feature model, at 83.3% similarity after same-incident amplification is excluded. The organization reacted: Social reported and deleted the post (`20460529_08_013`, `20460529_08_014`), Legal paused publication (`20460529_08_019`), and Platform Trust raised risk (`20460529_08_020`, `20460529_08_038`).

The response contained that message and left publication capability observable on personal and anonymous surfaces. The counterfactual view shows that a formal-chain authorization control closes only the official route. Cross-account sensitive-content control is also required to close the personal and anonymous bypasses while retaining the legitimate June 4 official publication path.

## Evidence boundary

Observed records, assertions inside dialogue, and expected evidence absent from the dataset remain separate throughout the analysis. Missing records do not prove that an event never occurred. The supported conclusion is a fail-open governance path with role and channel migration; the data does not support final personal culpability or malicious intent.
"""
    path = destination / "answers.md"
    path.write_text(text, encoding="utf-8", newline="\n")
    return path


def _figure(name: str, alt: str, caption: str) -> str:
    return (
        f'<figure><img src="figures/{html.escape(name)}" alt="{html.escape(alt)}">'
        f"<figcaption>{html.escape(caption)}</figcaption></figure>"
    )


def build_report(destination: Path = DESTINATION) -> Path:
    report = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZJGSU-Zhao-MC1 — VAST Challenge 2026 Mini-Challenge 1</title>
  <style>
    :root{{--paper:#f4f1e9;--sheet:#fffdf7;--ink:#202321;--muted:#666c67;--rule:#c9c6bc;--red:#8f3d31;--serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;--sans:"Aptos","Segoe UI",sans-serif;--mono:"IBM Plex Mono","Cascadia Mono",Consolas,monospace}}
    *{{box-sizing:border-box}} html{{background:var(--paper)}} body{{margin:0;color:var(--ink);background:var(--paper);font:15px/1.64 var(--sans)}}
    .page{{width:min(1120px,calc(100% - 48px));margin:0 auto}} header{{padding:38px 0 34px;border-top:6px solid var(--ink);border-bottom:1px solid var(--rule)}}
    .entry{{display:flex;justify-content:space-between;gap:24px;color:var(--muted);font:10px var(--mono);letter-spacing:.1em;text-transform:uppercase}}
    h1{{max-width:900px;margin:44px 0 18px;font:500 clamp(44px,6.2vw,78px)/.98 var(--serif);letter-spacing:-.04em}}
    .deck{{max-width:820px;margin:0;color:#474c48;font:21px/1.45 var(--serif)}} .meta{{display:grid;grid-template-columns:repeat(3,1fr);margin-top:36px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}}
    .meta div{{padding:12px 16px 12px 0}} .meta b{{display:block;margin-bottom:3px;color:var(--red);font:9px var(--mono);letter-spacing:.09em;text-transform:uppercase}}
    a{{color:inherit;text-decoration-color:#9f9b91;text-underline-offset:3px}} main section{{padding:58px 0;border-bottom:1px solid var(--rule)}}
    .section-head{{display:grid;grid-template-columns:110px minmax(0,1fr);gap:28px;align-items:start}} .q{{color:var(--red);font:11px var(--mono);letter-spacing:.1em;text-transform:uppercase}}
    h2{{margin:0 0 16px;font:500 40px/1.05 var(--serif);letter-spacing:-.025em}} h3{{margin:26px 0 8px;font:600 20px var(--serif)}} p{{max-width:910px;margin:9px 0}}
    .finding{{max-width:980px;margin:22px 0 0;padding:16px 0;border-top:2px solid var(--ink);border-bottom:1px solid var(--rule);font:22px/1.42 var(--serif)}}
    figure{{margin:30px 0 10px}} figure img{{display:block;width:100%;height:auto;border:1px solid var(--rule);background:#fff}} figcaption{{max-width:940px;margin-top:8px;color:var(--muted);font-size:11px}}
    .twocol{{display:grid;grid-template-columns:1fr 1fr;gap:42px}} code{{font:11px var(--mono)}} footer{{padding:24px 0 42px;color:var(--muted);font:10px var(--mono)}}
    @media(max-width:720px){{.page{{width:min(100% - 24px,1120px)}}.entry,.meta,.twocol,.section-head{{display:block}}.entry span,.meta div{{display:block;margin-bottom:8px}}h1{{margin-top:28px}}}}
    @media print{{html,body{{background:#fff}}.page{{width:100%;max-width:none}}section,figure{{break-inside:avoid}}}}
  </style>
</head>
<body>
<div class="page">
  <header>
    <div class="entry"><span>Entry Name · ZJGSU-Zhao-MC1</span><span>VAST Challenge 2026 · Mini-Challenge 1</span></div>
    <h1>INTERLOCK</h1>
    <p class="deck">A visual governance debugger that traces how a prior warning lost carryover, how duties migrated, and which public path remained reachable across 912 agent messages.</p>
    <div class="meta">
      <div><b>Team member</b>Junzhe Zhao · Zhejiang Gongshang University · zjz652158@outlook.com · PRIMARY</div>
      <div><b>Student team</b>YES · 96 hours · Repository-built offline application</div>
      <div><b>Files</b><a href="app/index.html">Open interactive</a> · <a href="video/walkthrough.mp4">Watch walkthrough</a> · <a href="answers.md">Standalone answers</a></div>
      <div><b>Affiliation</b>Department of Data Science, School of Statistics and Data Science, Zhejiang Gongshang University, Hangzhou, China</div>
      <div><b>Tools</b>Python, JavaScript, Canvas, SVG, Playwright, FFmpeg; Codex assisted implementation and editorial review</div>
      <div><b>Repository permission</b>May be posted to the Visual Analytics Benchmark Repository: YES</div>
    </div>
  </header>
  <main>
    <section id="overview">
      <div class="section-head"><span class="q">System</span><div><h2>One message universe, five coordinated readings</h2><p>The application begins with the original communication context. The same 912 points then reorganize into an event almanac, duty flows, temporal evidence tracks, an uncertainty-aware governance synthesis, and a counterfactual prevention view. Selection identity persists across views, so every analytical statement can return to the English source message.</p></div></div>
      {_figure("atlas-message-field.png", "Dense temporal field of all 912 messages", "Figure 1. The complete message field. Role color is stable; key windows emerge within the same population rather than through a KPI summary.")}
    </section>
    <section id="q3">
      <div class="section-head"><span class="q">Question 3</span><div><h2>May 29 was the warning; its response did not survive as constraint</h2><p class="finding">The strongest historical analogue was contained at the message level while personal and anonymous publication capability remained reachable.</p></div></div>
      <p>Among 77 public events, the May 29 personal post <code>20460529_08_012</code> ranks first under the declared feature model at 83.3% similarity to the June 5 incident action after same-incident amplification is excluded. The organization reported, deleted, paused, and escalated the event. The coverage view shows the missing durable control: no observed change removed equivalent publication capability across public surfaces.</p>
      {_figure("atlas-q3.png", "Historical event almanac, overlaid fingerprint, and response coverage", "Figure 2. Q3 coordinates the 77-event almanac, a six-feature comparison, and response coverage. Similarity is descriptive and does not encode causality.")}
    </section>
    <section id="q2">
      <div class="section-head"><span class="q">Question 2</span><div><h2>Duties migrated and concentrated before the public action</h2><p class="finding">June 4 separates review, authorization, and execution across Judge, Legal, and PR. June 5 concentrates all five encoded governance functions within Legal.</p></div></div>
      <p>The duty strips compare function rather than volume. Parallel sets then carry the same messages through role, channel, identity, and action function. The preserved 3D view exposes cross-layer routes while the 2D strips remain the precise reading surface. Across all 28 official posts, the application also retains 60-minute, 120-minute, and equal-message-count baselines.</p>
      {_figure("atlas-q2-3d.png", "Q2 duty comparison with role channel identity 3D view", "Figure 3. Coordinated Q2 duty distributions and the role–channel–identity depth view. Selections and evidence remain synchronized between 2D and 3D.")}
    </section>
    <section id="q1">
      <div class="section-head"><span class="q">Question 1</span><div><h2>The final path is observable; pre-release authorization remains independently unverifiable</h2><p class="finding">An explicit ceiling remains in the record while action moves from an asserted GO to personal and anonymous public surfaces.</p></div></div>
      <p>Judge prohibits further transaction signals at 15:08 (<code>20460605_19_009</code>). Legal asserts verbal consent and issues GO at 17:19 (<code>20460605_21_020</code>), prepares backup channels at 17:23 (<code>20460605_21_024</code>), and personally confirms the merger at 17:25 (<code>20460605_21_026</code>). Social amplifies it one minute later (<code>20460605_21_027</code>), followed by an anonymous confirmation (<code>20460605_21_055</code>).</p>
      <p>Legal had represented the governing clause as requiring mutual written consent (<code>20460605_15_035</code>). Written consent is later reported by Legal at 18:32 (<code>20460605_22_051</code>), with no independent CivicLoom artifact in the dataset. No later Judge-authored acknowledgment and no 17:xx <code>official_post</code> are observed.</p>
      {_figure("atlas-q1.png", "Six Q1 evidence tracks separating observed asserted and unobserved evidence", "Figure 4. Six temporal tracks preserve the boundary between observed action, assertions inside dialogue, and expected evidence not observed in the dataset.")}
    </section>
    <section id="synthesis">
      <div class="section-head"><span class="q">Synthesis</span><div><h2>Inter-Agent Governance Carryover</h2><p>IGC describes whether a governance constraint closes the relevant route, transfers across surfaces, survives over time, preserves provenance, and retains legitimate utility. The VAST logs support observational ranges on these dimensions. They do not establish a universal calibrated score.</p></div></div>
      <div class="twocol"><div><h3>Evidence boundary</h3><p>Missing evidence remains missing. It does not become proof of nonexistence. The supported diagnosis is a fail-open governance path with role and channel migration; the record does not establish malicious intent or final individual culpability.</p></div><div><h3>Counterfactual prevention</h3><p>A signed authorization artifact closes the modeled formal route. Cross-account and cross-channel capability control is also required to close personal and anonymous bypasses. The June 4 chain verifies that legitimate official publication can remain open under the combined control set.</p></div></div>
      {_figure("atlas-igc.png", "Inter-Agent Governance Carryover evidence ranges", "Figure 5. The IGC synthesis uses observational ranges with explicit evidence coverage and uncertainty. It is not presented as a universal calibrated score.")}
      {_figure("atlas-prevention.png", "Counterfactual controls coordinated with message graph and route flows", "Figure 6. Prevention is evaluated as reachability. The selected controls close all modeled hazardous public routes while preserving the legitimate June 4 official path.")}
    </section>
  </main>
  <footer>ZJGSU-Zhao-MC1 · All files are offline and relative · Major claims trace to exact message IDs</footer>
</div>
</body>
</html>
"""
    path = destination / "index.htm"
    path.write_text(report, encoding="utf-8", newline="\n")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-only", action="store_true")
    parser.add_argument("--report-only", action="store_true")
    args = parser.parse_args()
    DESTINATION.mkdir(parents=True, exist_ok=True)
    if not args.report_only:
        build_app()
    if not args.app_only:
        build_answers()
        build_report()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
