/* Génère rss.xml + sitemap.xml depuis posts.json */
const fs=require('fs');
const SITE_URL=process.env.SITE_URL || 'https://example.github.io/your-repo';
const posts=JSON.parse(fs.readFileSync('posts.json','utf8'));
const items=posts.filter(p=>p&&p.id&&p.title&&p.date).map(p=>({...p,url:`${SITE_URL}/post.html?id=${encodeURIComponent(p.id)}`}));
const rfc=d=>new Date(d).toUTCString();
const esc=s=>String(s).replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));

const rss=`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Robin — Génétique × IA</title><link>${SITE_URL}/</link><description>Blog Génétique × IA</description>
<lastBuildDate>${rfc(new Date())}</lastBuildDate>
${items.map(p=>`<item><title>${esc(p.title)}</title><link>${p.url}</link><guid>${p.url}</guid><pubDate>${rfc(p.date)}</pubDate><description><![CDATA[${p.excerpt||''}]]></description></item>`).join('')}
</channel></rss>`;
fs.writeFileSync('rss.xml',rss.trim());

const sitemap=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['index.html','blog.html','portfolio.html','contact.html'].map(p=>`<url><loc>${SITE_URL}/${p}</loc></url>`).join('')}
${items.map(p=>`<url><loc>${p.url}</loc></url>`).join('')}
</urlset>`;
fs.writeFileSync('sitemap.xml',sitemap.trim());
