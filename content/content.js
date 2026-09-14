"use strict";

const SELECTORS = {
  conversationItem: '[data-test-id="conversation"]',
  conversationTitle: '.title-text',
  optionsButton: '[data-test-id="actions-menu-button"]',
  scrollContainer: 'infinite-scroller',
};

let isRunning = false, deletedCount = 0, errorCount = 0, stopRequested = false;
let delayFactor = 1, baseDelay = 150;
async function loadSettings(){ try{ const s=await browser.storage.local.get({speedFactor:1,baseDelay:150}); delayFactor=s.speedFactor; baseDelay=s.baseDelay; }catch{}}
loadSettings(); browser.storage.onChanged.addListener(c=>{ if(c.speedFactor) delayFactor=c.speedFactor.newValue; if(c.baseDelay) baseDelay=c.baseDelay.newValue; });
const sleep = ms => new Promise(r => setTimeout(r, ms * delayFactor));
const dly = ms => Math.round(ms * delayFactor * (baseDelay/150));

async function waitFor(fn, timeout = 2000, interval = 50) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const r = fn(); if (r) return r; await sleep(interval); }
  return null;
}
function simulateClick(el) {
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  for (const t of ['pointerover','mouseover','pointerenter','mouseenter','pointerdown','mousedown','pointerup','mouseup','click']) {
    el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
  }
}
function findByText(root, tag, texts) {
  const els = root.querySelectorAll(tag + ', button, [role="menuitem"], [role="button"]');
  for (const el of els) {
    const txt = el.textContent.trim().toLowerCase();
    if (texts.some(s => txt.includes(s))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 || el.closest('.cdk-overlay-container')) return el;
    }
  }
  return null;
}
function queryVisible(sel) {
  for (const el of document.querySelectorAll(sel)) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return el; }
  return null;
}
function extractTitle(el, i) {
  const a = el.querySelector('a[aria-label]') || (el.matches('a[aria-label]') ? el : null);
  let raw = a?.getAttribute('aria-label') || el.querySelector('.title-text')?.textContent || el.textContent || '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, 120) || `#${i+1}`;
}

async function scanConversations() {
  const container = document.querySelector('infinite-scroller') || document.querySelector('.overflow-container') || document.querySelector('#sidenav-section-content-chats');
  const items = [], seen = new Set();
  const scrollEl = container;
  if (scrollEl) { scrollEl.scrollTop = 0; await sleep(200); }
  let stable = 0, prev = -1;
  // scroll to bottom until no new items for 3 consecutive checks (virtualized list)
  for (let iter = 0; iter < 80; iter++) {
    document.querySelectorAll(SELECTORS.conversationItem).forEach((el,i) => {
      const t = extractTitle(el,i);
      if (t.length < 2 || /^(new chat|search|images|videos|library)/i.test(t)) return;
      if (!seen.has(t)) { seen.add(t); items.push({ id:`conv-${items.length}`, title:t }); }
    });
    if (!scrollEl) break;
    if (items.length === prev) stable++; else stable = 0;
    if (stable >= 3 && scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 10) break;
    prev = items.length;
    scrollEl.scrollTop = scrollEl.scrollHeight;
    // also dispatch wheel to trigger Angular virtual scroll
    scrollEl.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, bubbles: true }));
    await sleep(280);
  }
  if (scrollEl) scrollEl.scrollTop = 0;
  return items;
}
async function scanLibrary() {
  const items = [];
  document.querySelectorAll('gem-card, [data-test-id="gem-card"]').forEach((el,i) => {
    const t = (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)||`#${i+1}`;
    items.push({ id:`lib-${i}`, title:t });
  });
  return items;
}

async function performDeleteConv(item) {
  await loadSettings();
  item.scrollIntoView({ block:'center' });
  item.dispatchEvent(new MouseEvent('mouseenter', { bubbles:true }));
  await sleep(dly(60));
  let btn = item.querySelector(SELECTORS.optionsButton);
  if (!btn) { await sleep(dly(60)); btn = item.querySelector(SELECTORS.optionsButton); }
  if (!btn) { errorCount++; return false; }
  simulateClick(btn);
  await sleep(dly(150));
  let delBtn = await waitFor(() => {
    const o = document.querySelector('.cdk-overlay-container');
    if (!o) return null;
    return findByText(o, 'button', ['delete','supprimer']) || findByText(document,'button',['delete','supprimer']);
  }, 1200);
  if (!delBtn) { document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); errorCount++; await sleep(100); return false; }
  simulateClick(delBtn);
  await sleep(dly(160));
  let confirm = await waitFor(() => {
    const o = document.querySelector('.cdk-overlay-container') || document;
    const all = [...o.querySelectorAll('button')];
    return all.find(b => /supprimer|delete/i.test(b.textContent) && b.offsetParent) || findByText(o,'button',['supprimer','delete']);
  }, 1200);
  if (!confirm) { document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); errorCount++; return false; }
  simulateClick(confirm);
  deletedCount++;
  await waitFor(() => !document.querySelector('[role="dialog"]'), 1500);
  await sleep(dly(200));
  return true;
}

async function deleteConvByTitle(title) {
  const all = document.querySelectorAll(SELECTORS.conversationItem);
  for (const it of all) if (extractTitle(it,0) === title) return await performDeleteConv(it);
  const first = queryVisible(SELECTORS.conversationItem);
  if (first) return await performDeleteConv(first);
  return false;
}
async function deleteLibByTitle(title){ return false; }

async function startDeletion({ selectedTitles=null, target='conversations'}={}) {
  if (isRunning) return;
  isRunning=true; stopRequested=false; deletedCount=0; errorCount=0;
  showOverlay({ message:'Deleting…', status:'running', showProgress:true, showStop:true, deleted:0, errors:0 });
  if (selectedTitles?.length) {
    for (const t of selectedTitles) { if(stopRequested) break; await deleteConvByTitle(t); updateOverlayStats(); }
  } else {
    let empty=0;
    while(!stopRequested) {
      const item = document.querySelector(SELECTORS.conversationItem);
      if(!item){ if(++empty>=4) break; await sleep(800); } else { empty=0; await performDeleteConv(item); updateOverlayStats(); }
    }
  }
  isRunning=false;
  const msg = stopRequested ? `Stopped — ${deletedCount} deleted` : `Done — ${deletedCount} deleted`;
  showOverlay({ message:msg, status:'done', showProgress:true, showClose:true, deleted:deletedCount, errors:errorCount });
  browser.runtime.sendMessage({ type:'DELETION_COMPLETE', deleted:deletedCount, errors:errorCount }).catch(()=>{});
}

const OVERLAY_ID='gc-overlay';
function getOverlay(){ let el=document.getElementById(OVERLAY_ID); if(!el){ el=document.createElement('div'); el.id=OVERLAY_ID; document.body.appendChild(el);} return el; }
const tx=s=>document.createTextNode(String(s));
function mk(tag,cls,...kids){ const e=document.createElement(tag); if(cls) e.className=cls; kids.forEach(k=>e.appendChild(typeof k==='string'?tx(k):k)); return e; }
function showOverlay(state){
  const o=getOverlay(); if(state.hidden){ o.style.display='none'; return;} o.style.display='';
  while(o.firstChild) o.removeChild(o.firstChild);
  const card=mk('div','gc-card');
  const prog = state.showProgress ? Math.min(100, state.deleted ? 50 : 0) : 0;
  card.appendChild(mk('div','gc-header', mk('span','gc-icon','🗑️'), mk('span','gc-name','Gemini Cleaner')));
  card.appendChild(mk('div',`gc-msg ${state.status}`, state.message));
  if(state.showProgress){
    const bar=mk('div','gc-bar'); const fill=mk('div','gc-bar-fill'); fill.style.width = isRunning ? '100%' : '100%'; bar.appendChild(fill);
    if(isRunning) fill.classList.add('gc-bar-anim');
    card.appendChild(bar);
    const row=mk('div','gc-stats');
    const ds=mk('span',null,'✓ '); ds.appendChild(mk('strong',null,String(state.deleted))); row.appendChild(ds);
    if((state.errors??0)>0){ const es=mk('span',null,'  ⚠ '); es.appendChild(mk('strong',null,String(state.errors))); row.appendChild(es); }
    card.appendChild(row);
  }
  if(state.showStop){ const b=mk('button','gc-btn gc-stop','■ Stop'); b.onclick=()=>{ stopRequested=true; const m=document.querySelector('#gc-overlay .gc-msg'); if(m) m.textContent='Stopping…'; }; card.appendChild(b); }
  if(state.showClose){ const b=mk('button','gc-btn gc-close','Close'); b.onclick=()=>showOverlay({hidden:true}); card.appendChild(b); }
  o.appendChild(card);
}
function updateOverlayStats(){
  const m=document.querySelector('#gc-overlay .gc-msg');
  if(m) m.textContent=`Deleting… (${deletedCount})`;
  const s=document.querySelector('#gc-overlay .gc-stats');
  if(!s) return; while(s.firstChild) s.removeChild(s.firstChild);
  const ds=mk('span',null,'✓ '); ds.appendChild(mk('strong',null,String(deletedCount))); s.appendChild(ds);
  if(errorCount>0){ const es=mk('span',null,'  ⚠ '); es.appendChild(mk('strong',null,String(errorCount))); s.appendChild(es); }
}

browser.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  switch(message.type){
    case 'START_DELETION': startDeletion({ selectedTitles:message.selectedTitles??null, target:message.target??'conversations'}); sendResponse({ok:true}); break;
    case 'SCAN_CONVERSATIONS': scanConversations().then(items=>sendResponse({ok:true,items})).catch(e=>sendResponse({ok:false,error:e.message})); return true;
    case 'SCAN_LIBRARY': scanLibrary().then(items=>sendResponse({ok:true,items})).catch(e=>sendResponse({ok:false,error:e.message})); return true;
    case 'GET_STATUS': sendResponse({isRunning,deletedCount,errorCount,url:location.href}); break;
    case 'STOP_DELETION': stopRequested=true; sendResponse({ok:true}); break;
    default: sendResponse({ok:false});
  }
  return true;
});
