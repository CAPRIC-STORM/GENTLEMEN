/* Lumia Island Map — Click-only / Global View (Districts only)
   - No hover highlight (labels + highlight only on click / right panel)
   - Global view shows ONLY district labels
   - Routes clickable + searchable
   - Audio unlock via INITIALISER (no autoplay)
*/

const state = {
  data: null,
  selected: { kind: null, id: null }, // "poi" | "route" | "district"
  reduceEffects: false,
  uiSound: true,
  volume: 0.35,
  audioUnlocked: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  drag: { on: false, x0: 0, y0: 0, panX0: 0, panY0: 0 },
  globalView: false
};

const els = {
  boot: document.getElementById("boot"),
  btnInit: document.getElementById("btnInit"),
  btnNoFx: document.getElementById("btnNoFx"),
  btnCenter: document.getElementById("btnCenter"),
  btnGlobal: document.getElementById("btnGlobal"),
  btnSound: document.getElementById("btnSound"),
  vol: document.getElementById("vol"),

  mapSvg: document.getElementById("mapSvg"),
  world: document.getElementById("world"),
  mapViewport: document.getElementById("mapViewport"),
  districtLayer: document.getElementById("districtLayer"),
  routeLayer: document.getElementById("routeLayer"),
  poiLayer: document.getElementById("poiLayer"),

  hudZoom: document.getElementById("hudZoom"),
  hudFocus: document.getElementById("hudFocus"),

  search: document.getElementById("search"),
  resultList: document.getElementById("resultList"),
  districtList: document.getElementById("districtList"),
  card: document.getElementById("card")
};

// Audio
const sounds = {
  click: new Audio("./assets/audio/ui_click.mp3"),
  ok: new Audio("./assets/audio/ui_ok.mp3"),
  warn: new Audio("./assets/audio/ui_warn.mp3")
};

function applySoundSettings(){
  Object.values(sounds).forEach(a => {
    a.preload = "auto";
    a.volume = state.volume;
  });
  els.vol.value = String(state.volume);
  els.btnSound.setAttribute("aria-pressed", String(state.uiSound));
  els.btnSound.textContent = state.uiSound ? "🔊" : "🔇";
}

function safePlay(aud){
  if(!state.uiSound) return;
  if(!state.audioUnlocked) return;
  try{
    aud.currentTime = 0;
    const p = aud.play();
    if(p && typeof p.catch === "function") p.catch(()=>{});
  } catch {}
}

function unlockAudio(){
  if(state.audioUnlocked) return;
  state.audioUnlocked = true;
  try{
    const a = sounds.click;
    a.currentTime = 0;
    const p = a.play();
    if(p && typeof p.then === "function"){
      p.then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{});
    }
  } catch {}
}

// Prefs
function loadPrefs(){
  try{
    const reduce = localStorage.getItem("reduceEffects");
    if(reduce !== null) state.reduceEffects = (reduce === "1");
    const uiSound = localStorage.getItem("uiSound");
    if(uiSound !== null) state.uiSound = (uiSound === "1");
    const vol = localStorage.getItem("uiVol");
    if(vol !== null){
      const n = Number(vol);
      if(!Number.isNaN(n)) state.volume = Math.max(0, Math.min(1, n));
    }
    const gv = localStorage.getItem("globalView");
    if(gv !== null) state.globalView = (gv === "1");
  } catch {}
}
function savePrefs(){
  try{
    localStorage.setItem("reduceEffects", state.reduceEffects ? "1" : "0");
    localStorage.setItem("uiSound", state.uiSound ? "1" : "0");
    localStorage.setItem("uiVol", String(state.volume));
    localStorage.setItem("globalView", state.globalView ? "1" : "0");
  } catch {}
}
function applyReduceEffects(){
  document.body.classList.toggle("reduce-effects", state.reduceEffects);
}
function applyGlobalView(){
  // CSS handles: global-view shows ONLY district labels
  document.body.classList.toggle("global-view", state.globalView);
  els.btnGlobal.setAttribute("aria-pressed", String(state.globalView));
  els.btnGlobal.textContent = state.globalView ? "VUE GLOBALE ✓" : "VUE GLOBALE";
}

// Helpers
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setCard(title, bodyHtml){
  els.card.innerHTML = `
    <div class="cardTitle">${escapeHtml(title)}</div>
    <div class="cardBody">${bodyHtml}</div>
  `;
}

function setZoomHud(){
  els.hudZoom.textContent = `${Math.round(state.zoom * 100)}%`;
}

function setFocusHud(text){
  els.hudFocus.textContent = text ? text : "Aucun";
  if(text) els.hudFocus.classList.remove("muted");
  else els.hudFocus.classList.add("muted");
}

function applyWorldTransform(){
  els.world.setAttribute("transform", `translate(${state.pan.x} ${state.pan.y}) scale(${state.zoom})`);
  setZoomHud();
}

// SVG helpers
function clientToSvg(clientX, clientY){
  const pt = els.mapSvg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = els.mapSvg.getScreenCTM();
  if(!ctm) return { x: 0, y: 0 };
  const inv = ctm.inverse();
  const p = pt.matrixTransform(inv);
  return { x: (p.x - state.pan.x) / state.zoom, y: (p.y - state.pan.y) / state.zoom };
}
function svgEl(tag){
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}
function makePathD(points){
  if(!points || points.length < 2) return "";
  return points.map((p,i)=> `${i===0?"M":"L"} ${p[0]},${p[1]}`).join(" ");
}

// Data lookup
function getDistrict(id){ return (state.data.districts || []).find(d => d.id === id); }
function getPoi(id){ return (state.data.locations || []).find(l => l.id === id); }
function getRoute(id){ return (state.data.routes || []).find(r => r.id === id); }

// Selection
function clearAllSelected(){
  document.querySelectorAll(".poiGroup.selected").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".routeGroup.selected").forEach(n => n.classList.remove("selected"));
  document.querySelectorAll(".districtGroup.selected").forEach(n => n.classList.remove("selected"));
  state.selected.kind = null;
  state.selected.id = null;
}
function select(kind, id){
  clearAllSelected();
  state.selected.kind = kind;
  state.selected.id = id;

  if(kind === "poi"){
    const node = document.querySelector(`.poiGroup[data-poi="${CSS.escape(id)}"]`);
    if(node) node.classList.add("selected");
  }
  if(kind === "route"){
    const node = document.querySelector(`.routeGroup[data-route="${CSS.escape(id)}"]`);
    if(node) node.classList.add("selected");
  }
  if(kind === "district"){
    const node = document.querySelector(`.districtGroup[data-district="${CSS.escape(id)}"]`);
    if(node) node.classList.add("selected");
  }
}

// Render districts
function renderDistricts(){
  els.districtLayer.innerHTML = "";
  const shapes = state.data.districtShapes || [];

  shapes.forEach(s => {
    const d = getDistrict(s.id);
    if(!d) return;

    const g = svgEl("g");
    g.classList.add("districtGroup");
    g.dataset.district = d.id;

    const p = svgEl("path");
    p.setAttribute("d", s.path);
    p.setAttribute("class", "districtShape");

    const label = svgEl("text");
    label.setAttribute("class", "mapLabel districtLabel");
    label.setAttribute("x", d.label?.x ?? 0);
    label.setAttribute("y", d.label?.y ?? 0);
    label.textContent = d.name;

    p.addEventListener("click", (e) => {
      e.stopPropagation();
      select("district", d.id);
      openDistrictFolder(d.id);
      setCard(`Territoire // ${d.name}`, `<span class="muted">${escapeHtml(d.function)}</span>`);
      setFocusHud(d.name);
      safePlay(sounds.ok);
    });

    g.appendChild(p);
    g.appendChild(label);
    els.districtLayer.appendChild(g);
  });
}

// Render routes (clickable with hitbox)
function renderRoutes(){
  els.routeLayer.innerHTML = "";
  const routes = state.data.routes || [];

  routes.forEach(r => {
    const g = svgEl("g");
    g.classList.add("routeGroup");
    g.dataset.route = r.id;
    g.classList.add(r.kind === "rail" ? "rail" : "road");

    const onPick = () => {
      select("route", r.id);
      setCard(`Infrastructure // ${r.name}`, `<span class="muted">${escapeHtml(r.desc || "")}</span>`);
      setFocusHud(r.name);
      safePlay(sounds.click);
    };

    const addStroke = (d) => {
      const casing = svgEl("path");
      casing.setAttribute("class","casing");
      casing.setAttribute("d", d);

      const main = svgEl("path");
      main.setAttribute("class","main");
      main.setAttribute("d", d);

      const hit = svgEl("path");
      hit.setAttribute("class","routeHit");
      hit.setAttribute("d", d);
      hit.setAttribute("stroke-width", "18");
      hit.addEventListener("click", (e) => { e.stopPropagation(); onPick(); });

      g.appendChild(casing);
      g.appendChild(main);
      g.appendChild(hit);
    };

    if(r.id === "axis_cross" && Array.isArray(r.segments)){
      r.segments.forEach(seg => addStroke(makePathD(seg.points)));
    } else if(r.id === "rail_ring" && Array.isArray(r.points)){
      addStroke(makePathD(r.points));
    }

    const label = svgEl("text");
    label.setAttribute("class","mapLabel routeLabel");
    label.setAttribute("x", r.label?.x ?? 0);
    label.setAttribute("y", r.label?.y ?? 0);
    label.textContent = r.name;
    label.addEventListener("click", (e) => { e.stopPropagation(); onPick(); });

    g.appendChild(label);
    els.routeLayer.appendChild(g);
  });
}

// Render POIs
function renderPOIs(){
  els.poiLayer.innerHTML = "";
  const locs = state.data.locations || [];

  locs.forEach(loc => {
    const g = svgEl("g");
    g.classList.add("poiGroup");
    g.dataset.poi = loc.id;

    const dot = svgEl("circle");
    dot.setAttribute("cx", loc.x);
    dot.setAttribute("cy", loc.y);
    dot.setAttribute("r", "4");
    dot.setAttribute("class","poiDot");

    const hit = svgEl("circle");
    hit.setAttribute("cx", loc.x);
    hit.setAttribute("cy", loc.y);
    hit.setAttribute("r", "14");
    hit.setAttribute("class","poiHit");

    const label = svgEl("text");
    label.setAttribute("x", loc.x + 12);
    label.setAttribute("y", loc.y - 12);
    label.setAttribute("class", "mapLabel poiLabel");
    label.textContent = loc.name;

    const onPick = () => {
      select("poi", loc.id);
      openDistrictFolder(loc.district);

      const d = getDistrict(loc.district);
      const links = (loc.links || []).map(id => getPoi(id)?.name).filter(Boolean);

      setCard(`${loc.name}`, `
        <div class="muted">${escapeHtml(d ? d.name : "Territoire inconnu")} • ${escapeHtml(loc.type)}</div>
        <div style="margin-top:8px;">${escapeHtml(loc.desc || "")}</div>
        ${links.length ? `<div style="margin-top:10px;" class="muted">Connexions :</div>
          <ul style="margin:6px 0 0 18px; padding:0;">
            ${links.map(n => `<li>${escapeHtml(n)}</li>`).join("")}
          </ul>` : ""}
      `);

      setFocusHud(loc.name);
      safePlay(sounds.ok);
    };

    hit.addEventListener("click", (e) => { e.stopPropagation(); onPick(); });
    label.addEventListener("click", (e) => { e.stopPropagation(); onPick(); });

    g.appendChild(dot);
    g.appendChild(hit);
    g.appendChild(label);
    els.poiLayer.appendChild(g);
  });
}

// District folders
function buildDistrictFolders(){
  els.districtList.innerHTML = "";
  const locs = state.data.locations || [];

  (state.data.districts || []).forEach(d => {
    const list = locs.filter(l => l.district === d.id).sort((a,b)=>a.name.localeCompare(b.name));

    const wrap = document.createElement("div");
    wrap.className = "folder";
    wrap.dataset.district = d.id;

    wrap.innerHTML = `
      <div class="folderHead">
        <div>
          <div class="folderName">${escapeHtml(d.name)}</div>
          <div class="folderFn">${escapeHtml(d.function)}</div>
        </div>
        <div class="folderMeta">${list.length} lieux</div>
      </div>
      <div class="folderBody">
        ${list.map(loc => `
          <div class="poiItem" data-kind="poi" data-id="${escapeHtml(loc.id)}">
            <div>
              <div class="poiName">${escapeHtml(loc.name)}</div>
              <div class="poiType">${escapeHtml(loc.type)}</div>
            </div>
            <div class="poiTiny">↗</div>
          </div>
        `).join("")}
      </div>
    `;

    wrap.querySelector(".folderHead").addEventListener("click", () => {
      const wasOpen = wrap.classList.contains("open");
      document.querySelectorAll(".folder.open").forEach(x => x.classList.remove("open"));
      if(!wasOpen) wrap.classList.add("open");

      select("district", d.id);
      setCard(`Territoire // ${d.name}`, `<span class="muted">${escapeHtml(d.function)}</span>`);
      setFocusHud(d.name);
      safePlay(sounds.click);
    });

    wrap.querySelectorAll(".poiItem").forEach(el => {
      el.addEventListener("click", () => pickFromIndex(el.dataset.kind, el.dataset.id));
    });

    els.districtList.appendChild(wrap);
  });
}

function openDistrictFolder(id){
  const folder = [...document.querySelectorAll(".folder")].find(f => f.dataset.district === id);
  if(!folder) return;
  document.querySelectorAll(".folder.open").forEach(x => x.classList.remove("open"));
  folder.classList.add("open");
}

// SEARCH INDEX: POIs + ROUTES
let SEARCH_INDEX = [];

function buildSearchIndex(){
  const items = [];

  (state.data.routes || []).forEach(r => {
    items.push({
      kind: "route",
      id: r.id,
      name: r.name,
      type: r.kind === "rail" ? "rail" : "road",
      desc: r.desc || ""
    });
  });

  (state.data.locations || []).forEach(l => {
    items.push({
      kind: "poi",
      id: l.id,
      name: l.name,
      type: l.type || "",
      desc: l.desc || ""
    });
  });

  return items;
}

function searchIndex(q){
  const query = (q || "").trim().toLowerCase();
  if(!query) return [];
  const out = SEARCH_INDEX.filter(it => {
    const name = it.name.toLowerCase();
    const desc = it.desc.toLowerCase();
    const type = it.type.toLowerCase();
    return name.includes(query) || desc.includes(query) || type.includes(query);
  });
  return out.slice(0, 60);
}

function renderResults(list, q){
  if(!q || !q.trim()){
    els.resultList.classList.add("muted");
    els.resultList.innerHTML = "Tape pour filtrer (lieux + routes).";
    return;
  }
  if(!list.length){
    els.resultList.classList.add("muted");
    els.resultList.innerHTML = "Aucun résultat.";
    return;
  }

  els.resultList.classList.remove("muted");
  els.resultList.innerHTML = `
    <div class="muted" style="margin-bottom:8px;">${list.length} résultat(s)</div>
    ${list.map(it => `
      <div class="poiItem" data-kind="${escapeHtml(it.kind)}" data-id="${escapeHtml(it.id)}">
        <div>
          <div class="poiName">${escapeHtml(it.name)}</div>
          <div class="poiType">${escapeHtml(it.kind === "route" ? (it.type === "rail" ? "route • rail" : "route • road") : it.type)}</div>
        </div>
        <div class="poiTiny">↗</div>
      </div>
    `).join("")}
  `;
}

function pickFromIndex(kind, id){
  if(kind === "poi"){
    const hit = document.querySelector(`.poiGroup[data-poi="${CSS.escape(id)}"] .poiHit`);
    if(hit) hit.dispatchEvent(new MouseEvent("click", { bubbles:true }));
    return;
  }
  if(kind === "route"){
    const r = getRoute(id);
    if(!r) return;
    select("route", id);
    setCard(`Infrastructure // ${r.name}`, `<span class="muted">${escapeHtml(r.desc || "")}</span>`);
    setFocusHud(r.name);
    safePlay(sounds.click);
    return;
  }
}

function bindResultClicks(){
  els.resultList.addEventListener("click", (e) => {
    const row = e.target.closest(".poiItem");
    if(!row) return;
    pickFromIndex(row.dataset.kind, row.dataset.id);
  });
}

// Pan/Zoom
function bindPanZoom(){
  els.mapSvg.addEventListener("pointerdown", (e) => {
    els.mapSvg.setPointerCapture(e.pointerId);
    state.drag.on = true;
    state.drag.x0 = e.clientX;
    state.drag.y0 = e.clientY;
    state.drag.panX0 = state.pan.x;
    state.drag.panY0 = state.pan.y;
  });

  els.mapSvg.addEventListener("pointermove", (e) => {
    if(!state.drag.on) return;
    const dx = e.clientX - state.drag.x0;
    const dy = e.clientY - state.drag.y0;
    state.pan.x = state.drag.panX0 + dx;
    state.pan.y = state.drag.panY0 + dy;
    applyWorldTransform();
  });

  const end = () => { state.drag.on = false; };
  els.mapSvg.addEventListener("pointerup", end);
  els.mapSvg.addEventListener("pointercancel", end);

  els.mapViewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const zoomFactor = (delta > 0) ? 0.92 : 1.08;

    const prevZoom = state.zoom;
    const nextZoom = Math.max(0.75, Math.min(2.35, prevZoom * zoomFactor));
    const p = clientToSvg(e.clientX, e.clientY);

    state.zoom = nextZoom;
    state.pan.x = state.pan.x + (p.x * prevZoom - p.x * nextZoom);
    state.pan.y = state.pan.y + (p.y * prevZoom - p.y * nextZoom);

    applyWorldTransform();
  }, { passive: false });
}

// UI
function centerView(){
  state.zoom = 1;
  state.pan.x = 0;
  state.pan.y = 0;
  applyWorldTransform();
  safePlay(sounds.click);
}

function bindUI(){
  els.btnCenter.addEventListener("click", centerView);

  els.btnGlobal.addEventListener("click", () => {
    state.globalView = !state.globalView;
    applyGlobalView();
    savePrefs();
    safePlay(sounds.click);
  });

  els.btnSound.addEventListener("click", () => {
    state.uiSound = !state.uiSound;
    applySoundSettings();
    savePrefs();
    safePlay(sounds.click);
  });

  els.vol.addEventListener("input", () => {
    state.volume = Number(els.vol.value);
    applySoundSettings();
    savePrefs();
  });

  els.search.addEventListener("input", () => {
    const q = els.search.value;
    const list = searchIndex(q);
    renderResults(list, q);
    safePlay(sounds.click);
  });

  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      clearAllSelected();
      setFocusHud("");
      els.search.value = "";
      renderResults([], "");
      setCard("Accès lecture", `<span class="muted">Sélection via la colonne de droite (routes incluses). VUE GLOBALE = districts uniquement.</span>`);
      safePlay(sounds.warn);
    }
  });
}

function bindBoot(){
  els.btnNoFx.addEventListener("click", () => {
    state.reduceEffects = !state.reduceEffects;
    applyReduceEffects();
    savePrefs();
    safePlay(sounds.click);
  });

  els.btnInit.addEventListener("click", () => {
    unlockAudio();
    els.boot.style.display = "none";
    safePlay(sounds.ok);
  });

  window.addEventListener("pointerdown", () => unlockAudio(), { once: true });
  window.addEventListener("keydown", () => unlockAudio(), { once: true });
}

// Data
async function loadData(){
  const res = await fetch("./assets/data/lumia-map.json", { cache: "no-store" });
  if(!res.ok) throw new Error("JSON not found");
  return res.json();
}

// Init
async function init(){
  loadPrefs();
  applyReduceEffects();
  applySoundSettings();
  applyGlobalView();
  applyWorldTransform();
  setFocusHud("");

  bindBoot();
  bindUI();
  bindPanZoom();
  bindResultClicks();

  state.data = await loadData();
  SEARCH_INDEX = buildSearchIndex();

  renderDistricts();
  renderRoutes();
  renderPOIs();
  buildDistrictFolders();

  renderResults([], "");
  setCard("Accès lecture", `<span class="muted">Sélection via la colonne de droite (routes incluses). VUE GLOBALE = districts uniquement.</span>`);
}

init().catch(err => console.error(err));

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
