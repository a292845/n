(function(){
const PV={
 chatgpt:{name:'ChatGPT',color:'#10a37f',model:'gpt-4o-mini',url:'https://api.openai.com/v1/chat/completions'},
 claude:{name:'Claude',color:'#d97757',model:'claude-sonnet-5-5'},
 gemini:{name:'Gemini',color:'#4285f4',model:'gemini-2.5-flash'},
 grok:{name:'Grok',color:'#9ca3af',model:'grok-4',url:'https://api.x.ai/v1/chat/completions'}
};
const FREE={chatgpt:'gpt-5-nano',claude:'claude-sonnet-4-6',gemini:'google/gemini-2.5-flash',grok:'x-ai/grok-4-fast'}; /* free via Puter login; edit in the model box if a name stops working */
const IDS=Object.keys(PV),KEY='shixy_ai'; /* keys live in their own storage, NOT in your JSON backups */
let cfg=Object.assign({keys:{},models:{},on:{chatgpt:true,claude:true,gemini:true,grok:true},ctx:false,combiner:'claude'},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>localStorage.setItem(KEY,JSON.stringify(cfg));
const hist={chatgpt:[],claude:[],gemini:[],grok:[]},busy={};
let lastQ='';
function status(){const el=document.getElementById('ai-login-status');if(!el)return;try{el.textContent=window.puter&&puter.auth.isSignedIn()?'Logged in \u2713':'Not logged in yet';}catch(e){}}
if(!window.puter){const sc=document.createElement('script');sc.src='https://js.puter.com/v2/';sc.onload=()=>setTimeout(status,300);document.head.appendChild(sc);}
window.aiLogin=async function(){if(!window.puter){showToast('Puter is still loading. Try again in a moment.','error');return;}try{await puter.auth.signIn();}catch(e){showToast('Login cancelled.','error');}status();};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function ask(p,msgs){
 const k=cfg.keys[p];
 const model=cfg.models[p]||(k?PV[p].model:FREE[p]),m=msgs.filter(x=>!x.err);
 let r,j;
 try{
  if(!k){
   if(!window.puter)throw new Error('Puter did not load. Check your internet and refresh the page.');
   const rr=await puter.ai.chat(m.map(x=>({role:x.role,content:x.text})),{model});
   const c=rr&&rr.message&&rr.message.content;
   return typeof c==='string'?c:Array.isArray(c)?c.map(x=>x.text||'').join(''):String(rr);
  }
  if(p==='claude'){
   r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:1500,messages:m.map(x=>({role:x.role,content:x.text}))})});
   j=await r.json();if(!r.ok)throw new Error(j.error&&j.error.message||r.status);
   return j.content.map(c=>c.text||'').join('');
  }
  if(p==='gemini'){
   r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(k)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:m.map(x=>({role:x.role==='user'?'user':'model',parts:[{text:x.text}]}))})});
   j=await r.json();if(!r.ok)throw new Error(j.error&&j.error.message||r.status);
   return ((j.candidates&&j.candidates[0]&&j.candidates[0].content.parts)||[]).map(x=>x.text||'').join('')||'(empty reply)';
  }
  r=await fetch(PV[p].url,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+k},body:JSON.stringify({model,messages:m.map(x=>({role:x.role,content:x.text}))})});
  j=await r.json();if(!r.ok)throw new Error(j.error&&(j.error.message||j.error)||r.status);
  return j.choices[0].message.content;
 }catch(e){
  const msg=(e&&e.message)||(e&&e.error&&(e.error.message||e.error))||JSON.stringify(e);throw new Error(msg==='Failed to fetch'?'Request blocked (wrong key, no internet, or this provider does not allow direct browser calls).':msg);
 }
}

function ctxText(){
 const pend=state.assignments.filter(a=>a.status!=='completed').slice(0,10).map(a=>a.title+' (due '+a.dueDate+')').join('; ')||'none';
 return 'Context about me (from my student dashboard): courses: '+(state.courses.map(c=>c.code+' '+c.name).join(', ')||'none')+'. Pending tasks: '+pend+'. GPA: '+calculateCumulativeGPA().toFixed(2)+'.';
}

window.aiSend=async function(){
 const box=document.getElementById('ai-input'),q=box.value.trim();if(!q)return;
 const on=IDS.filter(p=>cfg.on[p]);if(!on.length){showToast('Turn on at least one AI.','error');return;}
 if(on.some(p=>!cfg.keys[p])){if(!window.puter){showToast('Puter is still loading. Try again in a moment.','error');return;}if(!puter.auth.isSignedIn()){try{await puter.auth.signIn();}catch(e){showToast('Please log in to use the free AI.','error');return;}status();}}
 box.value='';lastQ=q;
 const full=(cfg.ctx?ctxText()+'\n\n':'')+q;
 on.forEach(p=>{hist[p].push({role:'user',text:full,shown:q});busy[p]=true;});
 render();
 await Promise.all(on.map(async p=>{
  try{hist[p].push({role:'assistant',text:await ask(p,hist[p])});}
  catch(e){hist[p].push({role:'assistant',text:e.message,err:true});}
  busy[p]=false;render();
 }));
};
window.aiCombine=async function(){
 const ans=IDS.filter(p=>cfg.on[p]).map(p=>[p,[...hist[p]].reverse().find(m=>m.role==='assistant'&&!m.err)]).filter(x=>x[1]);
 const out=document.getElementById('ai-combined');
 if(ans.length<2){showToast('Ask a question first and get at least 2 answers.','error');return;}
 out.innerHTML='<p class="text-xs text-gray-400 italic">Combining answers…</p>';
 const prompt='Question: '+lastQ+'\n\n'+ans.map(([p,a])=>'--- '+PV[p].name+' ---\n'+a.text).join('\n\n')+'\n\nMerge these into ONE best answer. Keep what they agree on, briefly flag any disagreements, and remove repetition.';
 try{const t=await ask(cfg.combiner,[{role:'user',text:prompt}]);out.innerHTML=`<p class="text-xs font-bold mb-1" style="color:rgb(var(--blue-600))">Combined answer (merged by ${PV[cfg.combiner].name})</p><div class="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-100">${esc(t)}</div>`;}
 catch(e){out.innerHTML=`<p class="text-xs text-red-500">${esc(e.message)}</p>`;}
};
window.aiClear=()=>{IDS.forEach(p=>hist[p]=[]);document.getElementById('ai-combined').innerHTML='';render();};
window.aiSet=(type,p,v)=>{if(type==='key')cfg.keys[p]=v.trim();else if(type==='model')cfg.models[p]=v.trim();else if(type==='on')cfg.on[p]=v;else if(type==='ctx')cfg.ctx=v;else cfg.combiner=v;save();if(type==='on')render();};

function render(){
 const g=document.getElementById('ai-cols');if(!g)return;
 g.innerHTML=IDS.filter(p=>cfg.on[p]).map(p=>`<div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col"><div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white"><span class="w-2.5 h-2.5 rounded-full" style="background:${PV[p].color}"></span>${PV[p].name}${cfg.keys[p]?'':` <span class="font-normal text-[10px] text-gray-400">via Puter: ${esc(cfg.models[p]||FREE[p])}</span>`}</div><div id="ai-col-${p}" class="p-3 space-y-2 overflow-y-auto max-h-[420px] min-h-[160px] text-xs">${hist[p].length?'':'<p class="text-gray-400 italic">No messages yet.</p>'}${hist[p].map(m=>m.role==='user'?`<div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">${esc(m.shown||m.text)}</div>`:`<div class="whitespace-pre-wrap leading-relaxed ${m.err?'text-red-500':'text-gray-800 dark:text-gray-100'}">${esc(m.text)}</div>`).join('')}${busy[p]?'<p class="text-gray-400 italic">Thinking…</p>':''}</div></div>`).join('');
 IDS.forEach(p=>{const c=document.getElementById('ai-col-'+p);if(c)c.scrollTop=c.scrollHeight;});
}

const _tab=switchTab;
window.switchTab=function(id){_tab(id);if(id==='ai'){document.getElementById('page-title').textContent='AI Hub';render();status();}};

document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('nav-settings').insertAdjacentHTML('beforebegin',`<button onclick="switchTab('ai')" id="nav-ai" class="nav-item w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"><i class="fa-solid fa-robot w-5 text-center"></i><span>AI Hub</span></button>`);
 const inp='w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg',card='bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700';
 const rows=IDS.map(p=>`<div class="grid grid-cols-12 gap-2 items-center"><label class="col-span-12 sm:col-span-2 flex items-center gap-2 font-bold"><input type="checkbox" ${cfg.on[p]?'checked':''} onchange="aiSet('on','${p}',this.checked)"><span style="color:${PV[p].color}">${PV[p].name}</span></label><input type="password" autocomplete="off" placeholder="Your own paid key (optional)" value="${esc(cfg.keys[p]||'')}" onchange="aiSet('key','${p}',this.value)" class="col-span-7 sm:col-span-6 ${inp}"><input type="text" value="${esc(cfg.models[p]||'')}" placeholder="${PV[p].model} / free: ${FREE[p]}" onchange="aiSet('model','${p}',this.value)" title="Model name" class="col-span-5 sm:col-span-4 ${inp} font-mono"></div>`).join('');
 document.querySelector('main').insertAdjacentHTML('beforeend',`
 <section id="view-ai" class="view-panel hidden space-y-4">
  <details class="${card} text-xs" ${Object.keys(cfg.keys).some(k=>cfg.keys[k])?'':'open'}><summary class="cursor-pointer font-bold text-sm text-gray-800 dark:text-white">AI setup: API keys &amp; models</summary>
   <div class="mt-4 space-y-3"><div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2"><p class="font-bold text-gray-800 dark:text-white">Free login (no API keys needed)</p><div class="flex items-center gap-3"><button onclick="aiLogin()" class="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Log in with Puter</button><span id="ai-login-status" class="text-gray-500 dark:text-gray-400"></span></div><p class="text-gray-500 dark:text-gray-400">One free Puter account powers all four columns. Usage is covered by your own Puter account, and new accounts get free credits.</p></div>${rows}
    <p class="text-gray-500 dark:text-gray-400">With no key, each column runs through your Puter login. Model names change often, so edit a model box if one stops working. If you paste your own paid key in a row, that column uses it directly instead. Keys are saved only in this browser, not in your JSON backups. Do not use this on a shared computer.</p>
    <div class="flex flex-wrap items-center gap-4"><label class="flex items-center gap-2">Merge answers with <select onchange="aiSet('comb',0,this.value)" class="${inp} w-auto">${IDS.map(p=>`<option value="${p}" ${cfg.combiner===p?'selected':''}>${PV[p].name}</option>`).join('')}</select></label><label class="flex items-center gap-2"><input type="checkbox" ${cfg.ctx?'checked':''} onchange="aiSet('ctx',0,this.checked)"> Share my courses, tasks &amp; GPA with the AIs</label></div></div></details>
  <div class="${card} space-y-3"><textarea id="ai-input" rows="3" placeholder="Ask all your AIs at once…  (Ctrl+Enter to send)" onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey))aiSend()" class="${inp} text-sm"></textarea>
   <div class="flex flex-wrap gap-2 text-xs font-semibold"><button onclick="aiSend()" class="px-4 py-2 bg-blue-600 text-white rounded-lg"><i class="fa-solid fa-paper-plane mr-1"></i>Ask all</button><button onclick="aiCombine()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg"><i class="fa-solid fa-code-merge mr-1"></i>Combine into 1 answer</button><button onclick="aiClear()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">Clear chat</button></div></div>
  <div id="ai-combined" class="${card.replace('p-5','p-0')} empty:hidden [&:not(:empty)]:p-5"></div>
  <div id="ai-cols" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></div>
 </section>`);
 render();
});
})();
