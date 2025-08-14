
// Theme toggle (persist in localStorage)
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if(savedTheme === 'light'){ root.classList.add('light'); }
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if(btn){
    btn.addEventListener('click', () => {
      root.classList.toggle('light');
      localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
    });
  }
});

// Blog listing + search + tags + pagination
async function loadPosts(){
  const listEl = document.getElementById('posts');
  const latestEl = document.getElementById('latest-posts');
  const tagSelect = document.getElementById('tag-filter');
  const searchInput = document.getElementById('search');
  const tagPills = document.getElementById('tag-pills');
  const resultCount = document.getElementById('result-count');
  if(!listEl && !latestEl){ return; }
  const res = await fetch('posts.json'); const posts = await res.json();
  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  const urlTag = new URLSearchParams(location.search).get('tag')||'';

  // Build tags for select
  if(tagSelect){
    const tags = Array.from(new Set(posts.flatMap(p => p.tags))).sort();
    for(const t of tags){ const o = document.createElement('option'); o.value = t; o.textContent = t; tagSelect.appendChild(o); }
  }
  // Build top tag pills
  if(tagPills){
    const counts = posts.flatMap(p => p.tags).reduce((a,t)=>{a[t]=(a[t]||0)+1; return a;},{});
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([t])=>t);
    top.forEach(t=>{ const b = document.createElement('button'); b.type='button'; b.className='tag-pill'+(t===urlTag?' active':''); b.dataset.tag=t; b.textContent=t; tagPills.appendChild(b); });
  }
  // Latest on home
  if(latestEl){
    const latest = posts.slice(0,3);
    latest.forEach(p => latestEl.appendChild(card(p)));
  }
  // Listing page with paging
  if(listEl){
    let page = 1, perPage = 9, currentTag = urlTag, q = '', qWords = [];
    if(tagSelect){ tagSelect.value = currentTag; }
    const button = document.getElementById('load-more');
    function updatePills(){
      if(!tagPills) return;
      [...tagPills.children].forEach(b=>b.classList.toggle('active', b.dataset.tag===currentTag));
    }
    function render(){
      listEl.innerHTML = '';
      const filtered = posts
        .filter(p => !currentTag || p.tags.includes(currentTag))
        .map(p => {
          const hay = norm(p.title + ' ' + p.excerpt);
          const score = qWords.reduce((s,w)=>s + (hay.includes(w)?1:0),0);
          return { ...p, score };
        })
        .filter(p => qWords.length ? p.score > 0 : true)
        .sort((a,b)=>{
          if(qWords.length && b.score !== a.score) return b.score - a.score;
          return new Date(b.date) - new Date(a.date);
        });
      const pageItems = filtered.slice(0, page*perPage);
      pageItems.forEach(p => listEl.appendChild(card(p, qWords)));
      button.style.display = (filtered.length > page*perPage) ? 'inline-flex' : 'none';
      if(resultCount){ resultCount.textContent = `${filtered.length} résultats`; }
      updatePills();
    }
    tagSelect?.addEventListener('change', (e)=>{ currentTag = e.target.value; page=1; render(); });
    tagPills?.addEventListener('click', (e)=>{ const t = e.target.closest('.tag-pill'); if(!t) return; currentTag = t.dataset.tag; if(tagSelect) tagSelect.value = currentTag; page=1; render(); });
    searchInput?.addEventListener('input', (e)=>{ q = e.target.value||''; qWords = norm(q).split(/\s+/).filter(Boolean); page=1; render(); });
    document.getElementById('load-more')?.addEventListener('click', ()=>{ page++; render(); });
    render();
  }

  function card(p, qWords=[]){
    const el = document.createElement('article');
    el.className = 'card';
    const title = highlight(p.title, qWords);
    const excerpt = highlight(p.excerpt, qWords);
    el.innerHTML = `
      <div class="meta">${p.date} • ${p.tags.join(', ')}</div>
      <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${title}</a></h3>
      <p>${excerpt}</p>
      <a class="arrow" href="post.html?id=${encodeURIComponent(p.id)}">Lire →</a>
    `;
    return el;
  }

  function highlight(text, qWords){
    if(!qWords.length) return text;
    const normText = norm(text);
    const ranges = [];
    for(const w of qWords){
      let start = 0;
      while(true){
        const idx = normText.indexOf(w, start);
        if(idx === -1) break;
        ranges.push({start:idx, end:idx + w.length});
        start = idx + w.length;
      }
    }
    if(!ranges.length) return text;
    ranges.sort((a,b)=>a.start-b.start);
    const merged = [];
    for(const r of ranges){
      const last = merged[merged.length-1];
      if(last && r.start < last.end){
        last.end = Math.max(last.end, r.end);
      }else{
        merged.push({...r});
      }
    }
    let out = '', lastIdx = 0;
    for(const m of merged){
      out += text.slice(lastIdx, m.start) + '<mark>' + text.slice(m.start, m.end) + '</mark>';
      lastIdx = m.end;
    }
    out += text.slice(lastIdx);
    return out;
  }
}
loadPosts();

// Post page
async function loadPost(){
  const wrap = document.getElementById('post-article'); if(!wrap) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const data = await (await fetch('posts.json')).json();
  const post = data.find(p => p.id === id) || data[0];
  document.title = post.title + " — Robin";
  document.getElementById('post-title').textContent = post.title;
  const metaEl = document.getElementById('post-meta');
  const cover = document.getElementById('post-cover');
  if(post.cover){
    const img = document.createElement('img');
    img.src = post.cover;
    img.loading = 'lazy';
    img.alt = '';
    img.style.borderRadius = '18px';
    img.style.width = '100%';
    img.style.height = 'auto';
    cover.innerHTML = '';
    cover.appendChild(img);
  }
  // Render markdown-lite (support basic paragraphs + code fence)
  const contentEl = document.getElementById('post-content');
  contentEl.innerHTML = post.content.split('\n\n').map(block => {
    if(block.startsWith("```")){
      const code = block.replace(/^```[a-z]*\n?|```$/g,'').replace(/```$/,'');
      return `<pre class="card"><code>${escapeHtml(code)}</code></pre>`;
    }
    return `<p>${block}</p>`;
  }).join('');

  const plain=(post.content||'').replace(/```[\s\S]*?```/g,'');
  const words=(plain.match(/\S+/g)||[]).length;
  const mins=Math.max(1,Math.round(words/220));
  if(metaEl){ metaEl.textContent=`${post.date} • ${post.tags.join(', ')} • ${mins} min`; }

  document.querySelectorAll('#post-content pre').forEach(pre=>{
    const btn=document.createElement('button');
    btn.className='copy-btn'; btn.type='button'; btn.textContent='Copier';
    btn.addEventListener('click',async()=>{
      try{ await navigator.clipboard.writeText(pre.textContent); btn.textContent='Copié !'; setTimeout(()=>btn.textContent='Copier',1200);}catch(e){}
    });
    pre.appendChild(btn);
  });

  const progress=document.getElementById('read-progress');
  if(progress){
    const target=document.getElementById('post-article');
    const onScroll=()=>{
      const total=target.scrollHeight - window.innerHeight;
      const scrolled=Math.min(Math.max(window.scrollY - target.offsetTop,0), total);
      progress.style.width=(total>0?(scrolled/total)*100:0).toFixed(2)+'%';
    };
    window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  }

  // Related
  const related = data.filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t))).slice(0,3);
  const relEl = document.getElementById('related'); relEl.innerHTML = '';
  related.forEach(p => {
    const a = document.createElement('article'); a.className='card';
    a.innerHTML = `<h3><a href="post.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h3><p class="meta">${p.date} • ${p.tags.join(', ')}</p>`;
    relEl.appendChild(a);
  });

  function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
}
loadPost();
(function prefetchOnHover(){
  const canPrefetch = 'relList' in HTMLLinkElement.prototype && HTMLLinkElement.prototype.relList.supports?.('prefetch');
  if(!canPrefetch) return;
  const isInternal = url => {
    try{ const u = new URL(url, location.href); return u.origin === location.origin; }catch{return false;}
  };
  document.addEventListener('mouseover', e => {
    const a = e.target.closest('a[href]');
    if(!a || !isInternal(a.href)) return;
    const link = document.createElement('link');
    link.rel='prefetch'; link.href=a.href; link.as='document';
    document.head.appendChild(link);
  }, {passive:true});
})();
