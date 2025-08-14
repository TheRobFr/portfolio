const fs=require('fs');const path=require('path');
function parseFM(txt){const m=txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); if(!m) return [null,txt]; const fm=Object.fromEntries(m[1].split('\n').map(l=>l.split(':').map(s=>s.trim())).map(([k,...v])=>[k, v.join(':')?.trim().replace(/^"|"$/g,'')])); return [fm,m[2]]; }
const files=fs.readdirSync('content').filter(f=>f.endsWith('.md'));
const posts=[];
for(const f of files){
  const raw=fs.readFileSync(path.join('content',f),'utf8');
  const [fm,body]=parseFM(raw);
  if(!fm||!fm.id||!fm.title||!fm.date){ console.error('FM manquant',f); continue; }
  posts.push({ id:fm.id, title:fm.title, date:fm.date, tags:(fm.tags?JSON.parse(fm.tags.replace(/'/g,'"')):[]), excerpt:fm.excerpt||'', cover:fm.cover||'', content:body.trim().replace(/\r\n/g,'\n') });
}
posts.sort((a,b)=> new Date(b.date)-new Date(a.date));
fs.writeFileSync('posts.json', JSON.stringify(posts,null,2));
console.log('posts.json généré avec',posts.length,'posts');
