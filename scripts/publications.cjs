const fs = require('node:fs');
const path = require('node:path');
module.exports = function(root, esc, webURL) {
  const items = JSON.parse(fs.readFileSync(path.join(root, 'content/publications.json'), 'utf8'));
  const categories = [
    ['gait', '步态表征与身份识别', '从局部运动到全局模式，学习跨视角、跨服饰的人体身份特征。'],
    ['adaptation', '无监督学习与域适应', '减少人工标注依赖，让步态识别模型适应新的数据与采集环境。'],
    ['multimodal', '多模态人体感知', '结合骨架、轮廓等互补观测，理解人体结构与运动。'],
    ['perception', '复杂环境视觉感知', '研究低照度等复杂条件下的目标感知与持续跟踪。']
  ];
  const ids = new Set();
  for(const p of items) {
    if(!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error('Invalid or duplicate publication ID');
    ids.add(p.id);
    if(!categories.some(c=>c[0]===p.category)) throw Error('Unknown publication category');
    if(!['article','inproceedings'].includes(p.type) || !p.title || !p.authors.length || !Number.isInteger(p.year)) throw Error('Invalid publication metadata');
    for(const name of p.corresponding) if(!p.authors.includes(name)) throw Error('Corresponding author missing from author list');
    for(const key of ['url','pdf','code']) if(p[key]) webURL(p[key]);
    if(!p.image.startsWith('assets/publications/') || p.image.includes('..') || !fs.existsSync(path.join(root,p.image))) throw Error('Publication thumbnail not found');
  }
  function bib(p) {
    const fields = {title:p.title, author:p.authors.map(n=>{const a=n.split(' ');return a.pop()+', '+a.join(' ')}).join(' and '), [p.type==='article'?'journal':'booktitle']:p.venue, year:p.year};
    for(const k of ['volume','number','pages','doi','url']) if(p[k]) fields[k]=p[k];
    return `@${p.type}{${p.id}${p.year},\n`+Object.entries(fields).map(([k,v])=>`  ${k} = {${v}}`).join(',\n')+'\n}\n';
  }
  function row(p) {
    const authors = p.authors.map(n=>`<span${p.corresponding.includes(n)?' class="corresponding" title="通讯作者"':''}>${esc(n)}</span>`).join(', ');
    const badgeClass=p.badge==='CVPR'?'conference':p.badge==='ICCV'?'iccv':'journal';
    return `<article class="publication" id="paper-${p.id}"><div class="publication-visual"><span class="venue-badge ${badgeClass}">${esc(p.badge)} ${p.year}</span><a href="${esc(p.image)}" target="_blank" rel="noopener" aria-label="查看 ${esc(p.title)} 论文缩略图"><img src="${esc(p.image)}" alt="${esc(p.title)}：论文图示" loading="lazy" width="500" height="190"></a></div><div class="publication-info"><h3><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a></h3><p class="publication-authors">${authors}</p><p class="publication-venue"><em>${esc(p.venue)}</em>, ${p.year}${p.volume?` · ${esc(p.volume)}${p.number?'('+esc(p.number)+')':''}`:''}${p.pages?' · '+esc(p.pages.replaceAll('--','–')):''}</p><p class="publication-summary">${esc(p.summary)}</p><div class="publication-actions"><details class="bib-details"><summary aria-label="展开 ${esc(p.title)} 的 BibTeX">BIB</summary><div class="bib-panel"><pre><code>${esc(bib(p))}</code></pre><a href="assets/bib/${p.id}.bib" download>下载 .bib</a></div></details>${p.pdf?`<a class="paper-button" href="${esc(p.pdf)}" target="_blank" rel="noopener noreferrer" title="${esc(p.pdf_note||'阅读论文 PDF')}">PDF${p.id==='rich'?' · 预印本':p.id==='mpanet'?' · 出版社':''}</a>`:''}${p.code?`<a class="paper-button" href="${esc(p.code)}" target="_blank" rel="noopener noreferrer">CODE</a>`:''}</div></div></article>`;
  }
  function render() {return `<p class="publication-legend">代表性论文 · <span class="corresponding">下划线</span>表示通讯作者</p><div class="publication-categories" aria-label="论文分类">${categories.map(([id,label])=>`<a href="#pub-${id}">${label}</a>`).join('')}</div>${categories.map(([id,label,desc])=>`<section class="publication-group" id="pub-${id}"><div class="publication-group-head"><h2>${label}</h2><p>${desc}</p></div>${items.filter(p=>p.category===id).sort((a,b)=>b.year-a.year).map(row).join('')}</section>`).join('')}`;}
  function writeBib(out) {const dir=path.join(out,'assets/bib');fs.mkdirSync(dir,{recursive:true});for(const p of items)fs.writeFileSync(path.join(dir,p.id+'.bib'),bib(p));}
  return {render, writeBib};
};
