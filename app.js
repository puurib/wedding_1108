'use strict';
(() => {
const data = window.WEDDING_DATA;
const slides = data.slides;
const $ = id => document.getElementById(id);
let current = 1;
let mode = 'reading';
let filter = 'all';
let search = '';
const categories = [{id:'all',label:'전체'},...Array.from(new Map(slides.map(s=>[s.category,{id:s.category,label:s.categoryLabel}])).values())];
function el(tag, cls, text) { const n = document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; }
function safeLink(url) { return typeof url === 'string' && /^https?:\/\//i.test(url); }
function photo(item, alt, eager=false) {
  const b=el('button','photo-button'); b.type='button'; b.setAttribute('aria-label',alt+' 확대');
  const img=el('img'); img.src=item.src; img.alt=alt; img.loading=eager?'eager':'lazy'; img.decoding='async'; b.append(img);
  b.addEventListener('click',()=>{$('photo-full').src=item.src;$('photo-full').alt=alt;$('photo-label').textContent=alt;$('photo-dialog').showModal();});
  return b;
}
function textElement(item) {
  const first=item.paragraphs[0]||{};
  const size=first.size||14;
  const heading=size>=17;
  const cls=heading?'':('card-text'+(size<=10.5 && item.text.length<35?' tag':''));
  const wrap=el(heading?'h3':'p',cls);
  if(item.paragraphs.some(p=>safeLink(p.url))){
    item.paragraphs.forEach((p,i)=>{if(i)wrap.append(document.createElement('br'));if(safeLink(p.url)){const a=el('a','source-link',p.text);a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';wrap.append(a);}else wrap.append(document.createTextNode(p.text));});
  }else wrap.textContent=item.text;
  return wrap;
}
function cover(s){
  const card=el('div','cover-card'); const copy=el('div','cover-copy');copy.append(el('span','eyebrow','OUR WEDDING STORY'),el('h3','','자연스러운 잔머리와 표정,\n우리다운 순간을 담는 날.'),el('p','names','홍희철 · 문숙경'),el('p','','드레스와 헤어, 서로를 바라보는 표정까지.\n두 사람의 촬영을 위한 작은 노트입니다.'));
  card.append(copy,photo(s.nodes.find(n=>n.type==='image'),'우리의 웨딩 촬영 시안 표지',true));return card;
}
function reading(s) {
  if(s.id===1)return cover(s);
  const groups=s.groups;
  let count=groups.filter(g=>!g.wide).length;
  if(s.priority)count=3;else if(count>5)count=2;
  const grid=el('div',`cards cols-${count} read-layout-${s.id}`);
  groups.forEach((group,gi)=>{
    const card=el('article','content-card'+(group.wide?' wide':''));
    const images=group.items.filter(n=>n.type==='image');
    const texts=group.items.filter(n=>n.type==='text');
    if(images.length){const holder=el('div','card-photos'+(images.length>1?' multiple':''));images.forEach((im,i)=>holder.append(photo(im,`${s.title} · 사진 ${gi+1}${images.length>1?'-'+(i+1):''}`,gi<2)));card.append(holder);}
    texts.forEach(t=>card.append(textElement(t)));
    grid.append(card);
  });
  return grid;
}
function pptLayout(s){
 const wrap=el('div');const canvas=el('div','slide-viewport');canvas.style.background=s.background;canvas.setAttribute('aria-label',s.title+' PPT 레이아웃');
 s.nodes.forEach(node=>{
  const n=el('div','slide-node '+node.type);Object.assign(n.style,{left:node.x+'%',top:node.y+'%',width:node.w+'%',height:node.h+'%'});
  if(node.rotation)n.style.transform=`rotate(${node.rotation}deg)`;
  if(node.type==='rect')n.style.background=node.fill;
  if(node.type==='image')n.append(photo(node,s.title+' 참고 사진',true));
  if(node.type==='text')node.paragraphs.forEach(p=>{const par=el('p');Object.assign(par.style,{fontSize:(p.size/9.6)+'cqw',fontWeight:p.bold?'700':'400',textAlign:p.align,color:p.color,fontFamily:p.font==='Georgia'?'Georgia,serif':'"Malgun Gothic","Apple SD Gothic Neo",sans-serif'});if(safeLink(p.url)){const a=el('a','',p.text);a.href=p.url;a.target='_blank';a.rel='noopener noreferrer';par.append(a);}else par.textContent=p.text;n.append(par);});
  canvas.append(n);
 });
 wrap.append(canvas,el('p','slide-note','PPT의 배치와 사진 비율을 재현한 보기입니다. 작은 화면에서는 ‘읽기 편하게’를 사용하거나 사진을 눌러 확대하세요.'));return wrap;
}
function navButton(s){
 const b=el('button','toc-item'+(s.priority?' priority':'')+(s.id===current?' active':''));b.type='button';b.append(el('span','',s.priority?'꼭':String(s.id).padStart(2,'0')),document.createTextNode(s.title));b.setAttribute('aria-label',`${s.id}페이지 ${s.title}`);if(s.id===current)b.setAttribute('aria-current','page');b.addEventListener('click',()=>{filter='all';go(s.id,true);$('toc-dialog').close();});return b;
}
function renderToc(){
 const q=search.trim().toLocaleLowerCase();let last='';const desktop=document.createDocumentFragment();const mobile=document.createDocumentFragment();let found=0;
 slides.forEach(s=>{if(filter!=='all'&&s.category!==filter)return;const hay=[s.title,s.subtitle,...s.nodes.filter(n=>n.type==='text').map(n=>n.text)].join(' ').toLocaleLowerCase();if(q&&!hay.includes(q))return;found++;if(last!==s.category){desktop.append(el('div','toc-group',s.categoryLabel));mobile.append(el('div','toc-group',s.categoryLabel));last=s.category;}desktop.append(navButton(s));mobile.append(navButton(s));});
 if(!found){desktop.append(el('p','empty','검색 결과가 없습니다.'));mobile.append(el('p','empty','검색 결과가 없습니다.'));}
 $('toc-list').replaceChildren(desktop);$('mobile-toc').replaceChildren(mobile);
 $('category-tabs').replaceChildren(...categories.map(c=>{const b=el('button','category'+(filter===c.id?' active':''),c.label);b.type='button';b.setAttribute('aria-pressed',String(filter===c.id));b.addEventListener('click',()=>{filter=c.id;search='';$('search').value='';const first=slides.find(s=>filter==='all'||s.category===filter);go(first.id,true);});return b;}));
}
function go(n,scroll=false){
 const pos=slides.findIndex(s=>s.id===Number(n));const index=pos<0?0:pos;const s=slides[index];current=s.id;history.replaceState(null,'',`#page=${current}`);document.title=`${s.title} · 웨딩 촬영 시안`;
 $('breadcrumb').textContent=`${s.categoryLabel} / ${s.priority?'꼭 남길 15장':String(current).padStart(2,'0')}`;$('page-kicker').textContent=s.kicker;$('page-title').textContent=s.title;$('page-subtitle').textContent=s.subtitle;$('page-badge').textContent=s.priority?'MUST':String(current).padStart(2,'0');
 $('reader').replaceChildren(mode==='reading'?reading(s):pptLayout(s));$('page-count').textContent=`${String(index+1).padStart(2,'0')} / ${slides.length}`;$('progress').style.width=((index+1)/slides.length*100)+'%';$('prev').disabled=index===0;$('next').disabled=index===slides.length-1;$('live').textContent=`${current}페이지 ${s.title}`;
 renderToc();if(scroll)$('content').scrollIntoView({behavior:'smooth',block:'start'});
}
function step(delta){const index=slides.findIndex(s=>s.id===current);const next=slides[Math.max(0,Math.min(slides.length-1,index+delta))];go(next.id,true);}
function setMode(m){mode=m;$('reading-mode').setAttribute('aria-pressed',String(m==='reading'));$('slide-mode').setAttribute('aria-pressed',String(m==='slide'));go(current,false);}
$('reading-mode').addEventListener('click',()=>setMode('reading'));$('slide-mode').addEventListener('click',()=>setMode('slide'));
$('prev').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));$('print').addEventListener('click',()=>window.print());
$('search').addEventListener('input',e=>{search=e.target.value;renderToc();});
$('toc-open').addEventListener('click',()=>$('toc-dialog').showModal());$('toc-close').addEventListener('click',()=>$('toc-dialog').close());$('photo-close').addEventListener('click',()=>$('photo-dialog').close());
for(const id of ['toc-dialog','photo-dialog'])$(id).addEventListener('click',e=>{if(e.target===$(id)){const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();}});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/page=(\d+)/);if(m)go(Number(m[1]),true);});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}});
const match=location.hash.match(/page=(\d+)/);go(match?Number(match[1]):1,false);
})();
