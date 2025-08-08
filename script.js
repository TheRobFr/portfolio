// Année
document.getElementById('year')?.append(new Date().getFullYear());

// Thème (respecte prefers-color-scheme)
const themeBtn = document.getElementById('themeToggle');
const setTheme = (t) => document.documentElement.dataset.theme = t;
const saved = localStorage.getItem('theme');
if (saved) setTheme(saved);
themeBtn?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(next);
  localStorage.setItem('theme', next);
});

// Menu mobile (si nécessaire)
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');
toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  menu?.classList.toggle('open');
});

// Charger et filtrer les posts (home)
const list = document.getElementById('postList');
const empty = document.getElementById('emptyPosts');
if (list) {
  fetch('posts.json')
    .then(r => r.json())
    .then(posts => {
      if (!posts.length) { empty.hidden = false; return; }
      render(posts);
      const chips = document.querySelectorAll('.chip');
      chips.forEach(ch => ch.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        ch.classList.add('is-active');
        const f = ch.dataset.filter;
        const filtered = f === 'all' ? posts : posts.filter(p => p.tags?.includes(f));
        render(filtered);
      }));
    })
    .catch(() => { empty.hidden = false; });
}

function render(items){
  list.innerHTML = '';
  items.forEach(p => {
    const a = document.createElement('article');
    a.className = 'card';
    const url = p.url || `post.html?slug=${encodeURIComponent(p.slug||'')}`;
    a.innerHTML = `
      <h3><a class="link" href="${url}">${p.title}</a></h3>
      <p class="meta">${p.date} · ${p.tags?.join(' · ')||''}</p>
      <p>${p.excerpt||''}</p>
    `;
    list.appendChild(a);
  });
}
