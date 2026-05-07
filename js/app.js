/* ── Backend Developer Complete Guide — App Engine ── */
let TOPICS=[], SECTIONS=[], ROADMAP=[], REFTABLE=[], BOOKS=[];
const DATA_DIR = document.body.dataset.dir || 'data';
const APP_KEY = document.body.dataset.key || 'be_done';
const doneSet=new Set(JSON.parse(localStorage.getItem(APP_KEY)||'[]'));
let currentFilter='all';

function el(tag,attrs,kids){
  const e=document.createElement(tag);
  if(attrs)Object.entries(attrs).forEach(([k,v])=>{
    if(k==='html')e.innerHTML=v;
    else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
    else if(k==='cls')e.className=v;
    else if(k==='stl')e.style.cssText=v;
    else e.setAttribute(k,v)});
  if(kids)(Array.isArray(kids)?kids:[kids]).forEach(c=>{
    if(typeof c==='string')e.appendChild(document.createTextNode(c));
    else if(c)e.appendChild(c)});
  return e;
}

async function loadData(){
  const [secRes,rmRes,refRes,idxRes]=await Promise.all([
    fetch(`${DATA_DIR}/sections.json`).then(r=>r.json()),
    fetch(`${DATA_DIR}/roadmap.json`).then(r=>r.json()),
    fetch(`${DATA_DIR}/reference.json`).then(r=>r.json()),
    fetch(`${DATA_DIR}/topics/_index.json`).then(r=>r.json())
  ]);
  SECTIONS=secRes; ROADMAP=rmRes; REFTABLE=refRes.tools; BOOKS=refRes.books;
  const topicResults=await Promise.all(
    idxRes.map(id=>fetch(`${DATA_DIR}/topics/${id}.json`).then(r=>r.json()).catch(()=>null))
  );
  TOPICS=topicResults.filter(Boolean);
}

function renderSidebar(){
  const nav=document.getElementById('sidebarNav');nav.innerHTML='';
  let lastSec='';
  TOPICS.forEach(tp=>{
    if(currentFilter!=='all'&&tp.lv!==currentFilter)return;
    if(tp.sec!==lastSec){lastSec=tp.sec;
      const lb=SECTIONS.find(s=>s.id===tp.sec);
      nav.appendChild(el('div',{cls:'nav-section-label'},[lb?lb.name:tp.sec]));
    }
    const a=el('a',{cls:'nav-item'+(doneSet.has(tp.id)?' done':''),href:'#'+tp.id,
      onclick:ev=>{ev.preventDefault();switchTab('topics');
        setTimeout(()=>{const t=document.getElementById(tp.id);if(t)t.scrollIntoView({behavior:'smooth',block:'start'})},80);
        if(window.innerWidth<900){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}}
    });
    a.appendChild(el('span',{cls:'dot'}));
    a.appendChild(document.createTextNode(tp.t));
    nav.appendChild(a);
  });
}

function renderTopicCard(tp){
  const sec=el('div',{cls:'topic-section',id:tp.id});
  const card=el('div',{cls:'topic-card',id:'card-'+tp.id});
  // Header
  const hdr=el('div',{cls:'topic-header',onclick:()=>toggleCard(tp.id)});
  const colors={core:'rgba(52,211,153,.1)',important:'rgba(251,191,36,.1)',advanced:'rgba(167,139,250,.1)',optional:'rgba(244,114,182,.1)'};
  hdr.appendChild(el('div',{cls:'topic-icon',stl:'background:'+(colors[tp.lv]||colors.core),html:tp.icon}));
  const tw=el('div',{cls:'topic-title-wrap'});
  tw.appendChild(el('div',{cls:'topic-title'},[tp.t]));
  tw.appendChild(el('div',{cls:'topic-sub'},[tp.s]));
  hdr.appendChild(tw);
  const meta=el('div',{cls:'topic-meta'});
  meta.appendChild(el('span',{cls:'level-badge '+tp.lv},[tp.lv.charAt(0).toUpperCase()+tp.lv.slice(1)]));
  meta.appendChild(el('div',{cls:'done-check'+(doneSet.has(tp.id)?' checked':''),id:'check-'+tp.id,
    onclick:ev=>{ev.stopPropagation();markDone(tp.id)}},['✓']));
  meta.appendChild(el('span',{cls:'chevron'},['▾']));
  hdr.appendChild(meta);card.appendChild(hdr);
  // Body
  const body=el('div',{cls:'topic-body'});
  const wb=el('div',{cls:'what-box'});
  wb.appendChild(el('h4',{},['What & Why']));
  wb.appendChild(el('p',{},[tp.d]));
  body.appendChild(wb);
  // Concepts
  if(tp.c&&tp.c.length){
    const cg=el('div',{cls:'concepts-grid'});
    tp.c.forEach(c=>cg.appendChild(el('div',{cls:'concept-pill',html:c})));
    body.appendChild(cg);
  }
  // Deep dive
  if(tp.dd&&tp.dd.length){
    const det=el('details',{cls:'deep-dive'});
    det.appendChild(el('summary',{},['Deep dive — details & examples']));
    let html='';
    tp.dd.forEach(s=>{
      html+='<h5>'+s.t+'</h5>';
      if(s.p)html+='<ul>'+s.p.map(p=>'<li>'+p+'</li>').join('')+'</ul>';
      if(s.code)html+='<div class="code-block">'+s.code+'</div>';
    });
    const dc=el('div',{cls:'detail-content',html:html});
    det.appendChild(dc);body.appendChild(det);
  }
  // Links
  if(tp.l&&tp.l.length){
    const lr=el('div',{cls:'links-row'});
    tp.l.forEach(lk=>lr.appendChild(el('a',{cls:'link-chip',href:lk.u,target:'_blank',
      html:lk.t+' <span class="ext">↗</span>'})));
    body.appendChild(lr);
  }
  card.appendChild(body);sec.appendChild(card);return sec;
}

function renderTopics(){
  const c=document.getElementById('tab-topics');c.innerHTML='';
  let lastSec='',count=0;
  TOPICS.forEach(tp=>{
    if(currentFilter!=='all'&&tp.lv!==currentFilter)return;
    if(tp.sec!==lastSec){lastSec=tp.sec;
      const lb=SECTIONS.find(s=>s.id===tp.sec);
      if(lb){const sd=el('div',{cls:'section-divider'});sd.appendChild(el('h2',{},[lb.name]));sd.appendChild(el('hr'));c.appendChild(sd)}}
    c.appendChild(renderTopicCard(tp));count++;
  });
  if(!count)c.appendChild(el('p',{stl:'color:var(--text3);text-align:center;padding:2rem'},['No topics match this filter.']));
}

function renderRoadmap(){
  const c=document.getElementById('tab-roadmap');c.innerHTML='';
  c.appendChild(el('p',{stl:'color:var(--text2);margin-bottom:1.5rem;font-size:14px'},
    ['Follow this structured path from beginner to senior backend engineer. Click any topic to jump to its details.']));
  const colors=['#34d399','#6196ff','#fbbf24','#a78bfa','#f87171','#2dd4bf','#f472b6','#fb923c'];
  ROADMAP.forEach((phase,i)=>{
    const ph=el('div',{cls:'roadmap-phase'});
    ph.appendChild(el('div',{cls:'phase-dot',stl:'background:'+colors[i%colors.length]},[(i+1).toString()]));
    ph.appendChild(el('div',{cls:'phase-title',stl:'color:'+colors[i%colors.length]},[phase.name]));
    ph.appendChild(el('div',{cls:'phase-desc'},[phase.desc]));
    const pt=el('div',{cls:'phase-topics'});
    phase.topics.forEach(tid=>{
      const tp=TOPICS.find(t=>t.id===tid);if(!tp)return;
      pt.appendChild(el('div',{cls:'phase-topic'+(doneSet.has(tid)?' completed':''),
        onclick:()=>{switchTab('topics');
          setTimeout(()=>{const e=document.getElementById(tid);if(e){e.scrollIntoView({behavior:'smooth'});toggleCard(tid)}},100)}
      },[tp.t]));
    });
    ph.appendChild(pt);
    if(phase.est)ph.appendChild(el('div',{cls:'phase-est'},['⏱ Estimated: '+phase.est]));
    c.appendChild(ph);
  });
}

function renderReference(){
  const c=document.getElementById('tab-reference');c.innerHTML='';
  // Tools table
  const qr=el('div',{cls:'quick-ref'});
  let h='<h3>⚡ Tools & Technologies by Category</h3><table class="ref-table"><thead><tr><th>Category</th><th>Tools</th><th>Use Case</th></tr></thead><tbody>';
  REFTABLE.forEach(r=>{h+='<tr><td>'+r[0]+'</td><td>'+r[1].split(',').map(t=>'<code>'+t.trim()+'</code>').join(' ')+'</td><td>'+r[2]+'</td></tr>'});
  h+='</tbody></table>';qr.innerHTML=h;c.appendChild(qr);
  // Books table
  const qr2=el('div',{cls:'quick-ref',stl:'margin-top:1rem'});
  let b='<h3>📖 Must-Read Books & Resources</h3><table class="ref-table"><thead><tr><th>Resource</th><th>Type</th><th>Best For</th></tr></thead><tbody>';
  BOOKS.forEach(r=>{b+='<tr><td><a href="'+r[3]+'" target="_blank" style="color:var(--accent);text-decoration:none">'+r[0]+' ↗</a></td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>'});
  b+='</tbody></table>';qr2.innerHTML=b;c.appendChild(qr2);
}

function toggleCard(id){
  const card=document.getElementById('card-'+id);if(!card)return;
  const isOpen=card.classList.contains('open');
  document.querySelectorAll('.topic-card.open').forEach(c=>c.classList.remove('open'));
  if(!isOpen)card.classList.add('open');
}

function markDone(id){
  const chk=document.getElementById('check-'+id);if(!chk)return;
  const tp=TOPICS.find(t=>t.id===id);
  if(doneSet.has(id)){
    doneSet.delete(id);chk.classList.remove('checked');
    showToast('Undo','Removed <b>'+tp.t+'</b> from completed.');
  }else{
    doneSet.add(id);chk.classList.add('checked');
    const card=document.getElementById('card-'+id);
    if(card){
      card.classList.remove('just-done');
      void card.offsetWidth; // trigger reflow
      card.classList.add('just-done');
    }
    showToast('🎉','Marked <b>'+tp.t+'</b> as complete! Great job.');
  }
  localStorage.setItem(APP_KEY,JSON.stringify([...doneSet]));
  updateProgress();renderSidebar();renderRightPanel();
}

function showToast(icon,msg){
  let tc=document.getElementById('toast-container');
  if(!tc){tc=el('div',{cls:'toast-container',id:'toast-container'});document.body.appendChild(tc);}
  const toast=el('div',{cls:'toast'});
  toast.appendChild(el('div',{cls:'toast-icon'},[icon]));
  toast.appendChild(el('div',{cls:'toast-msg',html:msg}));
  tc.appendChild(toast);
  setTimeout(()=>{if(toast.parentNode)toast.parentNode.removeChild(toast)},2800);
}

function updateProgress(){
  const n=doneSet.size,total=TOPICS.length;
  const pct=total?Math.round(n/total*100):0;
  document.getElementById('progress-pct').textContent=n+' / '+total;
  document.getElementById('progressBar').style.width=pct+'%';
  document.getElementById('statTopics').textContent=total;
  document.getElementById('statConcepts').textContent=TOPICS.reduce((a,t)=>a+(t.c?t.c.length:0),0)+'+';
  document.getElementById('statLinks').textContent=TOPICS.reduce((a,t)=>a+(t.l?t.l.length:0),0)+'+';
  document.getElementById('statDone').textContent=pct+'%';
}

function filterTopics(val){
  const q=val.toLowerCase();
  document.querySelectorAll('.topic-section').forEach(sec=>{
    sec.style.display=sec.textContent.toLowerCase().includes(q)?'':'none'});
  document.querySelectorAll('.section-divider').forEach(d=>{d.style.display=''});
}

function setFilter(f,btn){
  currentFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderTopics();renderSidebar();
  setTimeout(initScrollSpy,200);
}

function switchTab(tab,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  const tabBtns=document.querySelectorAll('.tab-btn');
  if(tab==='topics')tabBtns[0].classList.add('active');
  else if(tab==='roadmap')tabBtns[1].classList.add('active');
  else tabBtns[2].classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
  if(tab==='roadmap')renderRoadmap();
}

function renderRightPanel(){
  const rp=document.getElementById('rightPanel');if(!rp)return;
  // Progress ring
  const rpP=document.getElementById('rpProgress');
  const n=doneSet.size,total=TOPICS.length,pct=total?Math.round(n/total*100):0;
  const circ=2*Math.PI*44,offset=circ-(pct/100)*circ;
  rpP.innerHTML='<div class="rp-title">Overall Progress</div>'+
    '<div class="rp-ring-wrap"><div class="rp-ring">'+
    '<svg viewBox="0 0 100 100"><defs><linearGradient id="rpGrad" x1="0%" y1="0%" x2="100%" y2="100%">'+
    '<stop offset="0%" stop-color="#6196ff"/><stop offset="100%" stop-color="#34d399"/></linearGradient></defs>'+
    '<circle class="rp-track" cx="50" cy="50" r="44"/>'+
    '<circle class="rp-fill" cx="50" cy="50" r="44" stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'"/></svg>'+
    '<div class="rp-center"><span class="rp-pct">'+pct+'%</span><span class="rp-label">'+n+' of '+total+'</span></div></div></div>';

  // Section breakdown
  const rpB=document.getElementById('rpBreakdown');
  const secColors={foundations:'#34d399',core:'#6196ff',security:'#f87171',architecture:'#a78bfa',infrastructure:'#fbbf24',scale:'#2dd4bf',data:'#f472b6',optional:'#fb923c'};
  let bh='<div class="rp-title">By Section</div>';
  SECTIONS.forEach(sec=>{
    const secTopics=TOPICS.filter(t=>t.sec===sec.id);
    const secDone=secTopics.filter(t=>doneSet.has(t.id)).length;
    const secPct=secTopics.length?Math.round(secDone/secTopics.length*100):0;
    const color=secColors[sec.id]||'#6196ff';
    bh+='<div class="rp-bar-item"><span class="rp-bar-label">'+sec.name.replace(/^[^\s]+\s/,'')+'</span>'+
      '<div class="rp-bar-track"><div class="rp-bar-fill" style="width:'+secPct+'%;background:'+color+'"></div></div>'+
      '<span class="rp-bar-count">'+secDone+'/'+secTopics.length+'</span></div>';
  });
  rpB.innerHTML=bh;

  // Current section quick nav
  const rpC=document.getElementById('rpCurrentSection');
  let ch='<div class="rp-title">🔗 Quick Links</div>';
  
  let quickLinks = [];
  if (DATA_DIR === 'data/backend') {
    quickLinks=[
      {t:'🗺️ roadmap.sh/backend',u:'https://roadmap.sh/backend'},
      {t:'📖 System Design Primer',u:'https://github.com/donnemartin/system-design-primer'},
      {t:'🔐 OWASP Top 10',u:'https://owasp.org/www-project-top-ten'},
      {t:'🐳 Docker Getting Started',u:'https://docs.docker.com/get-started'},
      {t:'📊 Google SRE Book',u:'https://sre.google/sre-book/table-of-contents/'},
      {t:'🧪 Web Security Academy',u:'https://portswigger.net/web-security'},
      {t:'💻 MIT Missing Semester',u:'https://missing.csail.mit.edu'},
      {t:'📦 Learn Git Branching',u:'https://learngitbranching.js.org'}
    ];
  } else {
    quickLinks=[
      {t:'💻 LeetCode',u:'https://leetcode.com/problemset/all/'},
      {t:'🔥 NeetCode 150',u:'https://neetcode.io/practice'},
      {t:'🚀 Striver A2Z Sheet',u:'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/'},
      {t:'👀 Algorithm Visualizer',u:'https://algorithm-visualizer.org/'},
      {t:'📖 Big-O Cheat Sheet',u:'https://www.bigocheatsheet.com/'},
      {t:'🧠 Tech Interview Handbook',u:'https://www.techinterviewhandbook.org/software-engineering-interview-guide/'}
    ];
  }
  
  quickLinks.forEach(lk=>{ch+='<a class="rp-link" href="'+lk.u+'" target="_blank">'+lk.t+' ↗</a>'});
  rpC.innerHTML=ch;

  // Tips
  const rpT=document.getElementById('rpTips');
  let tips=[];
  if(DATA_DIR==='data/backend'){
    tips=[
      ['💡','Start with <b>Core</b> topics — they cover 80% of daily backend work'],
      ['🎯','Mark topics done to track your progress across sessions'],
      ['🔍','Use the search bar or filters to find specific topics quickly'],
      ['📱','This guide works offline once loaded — bookmark it!'],
      ['⌨️','Click any roadmap topic to jump directly to its details']
    ];
  } else {
    tips=[
      ['💡','Start with Arrays and Hashing. They appear in 50% of interviews.'],
      ['🎯','Focus on recognizing patterns, not memorizing code.'],
      ['⏳','Don\'t spend more than 45 mins stuck on one problem. Look at the solution.'],
      ['🗣️','Practice talking out loud while you write code.'],
      ['⌨️','Mark patterns done as you master them to track progress.']
    ];
  }
  rpT.innerHTML='<div class="rp-title">💡 Tips</div>'+tips.map(t=>'<div class="rp-tip"><span class="rp-tip-icon">'+t[0]+'</span><span>'+t[1]+'</span></div>').join('');
}

let visibleTopics = new Set();
function initScrollSpy(){
  if(window._scrollObs)window._scrollObs.disconnect();
  visibleTopics.clear();
  window._scrollObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting) visibleTopics.add(e.target.id);
      else visibleTopics.delete(e.target.id);
    });
    
    let activeId = null;
    for (const tp of TOPICS) {
      if (visibleTopics.has(tp.id)) {
        activeId = tp.id;
        break;
      }
    }
    
    if(activeId){
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      const link=document.querySelector('.nav-item[href="#'+activeId+'"]');
      if(link) {
        link.classList.add('active');
        const sb = document.getElementById('sidebar');
        const lRect = link.getBoundingClientRect();
        const sRect = sb.getBoundingClientRect();
        if(lRect.top < sRect.top || lRect.bottom > sRect.bottom) {
          link.scrollIntoView({block: 'nearest'});
        }
      }
    }
  },{threshold: 0, rootMargin: "-10% 0px -50% 0px"});
  
  document.querySelectorAll('.topic-section').forEach(s=>window._scrollObs.observe(s));
}

async function init(){
  try{
    await loadData();
    renderSidebar();renderTopics();renderRoadmap();renderReference();updateProgress();renderRightPanel();
    setTimeout(initScrollSpy,300);
    
    // Scroll to top button
    const stBtn=el('button',{cls:'scroll-top',onclick:()=>{window.scrollTo({top:0,behavior:'smooth'})}},['↑']);
    document.body.appendChild(stBtn);
    window.addEventListener('scroll',()=>{
      if(window.scrollY>500)stBtn.classList.add('visible');
      else stBtn.classList.remove('visible');
    });
  }catch(err){
    document.getElementById('tab-topics').innerHTML=
      '<div style="padding:2rem;text-align:center;color:var(--coral)">'+
      '<h3>⚠️ Failed to load data</h3>'+
      '<p style="margin-top:.5rem;color:var(--text2)">This app needs to be served via HTTP (not file://). Run a local server:</p>'+
      '<div class="code-block" style="text-align:left;margin-top:1rem">cd '+location.pathname.replace('/backend.html','')+'\\npython3 -m http.server 8080\\n# or\\nnpx serve .</div>'+
      '<p style="margin-top:1rem;color:var(--text3)">Then open <a href="http://localhost:8080/backend.html" style="color:var(--accent)">http://localhost:8080/backend.html</a></p>'+
      '</div>';
  }
}
document.addEventListener('DOMContentLoaded',init);
