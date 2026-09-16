"use strict";

const GEMINI = "https://gemini.google.com";

const $ = id => document.getElementById(id);

const state = {
  tab: "conv",
  conversations: [],
  library: [],
  selectedConv: new Set(),
  selectedLib: new Set(),
  isRunning: false,
};

let activeTabId = null;

async function relay(msg) {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab?.id;
    if (!activeTabId) return { ok: false, error: "No active tab" };
    if (tab.status !== "complete") return { ok: false, error: "Page still loading" };
    return await browser.tabs.sendMessage(activeTabId, { ...msg, target: "content" });
  } catch (e) {
    return { ok: false, error: e.message || "Connection lost" };
  }
}

async function relayWithRetry(msg, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const r = await relay(msg);
    if (r?.ok || !r?.error?.includes("Connection lost")) return r;
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return await relay(msg);
}

function showStatus(text, type) {
  const bar = $("status-bar");
  bar.textContent = text;
  bar.className = `status-bar ${type}`;
  bar.classList.remove("hidden");
}

function hideStatus() {
  $("status-bar").classList.add("hidden");
}

function setRunning(running) {
  state.isRunning = running;
  $("btn-stop").classList.toggle("hidden", !running);
  for (const id of ["btn-del-sel-conv","btn-del-all-conv","btn-del-sel-lib","btn-del-all-lib","btn-scan-conv","btn-scan-lib"]) {
    $(id).disabled = running;
  }
}

function mk(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function renderList(type) {
  const items   = type === "conv" ? state.conversations : state.library;
  const sel     = type === "conv" ? state.selectedConv  : state.selectedLib;
  const listEl  = $(`${type}-list`);
  const delBtn  = $(`btn-del-sel-${type}`);

  while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

  if (items.length === 0) {
    const p = mk("p", "placeholder");
    p.textContent = type === "conv"
      ? "No conversations found."
      : "No items. Open Gemini Library then click Scan.";
    listEl.appendChild(p);
    delBtn.disabled = true;
    delBtn.textContent = "Delete selected";
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const label = mk("label", "item-row");

    const cb = mk("input");
    cb.type = "checkbox";
    cb.className = "item-cb";
    cb.checked = sel.has(item.id);
    cb.addEventListener("change", () => {
      if (cb.checked) sel.add(item.id);
      else            sel.delete(item.id);
      refreshDelBtn(type);
    });

    const span = mk("span", "item-title");
    span.textContent = item.title;

    label.appendChild(cb);
    label.appendChild(span);
    frag.appendChild(label);
  });

  listEl.appendChild(frag);
  refreshDelBtn(type);
}

function refreshDelBtn(type){
  const sel=type==="conv"?state.selectedConv:state.selectedLib;
  const btn=$(`btn-del-sel-${type}`);
  const n=sel.size; btn.disabled=n===0;
  btn.textContent=n>0?`Delete selected (${n})`:`Delete selected`;
  const c=$(`count-${type}`); if(c) c.textContent=state[type==="conv"?"conversations":"library"].length?`${n}/${state[type==="conv"?"conversations":"library"].length} selected`:"";
}

function selectAll(type) {
  const items = type === "conv" ? state.conversations : state.library;
  const sel   = type === "conv" ? state.selectedConv  : state.selectedLib;
  items.forEach(i => sel.add(i.id));
  renderList(type);
}

function selectNone(type) {
  const sel = type === "conv" ? state.selectedConv : state.selectedLib;
  sel.clear();
  renderList(type);
}

async function scanConversations() {
  showStatus("Scanning conversations…", "running");
  try {
    const r = await relayWithRetry({ type: "SCAN_CONVERSATIONS" });
    if (r?.ok) {
      state.conversations = r.items;
      state.selectedConv.clear();
      renderList("conv");
      hideStatus();
    } else {
      showStatus(r?.error ?? "Scan failed.", "error");
    }
  } catch (e) {
    showStatus(e.message, "error");
  }
}

async function scanLibrary() {
  showStatus("Scanning library…", "running");
  try {
    const r = await relayWithRetry({ type: "SCAN_LIBRARY" });
    if (r?.ok) {
      state.library = r.items;
      state.selectedLib.clear();
      renderList("lib");
      hideStatus();
    } else {
      showStatus(r?.error ?? "Scan failed.", "error");
    }
  } catch (e) {
    showStatus(e.message, "error");
  }
}

async function deleteSelected(type) {
  const items = type === "conv" ? state.conversations : state.library;
  const sel   = type === "conv" ? state.selectedConv  : state.selectedLib;
  const titles = items.filter(i => sel.has(i.id)).map(i => i.title);
  if (titles.length === 0) return;
  setRunning(true);
  showStatus(`Deleting ${titles.length} item${titles.length>1?"s":""}…`, "running");
  try {
    await relayWithRetry({ type: "START_DELETION", selectedTitles: titles, target: type === "conv" ? "conversations" : "library" });
    showStatus("Deletion started — see overlay on page.", "running");
  } catch (e) { showStatus(e.message,"error"); setRunning(false); }
}
async function deleteAll(type) {
  setRunning(true);
  showStatus(`Deleting all ${type==="conv"?"chats":"library"}…`, "running");
  try {
    await relayWithRetry({ type: "START_DELETION", selectedTitles: null, target: type === "conv" ? "conversations" : "library" });
    showStatus("Deletion started — see overlay on page.", "running");
  } catch (e) { showStatus(e.message,"error"); setRunning(false); }
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  $("pane-conv").classList.toggle("hidden", tab !== "conv");
  $("pane-lib").classList.toggle("hidden",  tab !== "lib");
}

async function initSettings(){
  const s=await browser.storage.local.get({speedFactor:1,baseDelay:150});
  $("sel-speed").value=String(s.speedFactor); $("rng-delay").value=s.baseDelay; $("lbl-delay").textContent=s.baseDelay+"ms";
  $("sel-speed").addEventListener("change",e=> browser.storage.local.set({speedFactor:parseFloat(e.target.value)}));
  $("rng-delay").addEventListener("input",e=>{ $("lbl-delay").textContent=e.target.value+"ms"; browser.storage.local.set({baseDelay:parseInt(e.target.value)}); });
  $("btn-settings").addEventListener("click",()=> $("settings-panel").classList.toggle("hidden"));
}
async function init() {
  $("ver").textContent = `v${browser.runtime.getManifest().version}`;
  initSettings();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const onGemini = tab?.url?.startsWith(GEMINI) ?? false;

  if (!onGemini) {
    $("wrong-page").classList.remove("hidden");
    return;
  }

  $("main").classList.remove("hidden");

  try {
    const status = await relayWithRetry({ type: "GET_STATUS" });
    if (status?.isRunning) { setRunning(true); showStatus("Deleting…", "running"); }
  } catch (_) {}
  const saved = await browser.storage.local.get("lastRun").catch(()=>({}));
  if (saved?.lastRun) {
    const { deleted, errors } = saved.lastRun;
    if (deleted>0) showStatus(`Last run: ${deleted} deleted${errors>0?`, ${errors} failed`:''}.`, "success");
  }
}

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

$("btn-go").addEventListener("click", () => { browser.tabs.create({ url: GEMINI }); window.close(); });
$("btn-scan-conv").addEventListener("click", scanConversations);
$("btn-scan-lib").addEventListener("click", scanLibrary);
$("btn-all-conv").addEventListener("click", () => selectAll("conv"));
$("btn-none-conv").addEventListener("click", () => selectNone("conv"));
$("btn-all-lib").addEventListener("click", () => selectAll("lib"));
$("btn-none-lib").addEventListener("click", () => selectNone("lib"));
$("btn-del-sel-conv").addEventListener("click", () => deleteSelected("conv"));
$("btn-del-all-conv").addEventListener("click", () => deleteAll("conv"));
$("btn-del-sel-lib").addEventListener("click", () => deleteSelected("lib"));
$("btn-del-all-lib").addEventListener("click", () => deleteAll("lib"));
$("btn-stop").addEventListener("click", async () => {
  try { await relayWithRetry({ type: "STOP_DELETION" }); showStatus("Stopping…", "running"); } catch(_){}
});
browser.runtime.onMessage.addListener(msg => {
  if (msg.type === "DELETION_COMPLETE") {
    setRunning(false);
    showStatus(`Done — ${msg.deleted} deleted${msg.errors>0?`, ${msg.errors} failed`:''}.`, "success");
    state.conversations=[]; state.library=[]; renderList(state.tab==="conv"?"conv":"lib");
  }
});

init().catch(console.error);
