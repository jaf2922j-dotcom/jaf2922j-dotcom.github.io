/* Makro Marketing · PDF report builder (runs inside the live page, injected by _pdf/build.js).
   MKREP.build({kind:"all"|"sec"|"cv", id, key, theme:"screen"|"print"}) → lays content onto A4 sheets in #rep. */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(h)=>{const t=document.createElement("template");t.innerHTML=h.trim();return t.content.firstElementChild};
const num=s=>parseFloat(String(s).replace(/\s/g,"").replace(",","."))||0;
const fmt=(v,d=0)=>v.toFixed(d).replace(".",",");
const DATE="Ташкент · октябрь 2026";

/* ---------- data taken from the live page (single source of truth) ---------- */
function readData(){
  const inc=$("#income"),D={};
  D.months=$$(".mbars>div",inc).map(d=>({v:num($("b",d).textContent),m:$("small",d).textContent.trim(),part:d.classList.contains("part")}));
  const hb=$$(".hbar.wide",inc);
  const rows=h=>$$(":scope>div",h).map(d=>{const s=$("span",d);const name=[...s.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim();
    const b=$("b",d);const v=num([...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(""));const pc=$("small",b);return {name,v,pc:pc?pc.textContent.trim():""}});
  D.partners=hb[0]?rows(hb[0]):[];D.cats=hb[1]?rows(hb[1]):[];
  D.total=D.partners.reduce((s,x)=>s+x.v,0);
  const ok=$$("#tree .okpi>div").map(d=>num($("b",d).textContent));
  D.team=ok[0]||TEAM.filter(p=>!p.team).length;D.vac=ok[2]||VAC.length;D.need=D.team+D.vac;D.fill=ok[3]||Math.round(D.team/D.need*100);
  const more=D.partners.find(p=>/^Ещё/.test(p.name));D.npart=D.partners.length-(more?1:0)+(more?num(more.name.replace(/\D+/g," ")):0);
  D.before=BEFORE.reduce((s,r)=>s+num(String(r[2]).replace("~","")),0);
  D.issues={need:ISSUES.filter(i=>i.st==="need").length,wip:ISSUES.filter(i=>i.st==="wip").length,ok:ISSUES.filter(i=>i.st==="ok").length};
  D.done=$$("#done .bignum").map(b=>({v:$(".gnum",b)?$(".gnum",b).textContent.trim():"",t:$("span:not(.gnum)",b)?$("span:not(.gnum)",b).textContent.trim():""})).filter(x=>x.v);
  return D}

/* ---------- charts (SVG, themed through CSS variables) ---------- */
function chartMonths(D){
  const W=848,H=250,L=34,R=46,T=26,B=30,ms=D.months,n=ms.length,max=Math.max(...ms.map(m=>m.v))*1.12;
  const bw=(W-L-R)/n,y=v=>T+(H-T-B)*(1-v/max);
  let cum=0;const cumPts=ms.map((m,i)=>{cum+=m.v;return [L+bw*i+bw/2,cum]});const ctot=cum;
  const yc=v=>T+(H-T-B)*(1-v/(ctot*1.05));
  const h1=ms.slice(0,6),q3=ms.slice(6,9);const a1=h1.reduce((s,m)=>s+m.v,0)/h1.length,a2=q3.reduce((s,m)=>s+m.v,0)/q3.length;
  const grid=[0,250,500,750].map(v=>`<line class="grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`).join("");
  const bars=ms.map((m,i)=>{const x=L+bw*i+bw*.2,w=bw*.6,yy=y(m.v);return `<rect x="${x}" y="${yy}" width="${w}" height="${y(0)-yy}" rx="5" fill="url(#dbv)" opacity="${m.part?.45:1}"/><text class="vl" x="${x+w/2}" y="${yy-7}" text-anchor="middle">${m.v}</text><text class="ax" x="${x+w/2}" y="${H-10}" text-anchor="middle">${m.m}</text>`}).join("");
  const line=`<polyline points="${cumPts.map(([x,c])=>`${x},${yc(c)}`).join(" ")}" fill="none" stroke="var(--a2)" stroke-width="2.5" stroke-linejoin="round"/>`+cumPts.map(([x,c],i)=>`<circle cx="${x}" cy="${yc(c)}" r="${i===n-1?5:3}" fill="var(--sheet)" stroke="var(--a2)" stroke-width="2"/>`).join("")+
    `<text class="vl" x="${cumPts[n-1][0]+10}" y="${yc(ctot)+4}" style="fill:var(--a2)">${fmt(ctot/1000,2)} млрд</text>`;
  const avg=(v,i0,i1,lab)=>`<line x1="${L+bw*i0+4}" x2="${L+bw*i1-4}" y1="${y(v)}" y2="${y(v)}" stroke="var(--warn)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="${L+bw*i1-6}" y="${y(v)-6}" text-anchor="end" style="fill:var(--warn);font:600 11px 'JetBrains Mono',monospace">${lab} ${Math.round(v)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="dbv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--bv1)"/><stop offset="1" stop-color="var(--bv2)"/></linearGradient></defs>${grid}${bars}${avg(a1,0,6,"ср. янв–июн")}${avg(a2,6,9,"ср. июл–сен")}${line}</svg>`}

function chartDonut(D){
  const cats=D.cats,tot=cats.reduce((s,c)=>s+c.v,0),R=76,r=R,C=2*Math.PI*r,cols=["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)"];
  let off=0;const seg=cats.map((c,i)=>{const len=C*c.v/tot;const s=`<circle r="${r}" cx="100" cy="100" fill="none" stroke="${cols[i%6]}" stroke-width="30" stroke-dasharray="${Math.max(len-2,0)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;off+=len;return s}).join("");
  const svg=`<svg viewBox="0 0 200 200" style="max-width:200px">${seg}<text x="100" y="98" text-anchor="middle" style="fill:var(--ink);font:700 30px Oswald,sans-serif">${fmt(tot/1000,2)}</text><text x="100" y="118" text-anchor="middle" class="ax">млрд сум</text></svg>`;
  const lg=`<div class="lg">${cats.map((c,i)=>`<div><i style="background:${cols[i%6]}"></i><span>${c.name}</span><b>${c.v}<em>${c.pc||Math.round(c.v/tot*100)+"%"}</em></b></div>`).join("")}</div>`;
  return `<div style="display:grid;grid-template-columns:200px 1fr;gap:18px;align-items:center">${svg}${lg}</div>`}

function chartPareto(D){
  const ps=D.partners,tot=D.total,max=Math.max(...ps.map(p=>p.v));let cum=0;
  return `<div style="display:grid;gap:7px">${ps.map((p,i)=>{cum+=p.v;const pc=Math.round(cum/tot*100);const other=/^Ещё/.test(p.name);
   return `<div style="display:grid;grid-template-columns:150px 1fr 40px 46px;gap:10px;align-items:center;font-size:12px">
    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(${other?"--mute":"--ink"})">${p.name}</span>
    <span style="height:12px;border-radius:6px;background:var(--line);position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${p.v/max*100}%;border-radius:6px;background:var(--bar);opacity:${other?.45:1}"></i></span>
    <b style="font:600 13px Oswald,sans-serif;color:var(--ink);text-align:right">${p.v}</b>
    <em style="font:600 10.5px 'JetBrains Mono',monospace;font-style:normal;color:var(--a2);text-align:right">${other?"":pc+"%"}</em></div>`}).join("")}</div>
   <p class="note">Справа — накопленная доля дохода. Топ-2 партнёра дали <b style="color:var(--ink)">${Math.round((ps[0].v+ps[1].v)/tot*100)}%</b>, топ-5 — <b style="color:var(--ink)">${Math.round(ps.slice(0,5).reduce((s,p)=>s+p.v,0)/tot*100)}%</b> всего дохода.</p>`}

function chartGauge(v,max,label){
  const p=(arguments[3]!=null?arguments[3]/100:v/max),R=70,cx=90,cy=86,a=Math.PI*(1-p),x=cx+R*Math.cos(a),y=cy-R*Math.sin(a);
  return `<svg viewBox="0 0 180 104" style="max-width:220px;margin:0 auto"><path d="M${cx-R} ${cy} A${R} ${R} 0 0 1 ${cx+R} ${cy}" fill="none" stroke="var(--line)" stroke-width="16" stroke-linecap="round"/>
   <path d="M${cx-R} ${cy} A${R} ${R} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="url(#dbg)" stroke-width="16" stroke-linecap="round"/>
   <defs><linearGradient id="dbg"><stop offset="0" stop-color="var(--c1)"/><stop offset="1" stop-color="var(--c3)"/></linearGradient></defs>
   <text x="${cx}" y="${cy-8}" text-anchor="middle" style="fill:var(--ink);font:700 32px Oswald,sans-serif">${Math.round(p*100)}%</text>
   <text x="${cx}" y="${cy+12}" text-anchor="middle" class="ax">${label}</text></svg>`}

function chartTeam(D){
  const it=[["Было",D.before,"var(--c5)"],["Сейчас",D.team,"var(--c1)"],["Нужно",D.need,"var(--c3)"]],max=Math.max(...it.map(i=>i[1]));
  return `<svg viewBox="0 0 240 150">${it.map(([l,v,c],i)=>{const x=24+i*76,h=100*v/max,y=118-h;return `<rect x="${x}" y="${y}" width="44" height="${h}" rx="6" fill="${c}"/><text class="vl" x="${x+22}" y="${y-8}" text-anchor="middle" style="font-size:18px">${i===0?"~":""}${v}</text><text class="ax" x="${x+22}" y="138" text-anchor="middle">${l}</text>`}).join("")}</svg>`}

function chartIssues(D){
  const I=D.issues,t=I.need+I.wip+I.ok,seg=[["Нужно решение",I.need,"var(--warn)"],["В работе",I.wip,"var(--c2)"],["Решено",I.ok,"var(--ok)"]].filter(s=>s[1]);
  let x=0;return `<div style="display:flex;height:22px;border-radius:8px;overflow:hidden;gap:3px">${seg.map(([l,v,c])=>`<i style="flex:${v};background:${c}"></i>`).join("")}</div>
   <div class="lg" style="margin-top:12px">${seg.map(([l,v,c])=>`<div><i style="background:${c}"></i><span>${l}</span><b>${v}</b></div>`).join("")}</div>
   <p class="note">Всего ${t} пунктов в разделе «Проблемы и решения».</p>`}

function dashboard(D){
  const best=D.months.reduce((a,b)=>b.v>a.v?b:a),h1=D.months.slice(0,6).reduce((s,m)=>s+m.v,0)/6,q3=D.months.slice(6,9).reduce((s,m)=>s+m.v,0)/3;
  const top2=Math.round((D.partners[0].v+D.partners[1].v)/D.total*100);
  return [
   secHead("01","Дашборд · деньги","Доход от партнёров за 2026 год: сколько, когда, кто и за что платил. Данные — выгрузка из SAP за 1 января — 20 октября 2026."),
   el(`<div class="db"><div class="db-hero">
     <div class="db-c"><div class="db-l">Доход от партнёров · 2026 · без НДС</div><div class="db-big">${fmt(D.total/1000,2)}<small> млрд сум</small></div>
      <div class="db-sub">Лучший месяц — <b>${best.m.toLowerCase()} (${best.v} млн)</b>. Средний месяц июль–сентябрь <b>${Math.round(q3)} млн</b> против <b>${Math.round(h1)} млн</b> в первом полугодии — <b>${Math.round((q3/h1-1)*100)}%</b>.</div></div>
     <div class="db-k"><div><b>${D.npart}</b><span>партнёров платили за маркетинг</span></div><div><b>55</b><span>магазинов сети</span></div>
      <div><b>${D.team}<small>из ${D.need}</small></b><span>человек в команде по структуре</span></div><div><b>${top2}%</b><span>дохода дали 2 крупнейших партнёра</span></div></div></div></div>`),
   el(`<div class="db"><div class="db-c"><div class="db-l">Доход по месяцам · млн сум · линия — накопительный итог</div>${chartMonths(D)}<p class="note">Октябрь — данные по 20 октября. Пунктир — средний месяц за период.</p></div></div>`),
   el(`<div class="db"><div class="db-row" style="grid-template-columns:1.05fr 1fr">
     <div class="db-c"><div class="db-l">За что платили</div>${chartDonut(D)}</div>
     <div class="db-c"><div class="db-l">Кто платил · млн сум</div>${chartPareto(D)}</div></div></div>`)]}
function dashboard2(D){
  const need=ISSUES.filter(i=>i.st==="need");
  return [
   secHead("02","Дашборд · команда и решения","Сколько людей держат работу, что сделано за 6 месяцев и какие решения нужны от руководства. Лист удобно распечатать и отметить решения прямо на нём."),
   el(`<div class="db"><div class="db-row" style="grid-template-columns:1fr 1fr 1.15fr">
     <div class="db-c"><div class="db-l">Укомплектованность команды</div>${chartGauge(D.team,D.need,`${D.team} из ${D.need} по структуре`,D.fill)}</div>
     <div class="db-c"><div class="db-l">Команда · человек</div>${chartTeam(D)}</div>
     <div class="db-c"><div class="db-l">Статус проблем</div>${chartIssues(D)}</div></div></div>`),
   ...(D.done.length?[el(`<div class="db"><div class="db-c"><div class="db-l">Сделано за 6 месяцев</div><div class="db-k" style="grid-template-columns:repeat(${Math.min(D.done.length,4)},1fr)">${D.done.slice(0,4).map(d=>`<div><b>${d.v}</b><span>${d.t}</span></div>`).join("")}</div></div></div>`)]:[]),
   el(`<div class="sub-h" style="margin-top:22px"><b>Решения от руководства</b><span>${need.length} пунктов</span></div>`),
   ...need.map(i=>el(`<div class="chk"><div><span class="bx"></span><span><b>${i.r||i.p}</b><span>${i.p}</span></span><span class="sg">Решение · срок</span></div></div>`))]}

/* ---------- blocks from the page ---------- */
function secHead(n,t,p){return el(`<div class="sec-h" data-sec="${t}"><div class="n">${n}</div><h1>${t}</h1>${p?`<p>${p}</p>`:""}</div>`)}
function subHead(t,k){return el(`<div class="sub-h"><b>${t}</b>${k?`<span>${k}</span>`:""}</div>`)}
function fromPage(id){const src=$("#"+id);const c=src.cloneNode(true);return c}
function sheetOf(p){person(p,true);const w=el(`<div class="sheet sheetx on"></div>`);$$("#sheetBody>*").forEach(n=>w.appendChild(n.cloneNode(true)));close();
  $$("h4",w).forEach(h=>{if(/^В подчинении/.test(h.textContent.trim())){const n=h.nextElementSibling;if(n&&n.matches(".subs"))n.remove();h.remove()}});return w}
function cvOf(key){const w=document.createElement("div");w.innerHTML=CVS[key];const c=w.querySelector(".cv")||w.firstElementChild;if(c)c.classList.add("cvwrap");return c}
const CVKEY=id=>(typeof CVOF!=="undefined"&&CVOF[id])||null;
const SECS={
  team:["Структура департамента","Кто кому подчиняется, кто за что отвечает и кого не хватает команде.",()=>[fromPage("tree"),fromPage("load"),fromPage("teamx")]],
  dash:["Маркетинг в цифрах","Сеть, команда, результаты за 6 месяцев, рекламные продажи и статус проблем.",()=>[fromPage("dash")]],
  income:["Доходность","Факт дохода от поставщиков за 2026 год по данным SAP.",()=>[fromPage("income")]],
  done:["Что сделано","Открытия, ребрендинг, промо, POSM, рекламные продажи и digital за 6 месяцев.",()=>[fromPage("done")]],
  b2b:["B2B и E-commerce","Помощь коммерческому департаменту: доставка в цифрах, нагрузка, причины, проекты и что нужно утвердить.",()=>[fromPage("b2b")]],
  issues:["Проблемы и решения","С чем столкнулись, как решили, что осталось и какие решения нужны от руководства.",()=>[fromPage("issues")]],
};
function people(){
  const out=[];TEAM.filter(p=>!p.team).forEach(p=>{const k=CVKEY(p.id);if(!RESP[p.id]&&!k)return;
    out.push({brk:true});
    if(RESP[p.id])out.push(sheetOf(p));if(k&&CVS[k]){out.push({brk:true});out.push(cvOf(k))}});
  return out}

/* ---------- pagination ---------- */
let REP,pages=[],cur=null,label="";
function newPage(){const pg=el(`<div class="a4"><div class="a4-top"><span>Makro · <b>Департамент маркетинга</b></span><span class="lab">${label}</span></div><div class="a4-body page open"></div><div class="a4-foot"><span>Маркетинг 2026 · ${DATE}</span><span class="pn"></span></div></div>`);
  REP.appendChild(pg);cur={pg,body:$(".a4-body",pg),chain:[],placed:0};pages.push(cur);return cur}
const fits=()=>cur.body.scrollHeight<=cur.body.clientHeight+1;
const ATOM="svg,img,p,h1,h2,h3,h4,h5,li,button,a,tr,.gnum,.ldc,.hleaf,.store,.mcard,.vcard,.tnode,.rzb,.job,.chk>div,.sub-h,.sec-h,.db-c,.cvh,.gantt,.ibk>div";
const HEAD="h3,h4,h5,.glab,.glab2,.db-l,.sub-h,.eyebrow";
function parentFor(path){
  let i=0;while(i<cur.chain.length&&i<path.length&&cur.chain[i].o===path[i])i++;
  cur.chain.length=i;let par=i?cur.chain[i-1].s:cur.body;
  for(;i<path.length;i++){const s=path[i].cloneNode(false);par.appendChild(s);cur.chain.push({o:path[i],s});par=s}
  return par}
function flow(node,path,depth=0){
  if(node.brk){if(cur.placed)newPage();return}
  if(node.nodeType===3&&!node.textContent.trim())return;
  let par=parentFor(path);par.appendChild(node);
  if(fits()){cur.placed++;return}
  const h=node.nodeType===1?node.getBoundingClientRect().height:0;par.removeChild(node);
  const avail=cur.body.clientHeight,left=avail-cur.body.scrollHeight;
  const kids=node.nodeType===1?[...node.childNodes].filter(n=>n.nodeType===1||n.textContent.trim()):[];
  const atomic=node.nodeType!==1||node.matches(ATOM)||kids.length<2||h<170||depth>5||kids.some(k=>k.nodeType===3);
  if(!atomic&&(h>avail*.92||left>avail*.22)){kids.forEach(k=>flow(k,[...path,node],depth+1));return}
  if(cur.placed){const carry=par.lastElementChild&&par.children.length>1&&par.lastElementChild.matches(HEAD)?par.lastElementChild:null;
    newPage();if(carry){parentFor(path).appendChild(carry)}flow(node,path,depth);return}
  par=parentFor(path);par.appendChild(node);
  if(!fits()&&node.nodeType===1){const z=(avail-4)/node.getBoundingClientRect().height;if(z>=.8||!kids.length)node.style.zoom=Math.max(z,.8);else{par.removeChild(node);kids.forEach(k=>flow(k,[...path,node],depth+1));return}}
  cur.placed++}
function cleanShells(){$$(".a4-body *",REP).reverse().forEach(n=>{if(!n.childNodes.length&&!n.matches("img,svg,i,br,hr,input,video,span,b,em,canvas,circle,path,rect,line,polyline,stop,td,th")&&!n.className.baseVal&&n.className&&!/bx|sg|ph|dot|own|ex/.test(n.className)){/* keep decorative empty boxes */ if(n.getBoundingClientRect().height===0)n.remove()}})}

/* ---------- low-ink conversion for the print theme ---------- */
function rgb(s){if(!s||s==="none")return null;let m=s.match(/rgba?\(([^)]+)\)/);if(m){const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r:p[0]/255,g:p[1]/255,b:p[2]/255,a:p.length>3?p[3]:1}}
  m=s.match(/color\(srgb ([^)]+)\)/);if(m){const p=m[1].split(/[ \/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}return null}
const lum=c=>.2126*c.r+.7152*c.g+.0722*c.b,chroma=c=>Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b);
const BARS=".hbar i,.mbars i,.gb,.sbar i,.cvml i,.rzn .segs i.own,.rzn .roles span.own,.cvph,.store .im em,.tools i,.okpi .oring";
function toPrint(){
  $$(".a4-body *",REP).forEach(n=>{
    if(n.closest(".db,.chk,.sec-h,.sub-h"))return;
    const cs=getComputedStyle(n),st=n.style,svg=n instanceof SVGElement;
    if(svg){const f=rgb(cs.fill),k=rgb(cs.stroke);
      if(f&&f.a>0){if(n.tagName==="text"||n.tagName==="tspan"){if(lum(f)>.5)st.fill=chroma(f)>.3?"#3b36a8":"#141a33"}else if(lum(f)<.3)st.fill="#e6e9f3";else if(lum(f)>.85)st.fill="#5a4fd8"}
      if(k&&k.a>0&&lum(k)<.3)st.stroke="#dfe3ef";
      st.filter="none";return}
    const bar=n.matches(BARS);
    const bg=rgb(cs.backgroundColor);
    if(bar){if(!n.matches(".cvph"))st.background="var(--bar)";else st.background="var(--line2)"}
    else{
      if(cs.backgroundImage&&cs.backgroundImage!=="none"&&!/url\(/.test(cs.backgroundImage)){st.backgroundImage="none"}
      if(bg&&bg.a>.02&&lum(bg)<.6)st.backgroundColor="transparent"}
    const clip=(cs.webkitBackgroundClip||cs.backgroundClip)==="text";
    const c=rgb(cs.color);
    if(clip||(c&&c.a<.05)||rgb(cs.webkitTextFillColor)&&rgb(cs.webkitTextFillColor).a<.05){st.backgroundImage="none";st.color="#3b36a8";st.webkitTextFillColor="#3b36a8";st.background="none"}
    else if(c&&lum(c)>.45){const nc=chroma(c)>.28?"#3b36a8":lum(c)>.78?"#141a33":"#5d6685";st.color=nc;st.webkitTextFillColor=nc}
    ["Top","Right","Bottom","Left"].forEach(sd=>{if(parseFloat(cs["border"+sd+"Width"])>0){const b=rgb(cs["border"+sd+"Color"]);if(b&&b.a>0&&lum(b)<.45&&chroma(b)<.35)st["border"+sd+"Color"]="#d6dbea"}});
    if(cs.filter!=="none")st.filter="none";
    if(cs.webkitTextStrokeWidth&&parseFloat(cs.webkitTextStrokeWidth)>0)st.webkitTextStrokeColor="#c9cfe3";
  })}

/* ---------- cover ---------- */
function cover(D,toc,theme){
  const pg=el(`<div class="a4 cover"><div class="rc-hero"><img src="img/mk-intro-blue-poster.webp" alt=""><span class="tag">Makro · yangi zamon</span><span class="tag tag2">Отчёт · 2026</span><div class="rc-word">MARKETING</div></div>
   <div class="rc-main"><div class="rc-kick">Департамент маркетинга и рекламы</div><div class="rc-title">Отчёт для руководства</div>
   <p class="rc-lead">Кто мы, как работаем, что сделали за год и какие решения нужны, чтобы маркетинг сети рос дальше. Всё по шагам: от цифр и решений к команде и результатам.</p>
   <div class="rc-kpi"><div><b>${D.team}</b><span>человек в команде</span></div><div><b>55</b><span>магазинов сети</span></div><div><b>${fmt(D.total/1000,2)} млрд</b><span>сум дохода от партнёров</span></div><div><b>100+</b><span>акций за счёт партнёров</span></div></div>
   <div class="toc">${toc.map((t,i)=>`<div><i>${String(i+1).padStart(2,"0")}</i><span>${t[0]}</span><em>${t[1]}</em></div>`).join("")}</div>
   <div class="rc-foot"><span>${DATE}</span><span>${theme==="print"?"Версия для печати":"Версия для показа"}</span></div></div></div>`);
  return pg}

/* ---------- build ---------- */
async function build(job){
  const theme=job.theme||"screen",D=readData();
  // gather every block first (the page's own builders), then drop the live page
  const plan=[];
  const add=(lab,items)=>{plan.push({lab});items.forEach(x=>plan.push(x))};
  if(job.kind==="all"){
    add("Дашборд · деньги",dashboard(D));add("Дашборд · команда и решения",[{brk:true},...dashboard2(D)]);
    let n=3;for(const k of ["team"]){const s=SECS[k];add(s[0],[{brk:true},secHead(String(n++).padStart(2,"0"),s[0],s[1]),...s[2]()])}
    add("Люди",[{brk:true},secHead(String(n++).padStart(2,"0"),"Люди: зоны и резюме","Каждый сотрудник: направления, задачи, сколько ролей совмещает, и резюме."),...people().slice(1)]);
    for(const k of ["dash","income","done","b2b","issues"]){const s=SECS[k];add(s[0],[{brk:true},secHead(String(n++).padStart(2,"0"),s[0],s[1]),...s[2]()])}
  }else if(job.kind==="dashboard"){add("Дашборд · деньги",dashboard(D));add("Дашборд · команда и решения",[{brk:true},...dashboard2(D)])}
  else if(job.kind==="sec"){const s=SECS[job.id];add(s[0],[secHead("Makro · 2026",s[0],s[1]),...s[2]()]);
    if(job.id==="team"){const ppl=people().filter(x=>!(x.classList&&x.classList.contains("cvwrap"))).filter((x,i,a)=>!(x.brk&&a[i+1]&&a[i+1].brk));
      add("Люди",[{brk:true},secHead("Makro · 2026","Люди: зоны ответственности","Направления и задачи каждого сотрудника и сколько ролей он совмещает."),...ppl.slice(1)])}}
  else if(job.kind==="cv"){const id=Object.keys(CVOF).find(k=>CVOF[k]===job.key),p=TEAM.find(t=>t.id===id);
    add("Резюме",[secHead("Резюме · 2026",CVNAMES[job.key][0],CVNAMES[job.key][1]),...(p&&RESP[p.id]?[sheetOf(p),{brk:true}]:[]),cvOf(job.key)])}
  plan.forEach(it=>{if(!it||it.nodeType!==1)return;$$("details",it).forEach(d=>d.open=true);$$(".dnav",it).forEach(d=>d.remove());const w=document.createTreeWalker(it,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode()){if(/Нажмите|нажмите/.test(t.textContent))t.textContent=t.textContent.replace(/\s*[^.!?]*[Нн]ажмите[^.!?]*[.!?]?/g,"")}});
  const defs=$("#income svg defs")?$("#income svg").outerHTML:"";
  document.documentElement.classList.add("rep");
  $$("body>*").forEach(n=>{if(n.id!=="rep"&&!/^(STYLE|LINK|SCRIPT)$/.test(n.tagName))n.remove()});
  REP=el(`<div id="rep" class="t-${theme}"></div>`);document.body.appendChild(REP);
  if(defs)REP.insertAdjacentHTML("afterbegin",defs.replace(/<svg /,'<svg style="position:absolute;width:0;height:0" '));
  $$("img",REP).forEach(i=>i.loading="eager");
  await document.fonts.ready;
  const tocAt=[];newPage();
  for(const it of plan){
    if(it.lab!==undefined&&!it.nodeType&&!it.brk){label=it.lab;if(!cur.placed)$(".lab",cur.pg).textContent=label;tocAt.push([label,null]);continue}
    if(it.brk){if(cur.placed)newPage();$(".lab",cur.pg).textContent=label;cur.labSet=true;continue}
    if(tocAt.length&&tocAt[tocAt.length-1][1]===null&&!it.brk)tocAt[tocAt.length-1][1]=pages.length;
    $$("img",it.nodeType===1?it:document.createElement("i")).forEach(i=>i.loading="eager");
    const before=cur;flow(it,[]);if(cur!==before||!before.labSet){$(".lab",cur.pg).textContent=label;cur.labSet=true}}
  // images: wait, then re-check nothing overflowed after they got real heights
  await Promise.all($$("img",REP).map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  cleanShells();
  pages=pages.filter(p=>{if(!p.placed&&!p.body.textContent.trim()&&!$("img,svg",p.body)){p.pg.remove();return false}return true});
  if(job.kind==="all"){const toc=tocAt.map(([t,pn])=>[t,pn?String(pn+1).padStart(2,"0"):""]);REP.insertBefore(cover(D,toc,theme),REP.querySelector(".a4"))}
  const all=$$(".a4",REP);all.forEach((pg,i)=>{const pn=$(".pn",pg);if(pn)pn.innerHTML=`${String(i+1).padStart(2,"0")} <i>/ ${String(all.length).padStart(2,"0")}</i>`});
  document.getAnimations().forEach(a=>{try{if(a.effect&&a.effect.getComputedTiming().iterations===Infinity)a.cancel();else a.finish()}catch(_){try{a.cancel()}catch(__){}}});
  if(theme==="print")toPrint();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return {pages:all.length,overflow:$$(".a4-body",REP).filter(b=>b.scrollHeight>b.clientHeight+2).length}}
window.MKREP={build};
})();
