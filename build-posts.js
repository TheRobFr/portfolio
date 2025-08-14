const fs=require('fs'); const path=require('path');
const SITE_URL=process.env.SITE_URL || 'https://example.github.io/your-repo';
const posts=JSON.parse(fs.readFileSync('posts.json','utf8'));
fs.mkdirSync('posts',{recursive:true});
const template=(p)=>`<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${p.title} — Robin</title>
<meta name="description" content="${(p.excerpt||p.title).replace(/"/g,'&quot;')}"/>
<link rel="canonical" href="${SITE_URL}/post.html?id=${encodeURIComponent(p.id)}"/>
<meta property="og:title" content="${p.title} — Robin"/>
<meta property="og:description" content="${(p.excerpt||p.title).replace(/"/g,'&quot;')}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="${SITE_URL}/posts/${encodeURIComponent(p.id)}.html"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="stylesheet" href="../styles.css">
</head><body>
<main class="container"><p class="back"><a href="../blog.html">← Retour</a></p>
<h1>${p.title}</h1>
<p class="meta">${p.date} • ${p.tags.join(', ')}</p>
${(p.cover?`<img src="${p.cover}" alt="" loading="lazy" style="border-radius:18px;width:100%;height:auto">`:'')}
<div class="prose">${p.content.split('\n\n').map(b=>b.startsWith('## ')?`<h2>${b.replace(/^##\s+/,'')}</h2>`:b.startsWith('```')?`<pre class="card"><code>${b.replace(/^```[a-z]*\n?/,'').replace(/```$/,'')}</code></pre>`:`<p>${b}</p>`).join('')}</div>
<hr><p>Version dynamique : <a href="${SITE_URL}/post.html?id=${encodeURIComponent(p.id)}">post.html?id=${p.id}</a></p>
</main></body></html>`;
for(const p of posts){ fs.writeFileSync(path.join('posts',`${p.id}.html`), template(p)); }
