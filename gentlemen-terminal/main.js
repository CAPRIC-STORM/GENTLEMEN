/* =========================================================
   GENTLEMEN — main.js (RULES PAGE)
   - No autoplay: unlock required
   - UI SFX: ui-click + ui-confirm
   - localStorage: reduceFx, mute, volume, lastSection
   - TOC + search + highlight
========================================================= */

const LS = {
  reduceFx: "gentlemen:reduceFx",
  mute: "gentlemen:mute",
  vol: "gentlemen:vol",
  lastSection: "gentlemen:rules:lastSection"
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ================= Reduce FX ================= */
function setReduceFx(on){
  $("#app")?.classList.toggle("reduceFx", !!on);
  $("#btnReduceEffects")?.setAttribute("aria-pressed", on ? "true" : "false");
  $("#fxState") && ($("#fxState").textContent = on ? "FX: OFF" : "FX: ON");
  localStorage.setItem(LS.reduceFx, on ? "1" : "0");
}
function getReduceFx(){ return localStorage.getItem(LS.reduceFx) === "1"; }

/* ================= Mute/Vol ================= */
function setMute(on){
  $("#btnMute")?.setAttribute("aria-pressed", on ? "true" : "false");
  $("#muteState") && ($("#muteState").textContent = on ? "MUTE: ON" : "MUTE: OFF");
  localStorage.setItem(LS.mute, on ? "1" : "0");
  applyVolumes();
}
function getMute(){ return localStorage.getItem(LS.mute) === "1"; }

function setVol(v01){
  const v = Math.max(0, Math.min(1, v01));
  localStorage.setItem(LS.vol, String(v));
  applyVolumes();
}
function getVol(){
  const raw = localStorage.getItem(LS.vol);
  const v = raw === null ? 0.42 : Number(raw);
  if(Number.isNaN(v)) return 0.42;
  return Math.max(0, Math.min(1, v));
}

/* ================= Strict audio unlock ================= */
let audioUnlocked = false;
const SFX = { click:null, confirm:null };

function createAudio(path){
  const a = new Audio(path);
  a.preload = "auto";
  return a;
}

function applyVolumes(){
  const v = getMute() ? 0 : getVol();
  if(SFX.click) SFX.click.volume = Math.min(1, v * 0.95);
  if(SFX.confirm) SFX.confirm.volume = Math.min(1, v * 1.0);
}

function safePlay(aud){
  if(!audioUnlocked) return;
  if(getMute()) return;
  try{ aud.currentTime = 0; }catch(_){}
  const p = aud.play();
  if(p && typeof p.catch === "function") p.catch(() => {});
}

async function unlockAudio(){
  if(audioUnlocked) return;

  SFX.click = createAudio("assets/audio/ui-click.mp3");
  SFX.confirm = createAudio("assets/audio/ui-confirm.mp3");

  try{
    // warm-up gesture: play silent one time
    SFX.click.volume = 0;
    await SFX.click.play();
    SFX.click.pause();
    SFX.click.currentTime = 0;
    audioUnlocked = true;
  }catch(_){
    audioUnlocked = false;
  }

  const btn = $("#btnUnlockAudio");
  if(btn) btn.disabled = audioUnlocked;

  applyVolumes();
  if(audioUnlocked && SFX.confirm) safePlay(SFX.confirm);
}

function stopAllAudio(){
  [SFX.click, SFX.confirm].forEach(a => {
    if(!a) return;
    try{ a.pause(); }catch(_){}
    try{ a.currentTime = 0; }catch(_){}
  });
}
document.addEventListener("visibilitychange", () => { if(document.hidden) stopAllAudio(); });
window.addEventListener("pagehide", stopAllAudio);

/* SFX wiring */
function wireGlobalSfx(){
  document.addEventListener("click", (e) => {
    const t = e.target;
    if(!(t instanceof Element)) return;

    const interactive = t.closest("button, a, input[type='range']");
    if(!interactive) return;

    const isConfirm =
      interactive.id === "rulesClear" ||
      interactive.id === "btnReduceEffects" ||
      interactive.id === "btnMute" ||
      interactive.id === "btnUnlockAudio" ||
      interactive.classList.contains("tocItem");

    if(isConfirm){
      if(SFX.confirm) safePlay(SFX.confirm);
    } else {
      if(SFX.click) safePlay(SFX.click);
    }
  }, true);
}

/* ================= TOC ================= */
function buildTOC(){
  const toc = $("#rulesToc");
  const sections = $$("#rulesContent .rSection");
  if(!toc || !sections.length) return;

  toc.innerHTML = "";

  sections.forEach((sec, idx) => {
    const title = $(".rTitle", sec)?.textContent?.trim() || `Section ${idx+1}`;
    const id = sec.id || `sec-${idx+1}`;
    sec.id = id;

    const btn = document.createElement("button");
    btn.className = "tocItem";
    btn.type = "button";
    btn.dataset.target = id;
    btn.innerHTML = `
      <div class="t">${title}</div>
      <div class="s mono">Saut direct · ${String(idx+1).padStart(2,"0")}</div>
    `;

    btn.addEventListener("click", () => {
      localStorage.setItem(LS.lastSection, id);
      document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });
      $$("#rulesToc .tocItem").forEach(b => b.classList.toggle("selected", b.dataset.target === id));
    });

    toc.appendChild(btn);
  });

  $("#matchCount") && ($("#matchCount").textContent = `${sections.length}`);

  // restore last selected
  const last = localStorage.getItem(LS.lastSection);
  if(last){
    $$("#rulesToc .tocItem").forEach(b => b.classList.toggle("selected", b.dataset.target === last));
  } else {
    const first = $$("#rulesToc .tocItem")[0];
    if(first) first.classList.add("selected");
  }
}

/* ================= Search + highlight ================= */
function clearHighlights(root){
  $$("mark", root).forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
}

function highlight(root, query){
  if(!query) return;
  const q = query.toLowerCase();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName.toLowerCase();
      if(["script","style","button","input","textarea"].includes(tag)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while(walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    const txt = node.nodeValue;
    const lower = txt.toLowerCase();
    if(!lower.includes(q)) return;

    const frag = document.createDocumentFragment();
    let last = 0;
    while(true){
      const start = lower.indexOf(q, last);
      if(start === -1) break;

      const before = txt.slice(last, start);
      if(before) frag.appendChild(document.createTextNode(before));

      const match = txt.slice(start, start + q.length);
      const mk = document.createElement("mark");
      mk.textContent = match;
      frag.appendChild(mk);

      last = start + q.length;
      if(last >= txt.length) break;
    }
    const after = txt.slice(last);
    if(after) frag.appendChild(document.createTextNode(after));
    node.parentNode.replaceChild(frag, node);
  });
}

function applySearch(query){
  const q = (query || "").trim().toLowerCase();
  const sections = $$("#rulesContent .rSection");

  sections.forEach(sec => clearHighlights(sec));

  if(!q){
    sections.forEach(sec => sec.classList.remove("isHidden"));
    $("#matchCount") && ($("#matchCount").textContent = `${sections.length}`);
    return;
  }

  let visible = 0;
  sections.forEach(sec => {
    const hay = (sec.textContent + " " + (sec.dataset.keywords || "")).toLowerCase();
    const ok = hay.includes(q);
    sec.classList.toggle("isHidden", !ok);
    if(ok){
      visible++;
      highlight(sec, q);
    }
  });

  $("#matchCount") && ($("#matchCount").textContent = `${visible}`);
}

/* ================= Boot ================= */
document.addEventListener("DOMContentLoaded", () => {
  setReduceFx(getReduceFx());

  const volEl = $("#vol");
  if(volEl){
    volEl.value = String(Math.round(getVol() * 100));
    volEl.addEventListener("input", () => setVol(Number(volEl.value)/100));
  }

  setMute(getMute());

  $("#btnUnlockAudio")?.addEventListener("click", unlockAudio);
  $("#btnMute")?.addEventListener("click", () => setMute(!getMute()));
  $("#btnReduceEffects")?.addEventListener("click", () => setReduceFx(!getReduceFx()));

  wireGlobalSfx();
  applyVolumes();

  buildTOC();

  const search = $("#rulesSearch");
  const clear = $("#rulesClear");

  search?.addEventListener("input", () => applySearch(search.value));
  search?.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      search.value = "";
      applySearch("");
    }
  });

  clear?.addEventListener("click", () => {
    if(search) search.value = "";
    applySearch("");
    search?.focus();
  });
});

// Floating Home Dock toggle
(() => {
  const dock = document.getElementById("homeDock");
  const tab = document.getElementById("homeTab");
  const panel = document.getElementById("homePanel");
  if (!dock || !tab || !panel) return;

  function setOpen(open){
    dock.classList.toggle("open", open);
    tab.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
  }

  tab.addEventListener("click", () => {
    const open = !dock.classList.contains("open");
    setOpen(open);
  });

  // Close if click outside
  document.addEventListener("click", (e) => {
    if (!dock.classList.contains("open")) return;
    if (dock.contains(e.target)) return;
    setOpen(false);
  });

  // Close with Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
