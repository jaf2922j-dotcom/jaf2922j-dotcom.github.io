// Builds every PDF of the marketing page from the live page itself.
// Usage: node marketing/_pdf/build.js <base-url> [only-name ...]
//   base-url: where the site is served with HTTP range support, e.g. http://localhost:8766
// Output: marketing/pdf/*.pdf
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const base=(process.argv[2]||'http://localhost:8766').replace(/\/$/,'');
const only=process.argv.slice(3);
const dir=__dirname,out=path.join(dir,'..','pdf');
const css=fs.readFileSync(path.join(dir,'report.css'),'utf8'),js=fs.readFileSync(path.join(dir,'report.js'),'utf8');

const JOBS=[
  ['makro-marketing-2026',{kind:'all',theme:'screen'}],
  ['makro-marketing-2026-print',{kind:'all',theme:'print'}],
  ['team',{kind:'sec',id:'team'}],['dash',{kind:'sec',id:'dash'}],['income',{kind:'sec',id:'income'}],
  ['done',{kind:'sec',id:'done'}],['b2b',{kind:'sec',id:'b2b'}],['need',{kind:'sec',id:'need'}],['issues',{kind:'sec',id:'issues'}],
];
(async()=>{
  const b=await chromium.launch();
  const probe=await b.newPage();await probe.goto(base+'/marketing/',{waitUntil:'load'});
  const cvs=await probe.evaluate(()=>Object.keys(CVNAMES));await probe.close();
  for(const k of cvs)JOBS.push(['cv-'+k,{kind:'cv',key:k}]);
  for(const [name,job] of JOBS){
    if(only.length&&!only.includes(name))continue;
    const p=await b.newPage({viewport:{width:1000,height:1414}});
    await p.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare/,r=>r.abort());
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.addInitScript(()=>{try{sessionStorage.setItem('mkIntro','1')}catch(e){}});
    await p.goto(base+'/marketing/',{waitUntil:'load'});
    await p.addStyleTag({content:css});await p.addScriptTag({content:js});
    const r=await p.evaluate(j=>MKREP.build(j),job);
    await p.emulateMedia({media:'screen'});
    await p.pdf({path:path.join(out,name+'.pdf'),width:'210mm',height:'297mm',printBackground:true,scale:793.7/1000,margin:{top:0,right:0,bottom:0,left:0}});
    console.log(name,JSON.stringify(r),errs.length?errs:'');
    await p.close();
  }
  await b.close();
  // photos come out lossless from Chromium: re-encode them as JPEG so the files open fast on phones
  const built=fs.readdirSync(out).filter(f=>f.endsWith('.pdf')&&(!only.length||only.includes(f.slice(0,-4)))).map(f=>path.join(out,f));
  require('child_process').execFileSync('python3',[path.join(dir,'compress.py'),...built],{stdio:'inherit'});
})();
