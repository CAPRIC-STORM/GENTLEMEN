const KIND_LABELS = {
  finance: "Finances",
  secure: "Coffres",
  contact: "Contacts",
  service: "Services",
  market: "Accès",
  district_core: "Quotidien",
  training: "Formation",
  social: "Social",
  black_market: "Marché noir",
  hub: "Transit",
  legal: "Identités",
  corporate: "Corporate",
  archive: "Archives",
  luxury: "Prestige",
  underground: "Souterrain",
  weapon_shop: "Equipement",
  workshop: "Atelier",
  industry: "Materiel",
  infiltration: "Infiltration",
  infrastructure: "Infrastructure",
  landmark: "Repere",
  laboratory: "Recherche",
  medical: "Santé",
  meeting: "Rencontre",
  augmentation: "Implants",
  air_transport: "Transport",
  safe: "Refuge",
  storage: "Stockage",
  surveillance: "Surveillance",
  tech: "Technologie",
  drone: "Drones",
  port: "Port",
  data_center: "Data",
  media: "Media",
  combat_zone: "Combat",
  contracts: "Dettes",
  transit: "Transit"
};

const state = {
  data: null,
  items: [],
  reduceEffects: false,
  uiSound: true,
  volume: 0.35,
  audioUnlocked: false,
  activeKind: "",
  filters: {
    search: "",
    district: "",
    shop: "",
    price: "",
    sort: "relevance"
  },
  cart: [],
  selectedItemId: ""
};

const els = {
  boot: document.getElementById("boot"),
  btnInit: document.getElementById("btnInit"),
  btnNoFx: document.getElementById("btnNoFx"),
  btnSound: document.getElementById("btnSound"),
  vol: document.getElementById("vol"),
  currencyBox: document.getElementById("currencyBox"),
  quickFilters: document.getElementById("quickFilters"),
  search: document.getElementById("search"),
  districtFilter: document.getElementById("districtFilter"),
  shopFilter: document.getElementById("shopFilter"),
  priceFilter: document.getElementById("priceFilter"),
  sortFilter: document.getElementById("sortFilter"),
  btnResetFilters: document.getElementById("btnResetFilters"),
  activeFilters: document.getElementById("activeFilters"),
  resultGrid: document.getElementById("resultGrid"),
  resultCount: document.getElementById("resultCount"),
  resultHint: document.getElementById("resultHint"),
  detailPanel: document.getElementById("detailPanel"),
  cartList: document.getElementById("cartList"),
  cartCount: document.getElementById("cartCount"),
  cartTotal: document.getElementById("cartTotal"),
  btnExport: document.getElementById("btnExport"),
  btnClear: document.getElementById("btnClear")
};

const sounds = {
  click: new Audio("../assets/audio/ui_click.mp3"),
  ok: new Audio("../assets/audio/ui_ok.mp3"),
  warn: new Audio("../assets/audio/ui_warn.mp3")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applySoundSettings() {
  for (const audio of Object.values(sounds)) {
    audio.preload = "auto";
    audio.volume = state.volume;
  }
  els.vol.value = String(state.volume);
  els.btnSound.setAttribute("aria-pressed", String(state.uiSound));
  els.btnSound.textContent = state.uiSound ? "SOUND" : "MUTE";
}

function safePlay(audio) {
  if (!state.uiSound || !state.audioUnlocked) return;
  try {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {}
}

function unlockAudio() {
  if (state.audioUnlocked) return;
  state.audioUnlocked = true;
  try {
    const audio = sounds.click;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }
  } catch {}
}

function loadPrefs() {
  try {
    const reduce = localStorage.getItem("reduceEffects_shop");
    if (reduce !== null) state.reduceEffects = reduce === "1";

    const uiSound = localStorage.getItem("uiSound_shop");
    if (uiSound !== null) state.uiSound = uiSound === "1";

    const volume = localStorage.getItem("uiVol_shop");
    if (volume !== null) {
      const parsed = Number(volume);
      if (!Number.isNaN(parsed)) state.volume = Math.max(0, Math.min(1, parsed));
    }

    const cart = localStorage.getItem("lumia_cart");
    if (cart) {
      const parsed = JSON.parse(cart);
      if (Array.isArray(parsed)) state.cart = parsed;
    }
  } catch {}
}

function savePrefs() {
  try {
    localStorage.setItem("reduceEffects_shop", state.reduceEffects ? "1" : "0");
    localStorage.setItem("uiSound_shop", state.uiSound ? "1" : "0");
    localStorage.setItem("uiVol_shop", String(state.volume));
    localStorage.setItem("lumia_cart", JSON.stringify(state.cart));
  } catch {}
}

function applyReduceEffects() {
  document.body.classList.toggle("reduce-effects", state.reduceEffects);
}

async function loadData() {
  const response = await fetch("../assets/data/lumia-shop.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Shop JSON not found");
  return response.json();
}

function getKindLabel(kind) {
  return KIND_LABELS[kind] || "Autres";
}

function getPriceMode(unit) {
  const normalized = String(unit || "").toLowerCase();
  if (normalized.includes("favor")) return "favor";
  if (normalized.includes("%")) return "percent";
  if (normalized.includes("/")) return "subscription";
  if (normalized.includes("mo")) return "subscription";
  if (normalized.includes("lmn")) return "lmn";
  return "other";
}

function buildItems() {
  const items = [];

  for (const shop of state.data.shops || []) {
    for (const section of shop.sections || []) {
      for (const item of section.items || []) {
        items.push({
          id: `${shop.id}::${section.title}::${item.name}`,
          shopId: shop.id,
          shopName: shop.name,
          district: shop.district,
          kind: shop.kind,
          kindLabel: getKindLabel(shop.kind),
          shopTagline: shop.tagline,
          shopDesc: shop.desc,
          sectionTitle: section.title,
          itemName: item.name,
          priceNumber: Number(item.price),
          priceDisplay: `${item.price} ${item.unit}`,
          priceUnit: item.unit,
          priceMode: getPriceMode(item.unit),
          note: item.note || "",
          searchable: [
            shop.name,
            shop.district,
            shop.kind,
            getKindLabel(shop.kind),
            shop.tagline,
            shop.desc,
            section.title,
            item.name,
            item.unit || "",
            item.note || ""
          ].join(" ").toLowerCase()
        });
      }
    }
  }

  state.items = items;
}

function renderCurrency() {
  const currency = state.data.meta.currency;

  els.currencyBox.innerHTML = `
    <div class="currencyGrid">
      <div class="currencyCard">
        <div class="currencyName">${escapeHtml(currency.name)} (${escapeHtml(currency.symbol)})</div>
        <div class="currencyDesc">${escapeHtml(currency.desc)}</div>
      </div>
      <div class="currencyCard">
        <div class="currencyName">${escapeHtml(currency.street)}</div>
        <div class="currencyDesc">${escapeHtml(currency.street_desc)}</div>
      </div>
    </div>
    <ul class="noteList">
      ${(currency.notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
    </ul>
  `;
}

function populateSelect(select, values, allLabel) {
  const current = select.value;
  select.innerHTML = `<option value="">${allLabel}</option>` +
    values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = values.includes(current) ? current : "";
}

function renderQuickFilters() {
  const counts = new Map();
  for (const item of state.items) {
    counts.set(item.kind, (counts.get(item.kind) || 0) + 1);
  }

  const kinds = Array.from(counts.keys()).sort((a, b) => getKindLabel(a).localeCompare(getKindLabel(b)));

  els.quickFilters.innerHTML = [
    `<button class="quickChip${state.activeKind === "" ? " active" : ""}" type="button" data-kind="">TOUT</button>`,
    ...kinds.map((kind) => {
      const active = state.activeKind === kind ? " active" : "";
      return `<button class="quickChip${active}" type="button" data-kind="${escapeHtml(kind)}">${escapeHtml(getKindLabel(kind))} (${counts.get(kind)})</button>`;
    })
  ].join("");

  els.quickFilters.querySelectorAll("[data-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeKind = button.dataset.kind || "";
      renderQuickFilters();
      renderResults();
      safePlay(sounds.click);
    });
  });
}

function populateFilters() {
  const districts = Array.from(new Set(state.items.map((item) => item.district))).sort((a, b) => a.localeCompare(b));
  const shops = Array.from(new Set(state.items.map((item) => item.shopName))).sort((a, b) => a.localeCompare(b));

  populateSelect(els.districtFilter, districts, "Tous");
  populateSelect(els.shopFilter, shops, "Toutes");
}

function findItemById(id) {
  return state.items.find((item) => item.id === id);
}

function renderActiveFilters() {
  const tags = [];

  if (state.activeKind) tags.push({ key: "kind", label: getKindLabel(state.activeKind) });
  if (state.filters.search.trim()) tags.push({ key: "search", label: `Recherche: ${state.filters.search.trim()}` });
  if (state.filters.district) tags.push({ key: "district", label: state.filters.district });
  if (state.filters.shop) tags.push({ key: "shop", label: state.filters.shop });
  if (state.filters.price) tags.push({ key: "price", label: state.filters.price.toUpperCase() });
  if (state.filters.sort !== "relevance") tags.push({ key: "sort", label: `Tri: ${els.sortFilter.options[els.sortFilter.selectedIndex].text}` });

  if (!tags.length) {
    els.activeFilters.innerHTML = "";
    return;
  }

  els.activeFilters.innerHTML = tags.map((tag) => `
    <span class="filterTag">
      ${escapeHtml(tag.label)}
      <button type="button" data-clear-filter="${escapeHtml(tag.key)}" aria-label="Retirer ${escapeHtml(tag.label)}">x</button>
    </span>
  `).join("");

  els.activeFilters.querySelectorAll("[data-clear-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      clearOneFilter(button.dataset.clearFilter);
      safePlay(sounds.click);
    });
  });
}

function clearOneFilter(key) {
  if (key === "kind") state.activeKind = "";
  if (key === "search") {
    state.filters.search = "";
    els.search.value = "";
  }
  if (key === "district") {
    state.filters.district = "";
    els.districtFilter.value = "";
  }
  if (key === "shop") {
    state.filters.shop = "";
    els.shopFilter.value = "";
  }
  if (key === "price") {
    state.filters.price = "";
    els.priceFilter.value = "";
  }
  if (key === "sort") {
    state.filters.sort = "relevance";
    els.sortFilter.value = "relevance";
  }

  renderQuickFilters();
  renderResults();
}

function renderDetailPanel() {
  const item = findItemById(state.selectedItemId);

  if (!item) {
    els.detailPanel.innerHTML = `
      <div class="detailEmpty muted">
        Sélectionne un article dans le registre pour afficher sa fiche détaillée ici.
      </div>
    `;
    return;
  }

  els.detailPanel.innerHTML = `
    <div class="detailHeader">
      <div class="detailKicker">${escapeHtml(item.shopName)} • ${escapeHtml(item.district)}</div>
      <div class="detailTitle">${escapeHtml(item.itemName)}</div>
      <div class="detailPrice">${escapeHtml(item.priceDisplay)}</div>
    </div>

    <div class="detailMeta">
      <span class="metaPill">${escapeHtml(item.kindLabel)}</span>
      <span class="metaPill">${escapeHtml(item.sectionTitle)}</span>
      <span class="metaPill">${escapeHtml(item.priceMode.toUpperCase())}</span>
    </div>

    <div class="detailText">${escapeHtml(item.note || item.shopDesc || item.shopTagline)}</div>
    <div class="detailText">${escapeHtml(item.shopTagline)}</div>

    <button class="btn detailAction" type="button" id="detailAddBtn">AJOUTER AU BON</button>
  `;

  document.getElementById("detailAddBtn")?.addEventListener("click", () => {
    addToCart(item);
  });
}

function computeScore(item, query) {
  if (!query) return 0;
  let score = 0;
  const tokens = query.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (item.itemName.toLowerCase().includes(token)) score += 5;
    if (item.sectionTitle.toLowerCase().includes(token)) score += 3;
    if (item.shopName.toLowerCase().includes(token)) score += 2;
    if (item.note.toLowerCase().includes(token)) score += 1;
  }
  return score;
}

function getFilteredItems() {
  const query = state.filters.search.trim().toLowerCase();

  let items = state.items.filter((item) => {
    if (state.activeKind && item.kind !== state.activeKind) return false;
    if (state.filters.district && item.district !== state.filters.district) return false;
    if (state.filters.shop && item.shopName !== state.filters.shop) return false;
    if (state.filters.price && item.priceMode !== state.filters.price) return false;
    if (query && !item.searchable.includes(query)) return false;
    return true;
  });

  items = items.map((item) => ({ ...item, score: computeScore(item, query) }));

  switch (state.filters.sort) {
    case "price-asc":
      items.sort((a, b) => a.priceNumber - b.priceNumber || a.itemName.localeCompare(b.itemName));
      break;
    case "price-desc":
      items.sort((a, b) => b.priceNumber - a.priceNumber || a.itemName.localeCompare(b.itemName));
      break;
    case "district":
      items.sort((a, b) => a.district.localeCompare(b.district) || a.itemName.localeCompare(b.itemName));
      break;
    case "shop":
      items.sort((a, b) => a.shopName.localeCompare(b.shopName) || a.itemName.localeCompare(b.itemName));
      break;
    default:
      if (query) {
        items.sort((a, b) => b.score - a.score || a.itemName.localeCompare(b.itemName));
      } else {
        items.sort((a, b) => a.shopName.localeCompare(b.shopName) || a.itemName.localeCompare(b.itemName));
      }
      break;
  }

  return items;
}

function renderResults() {
  const items = getFilteredItems();
  const query = state.filters.search.trim();

  els.resultCount.textContent = `${items.length} entrée${items.length > 1 ? "s" : ""}`;
  renderActiveFilters();

  if (query) {
    els.resultHint.textContent = `Recherche active : "${query}"`;
  } else if (state.activeKind) {
    els.resultHint.textContent = `Filtre actif : ${getKindLabel(state.activeKind)}`;
  } else {
    els.resultHint.textContent = "Affichage complet du registre marchand.";
  }

  if (state.selectedItemId && !items.some((item) => item.id === state.selectedItemId)) {
    state.selectedItemId = "";
    renderDetailPanel();
  }

  if (!items.length) {
    els.resultGrid.innerHTML = `
      <div class="emptyState">
        Aucun article ne correspond au filtre actuel.
        Ouvre un autre angle, élargis le district ou change de besoin.
      </div>
    `;
    return;
  }

  els.resultGrid.innerHTML = items.map((item) => `
    <article class="resultCard${state.selectedItemId === item.id ? " selected" : ""}" data-item-id="${escapeHtml(item.id)}" tabindex="0">
      <div class="cardTop">
        <div>
          <div class="cardKicker">${escapeHtml(item.shopName)}</div>
          <div class="cardName">${escapeHtml(item.itemName)}</div>
        </div>
        <div class="cardBadge">${escapeHtml(item.kindLabel)}</div>
      </div>

      <div class="cardRoute">${escapeHtml(item.note || item.shopTagline || item.shopDesc)}</div>

      <div class="cardMeta">
        <span class="metaPill">${escapeHtml(item.district)}</span>
        <span class="metaPill">${escapeHtml(item.sectionTitle)}</span>
        <span class="metaPill">${escapeHtml(item.priceMode.toUpperCase())}</span>
      </div>

      <div class="cardFoot">
        <div class="cardPrice">
          <div class="priceMain">${escapeHtml(item.priceDisplay)}</div>
          <div class="priceNote">${escapeHtml(item.shopTagline)}</div>
        </div>

        <button class="btn addBtn" type="button" data-add-id="${escapeHtml(item.id)}">AJOUTER</button>
      </div>
    </article>
  `).join("");

  els.resultGrid.querySelectorAll("[data-add-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const item = state.items.find((entry) => entry.id === button.dataset.addId);
      if (item) addToCart(item);
    });
  });

  els.resultGrid.querySelectorAll(".resultCard").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedItemId = card.dataset.itemId;
      renderResults();
      renderDetailPanel();
      safePlay(sounds.click);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      state.selectedItemId = card.dataset.itemId;
      renderResults();
      renderDetailPanel();
    });
  });
}

function addToCart(item) {
  state.cart.push({
    id: item.id,
    shopId: item.shopId,
    shopName: item.shopName,
    district: item.district,
    itemName: item.itemName,
    priceNumber: item.priceNumber,
    priceUnit: item.priceUnit,
    note: item.note
  });
  savePrefs();
  renderCart();
  safePlay(sounds.ok);
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  savePrefs();
  renderCart();
  safePlay(sounds.click);
}

function cartTotalLMN() {
  let total = 0;
  for (const item of state.cart) {
    if (getPriceMode(item.priceUnit) === "lmn" && Number.isFinite(item.priceNumber)) {
      total += item.priceNumber;
    }
  }
  return total;
}

function renderCart() {
  els.cartCount.textContent = String(state.cart.length);
  els.cartTotal.textContent = String(cartTotalLMN());

  if (!state.cart.length) {
    els.cartList.classList.add("muted");
    els.cartList.textContent = "Aucune acquisition enregistrée.";
    return;
  }

  els.cartList.classList.remove("muted");
  els.cartList.innerHTML = state.cart.map((item, index) => `
    <div class="cartRow">
      <div class="cartTop">
        <div>
          <div class="cartName">${escapeHtml(item.itemName)}</div>
          <div class="cartMeta">${escapeHtml(item.shopName)} - ${escapeHtml(item.district)}</div>
        </div>
        <div class="cartPrice">${escapeHtml(`${item.priceNumber} ${item.priceUnit}`)}</div>
      </div>
      <button class="cartRemove" type="button" data-remove-index="${index}">retirer du bon</button>
    </div>
  `).join("");

  els.cartList.querySelectorAll("[data-remove-index]").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(Number(button.dataset.removeIndex));
    });
  });
}

async function exportCart() {
  if (!state.cart.length) {
    safePlay(sounds.warn);
    return;
  }

  const lines = [];
  lines.push("LUMIA ISLAND // BON D'ACQUISITION");
  lines.push("----------------------------------------");
  for (const item of state.cart) {
    lines.push(`- ${item.itemName} // ${item.priceNumber} ${item.priceUnit} // ${item.shopName} (${item.district})`);
  }
  lines.push("----------------------------------------");
  lines.push(`TOTAL LMN : ${cartTotalLMN()}`);

  const text = lines.join("\n");

  try {
    await navigator.clipboard.writeText(text);
    safePlay(sounds.ok);
    alert("Bon d'acquisition copié dans le presse-papier.");
  } catch {
    safePlay(sounds.warn);
    alert(text);
  }
}

function resetFilters() {
  state.activeKind = "";
  state.filters = {
    search: "",
    district: "",
    shop: "",
    price: "",
    sort: "relevance"
  };

  els.search.value = "";
  els.districtFilter.value = "";
  els.shopFilter.value = "";
  els.priceFilter.value = "";
  els.sortFilter.value = "relevance";

  renderQuickFilters();
  renderResults();
}

function bindUI() {
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
    state.filters.search = els.search.value;
    renderResults();
  });

  els.districtFilter.addEventListener("change", () => {
    state.filters.district = els.districtFilter.value;
    renderResults();
    safePlay(sounds.click);
  });

  els.shopFilter.addEventListener("change", () => {
    state.filters.shop = els.shopFilter.value;
    renderResults();
    safePlay(sounds.click);
  });

  els.priceFilter.addEventListener("change", () => {
    state.filters.price = els.priceFilter.value;
    renderResults();
    safePlay(sounds.click);
  });

  els.sortFilter.addEventListener("change", () => {
    state.filters.sort = els.sortFilter.value;
    renderResults();
    safePlay(sounds.click);
  });

  els.btnResetFilters.addEventListener("click", () => {
    resetFilters();
    safePlay(sounds.warn);
  });

  els.btnClear.addEventListener("click", () => {
    state.cart = [];
    savePrefs();
    renderCart();
    safePlay(sounds.warn);
  });

  els.btnExport.addEventListener("click", exportCart);
}

function bindDock() {
  const dock = document.getElementById("homeDock");
  const tab = document.getElementById("homeTab");
  const panel = document.getElementById("homePanel");
  if (!dock || !tab || !panel) return;

  function setOpen(open) {
    dock.classList.toggle("open", open);
    tab.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
  }

  tab.addEventListener("click", () => {
    setOpen(!dock.classList.contains("open"));
  });

  document.addEventListener("click", (event) => {
    if (!dock.classList.contains("open")) return;
    if (dock.contains(event.target)) return;
    setOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

async function init() {
  loadPrefs();
  applyReduceEffects();
  applySoundSettings();
  bindUI();
  bindDock();

  state.data = await loadData();
  buildItems();
  renderCurrency();
  populateFilters();
  renderQuickFilters();
  state.selectedItemId = state.items[0]?.id || "";
  renderResults();
  renderDetailPanel();
  renderCart();
}

init().catch((error) => {
  console.error(error);
  els.resultGrid.innerHTML = `<div class="emptyState">Le registre marchand ne répond pas. Réessaie plus tard.</div>`;
});
