// Thème
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const saved = localStorage.getItem('theme');
if(saved === 'light') root.classList.add('light');
toggle.textContent = root.classList.contains('light') ? '☀' : '☾';
toggle.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  toggle.textContent = root.classList.contains('light') ? '☀' : '☾';
});

// Année footer
document.getElementById('year').textContent = new Date().getFullYear();

// Copier email
const copyBtn = document.getElementById('copyEmail');
if(copyBtn){
  copyBtn.addEventListener('click', () => {
    const email = copyBtn.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
      copyBtn.textContent = '✅ Email copié';
      setTimeout(()=> copyBtn.textContent = '📧 Copier mon email', 1600);
    });
  });
}

// Filtres projets
const grid = document.getElementById('projectGrid');
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const f = chip.dataset.filter;
    [...grid.children].forEach(card => {
      const tags = card.dataset.tags || '';
      card.style.display = (f === 'all' || tags.includes(f)) ? '' : 'none';
    });
  });
});

// Charger posts
fetch('posts.json')
  .then(r => r.json())
  .then(posts => {
    const list = document.getElementById('postList');
    posts.forEach(p => {
      const el = document.createElement('article');
      el.className = 'post';
      el.innerHTML = `
        <h3><a href="${p.url}" target="_blank" rel="noreferrer">${p.title}</a></h3>
        <div class="small">${p.date} • ${p.tags.join(' · ')}</div>
        <p>${p.excerpt}</p>
      `;
      list.appendChild(el);
    });
  })
  .catch(() => {
    document.getElementById('postList').innerHTML =
      '<p class="muted">Aucun article pour le moment.</p>';
  });
// Masquer la section Projets si aucune carte
(() => {
  const grid = document.getElementById('projectGrid');
  if (grid && grid.children.length === 0) {
    const section = document.getElementById('projects');
    if (section) section.style.display = 'none';
  }
})();

