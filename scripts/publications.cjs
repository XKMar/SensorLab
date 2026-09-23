const fs = require('node:fs');
const path = require('node:path');
module.exports = function(root, esc, webURL) {
  const items = JSON.parse(fs.readFileSync(path.join(root, 'content/publications.json'), 'utf8'));
  const categories = [
    ['motion', '人体运动与身份理解', '步态识别、无监督学习、多模态运动表征与可穿戴运动感知。'],
    ['localization', '跨视角匹配与精确定位', '卫星、无人机与地面图像的跨视角定位，以及相关视觉跟踪研究。'],
    ['physiology', '人体生理信号感知', '通过近红外、脑电及多模态生理信号理解认知状态与交互。'],
    ['world', '世界模型与动作理解', '探索动作、人与环境的相互作用及其时空变化。']
  ];
  const ids = new Set();
  for(const p of items) {
    if(!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error('Invalid or duplicate publication ID');
    ids.add(p.id);
    if(!categories.some(c=>c[0]===p.category)) throw Error('Unknown publication category');
    if(!['article','inproceedings'].includes(p.type) || !p.title || !p.authors.length || !Number.isInteger(p.year)) throw Error('Invalid publication metadata');
    for(const key of ['url','pdf','code']) if(p[key]) webURL(p[key]);
    if(!p.image.startsWith('assets/publications/') || p.image.includes('..') || !fs.existsSync(path.join(root,p.image))) throw Error('Publication thumbnail not found');
  }
  function bib(p) {
    const fields = {title:p.title, author:p.authors.map(n=>{const a=n.split(' ');return a.pop()+', '+a.join(' ')}).join(' and '), [p.type==='article'?'journal':'booktitle']:p.venue, year:p.year};
    for(const k of ['volume','number','pages','doi','url']) if(p[k]) fields[k]=p[k];
    return `@${p.type}{${p.id}${p.year},\n`+Object.entries(fields).map(([k,v])=>`  ${k} = {${v}}`).join(',\n')+'\n}\n';
  }
  function row(p) {
    const authors = p.authors.map(esc).join(', ');
    const badgeClass=p.badge==='CVPR'?'conference':p.badge==='ICCV'?'iccv':'journal';
    return `<article class="publication" id="paper-${p.id}"><div class="publication-visual"><span class="venue-badge ${badgeClass}">${esc(p.badge)}</span><a href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="查看 ${esc(p.title)} 论文"><img src="${esc(p.image)}" alt="${esc(p.title)}：${esc(p.image_alt||'论文图示')}" loading="lazy" width="360" height="140"></a></div><div class="publication-info"><h3><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a></h3><p class="publication-authors">${authors}</p><p class="publication-venue"><em>${esc(p.venue)}</em>, ${p.year}${p.volume?` · ${esc(p.volume)}${p.number?'('+esc(p.number)+')':''}`:''}${p.pages?' · '+esc(p.pages.replaceAll('--','–')):''}</p><div class="publication-actions"><details class="bib-details"><summary aria-label="展开 ${esc(p.title)} 的 BibTeX">BIB</summary><div class="bib-panel"><pre><code>${esc(bib(p))}</code></pre><a href="assets/bib/${p.id}.bib" download>下载 .bib</a></div></details>${p.pdf?`<a class="paper-button" href="${esc(p.pdf)}" target="_blank" rel="noopener noreferrer" title="${esc(p.pdf_note||'阅读论文 PDF')}">Paper</a>`:''}${p.code?`<a class="paper-button" href="${esc(p.code)}" target="_blank" rel="noopener noreferrer">CODE</a>`:'<span class="paper-button is-disabled" aria-disabled="true" title="暂无已确认的代码链接">CODE</span>'}</div></div></article>`;
  }
  function render() {return `<p class="publication-legend">代表性论文</p><div class="publication-categories" aria-label="论文分类">${categories.map(([id,label])=>`<a href="#pub-${id}">${label}</a>`).join('')}</div>${categories.map(([id,label,desc])=>`<section class="publication-group" id="pub-${id}">${id==='motion'?'<span id="pub-gait"></span><span id="pub-adaptation"></span><span id="pub-multimodal"></span>':''}<div class="publication-group-head"><h2>${label}</h2><p>${desc}</p></div>${items.filter(p=>p.category===id).sort((a,b)=>b.year-a.year).map(row).join('')}${id==='world'?'<p class="publication-legend">该方向正在探索中。<a href="research/world-models.html">了解研究方向 ›</a></p>':''}</section>`).join('')}`;}
  function writeBib(out) {const dir=path.join(out,'assets/bib');fs.mkdirSync(dir,{recursive:true});for(const p of items)fs.writeFileSync(path.join(dir,p.id+'.bib'),bib(p));}
  return {render, writeBib};
};
