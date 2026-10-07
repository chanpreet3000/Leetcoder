// node replace.mjs batch.txt : like import.mjs but overwrites an existing java solution (after a compile check)
import fs from 'fs';import os from 'os';import path from 'path';import {execFileSync} from 'child_process';
const STUBS=`import java.util.*;import java.util.stream.*;
class ListNode{int val;ListNode next;ListNode(){}ListNode(int v){val=v;}ListNode(int v,ListNode n){val=v;next=n;}}
class TreeNode{int val;TreeNode left,right;TreeNode(){}TreeNode(int v){val=v;}TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
class Node{public int val;public List<Node> neighbors,children;public Node left,right,next,random,prev,child;public Node(){}public Node(int v){val=v;}}
interface HtmlParser{List<String> getUrls(String u);}
`;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jv-'));let ok=0;
const secs=fs.readFileSync(process.argv[2],'utf8').split(/^\/\/\/\/ /m).slice(1);
for(const s of secs){const nl=s.indexOf('\n');const slug=s.slice(0,nl).trim();const code=s.slice(nl+1).trim();
 const out=`problems/${slug}.json`;
 if(!fs.existsSync(out)){console.error('MISSING '+slug);continue}
 const imports=[...code.matchAll(/^import .*;$/gm)].map(m=>m[0]).join('\n');const body=code.replace(/^import .*;$/gm,'').replace(/^public (class)/gm,'$1');
 fs.writeFileSync(path.join(tmp,'Main.java'),imports+'\n'+STUBS+body+'\n');
 try{execFileSync('javac',['-d',tmp,path.join(tmp,'Main.java')],{stdio:'pipe'})}catch(e){console.error('FAIL '+slug+'\n'+e.stderr);continue}
 fs.writeFileSync(out,JSON.stringify({problemName:slug,language:'java',code},null,4));ok++}
console.log(`${ok}/${secs.length} replaced`);
