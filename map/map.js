const VIEWBOX = { width: 1400, height: 900 };
const MIN_ZOOM = 0.78;
const MAX_ZOOM = 2.8;
const BASE_FOCUS_PADDING = 56;

const state = {
  data: null,
  mode: "all",
  search: "",
  selected: null,
  reduceEffects: false,
  globalView: false,
  uiSound: true,
  volume: 0.34,
  audioUnlocked: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  drag: { on: false, x: 0, y: 0, panX: 0, panY: 0 },
  lists: {
    results: [],
    districts: []
  }
};

const els = {
  boot: document.getElementById("boot"),
  btnInit: document.getElementById("btnInit"),
  btnNoFx: document.getElementById("btnNoFx"),
  btnCenter: document.getElementById("btnCenter"),
  btnGlobal: document.getElementById("btnGlobal"),
  btnSound: document.getElementById("btnSound"),
  vol: document.getElementById("vol"),
  homeDock: document.getElementById("homeDock"),
  homeTab: document.getElementById("homeTab"),
  homePanel: document.getElementById("homePanel"),
  mapViewport: document.getElementById("mapViewport"),
  mapSvg: document.getElementById("mapSvg"),
  world: document.getElementById("world"),
  districtLayer: document.getElementById("districtLayer"),
  routeLayer: document.getElementById("routeLayer"),
  poiLayer: document.getElementById("poiLayer"),
  labelLayer: document.getElementById("labelLayer"),
  hudZoom: document.getElementById("hudZoom"),
  hudFocus: document.getElementById("hudFocus"),
  hudDistricts: document.getElementById("hudDistricts"),
  hudPois: document.getElementById("hudPois"),
  search: document.getElementById("search"),
  modeChips: document.getElementById("modeChips"),
  summaryStrip: document.getElementById("summaryStrip"),
  resultList: document.getElementById("resultList"),
  resultMeta: document.getElementById("resultMeta"),
  districtList: document.getElementById("districtList"),
  card: document.getElementById("card")
};

const sounds = {
  click: new Audio("./assets/audio/ui_click.mp3"),
  ok: new Audio("./assets/audio/ui_ok.mp3"),
  warn: new Audio("./assets/audio/ui_warn.mp3")
};

const TYPE_LABELS = {
  air_transport: "Transport aérien",
  archive: "Archives",
  augmentation: "Augmentation",
  black_market: "Marché noir",
  combat_zone: "Zone de combat",
  contact: "Contact",
  contracts: "Contrats",
  corporate: "Corporation",
  data_center: "Data center",
  district_core: "Noyau de district",
  finance: "Finance",
  hub: "Hub",
  industry: "Industrie",
  infiltration: "Infiltration",
  infrastructure: "Infrastructure",
  laboratory: "Laboratoire",
  landmark: "Repère",
  legal: "Légal",
  market: "Marché",
  media: "Médias",
  medical: "Médical",
  meeting: "Rencontre",
  port: "Port",
  safe: "Refuge",
  secure: "Sécurisé",
  service: "Service",
  social: "Social",
  storage: "Stockage",
  surveillance: "Surveillance",
  tech: "Technologie",
  training: "Entraînement",
  transit: "Transit",
  underground: "Souterrain",
  weapon_shop: "Armement",
  workshop: "Atelier"
};

const MODE_LABELS = {
  all: "Tout",
  district: "Territoires",
  route: "Routes",
  poi: "Nœuds"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function svgEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function makePathD(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ");
}

function applySoundSettings() {
  Object.values(sounds).forEach((audio) => {
    audio.preload = "auto";
    audio.volume = state.volume;
  });
  els.vol.value = String(state.volume);
  els.btnSound.setAttribute("aria-pressed", String(state.uiSound));
  els.btnSound.textContent = state.uiSound ? "SOUND" : "MUTE";
}

function safePlay(audio) {
  if (!state.uiSound || !state.audioUnlocked) return;
  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  } catch {}
}

function unlockAudio() {
  if (state.audioUnlocked) return;
  state.audioUnlocked = true;
  safePlay(sounds.ok);
}

function savePrefs() {
  try {
    localStorage.setItem("mapReduceEffects", state.reduceEffects ? "1" : "0");
    localStorage.setItem("mapUiSound", state.uiSound ? "1" : "0");
    localStorage.setItem("mapUiVol", String(state.volume));
    localStorage.setItem("mapGlobalView", state.globalView ? "1" : "0");
  } catch {}
}

function loadPrefs() {
  try {
    state.reduceEffects = localStorage.getItem("mapReduceEffects") === "1";
    const uiSound = localStorage.getItem("mapUiSound");
    if (uiSound !== null) state.uiSound = uiSound === "1";
    const volume = Number(localStorage.getItem("mapUiVol"));
    if (!Number.isNaN(volume) && volume >= 0 && volume <= 1) state.volume = volume;
    state.globalView = localStorage.getItem("mapGlobalView") === "1";
  } catch {}
}

function setFocusLabel(text) {
  if (text) {
    els.hudFocus.textContent = text;
    els.hudFocus.classList.remove("muted");
  } else {
    els.hudFocus.textContent = "Aucun";
    els.hudFocus.classList.add("muted");
  }
}

function applyReduceEffects() {
  document.body.classList.toggle("reduce-effects", state.reduceEffects);
  els.btnNoFx.setAttribute("aria-pressed", String(state.reduceEffects));
}

function applyGlobalView() {
  document.body.classList.toggle("global-view", state.globalView);
  els.btnGlobal.setAttribute("aria-pressed", String(state.globalView));
}

function updateZoomHud() {
  els.hudZoom.textContent = `${Math.round(state.zoom * 100)}%`;
}

function updateHudCounts() {
  els.hudDistricts.textContent = String(state.data?.districts?.length || 0);
  els.hudPois.textContent = String(state.data?.locations?.length || 0);
}

function applyTransform() {
  els.world.setAttribute("transform", `translate(${state.pan.x} ${state.pan.y}) scale(${state.zoom})`);
  updateZoomHud();
}

function clampPan(x, y, zoom = state.zoom) {
  const viewport = els.mapViewport.getBoundingClientRect();
  const scaledWidth = VIEWBOX.width * zoom;
  const scaledHeight = VIEWBOX.height * zoom;
  const minX = Math.min(0, viewport.width - scaledWidth - 40);
  const maxX = Math.max(0, (viewport.width - scaledWidth) / 2);
  const minY = Math.min(0, viewport.height - scaledHeight - 40);
  const maxY = Math.max(0, (viewport.height - scaledHeight) / 2);

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y))
  };
}

function setView(nextZoom, nextPan) {
  state.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  state.pan = clampPan(nextPan.x, nextPan.y, state.zoom);
  applyTransform();
}

function resetView() {
  const viewport = els.mapViewport.getBoundingClientRect();
  const zoom = Math.min(viewport.width / VIEWBOX.width, viewport.height / VIEWBOX.height) * 0.98;
  const pan = {
    x: (viewport.width - VIEWBOX.width * zoom) / 2,
    y: (viewport.height - VIEWBOX.height * zoom) / 2
  };
  setView(Math.max(MIN_ZOOM, zoom), pan);
}

function boundsFromPath(pathString) {
  const path = svgEl("path");
  path.setAttribute("d", pathString);
  els.labelLayer.appendChild(path);
  const box = path.getBBox();
  path.remove();
  return box;
}

function focusBox(box, padding = BASE_FOCUS_PADDING) {
  const viewport = els.mapViewport.getBoundingClientRect();
  const zoomX = (viewport.width - padding * 2) / box.width;
  const zoomY = (viewport.height - padding * 2) / box.height;
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(zoomX, zoomY)));
  const pan = {
    x: viewport.width / 2 - (box.x + box.width / 2) * zoom,
    y: viewport.height / 2 - (box.y + box.height / 2) * zoom
  };
  setView(zoom, pan);
}

function getDistrictById(id) {
  return state.data.districts.find((district) => district.id === id) || null;
}

function getDistrictShape(id) {
  return state.data.districtShapes.find((shape) => shape.id === id) || null;
}

function getRouteById(id) {
  return state.data.routes.find((route) => route.id === id) || null;
}

function getPoiById(id) {
  return state.data.locations.find((location) => location.id === id) || null;
}

function getSelectionEntity(selection = state.selected) {
  if (!selection) return null;
  if (selection.kind === "district") return getDistrictById(selection.id);
  if (selection.kind === "route") return getRouteById(selection.id);
  if (selection.kind === "poi") return getPoiById(selection.id);
  return null;
}

function districtPois(id) {
  return state.data.locations.filter((location) => location.district === id);
}

function selectionMatches(selection, item) {
  return Boolean(selection && selection.kind === item.kind && selection.id === item.id);
}

function buildSearchText(item) {
  if (item.kind === "district") {
    return [item.name, item.function, "territoire district"].join(" ");
  }

  if (item.kind === "route") {
    return [item.name, item.desc, item.kindLabel, "route axe transit"].join(" ");
  }

  const district = getDistrictById(item.district);
  return [
    item.name,
    item.desc,
    TYPE_LABELS[item.type] || item.type,
    district?.name || "",
    "noeud lieu point"
  ].join(" ");
}

function buildItems() {
  const districts = state.data.districts.map((district) => ({
    kind: "district",
    id: district.id,
    name: district.name,
    function: district.function,
    count: districtPois(district.id).length
  }));

  const routes = state.data.routes.map((route) => ({
    kind: "route",
    id: route.id,
    name: route.name,
    desc: route.desc || "",
    kindLabel: route.kind === "rail" ? "Rail" : "Axe"
  }));

  const pois = state.data.locations.map((location) => {
    const district = getDistrictById(location.district);
    return {
      kind: "poi",
      id: location.id,
      name: location.name,
      desc: location.desc || "",
      type: location.type,
      district: location.district,
      districtName: district?.name || "Secteur inconnu"
    };
  });

  return { districts, routes, pois };
}

function filteredItems() {
  const { districts, routes, pois } = buildItems();
  const query = normalize(state.search);
  const all = [...districts, ...routes, ...pois].filter((item) => {
    if (state.mode !== "all" && item.kind !== state.mode) return false;
    if (!query) return true;
    return normalize(buildSearchText(item)).includes(query);
  });

  all.sort((a, b) => {
    if (a.kind !== b.kind) {
      const order = { district: 0, route: 1, poi: 2 };
      return order[a.kind] - order[b.kind];
    }
    return a.name.localeCompare(b.name, "fr");
  });

  return { all, districts, routes, pois };
}

function updateMapVisibility(filtered) {
  const visibleDistrictIds = new Set(filtered.all.filter((item) => item.kind === "district").map((item) => item.id));
  const visibleRouteIds = new Set(filtered.all.filter((item) => item.kind === "route").map((item) => item.id));
  const visiblePoiIds = new Set(filtered.all.filter((item) => item.kind === "poi").map((item) => item.id));
  const showAll = state.mode === "all" && !state.search;

  document.querySelectorAll(".districtGroup").forEach((node) => {
    node.classList.toggle("dimmed", !showAll && !visibleDistrictIds.has(node.dataset.id));
  });
  document.querySelectorAll(".routeGroup").forEach((node) => {
    node.classList.toggle("dimmed", !showAll && !visibleRouteIds.has(node.dataset.id));
  });
  document.querySelectorAll(".poiGroup").forEach((node) => {
    node.classList.toggle("dimmed", !showAll && !visiblePoiIds.has(node.dataset.id));
  });
}

function setSummaryChips(items) {
  if (!items.length) {
    els.summaryStrip.innerHTML = `<span class="summaryChip active">Mode : ${MODE_LABELS[state.mode]}</span>`;
    return;
  }

  els.summaryStrip.innerHTML = items.map((item) => (
    `<button class="summaryChip ${item.active ? "active" : ""}" type="button" data-summary-action="${escapeHtml(item.action || "")}">${escapeHtml(item.label)}</button>`
  )).join("");

  els.summaryStrip.querySelectorAll("[data-summary-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.summaryAction;
      if (action === "clear-search") {
        state.search = "";
        els.search.value = "";
        refreshLists();
      }
      if (action === "reset-mode") {
        state.mode = "all";
        syncModeButtons();
        refreshLists();
      }
      if (action === "recenter") {
        focusSelection();
      }
    });
  });
}

function detailHtmlForSelection(selection) {
  if (!selection) {
    return `
      <div class="detailKicker">Accès lecture</div>
      <div class="detailTitle">Veille cartographique</div>
      <div class="detailBody">Sélectionne un territoire, une route ou un nœud pour afficher sa lecture détaillée.</div>
    `;
  }

  if (selection.kind === "district") {
    const district = getDistrictById(selection.id);
    const pois = districtPois(selection.id);
    return `
      <div class="detailKicker">Territoire verrouillé</div>
      <div class="detailTitle">${escapeHtml(district.name)}</div>
      <div class="detailBody">${escapeHtml(district.function)}</div>
      <div class="detailMeta">
        <span class="chipLabel">Territoire</span>
        <span class="chipLabel">${pois.length} nœuds</span>
      </div>
      <div class="detailLinks">
        <div class="detailLinksHead">Nœuds liés</div>
        <div class="detailLinkRow">
          ${pois.map((poi) => `<button class="detailLink" type="button" data-link-kind="poi" data-link-id="${escapeHtml(poi.id)}">${escapeHtml(poi.name)}</button>`).join("")}
        </div>
      </div>
    `;
  }

  if (selection.kind === "route") {
    const route = getRouteById(selection.id);
    return `
      <div class="detailKicker">Infrastructure active</div>
      <div class="detailTitle">${escapeHtml(route.name)}</div>
      <div class="detailBody">${escapeHtml(route.desc || "Aucune lecture disponible.")}</div>
      <div class="detailMeta">
        <span class="chipLabel">${escapeHtml(route.kind === "rail" ? "Rail périphérique" : "Axe structurant")}</span>
      </div>
    `;
  }

  const poi = getPoiById(selection.id);
  const district = getDistrictById(poi.district);
  const links = (poi.links || []).map((id) => getPoiById(id)).filter(Boolean);
  return `
    <div class="detailKicker">Nœud verrouillé</div>
    <div class="detailTitle">${escapeHtml(poi.name)}</div>
    <div class="detailBody">${escapeHtml(poi.desc || "Aucune lecture disponible.")}</div>
    <div class="detailMeta">
      <span class="chipLabel">${escapeHtml(TYPE_LABELS[poi.type] || poi.type)}</span>
      <span class="chipLabel">${escapeHtml(district?.name || "Secteur inconnu")}</span>
    </div>
    ${links.length ? `
      <div class="detailLinks">
        <div class="detailLinksHead">Connexions connues</div>
        <div class="detailLinkRow">
          ${links.map((link) => `<button class="detailLink" type="button" data-link-kind="poi" data-link-id="${escapeHtml(link.id)}">${escapeHtml(link.name)}</button>`).join("")}
        </div>
      </div>
    ` : ""}
  `;
}

function bindDetailLinks() {
  els.card.querySelectorAll("[data-link-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      pickSelection(button.dataset.linkKind, button.dataset.linkId, { center: true, sound: "click" });
    });
  });
}

function renderDetailCard() {
  els.card.innerHTML = detailHtmlForSelection(state.selected);
  bindDetailLinks();
}

function syncSelectedClasses() {
  document.querySelectorAll(".districtGroup, .routeGroup, .poiGroup").forEach((node) => node.classList.remove("selected"));
  document.querySelectorAll(".resultItem, .districtEntry").forEach((node) => node.classList.remove("selected"));

  if (!state.selected) return;

  document.querySelectorAll(`[data-map-kind="${state.selected.kind}"][data-id="${CSS.escape(state.selected.id)}"]`).forEach((node) => {
    node.classList.add("selected");
  });
  document.querySelectorAll(`[data-entry-kind="${state.selected.kind}"][data-entry-id="${CSS.escape(state.selected.id)}"]`).forEach((node) => {
    node.classList.add("selected");
  });
}

function focusSelection() {
  if (!state.selected) {
    resetView();
    return;
  }

  if (state.selected.kind === "district") {
    const shape = getDistrictShape(state.selected.id);
    if (shape) focusBox(boundsFromPath(shape.path), 70);
    return;
  }

  if (state.selected.kind === "route") {
    const route = getRouteById(state.selected.id);
    const pathString = route.points
      ? makePathD(route.points)
      : route.segments.map((segment) => makePathD(segment.points)).join(" ");
    focusBox(boundsFromPath(pathString), 90);
    return;
  }

  const poi = getPoiById(state.selected.id);
  if (poi) focusBox({ x: poi.x - 110, y: poi.y - 110, width: 220, height: 220 }, 120);
}

function pickSelection(kind, id, options = {}) {
  state.selected = { kind, id };
  const entity = getSelectionEntity();
  setFocusLabel(entity?.name || null);
  renderDetailCard();
  syncSelectedClasses();
  if (options.center !== false) focusSelection();
  if (options.sound === "ok") safePlay(sounds.ok);
  if (options.sound === "click") safePlay(sounds.click);
}

function renderResults(filtered) {
  state.lists.results = filtered.all;

  if (!filtered.all.length) {
    els.resultList.innerHTML = `<div class="muted">Aucun résultat ne répond à ce filtrage. Change l’angle ou efface la recherche.</div>`;
    els.resultMeta.textContent = "0 signal retenu";
    return;
  }

  els.resultMeta.textContent = `${filtered.all.length} signal${filtered.all.length > 1 ? "s" : ""} retenu${filtered.all.length > 1 ? "s" : ""}`;
  els.resultList.innerHTML = filtered.all.map((item) => {
    if (item.kind === "district") {
      return `
        <button class="resultItem ${selectionMatches(state.selected, item) ? "selected" : ""}" type="button" data-entry-kind="district" data-entry-id="${escapeHtml(item.id)}">
          <div class="resultHead">
            <div>
              <div class="resultKind">Territoire</div>
              <div class="resultTitle">${escapeHtml(item.name)}</div>
            </div>
            <span class="chipLabel">${item.count} nœuds</span>
          </div>
          <div class="resultDesc">${escapeHtml(item.function)}</div>
        </button>
      `;
    }

    if (item.kind === "route") {
      return `
        <button class="resultItem ${selectionMatches(state.selected, item) ? "selected" : ""}" type="button" data-entry-kind="route" data-entry-id="${escapeHtml(item.id)}">
          <div class="resultHead">
            <div>
              <div class="resultKind">Route</div>
              <div class="resultTitle">${escapeHtml(item.name)}</div>
            </div>
            <span class="chipLabel">${escapeHtml(item.kindLabel)}</span>
          </div>
          <div class="resultDesc">${escapeHtml(item.desc)}</div>
        </button>
      `;
    }

    return `
      <button class="resultItem ${selectionMatches(state.selected, item) ? "selected" : ""}" type="button" data-entry-kind="poi" data-entry-id="${escapeHtml(item.id)}">
        <div class="resultHead">
          <div>
            <div class="resultKind">Nœud</div>
            <div class="resultTitle">${escapeHtml(item.name)}</div>
          </div>
          <span class="chipLabel">${escapeHtml(TYPE_LABELS[item.type] || item.type)}</span>
        </div>
        <div class="resultDesc">${escapeHtml(item.desc)}</div>
        <div class="resultMetaRow">
          <span class="chipLabel">${escapeHtml(item.districtName)}</span>
        </div>
      </button>
    `;
  }).join("");

  els.resultList.querySelectorAll("[data-entry-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      pickSelection(button.dataset.entryKind, button.dataset.entryId, { center: true, sound: "click" });
    });
  });
}

function renderDistrictList() {
  const districts = state.data.districts.slice().sort((a, b) => a.name.localeCompare(b.name, "fr"));
  els.districtList.innerHTML = districts.map((district) => {
    const count = districtPois(district.id).length;
    return `
      <button class="districtEntry ${selectionMatches(state.selected, { kind: "district", id: district.id }) ? "selected" : ""}" type="button" data-entry-kind="district" data-entry-id="${escapeHtml(district.id)}">
        <div class="districtRow">
          <div>
            <div class="districtMeta">Territoire</div>
            <div class="districtName">${escapeHtml(district.name)}</div>
          </div>
          <div class="districtPoiCount">${count} nœuds</div>
        </div>
        <div class="districtFunction">${escapeHtml(district.function)}</div>
      </button>
    `;
  }).join("");

  els.districtList.querySelectorAll("[data-entry-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      pickSelection("district", button.dataset.entryId, { center: true, sound: "ok" });
    });
  });
}

function syncModeButtons() {
  els.modeChips.querySelectorAll(".modeChip").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function refreshLists() {
  const filtered = filteredItems();
  updateMapVisibility(filtered);
  renderResults(filtered);
  renderDistrictList();

  const summary = [
    { label: `Mode : ${MODE_LABELS[state.mode]}`, action: "reset-mode", active: true },
    ...(state.search ? [{ label: `Recherche : ${state.search}`, action: "clear-search", active: true }] : []),
    ...(state.selected ? [{ label: "Recentrer sur le focus", action: "recenter", active: false }] : [])
  ];
  setSummaryChips(summary);
  syncSelectedClasses();
}

function createDistrictNode(shape, district) {
  const group = svgEl("g");
  group.classList.add("districtGroup");
  group.dataset.mapKind = "district";
  group.dataset.id = district.id;

  const path = svgEl("path");
  path.setAttribute("class", "districtShape mapFocus");
  path.setAttribute("d", shape.path);
  path.setAttribute("tabindex", "0");
  path.setAttribute("aria-label", district.name);

  const label = svgEl("text");
  label.setAttribute("class", "mapLabel districtLabel");
  label.setAttribute("x", district.label.x);
  label.setAttribute("y", district.label.y);
  label.textContent = district.name;

  const activate = () => pickSelection("district", district.id, { center: true, sound: "ok" });
  path.addEventListener("click", (event) => {
    event.stopPropagation();
    activate();
  });
  path.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });

  group.append(path, label);
  return group;
}

function routePathStrings(route) {
  if (Array.isArray(route.points)) return [makePathD(route.points)];
  if (Array.isArray(route.segments)) return route.segments.map((segment) => makePathD(segment.points));
  return [];
}

function createRouteNode(route) {
  const group = svgEl("g");
  group.classList.add("routeGroup", route.kind === "rail" ? "rail" : "road");
  group.dataset.mapKind = "route";
  group.dataset.id = route.id;
  const activate = () => pickSelection("route", route.id, { center: true, sound: "click" });

  routePathStrings(route).forEach((pathString) => {
    const base = svgEl("path");
    base.setAttribute("class", "routeStroke routeBase");
    base.setAttribute("d", pathString);

    const main = svgEl("path");
    main.setAttribute("class", "routeStroke routeMain");
    main.setAttribute("d", pathString);

    const hit = svgEl("path");
    hit.setAttribute("class", "routeHit");
    hit.setAttribute("d", pathString);
    hit.addEventListener("click", (event) => {
      event.stopPropagation();
      activate();
    });

    group.append(base, main, hit);
  });

  const label = svgEl("text");
  label.setAttribute("class", "mapLabel routeLabel");
  label.setAttribute("x", route.label.x);
  label.setAttribute("y", route.label.y);
  label.textContent = route.name;
  group.append(label);

  return group;
}

function createPoiNode(location) {
  const group = svgEl("g");
  group.classList.add("poiGroup");
  group.dataset.mapKind = "poi";
  group.dataset.id = location.id;

  const pulse = svgEl("circle");
  pulse.setAttribute("class", "poiPulse");
  pulse.setAttribute("cx", location.x);
  pulse.setAttribute("cy", location.y);
  pulse.setAttribute("r", "9");

  const halo = svgEl("circle");
  halo.setAttribute("class", "poiHalo");
  halo.setAttribute("cx", location.x);
  halo.setAttribute("cy", location.y);
  halo.setAttribute("r", "10");

  const dot = svgEl("circle");
  dot.setAttribute("class", "poiDot");
  dot.setAttribute("cx", location.x);
  dot.setAttribute("cy", location.y);
  dot.setAttribute("r", "4.8");

  const hit = svgEl("circle");
  hit.setAttribute("class", "poiHit");
  hit.setAttribute("cx", location.x);
  hit.setAttribute("cy", location.y);
  hit.setAttribute("r", "17");

  const label = svgEl("text");
  label.setAttribute("class", "mapLabel poiLabel");
  label.setAttribute("x", location.x + 12);
  label.setAttribute("y", location.y - 14);
  label.textContent = location.name;

  const activate = () => pickSelection("poi", location.id, { center: true, sound: "click" });
  hit.addEventListener("click", (event) => {
    event.stopPropagation();
    activate();
  });

  group.append(pulse, halo, dot, hit, label);
  return group;
}

function renderMap() {
  els.districtLayer.innerHTML = "";
  els.routeLayer.innerHTML = "";
  els.poiLayer.innerHTML = "";
  els.labelLayer.innerHTML = "";

  state.data.districtShapes.forEach((shape) => {
    const district = getDistrictById(shape.id);
    if (district) els.districtLayer.appendChild(createDistrictNode(shape, district));
  });

  state.data.routes.forEach((route) => {
    els.routeLayer.appendChild(createRouteNode(route));
  });

  state.data.locations.forEach((location) => {
    els.poiLayer.appendChild(createPoiNode(location));
  });
}

function onMapPointerDown(event) {
  if (event.button !== 0) return;
  state.drag.on = true;
  state.drag.x = event.clientX;
  state.drag.y = event.clientY;
  state.drag.panX = state.pan.x;
  state.drag.panY = state.pan.y;
  els.mapViewport.classList.add("is-dragging");
}

function onMapPointerMove(event) {
  if (!state.drag.on) return;
  const dx = event.clientX - state.drag.x;
  const dy = event.clientY - state.drag.y;
  state.pan = clampPan(state.drag.panX + dx, state.drag.panY + dy);
  applyTransform();
}

function onMapPointerUp() {
  state.drag.on = false;
  els.mapViewport.classList.remove("is-dragging");
}

function zoomAtPoint(clientX, clientY, direction) {
  const rect = els.mapViewport.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const pointX = (localX - state.pan.x) / state.zoom;
  const pointY = (localY - state.pan.y) / state.zoom;
  const nextZoom = direction > 0 ? state.zoom * 1.12 : state.zoom / 1.12;
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  const nextPan = {
    x: localX - pointX * zoom,
    y: localY - pointY * zoom
  };
  setView(zoom, nextPan);
}

function attachEvents() {
  els.btnInit.addEventListener("click", () => {
    unlockAudio();
    els.boot.hidden = true;
    safePlay(sounds.ok);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (state.data) {
          resetView();
          refreshLists();
          renderDetailCard();
        }
      });
    });
    els.search.focus();
  });

  els.btnNoFx.addEventListener("click", () => {
    state.reduceEffects = !state.reduceEffects;
    applyReduceEffects();
    savePrefs();
    safePlay(sounds.click);
  });

  els.btnGlobal.addEventListener("click", () => {
    state.globalView = !state.globalView;
    applyGlobalView();
    savePrefs();
    safePlay(sounds.click);
  });

  els.btnCenter.addEventListener("click", () => {
    focusSelection();
    safePlay(sounds.click);
  });

  els.btnSound.addEventListener("click", () => {
    state.uiSound = !state.uiSound;
    applySoundSettings();
    savePrefs();
    if (state.uiSound) safePlay(sounds.ok);
  });

  els.vol.addEventListener("input", () => {
    state.volume = Number(els.vol.value);
    applySoundSettings();
    savePrefs();
  });

  els.search.addEventListener("input", () => {
    state.search = els.search.value.trim();
    refreshLists();
  });

  els.modeChips.querySelectorAll(".modeChip").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      syncModeButtons();
      refreshLists();
      safePlay(sounds.click);
    });
  });

  els.homeTab.addEventListener("click", () => {
    const open = els.homeDock.classList.toggle("open");
    els.homeTab.setAttribute("aria-expanded", String(open));
    els.homePanel.setAttribute("aria-hidden", String(!open));
  });

  document.addEventListener("click", (event) => {
    if (!els.homeDock.contains(event.target)) {
      els.homeDock.classList.remove("open");
      els.homeTab.setAttribute("aria-expanded", "false");
      els.homePanel.setAttribute("aria-hidden", "true");
    }
  });

  els.mapSvg.addEventListener("pointerdown", onMapPointerDown);
  window.addEventListener("pointermove", onMapPointerMove);
  window.addEventListener("pointerup", onMapPointerUp);
  window.addEventListener("pointercancel", onMapPointerUp);

  els.mapSvg.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomAtPoint(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  els.mapSvg.addEventListener("click", (event) => {
    if (event.target === els.mapSvg || event.target === els.world || event.target.id === "island") {
      state.selected = null;
      setFocusLabel(null);
      renderDetailCard();
      syncSelectedClasses();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.search = "";
      els.search.value = "";
      state.selected = null;
      setFocusLabel(null);
      renderDetailCard();
      refreshLists();
      resetView();
    }
  });

  window.addEventListener("resize", () => {
    if (state.selected) focusSelection();
    else resetView();
  });
}

async function loadData() {
  if (window.__LUMIA_MAP_DATA__) {
    return window.__LUMIA_MAP_DATA__;
  }
  const response = await fetch("./assets/data/lumia-map.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Impossible de charger la cartographie.");
  return response.json();
}

async function init() {
  loadPrefs();
  applyReduceEffects();
  applyGlobalView();
  applySoundSettings();
  attachEvents();

  try {
    state.data = await loadData();
    renderMap();
    updateHudCounts();
    renderDetailCard();
    resetView();
    syncModeButtons();
    refreshLists();
  } catch (error) {
    els.resultMeta.textContent = "Erreur de chargement";
    els.resultList.innerHTML = `<div class="muted">La cartographie ne répond pas. Vérifie le fichier de données et relance le terminal.</div>`;
    els.card.innerHTML = `
      <div class="detailKicker">Échec de liaison</div>
      <div class="detailTitle">Worldmap indisponible</div>
      <div class="detailBody">${escapeHtml(error.message || "Erreur inconnue.")}</div>
    `;
    console.error(error);
  }
}

init();
