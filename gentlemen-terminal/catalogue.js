/* =========================================================
   GENTLEMEN — catalogue.js (v1.1)
   - Catalogue PD (création only)
   - Stats ↟ cumulables (quantités)
   - Prix ↟ dynamique: <=65 => 1 PD | 66-80 => 2 PD | >80 bloqué
   - Audio: pas d’autoplay au load
           si déjà unlock une fois: relance au 1er clic au retour
========================================================= */

const LS = {
  reduceFx: "gentlemen:reduceFx",
  mute: "gentlemen:mute",
  vol: "gentlemen:vol",

  catSel: "gentlemen:catalogue:selection:v2",     // { id: true/qty }
  baseStats: "gentlemen:catalogue:basestats",     // { phys, tech, ment, soc }

  audioEver: "gentlemen:audioEverUnlocked"        // "1" if user unlocked once
};

const $ = (sel, root=document) => root.querySelector(sel);

/* ===================== AUDIO (strict unlock) ===================== */
let audioUnlocked = false;
const SFX = { click:null, confirm:null };
let bgm = null;

function createAudio(path, loop=false){
  const a = new Audio(path);
  a.preload = "auto";
  a.loop = loop;
  return a;
}

function getMute(){ return localStorage.getItem(LS.mute) === "1"; }
function setMute(on){
  $("#btnMute")?.setAttribute("aria-pressed", on ? "true" : "false");
  $("#muteState") && ($("#muteState").textContent = on ? "MUTE: ON" : "MUTE: OFF");
  localStorage.setItem(LS.mute, on ? "1" : "0");
  applyVolumes();
}

function getVol(){
  const raw = localStorage.getItem(LS.vol);
  const v = raw === null ? 0.42 : Number(raw);
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.42;
}
function setVol(v01){
  const v = Math.max(0, Math.min(1, v01));
  localStorage.setItem(LS.vol, String(v));
  applyVolumes();
}

function applyVolumes(){
  const v = getMute() ? 0 : getVol();
  if(SFX.click) SFX.click.volume = Math.min(1, v * 0.95);
  if(SFX.confirm) SFX.confirm.volume = Math.min(1, v * 1.0);
  if(bgm) bgm.volume = Math.min(1, v * 0.55);
}

function safePlay(aud){
  if(!audioUnlocked || getMute()) return;
  try{ aud.currentTime = 0; }catch(_){}
  const p = aud.play();
  if(p && typeof p.catch === "function") p.catch(()=>{});
}

function stopAllAudio(){
  [SFX.click, SFX.confirm, bgm].forEach(a=>{
    if(!a) return;
    try{ a.pause(); }catch(_){}
    try{ a.currentTime = 0; }catch(_){}
  });

  // important : au retour, le navigateur exige un nouveau geste utilisateur
  audioUnlocked = false;

  // réactive le bouton (au cas où page cache / bfcache)
  const b = document.querySelector("#btnUnlockAudio");
  if(b){
    b.disabled = false;
    const lab = b.querySelector(".btnLabel");
    if(lab) lab.textContent = "INITIALISER AUDIO";
  }
}

document.addEventListener("visibilitychange", ()=>{ if(document.hidden) stopAllAudio(); });
window.addEventListener("pagehide", stopAllAudio);

window.addEventListener("pageshow", () => {
  // Quand on revient sur la page (même depuis cache), on ré-arme la relance
  if(localStorage.getItem(LS.audioEver) === "1"){
    audioUnlocked = false; // on force un nouvel unlock (contexte audio nouveau)
    armAutoUnlockOnFirstGesture();
  }
});


/**
 * Unlock audio (user gesture required).
 * If user already unlocked once in the past, we auto-arm this on first click anywhere.
 */
async function unlockAudio(){
  // si déjà unlock: on tente juste de relancer la musique (utile si elle a été stoppée)
  if(audioUnlocked){
    applyVolumes();
    if(bgm && !getMute()){
      try{
        const p = bgm.play();
        if(p && typeof p.catch === "function") p.catch(()=>{});
      }catch(_){}
    }
    return;
  }

  // (re)crée les objets audio à chaque unlock :
  // plus fiable après retour de page / bfcache / restrictions navigateur
  SFX.click = createAudio("assets/audio/ui-click.mp3");
  SFX.confirm = createAudio("assets/audio/ui-confirm.mp3");
  bgm = createAudio("assets/audio/catalogue-ambience.mp3", true);

  try{
    // warmup obligatoire sur geste user
    SFX.click.volume = 0;
    const warm = SFX.click.play();
    if(warm && typeof warm.catch === "function") await warm.catch(()=>{});
    SFX.click.pause();
    SFX.click.currentTime = 0;

    audioUnlocked = true;
    localStorage.setItem(LS.audioEver, "1");
  }catch(_){
    audioUnlocked = false;
  }

  // UI bouton
  const b = document.querySelector("#btnUnlockAudio");
  if(b){
    b.disabled = audioUnlocked;
    const lab = b.querySelector(".btnLabel");
    if(lab) lab.textContent = audioUnlocked ? "AUDIO PRÊT" : "INITIALISER AUDIO";
  }

  applyVolumes();

  if(audioUnlocked){
    // petit feedback
    safePlay(SFX.confirm);

    // lancer la musique (sans autoplay car on est dans le clic)
    if(!getMute() && bgm){
      try{
        const p = bgm.play();
        if(p && typeof p.catch === "function") p.catch(()=>{});
      }catch(_){}
    }
  }
}


/** If previously unlocked once, relaunch audio on the first user interaction (no autoplay on load). */
function armAutoUnlockOnFirstGesture(){
  if(localStorage.getItem(LS.audioEver) !== "1") return;

  const b = $("#btnUnlockAudio");
  if(b){
    b.querySelector(".btnLabel").textContent = "AUDIO (CLIC POUR RELANCER)";
    b.disabled = false;
  }

  const handler = async () => {
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("keydown", handler, true);

    // unlock + relance musique (si déjà unlocked, on relance juste)
    await unlockAudio();

    if(audioUnlocked && bgm && !getMute()){
      try{
        const p = bgm.play();
        if(p && typeof p.catch === "function") p.catch(()=>{});
      }catch(_){}
    }
  };

  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("keydown", handler, true);
}


function wireGlobalSfx(){
  document.addEventListener("click", (e)=>{
    const t = e.target;
    if(!(t instanceof Element)) return;
    const inter = t.closest("button, a, select, input[type='range'], input[type='number']");
    if(!inter) return;

    const isConfirm =
      inter.id === "btnUnlockAudio" ||
      inter.id === "resetFilters" ||
      inter.id === "export" ||
      inter.id === "toggleSelect" ||
      inter.id === "closeDrawer" ||
      inter.id === "qtyPlus" ||
      inter.id === "qtyMinus";

    if(isConfirm) safePlay(SFX.confirm);
    else safePlay(SFX.click);
  }, true);
}

/* ===================== FX ===================== */
function getReduceFx(){ return localStorage.getItem(LS.reduceFx) === "1"; }
function setReduceFx(on){
  $("#app")?.classList.toggle("reduceFx", !!on);
  $("#btnReduceEffects")?.setAttribute("aria-pressed", on ? "true" : "false");
  $("#fxState") && ($("#fxState").textContent = on ? "FX: OFF" : "FX: ON");
  localStorage.setItem(LS.reduceFx, on ? "1" : "0");
}

/* ===================== DATA ===================== */
/*
  cost:
    - number => fixed cost PD
    - negative => gives PD (constraint)
  energyMaxDelta:
    - passifs/modifs/hybrids may reduce energy max (definitive)
*/
const CATALOGUE = [
  /* =========================================================
     STATS ↟ (quantités / prix dynamique par palier)
  ========================================================= */
  { id:"S-PHYS-5", statKey:"phys", name:"↟ PHYSIQUE +5", type:"Stats", district:"Manhattan Grid", cost:0, tags:["stat","création"], desc:"Augmentation du Physique (cumulable).", effect:"+5 Physique (prix par palier)", req:"—", notes:"<=65 : 1 PD · 66–80 : 2 PD · >80 : bloqué." },
  { id:"S-TECH-5", statKey:"tech", name:"↟ TECHNIQUE +5", type:"Stats", district:"Skyline Ward", cost:0, tags:["stat","précision"], desc:"Augmentation de Technique (cumulable).", effect:"+5 Technique (prix par palier)", req:"—", notes:"<=65 : 1 PD · 66–80 : 2 PD · >80 : bloqué." },
  { id:"S-MENT-5", statKey:"ment", name:"↟ MENTAL +5", type:"Stats", district:"Signal Basilica", cost:0, tags:["stat","sang-froid"], desc:"Augmentation du Mental (cumulable).", effect:"+5 Mental (prix par palier)", req:"—", notes:"<=65 : 1 PD · 66–80 : 2 PD · >80 : bloqué." },
  { id:"S-SOC-5", statKey:"soc", name:"↟ SOCIAL +5", type:"Stats", district:"Shin Arcade", cost:0, tags:["stat","couverture"], desc:"Augmentation du Social (cumulable).", effect:"+5 Social (prix par palier)", req:"—", notes:"<=65 : 1 PD · 66–80 : 2 PD · >80 : bloqué." },

  /* =========================================================
     VANTACORE (D1) — identité / dette / effacement
  ========================================================= */
  { id:"VC-LEDGER-IDSEALED", name:"Identité Scellée — Ledger Hall", type:"Équipement", district:"Vantacore", cost:2, tags:["identité","finance","contrat"], desc:"Profil propre et reconnu. Un nom qui tient debout.", effect:"1 fois/mission : ignorer une complication légale mineure si couverture plausible.", req:"SOC ≥ 45", notes:"Légal = traçable." },
  { id:"VC-VAULT19-KEY", name:"Clé Privée — Vault 19", type:"Équipement", district:"Vantacore", cost:2, tags:["secure","coffre","stash"], desc:"Accès à un coffre discret, sécurisé, froid.", effect:"Entre-missions : stocker 1 élément sensible hors radar (fiction).", req:"—", notes:"Vault 19 ne garde pas gratuitement." },
  { id:"VC-BROKER-FAVOR", name:"Faveur d’Intermédiaire — Broker’s Corner", type:"Équipement", district:"Vantacore", cost:1, tags:["contact","fixer","réseau"], desc:"Un nom, un angle, un passage.", effect:"+10 sur négociation de mission/offre si tu proposes quelque chose en échange.", req:"SOC ≥ 35", notes:"Les fixers se souviennent." },
  { id:"VC-CLEANROOM-WIPE", name:"Service — Clean Room (Wipe)", type:"Action", district:"Vantacore", cost:2, tags:["service","effacement","trace"], desc:"Nettoyage post-op : tu n’étais pas là.", effect:"Coût 1⚡ : réduire un tag de trace (HEAT/SURV/MEDIA) si plausible.", req:"MENT ≥ 45", notes:"La Clean Room remplace plus qu’elle efface." },
  { id:"VC-BLACKEX-TEMPID", name:"Identité Jetable — Black Exchange", type:"Équipement", district:"Vantacore", cost:1, tags:["market","identité","illégal"], desc:"Un badge temporaire, un faux souffle.", effect:"1 mission : +10 infiltration sociale si couverture cohérente.", req:"SOC ≥ 35", notes:"Après : risque de recoupement." },

  /* =========================================================
     SHIN ARCADE (D2) — rumeur / fixers / rare / social
  ========================================================= */
  { id:"SA-FIXERBOOTH-SLOT", name:"Accès — Fixer Booth (Slot)", type:"Équipement", district:"Shin Arcade", cost:1, tags:["contact","missions","off-book"], desc:"Un créneau pour un contrat qui n’existe pas.", effect:"1 fois/arc : obtenir une mission off-book (récompense narrative).", req:"SOC ≥ 40", notes:"Off-book = conséquences floues." },
  { id:"SA-VRPIT-TRAIN", name:"Sim — VR Pit (Prépa)", type:"Renforcement", district:"Shin Arcade", cost:2, tags:["training","simulation"], desc:"Tu répètes la scène avant de la vivre.", effect:"Avant mission : 1 avantage de préparation (+10 sur 1 type d’action).", req:"MENT ≥ 40", notes:"Si tu reconnais trop, c’est un problème." },
  { id:"SA-KITSUNE-ETIQUETTE", name:"Étiquette Kitsune — Lounge", type:"Équipement", district:"Shin Arcade", cost:2, tags:["social","négociation","premium"], desc:"Tu sais parler sans t’exposer.", effect:"1 fois/mission : convertir un échec social en succès mitigé (fiction).", req:"SOC ≥ 55", notes:"Un succès mitigé coûte quelque chose." },
  { id:"SA-BACKROOM13-RAREKIT", name:"Kit Rare — Backroom 13", type:"Équipement", district:"Shin Arcade", cost:3, tags:["black_market","rare","outil"], desc:"Un kit ‘impossible’ selon la ville.", effect:"Choisis 1 : micro-explosif discret / lockpick avancé / faux cachet douane.", req:"SOC ≥ 40", notes:"Backroom 13 vend des problèmes emballés." },
  { id:"SA-NIGHTSTRIP-RUMOR", name:"Rumeur Contrôlée — Nightstrip", type:"Équipement", district:"Shin Arcade", cost:1, tags:["district_core","rumeur","couverture"], desc:"Tu injectes un récit avant l’action.", effect:"1 fois/mission : +10 à la première interaction sociale liée à ta couverture.", req:"—", notes:"La rumeur attire aussi." },

  /* =========================================================
     MANHATTAN GRID (D3) — légal / contrats / corporate / hub
  ========================================================= */
  { id:"MG-SAFEHOUSE-CENTRAL", name:"Clé d’accès — Safehouse Central", type:"Équipement", district:"Manhattan Grid", cost:2, tags:["hub","safe","logistique"], desc:"Planque neutre, stockage, respiration.", effect:"Entre-missions : stabiliser 1 état narratif + préparer 1 avantage.", req:"—", notes:"Arc 4 : plus si safe." },
  { id:"MG-CONTRACT-BUREAU", name:"Dépôt Prioritaire — Contract Bureau", type:"Équipement", district:"Manhattan Grid", cost:2, tags:["contracts","procédure"], desc:"Tes contrats montent en haut de pile.", effect:"1 fois/arc : obtenir accès à une mission ‘premium’ (récompense).", req:"SOC ≥ 40", notes:"Le premium a toujours un sponsor." },
  { id:"MG-WRITSTEEL-COVER", name:"Couverture Juridique — Writ & Steel", type:"Équipement", district:"Manhattan Grid", cost:2, tags:["legal","tampon","protection"], desc:"Le monde croit à tes papiers.", effect:"1 fois/mission : annuler une conséquence légale directe si tu joues la procédure.", req:"SOC ≥ 45", notes:"La procédure se paie en dettes." },
  { id:"MG-OBSIDIAN-BADGE", name:"Badge Corporate — Obsidian Tower", type:"Équipement", district:"Manhattan Grid", cost:3, tags:["corporate","accès","badge"], desc:"Le masque propre, version luxe.", effect:"Accès : zones corporate +10 aux interactions ‘cadre’.", req:"SOC ≥ 55", notes:"Si tu trahis, la chute est verticale." },
  { id:"MG-METROHUB-GHOST", name:"Ticket ‘Ghost’ — Metro Hub", type:"Équipement", district:"Manhattan Grid", cost:1, tags:["transit","disparition"], desc:"Une traversée sans caméra utile.", effect:"1 fois/mission : +10 à l’exfiltration si tu passes par le hub.", req:"—", notes:"Le hub connaît tes horaires." },
  { id:"MG-GILDED-ROOM", name:"Salle Neutre — Gilded Hall", type:"Équipement", district:"Manhattan Grid", cost:1, tags:["meeting","neutral"], desc:"Rencontre propre, règles propres.", effect:"1 fois/arc : réunion sans violence (fiction).", req:"—", notes:"La neutralité n’est jamais gratuite." },

  /* =========================================================
     NOUVELLE-PARIS (D4) — mémoire / archives / souterrains
  ========================================================= */
  { id:"NP-ARCHIVE-SEPIA", name:"Index Sépia — Archive Sépia", type:"Équipement", district:"Nouvelle-Paris", cost:2, tags:["archive","vérité"], desc:"Accès à des dossiers originaux, non réécrits.", effect:"1 fois/arc : obtenir une info structurelle fiable.", req:"MENT ≥ 45", notes:"La vérité existe ici." },
  { id:"NP-MUSEE-NOIR-PASS", name:"Passe Musée Noir", type:"Équipement", district:"Nouvelle-Paris", cost:2, tags:["archive","prototype"], desc:"Tu visites les versions ratées.", effect:"+10 investigation liée au Projet Héritage (fiction).", req:"MENT ≥ 40", notes:"Tu risques de te reconnaître." },
  { id:"NP-SALON-VERRE-INV", name:"Invitation — Salon de Verre", type:"Équipement", district:"Nouvelle-Paris", cost:2, tags:["social","invitation-only"], desc:"Tu entres dans la conversation.", effect:"1 fois/mission : +10 social si tu joues ‘élite’.", req:"SOC ≥ 45", notes:"Le verre coupe." },
  { id:"NP-GALERIES-PASS", name:"Passage — Galeries Souterraines", type:"Équipement", district:"Nouvelle-Paris", cost:1, tags:["underground","passage"], desc:"Une route sous la ville.", effect:"1 fois/mission : éviter un contrôle (SURV) si tu passes par là.", req:"—", notes:"Sous la ville, tout écoute." },
  { id:"NP-CONTINENTAL-RULES", name:"Statut — Continental Annex", type:"Équipement", district:"Nouvelle-Paris", cost:2, tags:["safe","règles"], desc:"Un refuge. Des règles.", effect:"1 fois/arc : obtenir asile temporaire sans poursuite immédiate.", req:"SOC ≥ 35", notes:"Briser les règles = bannissement." },

  /* =========================================================
     RUSTBELT (D5) — armurerie / workshop / sabotage
  ========================================================= */
  { id:"RB-HARDLINE-SUPP", name:"Silencieux ‘Null-Noise’ — HARDLINE", type:"Équipement", district:"Rustbelt", cost:1, tags:["weapon_shop","silence"], desc:"Le tir qui ne résonne pas.", effect:"+10 neutralisation discrète au tir si plausible.", req:"TECH ≥ 40", notes:"Le silence ne protège pas de tout." },
  { id:"RB-HARDLINE-AMMO", name:"Munitions Spéciales (Pack)", type:"Équipement", district:"Rustbelt", cost:1, tags:["weapon_shop","ammo"], desc:"Le bon calibre au bon moment.", effect:"1 mission : +10 dégâts narratifs OU percer 1 protection légère (fiction).", req:"—", notes:"À déclarer avant la scène." },
  { id:"RB-WORKSHOP-OPTIM", name:"Ajustage — Workshop Row", type:"Modification", district:"Rustbelt", cost:2, tags:["workshop","calibrage"], desc:"Ton gear devient une extension stable.", effect:"+10 sur 1 catégorie d’outil (armes OU infiltration OU drones) au choix.", req:"TECH ≥ 45", notes:"Une optimisation, pas un miracle." },
  { id:"RB-SCRAPYARD-PARTS", name:"Pièces — Scrapyard Gate", type:"Équipement", district:"Rustbelt", cost:1, tags:["industry","pièces"], desc:"Des pièces qui ne sont pas censées exister.", effect:"Entre-missions : réparer/renforcer 1 équipement sans coût narratif.", req:"—", notes:"Traçabilité floue." },
  { id:"RB-SUB6-BLACKOUT", name:"Plan — Substation 6 (Blackout)", type:"Action", district:"Rustbelt", cost:2, tags:["infrastructure","sabotage"], desc:"Une coupure au bon moment.", effect:"Coût 1⚡ : provoquer une fenêtre ‘no cam’ locale (fiction).", req:"TECH ≥ 50", notes:"La ville réagit." },
  { id:"RB-GREYMARKET-TOOLS", name:"Kit Gris — Marché Gris", type:"Équipement", district:"Rustbelt", cost:2, tags:["black_market","outil"], desc:"Des outils non catalogués.", effect:"Choisis 1 : lockpick avancé / coupe-fil / microcam.", req:"—", notes:"Le gris colle aux doigts." },

  /* =========================================================
     BIOMIRE (D6) — clinique / augmentation / quarantaine
  ========================================================= */
  { id:"BM-HUSH-STITCH", name:"Soins Discrets — Clinique Hush", type:"Équipement", district:"BioMire", cost:2, tags:["medical","soins"], desc:"On te répare sans poser de question (sauf paiement).", effect:"Entre-missions : effacer 1 blessure légère OU stabiliser 1 trauma.", req:"—", notes:"Un patient sur trois n’a pas d’identité." },
  { id:"BM-IMPLANTBAY-CAL", name:"Calibrage — Implant Bay", type:"Modification", district:"BioMire", cost:3, tags:["augmentation","implant"], desc:"Ton corps accepte mieux l’inhumain.", effect:"Réduit le coût narratif des implants (fiction). Énergie max -1.", req:"SPÉCIAL ≥ 55", notes:"Tout ce qui rentre laisse une trace.", energyMaxDelta:-1 },
  { id:"BM-COMPLEX7-ACCESS", name:"Accès — Complexe 7 (dossier incomplet)", type:"Équipement", district:"BioMire", cost:3, tags:["laboratory","héritage"], desc:"Un bout de vérité biologique.", effect:"1 fois/arc : obtenir une info sur ton origine (ou variante).", req:"MENT ≥ 45", notes:"Incomplet ≠ faux." },
  { id:"BM-QUARANTINE-PASS", name:"Passe Quarantine Wing", type:"Équipement", district:"BioMire", cost:2, tags:["secure","danger"], desc:"Voir ce que tu pourrais devenir.", effect:"+10 résistance mentale face aux ‘miroirs’ (fiction).", req:"MENT ≥ 50", notes:"On y enferme des versions instables." },
  { id:"BM-COLDSTORAGE-STASH", name:"Caisse Scellée — Cold Storage", type:"Équipement", district:"BioMire", cost:2, tags:["storage","échantillon"], desc:"Un stockage froid, hors regard.", effect:"Entre-missions : conserver 1 preuve biologique / donnée sensible.", req:"—", notes:"Ce qui est froid ne dort pas." },

  /* =========================================================
     SKYLINE WARD (D7) — drones / verticalité / surveillance
  ========================================================= */
  { id:"SW-DRONE-MOTH", name:"Microdrone ‘Moth’", type:"Équipement", district:"Skyline Ward", cost:2, tags:["drone","reco"], desc:"Une aile dans l’angle mort.", effect:"1 fois/mission : révéler 1 menace/zone cachée.", req:"TECH ≥ 50", notes:"Le ciel est une salle de contrôle." },
  { id:"SW-NEEDLE-PERM", name:"Autorisation — Control Needle", type:"Équipement", district:"Skyline Ward", cost:2, tags:["surveillance","autorisation"], desc:"Tu passes parce que tu es ‘autorisé’.", effect:"1 fois/mission : éviter un scan si tu as une couverture crédible.", req:"SOC ≥ 40", notes:"Les autorisations laissent des logs." },
  { id:"SW-ROOFTOP-KIT", name:"Kit Vertical — Rooftop Spine", type:"Équipement", district:"Skyline Ward", cost:2, tags:["infiltration","vertical"], desc:"Grappin, ancrages, silencieux mécanique.", effect:"+10 infiltration verticale / fuite par les toits.", req:"PHYS ≥ 45", notes:"Tomber, c’est signer." },
  { id:"SW-SKYDOCK-EXFIL", name:"Jeton Extraction — SkyDock 03", type:"Équipement", district:"Skyline Ward", cost:3, tags:["air_transport","extraction"], desc:"Une extraction aérienne possible.", effect:"1 fois/arc : exfiltration ‘propre’ si la scène est jouable.", req:"—", notes:"Le prix dépend du bruit." },
  { id:"SW-FREIGHT-ELEV", name:"Accès — Freight Elevator", type:"Équipement", district:"Skyline Ward", cost:1, tags:["transit","accès"], desc:"Une montée discrète, un couloir technique.", effect:"+10 sur déplacement rapide vertical si plausible.", req:"—", notes:"Les couloirs techniques ne pardonnent pas." },

  /* =========================================================
     HARBORLINE (D8) — docks / douane / containers / underpier
  ========================================================= */
  { id:"HL-MANIFEST-FALSE", name:"Manifeste Falsifié — Customs Office", type:"Équipement", district:"Harborline", cost:2, tags:["legal","douane"], desc:"Les papiers disent que c’est bon.", effect:"1 mission : +10 import/export / passage barrière.", req:"SOC ≥ 40", notes:"Un tampon peut tuer un dossier." },
  { id:"HL-WAREHOUSEK-LOCK", name:"Box — Warehouse K", type:"Équipement", district:"Harborline", cost:2, tags:["storage","cache"], desc:"Un conteneur qui devient ton tiroir.", effect:"Entre-missions : stocker 1 équipement illégal sans fouille immédiate.", req:"—", notes:"Tout ce qui reste trop longtemps devient une preuve." },
  { id:"HL-DOCKS-INSIDE", name:"Contact Dock — Harborline Docks", type:"Équipement", district:"Harborline", cost:1, tags:["port","contact"], desc:"Quelqu’un te dit quand passer.", effect:"+10 sur infiltration portuaire / timing.", req:"SOC ≥ 35", notes:"Le port a ses propres lois." },
  { id:"HL-TUG-SABO", name:"Serrure Technique — Tug Station", type:"Action", district:"Harborline", cost:2, tags:["infrastructure","sabotage"], desc:"Une petite panne, un gros effet.", effect:"Coût 1⚡ : retarder un convoi / créer 1 fenêtre.", req:"TECH ≥ 45", notes:"Les docks détestent les retards." },
  { id:"HL-UNDERPIER-MEET", name:"Point Mort — Underpier", type:"Équipement", district:"Harborline", cost:1, tags:["underground","meeting"], desc:"Rencontre brève, sans nom.", effect:"1 fois/mission : échanger un objet/information sans exposition directe.", req:"—", notes:"On parle vite, on oublie vite." },

  /* =========================================================
     SIGNAL BASILICA (D9) — data / média / brouillage / récit
  ========================================================= */
  { id:"SB-DATACATH-KEY", name:"Clé de Session — Data-Cathédrale", type:"Équipement", district:"Signal Basilica", cost:3, tags:["data_center","accès"], desc:"Accès à des données trop lourdes pour les rues.", effect:"1 fois/arc : obtenir un ‘paquet’ de data utile (preuve ou levier).", req:"TECH ≥ 50", notes:"La data change la guerre." },
  { id:"SB-JAMMER-LOFT", name:"Brouilleur — Jammer Loft", type:"Équipement", district:"Signal Basilica", cost:2, tags:["tech","brouillage"], desc:"Une fenêtre numérique noire.", effect:"1 fois/mission : +10 infiltration numérique OU couper 1 drone/cam local (fiction).", req:"TECH ≥ 45", notes:"Le brouillage attire les yeux." },
  { id:"SB-BROADCAST-PULSE", name:"Pulse — Broadcast Core", type:"Action", district:"Signal Basilica", cost:2, tags:["media","récit"], desc:"Tu pousses un récit au bon moment.", effect:"Coût 1⚡ : réduire MEDIA (si plausible) ou créer une diversion narrative.", req:"SOC ≥ 40", notes:"Le récit est une arme." },
  { id:"SB-PRESS-VAULT", name:"Accès — Press Vault (preuves/montages)", type:"Équipement", district:"Signal Basilica", cost:2, tags:["archive","preuves"], desc:"Images, preuves, montages : la vérité malléable.", effect:"1 fois/arc : obtenir un dossier média (vrai ou falsifiable).", req:"MENT ≥ 40", notes:"Une preuve peut être retournée." },
  { id:"SB-SIGNAL-SPIRE", name:"Relais — Signal Spire", type:"Équipement", district:"Signal Basilica", cost:1, tags:["landmark","vue"], desc:"Position haute, signal haut.", effect:"+10 sur observation / repérage si tu prends le temps.", req:"—", notes:"Prendre le temps est dangereux." },

  /* =========================================================
     NOCTURNE RING (D10) — violence ritualisée / dettes / cage
  ========================================================= */
  { id:"NR-ARENA-ENTRY", name:"Accès — Nocturne Arena", type:"Équipement", district:"Nocturne Ring", cost:2, tags:["combat_zone","accès"], desc:"Tu entres dans la violence officielle.", effect:"1 fois/arc : obtenir un contact / sponsor via l’arène.", req:"PHYS ≥ 45 ou SOC ≥ 45", notes:"L’arène regarde tout." },
  { id:"NR-HOUSEBOOK-DEBT", name:"Inscription — House Book", type:"Contrainte", district:"Nocturne Ring", cost:-2, tags:["contracts","dette_sang"], desc:"Ton nom est inscrit. L’honneur se paie.", effect:"Gain +2 PD à la création.", req:"—", notes:"En campagne : dettes de sang / sanctions." },
  { id:"NR-CAGE-GLANCE", name:"Visite — The Cage", type:"Équipement", district:"Nocturne Ring", cost:2, tags:["combat_zone","héritage"], desc:"Voir les Gentlemen expérimentaux.", effect:"+10 pour comprendre/anticiper une menace ‘Gentlemen’ (fiction).", req:"MENT ≥ 45", notes:"Tu peux te reconnaître aussi." },
  { id:"NR-BACKSTAGE-PASS", name:"Passe — Backstage Corridor", type:"Équipement", district:"Nocturne Ring", cost:1, tags:["secure","accès"], desc:"Une porte derrière les cris.", effect:"+10 à exfiltration arène si tu connais les couloirs.", req:"—", notes:"Les couloirs ont des gardiens." },
  { id:"NR-EXIT-TUNNEL", name:"Route — Exit Tunnel", type:"Équipement", district:"Nocturne Ring", cost:1, tags:["underground","escape"], desc:"Une sortie qui ne devrait pas exister.", effect:"1 fois/mission : éviter un verrouillage si fuite souterraine plausible.", req:"—", notes:"Tout tunnel mène à un autre tunnel." },

  /* =========================================================
     ACTIONS (combat / infil / hack / clean)
  ========================================================= */
  { id:"A-CHIRURGICAL-SHOT", name:"⚔ Tir Chirurgical", type:"Action", district:"Manhattan Grid", cost:2, tags:["tir","précision"], desc:"Un tir. Une zone. Pas de bavure.", effect:"Coût 1⚡ : si réussite, neutralisation propre (évite alerte mineure).", req:"TECH ≥ 55", notes:"Tu ne tires pas. Tu conclus." },
  { id:"A-SNAP-HACK", name:"⚔ Hack Express", type:"Action", district:"Signal Basilica", cost:2, tags:["hack","réseau"], desc:"Tu convaincs le système qu’il était déjà ouvert.", effect:"Coût 1⚡ : 1 accès rapide (caméra/porte/terminal).", req:"TECH ≥ 50", notes:"Chaque hack laisse une signature." },
  { id:"A-QUIET-TAKEDOWN", name:"⚔ Neutralisation Rapide", type:"Action", district:"Skyline Ward", cost:2, tags:["close","infiltration"], desc:"Une main, un angle, fin.", effect:"Coût 1⚡ : neutraliser une cible isolée sans bruit majeur (fiction).", req:"PHYS ≥ 50", notes:"Si témoin : ça explose." },
  { id:"A-CLEANPOST", name:"⚔ Nettoyage Post-Op", type:"Action", district:"Vantacore", cost:2, tags:["trace","effacement"], desc:"Tu nettoies l’histoire.", effect:"Coût 1⚡ : réduire 1 tag HEAT/SURV/MEDIA si plausible.", req:"MENT ≥ 45", notes:"Effacer = déplacer." },
  { id:"A-PORT-SLIP", name:"⚔ Glissade Portuaire", type:"Action", district:"Harborline", cost:2, tags:["transit","port"], desc:"Passer quand personne ne regarde.", effect:"Coût 1⚡ : éviter un contrôle douane/port si route plausible.", req:"SOC ≥ 35", notes:"Les docks ont des chiens." },

  /* =========================================================
     RENFORCEMENTS (1 gratuit/combat, ensuite coût)
  ========================================================= */
  { id:"R-ADRENALINE", name:"⬚ Mode Adrénaline", type:"Renforcement", district:"Nocturne Ring", cost:1, tags:["combat","tempo"], desc:"Ton corps refuse de tomber.", effect:"(1 gratuit/combat) +10 sur 1 action physique/attaque ce tour.", req:"PHYS ≥ 45", notes:"Après : fatigue narrative possible." },
  { id:"R-ICEVEIN", name:"⬚ Verrou Émotionnel", type:"Renforcement", district:"Signal Basilica", cost:2, tags:["sang-froid"], desc:"Froid. Stable.", effect:"(1 gratuit/combat) ignorer 1 malus de panique/stress.", req:"MENT ≥ 55", notes:"Bloquer = payer plus tard." },
  { id:"R-FOCUS-TRACK", name:"⬚ Focus Tactique", type:"Renforcement", district:"Manhattan Grid", cost:1, tags:["tactique"], desc:"Tu vois la trajectoire.", effect:"(1 gratuit/combat) +10 sur tir OU hack OU social, au choix.", req:"MENT ≥ 45", notes:"Concentration = dette." },

  /* =========================================================
     PASSIFS (réduisent énergie max)
  ========================================================= */
  { id:"P-REFLEX", name:"○ Réflexes Conditionnés", type:"Passif", district:"BioMire", cost:3, tags:["réflexe","survie"], desc:"Ton corps répond avant toi.", effect:"Passif : +10 réactions/initiative. Énergie max -1.", req:"SPÉCIAL ≥ 50", notes:"Tu es programmé.", energyMaxDelta:-1 },
  { id:"P-QUIETHEART", name:"○ Cœur Silencieux", type:"Passif", district:"Nouvelle-Paris", cost:3, tags:["discrétion","pouls"], desc:"Respiration basse, rythme contrôlé.", effect:"Passif : +10 discrétion sous surveillance. Énergie max -1.", req:"MENT ≥ 50", notes:"Si tu craques, ça se voit.", energyMaxDelta:-1 },
  { id:"P-HARDLINE-SKIN", name:"○ Peau ‘Hardline’", type:"Passif", district:"Rustbelt", cost:4, tags:["armure","résistance"], desc:"Blindage sous la chair.", effect:"Passif : ignorer 1 blessure légère/mission. Énergie max -2.", req:"SPÉCIAL ≥ 60", notes:"Tu portes ton cercueil.", energyMaxDelta:-2 },
  { id:"P-CAMERA-SENSE", name:"○ Sens Caméra", type:"Passif", district:"Skyline Ward", cost:3, tags:["surveillance","angles"], desc:"Tu sens les angles morts.", effect:"Passif : +10 infiltration en zone surveillée. Énergie max -1.", req:"TECH ≥ 50", notes:"La ville est un œil.", energyMaxDelta:-1 },
  { id:"P-LIE-RESIST", name:"○ Résistance au Récit", type:"Passif", district:"Signal Basilica", cost:3, tags:["media","mental"], desc:"Tu ne bois pas tout.", effect:"Passif : ignorer 1 manipulation MEDIA/arc (fiction). Énergie max -1.", req:"MENT ≥ 55", notes:"Ça t’isole.", energyMaxDelta:-1 },

  /* =========================================================
     COMBOS (conditions → gratuit, sinon action coût doublé)
  ========================================================= */
  { id:"C-DEADANGLE", name:"◆ Angle Mort", type:"Combo", district:"Skyline Ward", cost:2, tags:["position","infiltration"], desc:"Bien placé → fin sans bruit.", effect:"Si cible isolée + couverture : neutralisation gratuite (fiction).", req:"TECH ≥ 45", notes:"Sinon : Action (2⚡)." },
  { id:"C-DOUBLETRUTH", name:"◆ Double Vérité", type:"Combo", district:"Signal Basilica", cost:2, tags:["mensonge","social"], desc:"Une vérité, puis une torsion.", effect:"Si tu possèdes une preuve : +20 bluff/pression.", req:"SOC ≥ 50", notes:"Sinon : exposition MEDIA." },
  { id:"C-EXITROUTE", name:"◆ Sortie Définitive", type:"Combo", district:"Nocturne Ring", cost:3, tags:["escape","extraction"], desc:"Une porte que personne ne voit.", effect:"Si exfil préparée : extraction sans jet majeur.", req:"MENT ≥ 50", notes:"Sinon : coûte 2⚡." },
  { id:"C-CLAUSE-KILL", name:"◆ Clause de Rupture", type:"Combo", district:"Vantacore", cost:2, tags:["contrat","légal"], desc:"Tu utilises la procédure comme une lame.", effect:"Si contrat signé/valide : annuler 1 sanction légale (fiction).", req:"SOC ≥ 45", notes:"Sinon : dette." },

  /* =========================================================
     MODIFICATIONS / HYBRIDATIONS (plus rares)
  ========================================================= */
  { id:"M-NEURAL-SPLICE", name:"⟁ Splice Neural", type:"Modification", district:"BioMire", cost:4, tags:["implant","réseau"], desc:"Une passerelle dans le crâne.", effect:"+10 hack +10 perception techno. Énergie max -1.", req:"SPÉCIAL ≥ 60, TECH ≥ 50", notes:"Tu n’es pas seul dans ta tête.", energyMaxDelta:-1 },
  { id:"M-BONE-REINFORCE", name:"⟁ Renfort Osseux", type:"Modification", district:"Rustbelt", cost:3, tags:["corps","choc"], desc:"Tes os ne cèdent plus facilement.", effect:"Ignorer 1 impact/chute significatif (fiction). Énergie max -1.", req:"SPÉCIAL ≥ 55", notes:"Solide ≠ indolore.", energyMaxDelta:-1 },
  { id:"M-RETINA-OVERLAY", name:"⟁ Overlay Rétinien", type:"Modification", district:"Skyline Ward", cost:3, tags:["vision","surveillance"], desc:"Ta vision lit les couches.", effect:"+10 repérage +10 tir de précision (fiction). Énergie max -1.", req:"SPÉCIAL ≥ 55, TECH ≥ 50", notes:"Les lumières te suivent.", energyMaxDelta:-1 },
  { id:"H-GLASSMORPH", name:"⟠ Trait ‘Glassmorph’", type:"Hybridation", district:"Shin Arcade", cost:4, tags:["mutation","camouflage"], desc:"Ta peau casse les reflets.", effect:"+15 discrétion visuelle. Énergie max -2.", req:"SPÉCIAL ≥ 65", notes:"On sent que quelque chose cloche.", energyMaxDelta:-2 },
  { id:"H-COLD-BLOOD", name:"⟠ Sang Froid (Bio)", type:"Hybridation", district:"BioMire", cost:4, tags:["bio","stress"], desc:"Ton corps gère l’adrénaline autrement.", effect:"1 fois/mission : ignorer panique/stress (fiction). Énergie max -2.", req:"SPÉCIAL ≥ 65, MENT ≥ 50", notes:"Les émotions te quittent.", energyMaxDelta:-2 },

  /* =========================================================
     CONTRAINTES (gain PD) — pour construire des fiches “à dette”
  ========================================================= */
  { id:"K-DEBT-LEDGER", name:"⚠ Dette Scellée (Contrat)", type:"Contrainte", district:"Vantacore", cost:-2, tags:["dette","contrat"], desc:"Tu dois quelque chose. Officiellement.", effect:"Gain +2 PD à la création.", req:"—", notes:"En campagne : pression/mission forcée possible." },
  { id:"K-SKYLINE-TRACE", name:"⚠ Trace Skyline", type:"Contrainte", district:"Skyline Ward", cost:-1, tags:["surveillance"], desc:"Ton signal est trop visible.", effect:"Gain +1 PD à la création.", req:"—", notes:"En campagne : scans plus fréquents." },
  { id:"K-BIOMIRE-UNSTABLE", name:"⚠ Instabilité Bio", type:"Contrainte", district:"BioMire", cost:-2, tags:["bio","instable"], desc:"Ton corps accepte… mais il le fait payer.", effect:"Gain +2 PD à la création.", req:"SPÉCIAL ≥ 55", notes:"En campagne : 1 complication/mission possible." },
  { id:"K-PRESS-FILE", name:"⚠ Dossier Média", type:"Contrainte", district:"Signal Basilica", cost:-1, tags:["media"], desc:"Quelqu’un a un récit sur toi.", effect:"Gain +1 PD à la création.", req:"—", notes:"En campagne : risque MEDIA (rumeur/montage)." },
  { id:"K-HARBOR-OWE", name:"⚠ Dette Portuaire", type:"Contrainte", district:"Harborline", cost:-1, tags:["port","contrebandier"], desc:"Tu dois un service à un dockmaster.", effect:"Gain +1 PD à la création.", req:"—", notes:"En campagne : appel de dette." },
  { id:"K-RING-ODDS", name:"⚠ Paris sur ton Nom", type:"Contrainte", district:"Nocturne Ring", cost:-1, tags:["ring","réputation"], desc:"Quelqu’un parie ta chute.", effect:"Gain +1 PD à la création.", req:"—", notes:"En campagne : duels/pression." }
];


/* ===================== BASE STATS ===================== */
function loadBaseStats(){
  try{
    const raw = localStorage.getItem(LS.baseStats);
    if(!raw) return { phys:50, tech:50, ment:50, soc:50 };
    const o = JSON.parse(raw);
    return {
      phys: clampStep(Number(o.phys ?? 50)),
      tech: clampStep(Number(o.tech ?? 50)),
      ment: clampStep(Number(o.ment ?? 50)),
      soc: clampStep(Number(o.soc ?? 50)),
    };
  }catch(_){
    return { phys:50, tech:50, ment:50, soc:50 };
  }
}
function saveBaseStats(bs){
  localStorage.setItem(LS.baseStats, JSON.stringify(bs));
}

/* ===================== SELECTION MODEL (v2) ===================== */
/**
 * selection = {
 *   "ID-XXX": true,          // regular items (toggle)
 *   "S-PHYS-5": 3            // Stats items (quantity)
 * }
 */
function loadSelection(){
  try{
    const raw = localStorage.getItem(LS.catSel);
    if(!raw) return {};
    const o = JSON.parse(raw);
    return (o && typeof o === "object") ? o : {};
  }catch(_){
    return {};
  }
}
function saveSelection(sel){
  localStorage.setItem(LS.catSel, JSON.stringify(sel));
}

const BASE_PD = 12;
let baseStats = loadBaseStats();
let selection = loadSelection();

function isStatsItem(it){ return it.type === "Stats"; }
function getQty(id){
  const v = selection[id];
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}
function setQty(id, qty){
  if(qty <= 0) delete selection[id];
  else selection[id] = qty;
  saveSelection(selection);
}

function isSelected(id){
  return selection[id] === true;
}
function setSelected(id, on){
  if(on) selection[id] = true;
  else delete selection[id];
  saveSelection(selection);
}

/* ===================== PRICING ↟ ===================== */
function statsStepCost(currentValue){
  // price determined by current value BEFORE +5
  if(currentValue <= 65) return 1;
  if(currentValue >= 66 && currentValue <= 80) return 2;
  return null; // invalid / should not happen
}
function canBuyNextStep(currentValue){
  const next = currentValue + 5;
  // block if would exceed 80
  if(next > 80) return false;
  return true;
}

/** compute total cost for a stat pack based on base + qty steps */
function computeStatsCostForQty(baseValue, qty){
  let cost = 0;
  let value = baseValue;

  for(let i=0; i<qty; i++){
    if(!canBuyNextStep(value)) return { ok:false, cost, final:value };
    const c = statsStepCost(value);
    if(c === null) return { ok:false, cost, final:value };
    cost += c;
    value += 5;
  }
  return { ok:true, cost, final:value };
}

/* ===================== BUDGET ===================== */
function calcBudget(){
  let fixedUsed = 0;
  let gain = 0;

  // fixed items
  for(const [id,val] of Object.entries(selection)){
    const it = CATALOGUE.find(x => x.id === id);
    if(!it) continue;

    if(isStatsItem(it)) continue;

    if(val === true){
      if(it.cost >= 0) fixedUsed += it.cost;
      else gain += Math.abs(it.cost);
    }
  }

  // stats items cost dynamic
  const statItems = CATALOGUE.filter(isStatsItem);
  let statsUsed = 0;

  for(const it of statItems){
    const qty = getQty(it.id);
    if(qty <= 0) continue;

    const key = it.statKey;
    const base = baseStats[key];
    const res = computeStatsCostForQty(base, qty);
    statsUsed += res.cost; // even if ok false, we keep partial but UI blocks buying past
  }

  // energy max delta from passifs/modifs/hybrids
  let energyDelta = 0;
  for(const [id,val] of Object.entries(selection)){
    const it = CATALOGUE.find(x => x.id === id);
    if(!it) continue;

    const chosen = (val === true) || (isStatsItem(it) && Number(val) > 0);
    if(!chosen) continue;

    if(typeof it.energyMaxDelta === "number") energyDelta += it.energyMaxDelta;
  }

  const total = BASE_PD + gain;
  const used = fixedUsed + statsUsed;
  const left = total - used;

  return { total, used, left, gain, energyDelta };
}

/* ===================== RENDER ===================== */
let currentDrawerId = null;

function iconForType(type){
  return ({
    "Action":"⚔",
    "Renforcement":"⬚",
    "Passif":"○",
    "Combo":"◆",
    "Équipement":"⧉",
    "Modification":"⟁",
    "Hybridation":"⟠",
    "Contrainte":"⚠",
    "Stats":"↟"
  })[type] || "•";
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function pill(txt){
  const d = document.createElement("span");
  d.className = "pill";
  d.textContent = txt;
  return d;
}

function render(){
  const grid = $("#grid");
  if(!grid) return;

  const q = ($("#q")?.value || "").trim().toLowerCase();
  const type = ($("#type")?.value || "");
  const district = ($("#district")?.value || "");
  const cost = ($("#cost")?.value || "");

  const list = CATALOGUE.filter(it => {
    const hay = `${it.name} ${it.type} ${it.district} ${(it.tags||[]).join(" ")} ${it.desc} ${it.effect||""} ${it.req||""} ${it.notes||""}`.toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(type && it.type !== type) return false;
    if(district && it.district !== district) return false;

    if(cost){
      if(cost === "gain") return it.cost < 0;
      if(cost === "5") return it.cost >= 5;
      const n = Number(cost);
      if(Number.isFinite(n)) return it.cost === n;
    }
    return true;
  });

  grid.innerHTML = "";
  for(const it of list){
    grid.appendChild(makeCard(it));
  }

  $("#count") && ($("#count").textContent = String(list.length));
  updateBudgetUI();
}

function makeCard(it){
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = it.id;

  const isStats = isStatsItem(it);
  const qty = isStats ? getQty(it.id) : 0;

  const selected = isStats ? (qty > 0) : isSelected(it.id);
  if(selected) div.classList.add("selected");

  const costLabel = it.cost >= 0 ? `PD ${it.cost}` : `GAIN +${Math.abs(it.cost)} PD`;
  const meta = `${iconForType(it.type)} ${it.type} · ${it.district}`;

  div.innerHTML = `
    <div class="cardTop">
      <div>
        <div class="cTitle">${escapeHtml(it.name)}</div>
        <div class="cMeta mono">${escapeHtml(meta)}</div>
      </div>
      <div class="cCost">${escapeHtml(isStats ? "↟ DYNAMIQUE" : costLabel)}</div>
    </div>
    <div class="cDesc">${escapeHtml(it.desc)}</div>
    <div class="pills"></div>
    ${isStats ? `
      <div class="qtyMini">
        <span class="qtyTag mono">x<span data-qty>${qty}</span></span>
        <div class="stepper">
          <button class="stepBtn" data-step="minus" type="button" aria-label="Moins">−</button>
          <button class="stepBtn" data-step="plus" type="button" aria-label="Plus">+</button>
        </div>
      </div>
    ` : ``}
  `;

  const pillsEl = $(".pills", div);
  (it.tags || []).slice(0,4).forEach(t => pillsEl.appendChild(pill(t)));

  // interactions
  div.addEventListener("dblclick", () => openDrawer(it.id));

  if(isStats){
    // clicks on step buttons
    div.querySelectorAll(".stepBtn").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.stopPropagation();
        const dir = btn.getAttribute("data-step");
        if(dir === "plus") incStats(it.id);
        else decStats(it.id);
      });
    });

    // single click open drawer (clean)
    div.addEventListener("click", () => openDrawer(it.id));
  }else{
    // normal: click toggle ; dblclick opens drawer already
    div.addEventListener("click", () => toggle(it.id));
  }

  return div;
}

function updateCardQty(id){
  const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  if(!card) return;
  const qty = getQty(id);
  const el = card.querySelector("[data-qty]");
  if(el) el.textContent = String(qty);
  card.classList.toggle("selected", qty > 0);
}

/* ===================== TOGGLES ===================== */
function toggle(id){
  const on = isSelected(id);
  setSelected(id, !on);
  render();
  if(currentDrawerId === id) updateDrawerButton();
}

/* ===================== STATS INCREMENT/DECREMENT ===================== */
function incStats(id){
  const it = CATALOGUE.find(x => x.id === id);
  if(!it || !isStatsItem(it)) return;

  const key = it.statKey;
  const base = baseStats[key];
  const qty = getQty(id);
  const currentValue = base + (qty * 5);

  if(!canBuyNextStep(currentValue)){
    toast("↟ Bloqué : > 80. Passe par Modif/Hybridation.");
    return;
  }

  // budget guard: allow even if negative? we warn by UI, but block if would exceed budget
  const before = calcBudget();
  const stepCost = statsStepCost(currentValue);
  const afterLeft = before.left - stepCost;
  if(afterLeft < 0){
    toast("Budget insuffisant : retire ou prends une contrainte.");
    return;
  }

  setQty(id, qty + 1);
  render();
  if(currentDrawerId === id) syncDrawerQty();
}

function decStats(id){
  const it = CATALOGUE.find(x => x.id === id);
  if(!it || !isStatsItem(it)) return;

  const qty = getQty(id);
  if(qty <= 0) return;

  setQty(id, qty - 1);
  render();
  if(currentDrawerId === id) syncDrawerQty();
}

/* ===================== DRAWER ===================== */
function openDrawer(id){
  const it = CATALOGUE.find(x => x.id === id);
  if(!it) return;
  currentDrawerId = id;

  $("#dTitle").textContent = it.name;

  // meta
  let meta = `${iconForType(it.type)} ${it.type} · ${it.district}`;
  if(isStatsItem(it)){
    const key = it.statKey;
    const qty = getQty(it.id);
    const base = baseStats[key];
    const res = computeStatsCostForQty(base, qty);
    const final = res.final;
    meta += ` · base ${base} → ${final} · coût actuel ${res.cost} PD`;
  }else{
    meta += ` · ${it.cost >= 0 ? `PD ${it.cost}` : `GAIN +${Math.abs(it.cost)} PD`}`;
  }
  $("#dMeta").textContent = meta;

  // pills
  const pillsEl = $("#dPills");
  pillsEl.innerHTML = "";
  (it.tags || []).forEach(t => pillsEl.appendChild(pill(t)));
  pillsEl.appendChild(pill(it.district));

  // qty block
  const qtyBlock = $("#dQtyBlock");
  if(isStatsItem(it)){
    qtyBlock.style.display = "block";
    syncDrawerQty();
  }else{
    qtyBlock.style.display = "none";
  }

  $("#dDesc").textContent = it.desc || "—";
  $("#dEffect").textContent = it.effect || "—";
  $("#dReq").textContent = it.req || "—";
  $("#dNotes").textContent = it.notes || "—";

  updateDrawerButton();

  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden","false");
}

function closeDrawer(){
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden","true");
  currentDrawerId = null;
}

function updateDrawerButton(){
  const btn = $("#toggleSelect");
  if(!btn || !currentDrawerId) return;

  const it = CATALOGUE.find(x => x.id === currentDrawerId);
  if(!it) return;

  if(isStatsItem(it)){
    btn.style.display = "none"; // stats use qty buttons
    return;
  }
  btn.style.display = "";

  const on = isSelected(currentDrawerId);
  btn.querySelector(".btnLabel").textContent = on ? "RETIRER DE LA SÉLECTION" : "AJOUTER À LA SÉLECTION";
}

function syncDrawerQty(){
  if(!currentDrawerId) return;
  const it = CATALOGUE.find(x => x.id === currentDrawerId);
  if(!it || !isStatsItem(it)) return;

  $("#qtyVal").textContent = String(getQty(it.id));
}

/* ===================== EXPORT ===================== */
function exportSelection(){
  const chosen = [];
  for(const [id,val] of Object.entries(selection)){
    const it = CATALOGUE.find(x => x.id === id);
    if(!it) continue;

    if(isStatsItem(it)){
      const qty = Number(val) || 0;
      if(qty > 0) chosen.push({ it, qty });
    }else if(val === true){
      chosen.push({ it, qty:1 });
    }
  }

  const b = calcBudget();

  const lines = [];
  lines.push("=== GENTLEMEN · FEUILLE D’ACHATS (CRÉATION) ===");
  lines.push(`Budget total : ${b.total} PD | Dépensé : ${b.used} PD | Reste : ${b.left} PD | Gains : +${b.gain} PD`);
  if(b.energyDelta !== 0) lines.push(`Impact passifs/modifs : Énergie max ${b.energyDelta} (définitif)`);
  lines.push("");

  // Stats summary
  const statSummary = [];
  for(const si of CATALOGUE.filter(isStatsItem)){
    const qty = getQty(si.id);
    if(qty <= 0) continue;
    const base = baseStats[si.statKey];
    const res = computeStatsCostForQty(base, qty);
    statSummary.push(`- ${si.name}: x${qty} | ${base} → ${res.final} | coût ${res.cost} PD`);
  }
  if(statSummary.length){
    lines.push("[STATS ↟]");
    lines.push(...statSummary);
    lines.push("");
  }

  // Other entries grouped by type
  const groups = {};
  for(const {it} of chosen){
    if(isStatsItem(it)) continue;
    (groups[it.type] ||= []).push(it);
  }
  Object.keys(groups).sort().forEach(k=>{
    lines.push(`[${k}]`);
    groups[k].forEach(it=>{
      const costLabel = it.cost >= 0 ? `PD ${it.cost}` : `GAIN +${Math.abs(it.cost)} PD`;
      lines.push(`- ${it.name} (${costLabel}) — ${it.district}`);
      if(it.effect) lines.push(`  Effet: ${it.effect}`);
      if(it.req && it.req !== "—") lines.push(`  Prérequis: ${it.req}`);
    });
    lines.push("");
  });

  // Base stats
  lines.push("[BASE STATS]");
  lines.push(`PHYS ${baseStats.phys} | TECH ${baseStats.tech} | MENT ${baseStats.ment} | SOC ${baseStats.soc}`);
  lines.push("");

  const out = lines.join("\n");
  navigator.clipboard?.writeText(out).then(()=>{
    toast("Export copié.");
  }).catch(()=>{
    prompt("Copie manuelle :", out);
  });
}

/* ===================== UI BUDGET ===================== */
function updateBudgetUI(){
  const b = calcBudget();
  $("#pdTotal") && ($("#pdTotal").textContent = String(b.total));
  $("#pdUsed") && ($("#pdUsed").textContent = String(b.used));
  $("#pdLeft") && ($("#pdLeft").textContent = String(b.left));

  const hint = $("#budgetHint");
  if(hint){
    const warn = b.left < 0 ? "Budget dépassé : retire des entrées ou prends une contrainte." :
                 b.left === 0 ? "Budget parfait : fiche verrouillable." :
                 "Tu peux encore affiner ton agent.";
    const e = b.energyDelta < 0 ? ` | ⚡ Énergie max ${b.energyDelta}` : "";
    hint.textContent = warn + e;
  }
}

/* ===================== HELPERS ===================== */
function clampStep(v){
  if(!Number.isFinite(v)) return 50;
  const n = Math.max(0, Math.min(100, v));
  // force step=5
  return Math.round(n / 5) * 5;
}

let toastTimer = null;
function toast(msg){
  clearTimeout(toastTimer);
  const el = document.createElement("div");
  el.className = "toast mono";
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(()=> el.classList.add("show"));
  toastTimer = setTimeout(()=>{
    el.classList.remove("show");
    setTimeout(()=> el.remove(), 200);
  }, 1600);
}

/* ===================== BOOT ===================== */
document.addEventListener("DOMContentLoaded", ()=>{
  setReduceFx(getReduceFx());

  // base stats inputs
  $("#bPhys").value = String(baseStats.phys);
  $("#bTech").value = String(baseStats.tech);
  $("#bMent").value = String(baseStats.ment);
  $("#bSoc").value  = String(baseStats.soc);

  const onBaseChange = ()=>{
    baseStats = {
      phys: clampStep(Number($("#bPhys").value)),
      tech: clampStep(Number($("#bTech").value)),
      ment: clampStep(Number($("#bMent").value)),
      soc:  clampStep(Number($("#bSoc").value)),
    };
    $("#bPhys").value = String(baseStats.phys);
    $("#bTech").value = String(baseStats.tech);
    $("#bMent").value = String(baseStats.ment);
    $("#bSoc").value  = String(baseStats.soc);
    saveBaseStats(baseStats);
    render();
  };
  ["bPhys","bTech","bMent","bSoc"].forEach(id=>{
    $("#"+id)?.addEventListener("change", onBaseChange);
  });

  // volume
  const volEl = $("#vol");
  if(volEl){
    volEl.value = String(Math.round(getVol()*100));
    volEl.addEventListener("input", ()=> setVol(Number(volEl.value)/100));
  }
  setMute(getMute());

  $("#btnUnlockAudio")?.addEventListener("click", unlockAudio);
  $("#btnMute")?.addEventListener("click", ()=> setMute(!getMute()));
  $("#btnReduceEffects")?.addEventListener("click", ()=> setReduceFx(!getReduceFx()));

  wireGlobalSfx();
  applyVolumes();

  // IMPORTANT: music comes back on return (first gesture autounlock if ever unlocked)
  armAutoUnlockOnFirstGesture();

  // search & filters
  $("#q")?.addEventListener("input", render);
  $("#type")?.addEventListener("change", render);
  $("#district")?.addEventListener("change", render);
  $("#cost")?.addEventListener("change", render);

  $("#clearQ")?.addEventListener("click", ()=>{
    $("#q").value = "";
    render();
    $("#q").focus();
  });

  $("#resetFilters")?.addEventListener("click", ()=>{
    $("#q").value = "";
    $("#type").value = "";
    $("#district").value = "";
    $("#cost").value = "";
    render();
  });

  // drawer
  $("#drawer")?.addEventListener("click", (e)=>{
    if(e.target === $("#drawer")) closeDrawer();
  });
  $("#closeDrawer")?.addEventListener("click", closeDrawer);

  $("#qtyPlus")?.addEventListener("click", ()=>{
    if(!currentDrawerId) return;
    incStats(currentDrawerId);
    syncDrawerQty();
  });
  $("#qtyMinus")?.addEventListener("click", ()=>{
    if(!currentDrawerId) return;
    decStats(currentDrawerId);
    syncDrawerQty();
  });

  $("#toggleSelect")?.addEventListener("click", ()=>{
    if(!currentDrawerId) return;
    toggle(currentDrawerId);
    updateDrawerButton();
  });

  // export
  $("#export")?.addEventListener("click", exportSelection);

  render();
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

