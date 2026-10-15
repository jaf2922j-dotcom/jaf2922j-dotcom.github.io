/* JD Works: shared effects for every page */
(function(){
  var d=document, root=d.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* intro splash, once per browser session */
  var seen=false; try{seen=sessionStorage.getItem('jdIntro')==='1';sessionStorage.setItem('jdIntro','1');}catch(e){}
  if(!seen && !reduce){
    var it=d.createElement('div'); it.id='intro';
    it.innerHTML='<div class="in-w"><b>JD</b><i></i><span>WORKS</span><em>Жафархон Дехканов</em></div>';
    d.body.appendChild(it); root.classList.add('intro-on');
    setTimeout(function(){it.classList.add('out');root.classList.remove('intro-on');},1650);
    setTimeout(function(){it.remove();},2500);
  }

  /* scroll progress bar */
  var bar=d.createElement('div'); bar.id='prog'; d.body.appendChild(bar);
  var tick=false;
  function onScroll(){ if(tick)return; tick=true; requestAnimationFrame(function(){
    var h=root.scrollHeight-innerHeight; bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')'; tick=false; }); }
  addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* hero / page-head entrance */
  var off=(!seen&&!reduce)?1300:0;
  d.querySelectorAll('.hero>div>*,.hero>.pf,.ph>*:not(div),.ph>div>*,.ph>.pf').forEach(function(e,i){
    e.classList.add('rv','hd'); e.style.setProperty('--dl',(off+i*90)+'ms'); });

  /* staggered reveal */
  var groups=new Map();
  d.querySelectorAll('.rv:not(.hd)').forEach(function(e){
    var p=e.parentElement, n=groups.get(p)||0; groups.set(p,n+1);
    e.style.setProperty('--dl',Math.min(n,8)*70+'ms');
  });
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
  });},{rootMargin:'0px 0px -6% 0px'});
  d.querySelectorAll('.rv').forEach(function(e){io.observe(e);});

  /* count-up numbers */
  function fmt(n,grp){ var s=String(n); return grp? s.replace(/\B(?=(\d{3})+(?!\d))/g,' '):s; }
  var cio=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return; cio.unobserve(e.target);
    var el=e.target, t=el.textContent, m=t.match(/^(\D*)(\d[\d\s ]*)(.*)$/);
    if(!m||reduce)return;
    var target=parseInt(m[2].replace(/\D/g,''),10), grp=/[\s ]/.test(m[2]), t0=performance.now(), dur=1400;
    (function step(now){ var k=Math.min(1,(now-t0)/dur), v=Math.round(target*(1-Math.pow(1-k,4)));
      el.textContent=m[1]+fmt(v,grp)+m[3]; if(k<1)requestAnimationFrame(step); else el.textContent=t; })(t0);
  });},{threshold:.4});
  d.querySelectorAll('.kpi b, .fk b').forEach(function(e){cio.observe(e);});

  /* 60 -> 6 people visual */
  d.querySelectorAll('.dots').forEach(function(box){
    var n=+box.dataset.n||60, k=+box.dataset.k||6, h='';
    for(var i=0;i<n;i++) h+='<i style="--i:'+i+'"></i>';
    box.innerHTML=h; var dots=box.children, keep=[0,11,22,33,44,55];
    for(var j=0;j<keep.length&&j<k;j++) dots[keep[j]].className='k';
    new IntersectionObserver(function(es,o){ if(es[0].isIntersecting){ box.classList.add('go'); o.disconnect(); } },{threshold:.5}).observe(box);
  });

  /* spotlight + tilt on cards */
  var sp=d.querySelectorAll('.card,.tile,.fx,.pj,.gal figure,.sl figure,.kpi');
  sp.forEach(function(el){
    el.classList.add('sp');
    if(!fine)return;
    var tilt=el.matches('.tile,.pj,.fx');
    el.addEventListener('pointermove',function(ev){
      var r=el.getBoundingClientRect(), x=ev.clientX-r.left, y=ev.clientY-r.top;
      el.style.setProperty('--mx',x+'px'); el.style.setProperty('--my',y+'px');
      if(tilt&&!reduce){ var rx=((y/r.height)-.5)*-5, ry=((x/r.width)-.5)*6;
        el.style.transform='perspective(1000px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-3px)'; }
    });
    el.addEventListener('pointerleave',function(){ if(tilt) el.style.transform=''; });
  });

  /* magnetic buttons */
  if(fine&&!reduce) d.querySelectorAll('.bt,.tabs a').forEach(function(b){
    b.addEventListener('pointermove',function(ev){ var r=b.getBoundingClientRect();
      b.style.transform='translate('+((ev.clientX-r.left-r.width/2)*.18)+'px,'+((ev.clientY-r.top-r.height/2)*.25)+'px)'; });
    b.addEventListener('pointerleave',function(){ b.style.transform=''; });
  });

  /* ambient light follows the cursor */
  if(fine&&!reduce){ var gx=0,gy=0,raf=0;
    addEventListener('pointermove',function(ev){ gx=ev.clientX; gy=ev.clientY; if(!raf) raf=requestAnimationFrame(function(){
      root.style.setProperty('--gx',gx+'px'); root.style.setProperty('--gy',gy+'px'); raf=0; }); },{passive:true}); }

  /* smooth page transitions between tabs */
  d.addEventListener('click',function(ev){
    var a=ev.target.closest('a'); if(!a||reduce||ev.defaultPrevented||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
    var href=a.getAttribute('href')||''; if(a.target||a.hasAttribute('download')||!/\.html(#.*)?$/.test(href)||/^https?:/.test(href))return;
    ev.preventDefault(); root.classList.add('leaving'); setTimeout(function(){ location.href=href; },260);
  });
  addEventListener('pageshow',function(e){ if(e.persisted) root.classList.remove('leaving'); });

  var on=d.querySelector('.tabs .on'); if(on) on.scrollIntoView({inline:'center',block:'nearest'});
})();
