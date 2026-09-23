const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(root, 'content/site.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function webURL(value) {
  if (!value) return '';
  const u = new URL(value);
  if (!['https:', 'http:'].includes(u.protocol)) throw new Error('Only http(s) links are allowed: '+value);
  return u.href;
}
// Metadata is intentionally limited to one key: value per line. Body is standard Markdown.
function collection(name) {
  const folder = path.join(root, 'content', name);
  return fs.readdirSync(folder).filter(f => f.endsWith('.md')).sort().map(file => {
    const raw = fs.readFileSync(path.join(folder, file), 'utf8').replace(/\r\n/g, '\n');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error('Missing metadata block: '+file);
    const data = {};
    for (const line of match[1].split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const part = line.match(/^([a-z_]+):\s*(.*)$/);
      if (!part) throw new Error('Use one metadata field per line: '+file);
      let value = part[2].trim();
      if (value.startsWith('"')) value = JSON.parse(value);
      data[part[1]] = value;
    }
    if (!data.title) throw new Error('Missing title: '+file);
    data.slug = file.slice(0,-3);
    if (!/^[a-z0-9-]+$/.test(data.slug)) throw new Error('Use lowercase ASCII filenames: '+file);
    data.body = match[2];
    for (const k of ['link','paper','code','project']) if (data[k]) data[k] = webURL(data[k]);
    if (data.image && (!data.image.startsWith('assets/') || data.image.includes('..') || !fs.existsSync(path.join(root,data.image)))) throw new Error('Image must exist under assets/: '+file);
    if (name === 'news' && (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || '') || new Date(data.date+'T00:00:00Z').toISOString().slice(0,10)!==data.date)) throw new Error('Use a valid YYYY-MM-DD date: '+file);
    return data;
  }).filter(d=>d.published === 'true').sort((a,b)=>name==='news'?b.date.localeCompare(a.date):Number(a.order||99)-Number(b.order||99));
}
const publications = require('./publications.cjs')(root, esc, webURL);
const news = collection('news');
const research = collection('research');
const routes = [['index.html','首页'],['research.html','研究'],['news.html','新闻'],['people.html','成员'],['join.html','加入我们']];
function links(item) {return ['paper','code','project'].filter(k=>item[k]).map(k=>`<a href="${esc(item[k])}" target="_blank" rel="noopener noreferrer">${{paper:'论文',code:'代码',project:'项目主页'}[k]} ↗</a>`).join('');}
function shell(file, title, content, active) {
 const base = '../'.repeat(file.split('/').length-1);
 const nav=routes.map(([url,label])=>`<a href="${base+url}"${(active||file)===url?' class="active" aria-current="page"':''}>${label}</a>`).join('');
 const favicon = 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#1d1d1f"/><text x="4" y="28" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="white">M+</text></svg>`);
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(site.description)}"><meta name="theme-color" content="#ffffff"><title>${esc(title)} · ${esc(site.name)}</title><link rel="icon" href="${esc(favicon)}"><link rel="stylesheet" href="${base}assets/style.css"></head><body><header><div class="nav-wrap"><a class="brand" href="${base}index.html" aria-label="${esc(site.name)} ${esc(site.subtitle)}，返回首页"><img class="brand-logo" src="${base}assets/msense-logo.svg" width="124" height="42" alt="${esc(site.name)}"><span class="brand-name">${esc(site.subtitle)}</span></a><nav aria-label="主导航">${nav}</nav></div></header><main>${content}</main><footer><div class="footer-inner"><div><strong>${esc(site.name)} · ${esc(site.subtitle)}</strong><p>${site.affiliation?esc(site.affiliation):'实验室介绍初稿 · 正式名称与所属单位待确认'}</p></div><div class="footer-links"><a href="${base}join.html">联系与加入</a><a href="${esc(webURL(site.repository))}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></div></footer></body></html>`;
 fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.writeFileSync(path.join(out,file),html);
}
function newsList(items,base='') {
 if(!items.length) return '<div class="empty"><strong>最新动态即将在这里发布。</strong><p>关注实验室的研究进展、学术交流与团队活动。</p></div>';
 return items.map(n=>`<article class="news-row"><time datetime="${n.date}">${n.date.replaceAll('-','.')}</time><div><h3><a href="${esc(n.link || base+'news/'+n.slug+'.html')}"${n.link?' target="_blank" rel="noopener noreferrer"':''}>${esc(n.title)}${n.link?' ↗':''}</a></h3>${n.summary?'<p>'+esc(n.summary)+'</p>':''}</div></article>`).join('');
}
function researchList(items,base='') {return `<div class="research-list">${items.map(r=>`<article class="research-item">${r.image?`<a href="${base}research/${r.slug}.html"><img loading="lazy" src="${base+esc(r.image)}" alt="${esc(r.title)}"></a>`:''}<div class="eyebrow">${esc(r.category)}</div><h3><a href="${base}research/${r.slug}.html">${esc(r.title)}</a></h3><p>${esc(r.summary)}</p><a class="more" href="${base}research/${r.slug}.html">了解研究 ›</a><div class="pill-links">${links(r)}</div></article>`).join('')}</div>`;}
function head(en,title,desc){return `<div class="page-head"><div class="eyebrow">${en}</div><h1>${title}</h1><p>${desc}</p></div>`;}
// Generated output only. All editable source lives in content/, assets/ and scripts/.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});fs.writeFileSync(path.join(out,'.nojekyll'),'');publications.writeBib(out);
shell('index.html','首页',`<section class="hero"><img class="hero-image" src="assets/hero.jpg" width="1536" height="1024" alt="蓝色点云与轨迹构成的人体运动研究概念图"><div class="hero-content"><div class="eyebrow">PERCEPTION · MOTION · WORLD MODELS</div><h1>从视觉出发，<br>理解运动与世界。</h1><p>融合生理与运动信号，理解人体状态与交互，<br>连接真实观测与智能理解。</p><a href="research.html">探索我们的研究 ›</a></div><span class="caption">研究概念视觉</span></section><div class="container"><section class="intro"><h2>关于 ${esc(site.name)}</h2><p>${esc(site.subtitle)}以生理与运动信号的多模态感知为核心，结合自研软硬件系统与人机交互平台，探索从真实观测到智能理解的方法。</p></section><section class="section"><div class="section-head"><h2>最新动态</h2><a href="news.html">全部新闻 ›</a></div>${newsList(news.slice(0,5))}</section><section class="section"><div class="section-head"><h2>研究工作</h2><a href="research.html">全部研究 ›</a></div>${publications.render()}</section><section class="section lab-platform" aria-labelledby="platform-title"><div class="platform-heading"><div class="eyebrow">HUMAN SENSING · INTERACTION</div><h2 id="platform-title">真实观测，支持研究</h2><p>以人为研究核心，贯通内部生理状态、外部运动行为与人机交互反馈，建设可持续演进的人体多模态感知与智能交互研究体系。</p></div><figure class="platform-figure"><a href="assets/lab-platform-layout-corrected.webp" target="_blank" rel="noopener noreferrer" aria-label="查看实验室空间布局大图"><img src="assets/lab-platform-layout-corrected.webp" alt="实验室空间布局图：精细行为测量、生理信号感知，以及上肢与下肢人机交互平台" width="2350" height="1410" loading="lazy"></a><figcaption>实验室空间布局 · 原图标注调整并增强清晰度 <span>点击图片查看大图 ↗</span></figcaption></figure><div class="platform-strategy"><div class="strategy-head"><span class="eyebrow">TWO SIGNALS · ONE SYSTEM</span><h3>建立从人体状态到人机协同的研究闭环</h3><p>通过长期自主设计采集端、分析端和交互验证平台，形成统一的数据基准与持续积累的研究能力，使人体理解能够跨任务、跨场景扩展。</p></div><div class="strategy-pillars"><div class="strategy-pillar"><span class="pillar-accent" aria-hidden="true"></span><span class="pillar-type">PHYSIOLOGY / 生理</span><h4>理解内在状态</h4><p>将脑血氧、脑电、高密度肌电与喉震等多维线索转化为可解释的状态表征，连接认知、肌肉活动与交互意图。</p></div><div class="strategy-pillar"><span class="pillar-accent" aria-hidden="true"></span><span class="pillar-type">MOTION / 运动</span><h4>刻画外在行为</h4><p>在统一时间基准下融合视觉、运动与力学信息，建立动作、身体响应和环境作用之间的关联。</p></div></div><div class="strategy-bridge"><span class="bridge-mark" aria-hidden="true">✳</span><div><strong>从多模态感知到智能交互的闭环能力</strong><p>软硬件协同设计与硬件同步让不同信号在同一时空坐标中对齐，并在交互任务中完成验证与迭代。</p></div></div><div class="strategy-impact"><span>支撑跨场景创新</span><p>医疗健康 <b>·</b> 康复评估 <b>·</b> 运动科学 <b>·</b> 具身智能 <b>·</b> 世界模型</p></div></div></section><section class="join-strip"><div><h2>带着你的问题，加入探索。</h2><p>对视觉、人体运动或世界模型感兴趣？从一个问题、一篇论文、一次实验开始。</p></div><a href="join.html">了解更多 ›</a></section></div>`);
shell('news.html','新闻',`<div class="container">${head('NEWS','新闻与动态','记录研究进展、学术交流与实验室日常。')}<div class="page-body">${newsList(news)}</div></div>`);
shell('research.html','研究',`<div class="container">${head('RESEARCH','研究工作','人体运动、身份识别与多模态视觉感知。')}<div class="page-body"><a class="scholar-link" href="${esc(webURL(site.scholar))}" target="_blank" rel="noopener noreferrer">Google Scholar ↗</a>${publications.render()}<section class="research-directions"><h2>探索中的研究方向</h2>${researchList(research)}</section></div></div>`);
const people = site.members.length ? `<div class="member-grid">${site.members.map(m=>{if(m.photo && (!m.photo.startsWith('assets/') || m.photo.includes('..') || !fs.existsSync(path.join(root,m.photo))))throw new Error('Member photo must exist under assets/');return `<article class="member">${m.photo?`<img class="member-avatar" src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">`:`<div class="member-avatar" aria-hidden="true">${esc(m.name.slice(0,1))}</div>`}<h2>${esc(m.name)}</h2><p>${esc(m.role)}</p><p>${esc(m.research)}</p>${m.url?`<a href="${esc(webURL(m.url))}" target="_blank" rel="noopener noreferrer">个人主页 ↗</a>`:''}</article>`}).join('')}</div>` : '<div class="empty"><strong>团队介绍正在整理中。</strong><p>导师、研究人员与学生成员的简介将在确认后更新。</p></div>';
shell('people.html','成员',`<div class="container">${head('PEOPLE','团队成员','不同的专长，共同的好奇。')}<div class="page-body">${people}</div></div>`);
shell('join.html','加入我们',`<article class="article"><div class="eyebrow">JOIN US</div><h1>一起探索，<br>值得研究的问题。</h1><p class="lead">欢迎对计算机视觉、人体运动和世界模型感兴趣的同学了解我们的研究。</p><div class="prose"><h2>从哪里开始</h2><p>选择一个感兴趣的研究方向，读一篇相关论文，尝试复现一个小实验，或整理一个你想验证的问题。</p><h2>建议准备</h2><ul><li>一份简历，介绍你的学习与项目经历。</li><li>一段研究兴趣说明：你关心什么，为什么想研究它。</li><li>能体现思考过程的项目、代码或实验记录。</li></ul><h2>联系与招生</h2>${site.email?`<p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>`:'<p>联系邮箱、招生对象及具体申请方式待实验室确认后公布。</p>'}</div></article>`);
for (const [kind,items] of [['research',research],['news',news]]) for(const item of items) {
 const base='../';
 shell(kind+'/'+item.slug+'.html',item.title,`<article class="article"><a class="back" href="../${kind}.html">‹ 返回${kind==='news'?'新闻':'研究'}</a><h1>${esc(item.title)}</h1><div class="meta">${esc(item.date||item.category||'')}</div><p class="lead">${esc(item.summary||'')}</p><div class="pill-links">${links(item)}</div><div class="prose">${marked.parse(item.body.replaceAll('{{base}}',base))}</div></article>`,kind+'.html');
}
shell('404.html','页面未找到','<div class="container"><div class="page-head"><h1>页面未找到。</h1><p>这个页面可能已移动，或链接有误。</p><p><a href="index.html">返回首页 ›</a></p></div></div>');
console.log(`Built ${6+news.length+research.length} HTML pages (${news.length} news, ${research.length} research).`);
