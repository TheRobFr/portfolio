
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
  if(!listEl && !latestEl){ return; }
  const res = await fetch('posts.json'); const posts = await res.json();
  // Build tags
  if(tagSelect){
    const tags = Array.from(new Set(posts.flatMap(p => p.tags))).sort();
    for(const t of tags){ const o = document.createElement('option'); o.value = t; o.textContent = t; tagSelect.appendChild(o); }
  }
  // Latest on home
  if(latestEl){
    const latest = posts.slice(0,3);
    latest.forEach(p => latestEl.appendChild(card(p)));
  }
  // Listing page with paging
  if(listEl){
    let page = 1, perPage = 9, currentTag = '', q = '';
    const button = document.getElementById('load-more');
    function render(){
      listEl.innerHTML = '';
      let filtered = posts.filter(p => (!currentTag || p.tags.includes(currentTag)) && (!q || (p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))));
      const pageItems = filtered.slice(0, page*perPage);
      pageItems.forEach(p => listEl.appendChild(card(p)));
      button.style.display = (filtered.length > page*perPage) ? 'inline-flex' : 'none';
    }
    tagSelect?.addEventListener('change', (e)=>{ currentTag = e.target.value; page=1; render(); });
    searchInput?.addEventListener('input', (e)=>{ q = (e.target.value||'').toLowerCase(); page=1; render(); });
    document.getElementById('load-more')?.addEventListener('click', ()=>{ page++; render(); });
    render();
  }

  function card(p){
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="meta">${p.date} • ${p.tags.join(', ')}</div>
      <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h3>
      <p>${p.excerpt}</p>
      <a class="arrow" href="post.html?id=${encodeURIComponent(p.id)}">Lire →</a>
    `;
    return el;
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

  const plain = (post.content||'').replace(/```[\s\S]*?```/g,'');
  const words = (plain.match(/\S+/g)||[]).length;
  const mins = Math.max(1, Math.round(words/220));
  if(metaEl) metaEl.textContent = `${post.date} • ${post.tags.join(', ')} • ${mins} min`;

  document.querySelectorAll('#post-content pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copier';
    btn.addEventListener('click', async () => {
      const code = pre.textContent;
      try { await navigator.clipboard.writeText(code); btn.textContent='Copié !'; setTimeout(()=>btn.textContent='Copier',1200); } catch(e){}
    });
    pre.appendChild(btn);
  });

  const progress = document.getElementById('read-progress');
  if(progress){
    const target = document.getElementById('post-article');
    const onScroll = () => {
      const rect = target.getBoundingClientRect();
      const total = target.scrollHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(window.scrollY - target.offsetTop, 0), total);
      const ratio = total>0 ? (scrolled/total) : 0;
      progress.style.width = (ratio*100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
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
