// node show.mjs slug... : statement (trimmed) + examples + current code
import fs from 'fs';
const sp=(process.env.SP||'scripts/.work');
for(const s of process.argv.slice(2)){
 const q=JSON.parse(fs.readFileSync(sp+'/meta/'+s+'.json'));
 const t=q.content.replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\n\s*\n+/g,'\n').split('\n').filter(l=>l.trim()&&!/^Explanation/i.test(l.trim())).map(l=>l.slice(0,300)).slice(0,40).join('\n');
 const c=JSON.parse(fs.readFileSync('problems/'+s+'.json')).code.split('\n').filter(l=>l.trim()&&!l.trim().startsWith('//')).join('\n');
 console.log('##### '+s+'\n'+t+'\n--- CURRENT\n'+c);
}
