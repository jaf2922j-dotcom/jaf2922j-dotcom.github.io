/* Счётчик посещений: только цифры (без имён, IP и cookie). Данные: abacus.jasoncameron.dev */
(function(){try{
 if(navigator.webdriver)return;                                   // роботы и сборка PDF не считаются
 var ns="jaf2922j-stats",api="https://abacus.jasoncameron.dev/hit/"+ns+"/";
 var p=location.pathname.replace(/index\.html$/,"").replace(/\.html$/,"").replace(/^\/|\/$/g,"")||"home";
 p=p.replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,30);
 var d=new Date(),day=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
 function hit(k){try{fetch(api+k,{mode:"cors",keepalive:true}).catch(function(){})}catch(e){}}
 hit("v-"+p);hit("v-"+p+"-"+day);hit("v-all-"+day);              // просмотры: страница, страница за день, все за день
 var seen=null;try{seen=localStorage.getItem("jds-"+day)}catch(e){}
 if(!seen){try{localStorage.setItem("jds-"+day,"1")}catch(e){}hit("u-all-"+day);hit("u-all")} // уникальные посетители за день
 try{seen=localStorage.getItem("jds-"+p+"-"+day)}catch(e){}
 if(!seen){try{localStorage.setItem("jds-"+p+"-"+day,"1")}catch(e){}hit("u-"+p+"-"+day)}
}catch(e){}})();
