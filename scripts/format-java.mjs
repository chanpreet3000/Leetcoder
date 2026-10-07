// format every java solution's code field with google-java-format (2-space); originals are backed up first
import fs from 'fs';import path from 'path';import {execFileSync,spawnSync} from 'child_process';
const sp=(process.env.SP||'scripts/.work');const dir='problems';
const back=sp+'/orig';fs.mkdirSync(back,{recursive:true});
const tmp=sp+'/fmt/work';fs.rmSync(tmp,{recursive:true,force:true});fs.mkdirSync(tmp,{recursive:true});
const items=[];
for(const f of fs.readdirSync(dir)){const j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));if(j.language!=='java')continue;
 if(!fs.existsSync(back+'/'+f))fs.copyFileSync(path.join(dir,f),back+'/'+f);
 const tf=path.join(tmp,f.replace('.json','.java'));fs.writeFileSync(tf,j.code.replace(/\r\n/g,'\n'));items.push({f,tf,j})}
const files=items.map(i=>i.tf);
let failed=0;
for(let i=0;i<files.length;i+=100){
 const r=spawnSync('java',['-jar',sp+'/fmt/gjf.jar','--replace','--skip-sorting-imports','--skip-removing-unused-imports',...files.slice(i,i+100)],{encoding:'utf8'});
 if(r.stderr)console.error(r.stderr.split('\n').slice(0,10).join('\n'));
}
let changed=0,same=0;
for(const {f,tf,j} of items){const out=fs.readFileSync(tf,'utf8').replace(/\s+$/,'');
 if(out===j.code.replace(/\r\n/g,'\n').replace(/\s+$/,'')){same++;continue}
 j.code=out;fs.writeFileSync(path.join(dir,f),JSON.stringify(j,null,4));changed++}
console.log({total:items.length,changed,same});
