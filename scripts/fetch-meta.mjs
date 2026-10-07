// cache LeetCode metadata (content, metaData, exampleTestcases) for every java solution slug
import fs from 'fs';
const sp=(process.env.SP||'scripts/.work');const slugs=fs.readdirSync('problems').map(f=>f.replace('.json','')).filter(s=>JSON.parse(fs.readFileSync('problems/'+s+'.json')).language==='java');
let i=0,done=0;
async function worker(){
 while(i<slugs.length){const s=slugs[i++];const out=sp+'/meta/'+s+'.json';if(fs.existsSync(out)){done++;continue}
  for(let a=0;a<3;a++){try{
   const r=await fetch('https://leetcode.com/graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'query q($s:String!){question(titleSlug:$s){content metaData exampleTestcases}}',variables:{s}})});
   const q=(await r.json()).data.question;fs.writeFileSync(out,JSON.stringify(q));done++;break}catch(e){await new Promise(r=>setTimeout(r,1500))}}}}
await Promise.all(Array.from({length:6},worker));console.log('fetched',done,'of',slugs.length);
