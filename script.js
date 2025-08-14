
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

function messageCard(text){
  const el = document.createElement('article');
  el.className = 'card';
  el.textContent = text;
  return el;
}

// Blog listing + search + tags + pagination
async function loadPosts(){
  const listEl = document.getElementById('posts');
  const latestEl = document.getElementById('latest-posts');
  const tagSelect = document.getElementById('tag-filter');
  const searchInput = document.getElementById('search');
  const tagPills = document.getElementById('tag-pills');
  if(!listEl && !latestEl){ return; }
  let posts = [];
  try{
    const res = await fetch('posts.json', {cache:'no-store'});
    posts = await res.json();
    if(!Array.isArray(posts)) throw new Error('Invalid JSON');
  }catch{
    const target = listEl || latestEl;
    target?.appendChild(messageCard('Impossible de charger les articles.'));
    return;
  }
  if(posts.length === 0){
    if(listEl) listEl.appendChild(messageCard('Aucun article...'));
    if(latestEl) latestEl.appendChild(messageCard('Aucun article...'));
    return;
  }
  // Build tags for select
  if(tagSelect){
    const tags = Array.from(new Set(posts.flatMap(p => p.tags))).sort();
    for(const t of tags){ const o = document.createElement('option'); o.value = t; o.textContent = t; tagSelect.appendChild(o); }
  }
  // Build top tag pills
  if(tagPills){
    const counts = posts.flatMap(p => p.tags).reduce((a,t)=>{a[t]=(a[t]||0)+1; return a;},{});
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([t])=>t);
    top.forEach(t=>{ const b = document.createElement('button'); b.type='button'; b.className='tag-pill'; b.dataset.tag=t; b.textContent=t; tagPills.appendChild(b); });
  }
  // Latest on home
  if(latestEl){
    const latest = posts.slice(0,3);
    latest.forEach(p => latestEl.appendChild(card(p)));
  }
  // Listing page with paging
  if(listEl){
    const params = new URLSearchParams(location.search);
    let page = 1, perPage = 9, currentTag = params.get('tag') || '', q = '';
    if(tagSelect){ tagSelect.value = currentTag; }
    const button = document.getElementById('load-more');
    function updatePills(){
      if(!tagPills) return;
      [...tagPills.children].forEach(b=>b.classList.toggle('active', b.dataset.tag===currentTag));
    }
    function render(){
      listEl.innerHTML = '';
      let filtered = posts.filter(p => (!currentTag || p.tags.includes(currentTag)) && (!q || (p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))));
      if(filtered.length === 0){
        listEl.appendChild(messageCard(`Aucun résultat pour « ${q || currentTag} »`));
        button.style.display = 'none';
        updatePills();
        return;
      }
      const pageItems = filtered.slice(0, page*perPage);
      pageItems.forEach(p => listEl.appendChild(card(p, q)));
      button.style.display = (filtered.length > page*perPage) ? 'inline-flex' : 'none';
      updatePills();
    }
    tagSelect?.addEventListener('change', (e)=>{ currentTag = e.target.value; page=1; render(); });
    tagPills?.addEventListener('click', (e)=>{ const t = e.target.closest('.tag-pill'); if(!t) return; currentTag = t.dataset.tag; if(tagSelect) tagSelect.value = currentTag; page=1; render(); });
    searchInput?.addEventListener('input', (e)=>{ q = (e.target.value||'').toLowerCase(); page=1; render(); });
    document.getElementById('load-more')?.addEventListener('click', ()=>{ page++; render(); });
    render();
  }

  function card(p, q=''){
    const el = document.createElement('article');
    el.className = 'card';
    const title = highlight(p.title, q);
    const excerpt = highlight(p.excerpt, q);
    el.innerHTML = `
      <div class="meta">${p.date} • ${p.tags.join(', ')}</div>
      <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${title}</a></h3>
      <p>${excerpt}</p>
      <a class="arrow" href="post.html?id=${encodeURIComponent(p.id)}">Lire →</a>
    `;
    return el;
  }

  function highlight(text, q){
    if(!q) return text;
    const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    return text.replace(re,'<mark>$1</mark>');
  }

  function escapeRegExp(str){
    return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }
}
loadPosts();

// Post page
async function loadPost(){
  const wrap = document.getElementById('post-article'); if(!wrap) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  let data = [];
  try{
    const res = await fetch('posts.json', {cache:'no-store'});
    data = await res.json();
    if(!Array.isArray(data)) throw new Error('Invalid JSON');
  }catch{
    wrap.appendChild(messageCard("Impossible de charger l'article."));
    return;
  }
  if(data.length === 0){
    wrap.appendChild(messageCard('Aucun article...'));
    return;
  }
  const post = data.find(p => p.id === id) || data[0];
  if(!post){
    wrap.appendChild(messageCard("Article introuvable."));
    return;
  }
  document.title = post.title + " — Robin";
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-meta').textContent = `${post.date} • ${post.tags.join(', ')}`;
  const cover = document.getElementById('post-cover');
  if(post.cover){ cover.style.backgroundImage = `url(${post.cover})`; cover.style.backgroundSize = 'cover'; cover.style.backgroundPosition = 'center'; }
  // Render markdown-lite (support basic paragraphs + code fence)
  const contentEl = document.getElementById('post-content');
  contentEl.innerHTML = post.content.split('\n\n').map(block => {
    if(block.startsWith("```")){
      const code = block.replace(/^```[a-z]*\n?|```$/g,'').replace(/```$/,'');
      return `<pre class="card"><code>${escapeHtml(code)}</code></pre>`;
    }
    return `<p>${block}</p>`;
  }).join('');

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
