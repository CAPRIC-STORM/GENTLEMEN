/* Boutique Lumia Island — RP Economy
   - Accordéons boutiques
   - Recherche globale (boutiques + items)
   - Liste d’achats (localStorage) + total + export
   - Audio unlock via INITIALISER
*/

const state = {
  data: null,
  reduceEffects: false,
  uiSound: true,
  volume: 0.35,
  audioUnlocked: false,
  cart: [] // { shopId, shopName, itemName, priceNumber, priceUnit, note, district }
};

const els = {
  boot: document.getElementById("boot"),
  btnInit: document.getElementById("btnInit"),
  btnNoFx: document.getElementById("btnNoFx"),
  btnSound: document.getElementById("btnSound"),
  vol: document.getElementById("vol"),

  currencyBox: document.getElementById("currencyBox"),
  shopList: document.getElementById("shopList"),
  search: document.getElementById("search"),

  cartList: document.getElementById("cartList"),
  cartTotal: document.getElementById("cartTotal"),
  btnExport: document.getElementById("btnExport"),
  btnClear: document.getElementById("btnClear")
};

// Audio (mêmes fichiers que ta map)
const sounds = {
  click: new Audio("../assets/audio/ui_click.mp3"),
  ok: new Audio("../assets/audio/ui_ok.mp3"),
  warn: new Audio("../assets/audio/ui_warn.mp3")
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

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// Prefs + cart persistence
function loadPrefs(){
  try{
    const reduce = localStorage.getItem("reduceEffects_shop");
    if(reduce !== null) state.reduceEffects = (reduce === "1");
    const uiSound = localStorage.getItem("uiSound_shop");
    if(uiSound !== null) state.uiSound = (uiSound === "1");
    const vol = localStorage.getItem("uiVol_shop");
    if(vol !== null){
      const n = Number(vol);
      if(!Number.isNaN(n)) state.volume = Math.max(0, Math.min(1, n));
    }
    const cart = localStorage.getItem("lumia_cart");
    if(cart){
      const parsed = JSON.parse(cart);
      if(Array.isArray(parsed)) state.cart = parsed;
    }
  } catch {}
}
function savePrefs(){
  try{
    localStorage.setItem("reduceEffects_shop", state.reduceEffects ? "1" : "0");
    localStorage.setItem("uiSound_shop", state.uiSound ? "1" : "0");
    localStorage.setItem("uiVol_shop", String(state.volume));
    localStorage.setItem("lumia_cart", JSON.stringify(state.cart));
  } catch {}
}
function applyReduceEffects(){
  document.body.classList.toggle("reduce-effects", state.reduceEffects);
}

async function loadData(){
  const res = await fetch("../assets/data/lumia-shop.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Shop JSON not found");
  return res.json();
}

function renderCurrency(){
  const c = state.data.meta.currency;

  els.currencyBox.innerHTML = `
    <div class="currencyGrid">
      <div class="currencyCard">
        <div class="currencyName">${escapeHtml(c.name)} (${escapeHtml(c.symbol)})</div>
        <div class="currencyDesc">${escapeHtml(c.desc)}</div>
      </div>
      <div class="currencyCard">
        <div class="currencyName">${escapeHtml(c.street)}</div>
        <div class="currencyDesc">${escapeHtml(c.street_desc)}</div>
      </div>
    </div>

    <ul class="noteList">
      ${(c.notes || []).map(n => `<li>${escapeHtml(n)}</li>`).join("")}
    </ul>
  `;
}

function shopItemsCount(shop){
  let n = 0;
  (shop.sections || []).forEach(s => n += (s.items || []).length);
  return n;
}

function renderShops(filterText = ""){
  const q = (filterText || "").trim().toLowerCase();
  const shops = state.data.shops || [];

  const filtered = !q ? shops : shops.filter(shop => {
    const blobShop = `${shop.name} ${shop.district} ${shop.kind} ${shop.tagline} ${shop.desc}`.toLowerCase();
    if(blobShop.includes(q)) return true;

    return (shop.sections || []).some(sec =>
      (sec.items || []).some(it => {
        const blob = `${sec.title} ${it.name} ${it.unit || ""} ${it.note || ""}`.toLowerCase();
        return blob.includes(q);
      })
    );
  });

  if(!filtered.length){
    els.shopList.innerHTML = `<div class="muted">Aucun résultat.</div>`;
    return;
  }

  els.shopList.innerHTML = filtered.map(shop => {
    const count = shopItemsCount(shop);
    return `
      <div class="shop" data-shop="${escapeHtml(shop.id)}">
        <div class="shopHead">
          <div>
            <div class="shopTitle">${escapeHtml(shop.name)}</div>
            <div class="shopTagline">${escapeHtml(shop.tagline)}</div>
          </div>
          <div class="shopMeta">
            <div>${escapeHtml(shop.district)}</div>
            <div>${count} entrées</div>
          </div>
        </div>

        <div class="shopBody">
          <div class="shopDesc">${escapeHtml(shop.desc)}</div>

          ${(shop.sections || []).map(sec => `
            <div class="section">
              <div class="sectionTitle">${escapeHtml(sec.title)}</div>
              ${(sec.items || []).map(it => `
                <div class="item"
                  data-add="1"
                  data-shopid="${escapeHtml(shop.id)}"
                  data-shopname="${escapeHtml(shop.name)}"
                  data-district="${escapeHtml(shop.district)}"
                  data-item="${escapeHtml(it.name)}"
                  data-price="${escapeHtml(it.price)}"
                  data-unit="${escapeHtml(it.unit)}"
                  data-note="${escapeHtml(it.note || "")}"
                >
                  <div class="itemLeft">
                    <div class="itemName">${escapeHtml(it.name)}</div>
                    ${it.note ? `<div class="itemNote">${escapeHtml(it.note)}</div>` : ``}
                  </div>
                  <div class="itemRight">
                    <div class="price">${escapeHtml(it.price)} ${escapeHtml(it.unit)}</div>
                    <div class="priceSub">+ liste RP</div>
                  </div>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  // bind accordéons
  els.shopList.querySelectorAll(".shopHead").forEach(head => {
    head.addEventListener("click", () => {
      const shop = head.closest(".shop");
      const wasOpen = shop.classList.contains("open");

      // open/close simple (tu peux changer en multi-open si tu veux)
      els.shopList.querySelectorAll(".shop.open").forEach(x => x.classList.remove("open"));
      if(!wasOpen) shop.classList.add("open");

      safePlay(sounds.click);
    });
  });

  // bind add item
  els.shopList.querySelectorAll(".item[data-add='1']").forEach(row => {
    row.addEventListener("click", () => {
      addToCart({
        shopId: row.dataset.shopid,
        shopName: row.dataset.shopname,
        district: row.dataset.district,
        itemName: row.dataset.item,
        priceNumber: Number(row.dataset.price),
        priceUnit: row.dataset.unit,
        note: row.dataset.note
      });
    });
  });
}

function addToCart(entry){
  state.cart.push(entry);
  savePrefs();
  renderCart();
  safePlay(sounds.ok);
}

function removeFromCart(idx){
  state.cart.splice(idx, 1);
  savePrefs();
  renderCart();
  safePlay(sounds.click);
}

function cartTotalLMN(){
  let total = 0;
  for(const it of state.cart){
    // On totalise seulement les prix en LMN (pas les %, pas FAVOR)
    const unit = (it.priceUnit || "").toLowerCase();
    const isLMN = unit.includes("lmn");
    const isPercent = unit.includes("%");
    const isFavor = unit.includes("favor");
    if(isLMN && !isPercent && !isFavor && Number.isFinite(it.priceNumber)){
      total += it.priceNumber;
    }
  }
  return total;
}

function renderCart(){
  if(!state.cart.length){
    els.cartList.classList.add("muted");
    els.cartList.textContent = "Vide.";
    els.cartTotal.textContent = "0";
    return;
  }

  els.cartList.classList.remove("muted");

  els.cartList.innerHTML = state.cart.map((it, idx) => `
    <div class="cartRow">
      <div>
        <div class="cartName">${escapeHtml(it.itemName)}</div>
        <div class="cartMeta">${escapeHtml(it.shopName)} • ${escapeHtml(it.district)}</div>
      </div>
      <div>
        <div class="cartPrice">${escapeHtml(it.priceNumber)} ${escapeHtml(it.priceUnit)}</div>
        <div class="cartRemove" data-rm="${idx}">retirer</div>
      </div>
    </div>
  `).join("");

  els.cartList.querySelectorAll("[data-rm]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromCart(Number(btn.dataset.rm));
    });
  });

  els.cartTotal.textContent = String(cartTotalLMN());
}

async function exportCart(){
  if(!state.cart.length){
    safePlay(sounds.warn);
    return;
  }

  const lines = [];
  lines.push("LUMIA ISLAND — LISTE D’ACHATS RP");
  lines.push("--------------------------------------------------");
  for(const it of state.cart){
    lines.push(`- ${it.itemName} — ${it.priceNumber} ${it.priceUnit} @ ${it.shopName} (${it.district})`);
  }
  lines.push("--------------------------------------------------");
  lines.push(`TOTAL LMN (hors %, FAVOR): ${cartTotalLMN()}`);

  const txt = lines.join("\n");
  try{
    await navigator.clipboard.writeText(txt);
    safePlay(sounds.ok);
    alert("Export copié dans le presse-papier ✅");
  } catch {
    safePlay(sounds.warn);
    alert(txt);
  }
}

function bindUI(){
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
    renderShops(els.search.value);
    safePlay(sounds.click);
  });

  els.btnClear.addEventListener("click", () => {
    state.cart = [];
    savePrefs();
    renderCart();
    safePlay(sounds.warn);
  });

  els.btnExport.addEventListener("click", exportCart);
}

async function init(){
  loadPrefs();
  applyReduceEffects();
  applySoundSettings();
  bindUI();

  state.data = await loadData();
  renderCurrency();
  renderShops("");
  renderCart();
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
