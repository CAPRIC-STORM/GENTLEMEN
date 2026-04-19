/* =========================================================
   GENTLEMEN — TERMINAL PNJ (MJ TOOL)
   v4: branche sur les catalogues canoniques Saison I / Saison II
   ========================================================= */

const LS_ACTIVE = "gentlemen_pnj_active_v4";
const LS_REDUCE = "gentlemen_reduce_fx";
const LS_FAVS = "gentlemen_pnj_favs_v1";

const $ = (id) => document.getElementById(id);

const energyFromSpecial = (spe) => Math.round(Number(spe || 0) * 0.1);
const clampMin0 = (n) => Math.max(0, Number(n || 0));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickManyUnique = (arr, count) => {
  const copy = arr.slice();
  const out = [];
  for (let i = 0; i < count && copy.length; i += 1) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

const DATA_FILES = {
  bases: "assets/data/pnj-bases.json",
  templates: "assets/data/pnj-templates.json",
  catalogueS1: "assets/data/catalogue-s1.json",
  catalogueNexus: "assets/data/catalogue-nexus.json",
  overrides: "assets/data/pnj-overrides.json"
};

const PACK = {
  capacities: [],
  skills: [],
  gear: [],
  items: [],
  archetypes: []
};

const DATA = {
  bases: [],
  templates: [],
  catalogueS1: [],
  catalogueNexus: [],
  overrides: []
};

const CURATED_NEXUS_ARCHETYPES = [
  {
    id: "nexus_predator",
    baseId: "heritage",
    name: "Sujet Nexus — Prédateur",
    mode: "season2",
    roles: ["combat", "infil"],
    style: "Traque, bond, lecture du vivant, chasse rapprochée.",
    families: ["Noyau", "Physique", "Sensoriel", "Apex", "Instabilité"],
    coreId: "NX-CORE-PREDATOR",
    picks: ["NX-PHYS-CLAWS", "NX-SENS-THERMAL", "NX-APEX-CHIMERA", "NX-INSTAB-HUNGER"],
    defaults: { gear: ["Stabilisateur Héritage"], items: ["Noyau Prédateur — sujet calibré"] }
  },
  {
    id: "nexus_fortress",
    baseId: "soldat_aug",
    name: "Sujet Nexus — Forteresse",
    mode: "hybrid",
    roles: ["combat", "support"],
    style: "Tenue de ligne, encaissement monstrueux, verrou vivant.",
    families: ["Noyau", "Physique", "Organique", "Vital", "Apex", "Instabilité"],
    coreId: "NX-CORE-FORTRESS",
    picks: ["NX-PHYS-DENSITY", "NX-ORG-CHITINE", "NX-VITAL-REFUS", "NX-APEX-BASTION"],
    defaults: { gear: ["Armure augmentée"], items: ["Bastion Héritage — protocole défensif"] }
  },
  {
    id: "nexus_brasier",
    baseId: "heritage",
    name: "Sujet Nexus — Brasier",
    mode: "season2",
    roles: ["combat", "tech"],
    style: "Surchauffe, ignition, pression, destruction contrôlée.",
    families: ["Noyau", "Organique", "Thermique", "Instabilité"],
    coreId: "NX-CORE-BRASIER",
    picks: ["NX-ORG-COMBUST", "NX-THERM-PURGE", "NX-INSTAB-FEVER", "NX-INSTAB-MARK"],
    defaults: { gear: ["Amplificateur Nexus"], items: ["Canule thermique scellée"] }
  },
  {
    id: "nexus_dualite",
    baseId: "fixer_genie",
    name: "Sujet Nexus — Dualité",
    mode: "hybrid",
    roles: ["social", "tech"],
    style: "Calcul, lecture tactique, dédoublement cognitif, autorité froide.",
    families: ["Noyau", "Neurocognitif", "Sensoriel", "Nexus", "Instabilité"],
    coreId: "NX-CORE-DUALITE",
    picks: ["NX-NEURO-SECOND-MIND", "NX-NEURO-ANTICIP", "NX-SENS-NEXUS", "NX-INSTAB-FRACTURE"],
    defaults: { gear: ["Interface neuronale"], items: ["Dossier miroir — conscience auxiliaire"] }
  },
  {
    id: "nexus_cryoforme",
    baseId: "infil",
    name: "Sujet Nexus — Cryoforme",
    mode: "season2",
    roles: ["infil", "tech"],
    style: "Neutralisation froide, contrôle de zone, effacement méthodique.",
    families: ["Noyau", "Sensoriel", "Thermique", "Instabilité"],
    coreId: "NX-CORE-CRYOFORME",
    picks: ["NX-SENS-THERMAL", "NX-THERM-CRYO-LANCE", "NX-INSTAB-MARK"],
    defaults: { gear: ["Lunettes multi-spectres"], items: ["Ampoule cryoformée scellée"] }
  },
  {
    id: "nexus_oracle_prime",
    baseId: "baron",
    name: "Oracle Nexus — Prime Harmonique",
    mode: "hybrid",
    roles: ["social", "tech"],
    style: "Stabilise, lit, apaise ou reconfigure le champ autour de lui.",
    families: ["Noyau", "Sensoriel", "Neurocognitif", "Nexus", "Instabilité"],
    coreId: "NX-CORE-DUALITE",
    picks: ["NX-SENS-NEXUS", "NX-NEURO-SECOND-MIND", "NX-NEXUS-HARMONY", "NX-INSTAB-FRACTURE"],
    defaults: { gear: ["Modulateur émotionnel"], items: ["Fragment d'harmonie archivé"] }
  },
  {
    id: "nexus_drain_revenant",
    baseId: "heritage",
    name: "Revenant Nexus — Seuil Vorace",
    mode: "season2",
    roles: ["combat", "social"],
    style: "Survit au bord de la rupture, tient debout en volant de la durée aux autres.",
    families: ["Noyau", "Vital", "Nexus", "Instabilité"],
    coreId: "NX-CORE-FORTRESS",
    picks: ["NX-VITAL-REFUS", "NX-VITAL-DRAIN", "NX-INSTAB-HUNGER", "NX-INSTAB-MARK"],
    defaults: { gear: ["Stabilisateur Héritage"], items: ["Protocole de contention vital"] }
  },
  {
    id: "nexus_chimera_hunter",
    baseId: "blackwater",
    name: "Chimère BLACKWATER — Apex de traque",
    mode: "hybrid",
    roles: ["combat", "infil"],
    style: "Prédateur de crise, solution terminale, intervention de chasse pure.",
    families: ["Noyau", "Physique", "Sensoriel", "Apex", "Instabilité"],
    coreId: "NX-CORE-PREDATOR",
    picks: ["NX-PHYS-CLAWS", "NX-SENS-THERMAL", "NX-APEX-CHIMERA", "NX-INSTAB-HUNGER"],
    defaults: { gear: ["Armure augmentée", "Balise de traque"], items: ["Dossier BLACKWATER // classe chimère"] }
  }
];

const CURATED_OPERATIONAL_ARCHETYPES = [
  {
    id: "vantacore_broker",
    baseId: "fixer_genie",
    name: "Broker Vantacore — Coupeur de dettes",
    mode: "season1",
    roles: ["social", "tech"],
    style: "Fixer premium, dette propre, faux papiers, effacement discret.",
    s1Picks: ["VC-BROKER-FAVOR", "VC-CLEANROOM-WIPE", "VC-LEDGER-IDSEALED", "MG-WRITSTEEL-COVER"],
    defaults: { gear: ["Interface neuronale"], items: ["Registre noir de dettes actives"] }
  },
  {
    id: "skyline_operator",
    baseId: "hacker",
    name: "Opérateur Skyline — Contrôle aérien",
    mode: "season1",
    roles: ["tech", "support"],
    style: "Maîtrise du flux, drones, angles morts, intervention à distance.",
    s1Picks: ["SW-DRONE-MOTH", "SW-NEEDLE-PERM", "SW-FREIGHT-ELEV", "RB-SUB6-BLACKOUT"],
    defaults: { gear: ["Drone de reconnaissance", "Micro-drones espions"], items: ["Canal de supervision pirate"] }
  },
  {
    id: "nocturne_executioner",
    baseId: "close",
    name: "Exécuteur Nocturne — Cage breaker",
    mode: "season1",
    roles: ["combat", "infil"],
    style: "Violence rapide, lecture de foule, intimidation de fosse, sortie sanglante.",
    s1Picks: ["NR-ARENA-ENTRY", "NR-CAGE-GLANCE", "NR-BACKSTAGE-PASS", "SA-NIGHTSTRIP-RUMOR"],
    defaults: { gear: ["Lames mono-fil"], items: ["Jeton House Book marqué"] }
  },
  {
    id: "nouvelle_paris_ghost",
    baseId: "infil",
    name: "Fantôme Nouvelle-Paris — Galerie noire",
    mode: "season1",
    roles: ["infil", "social"],
    style: "Infiltration feutrée, archives, salons privés, sorties sous la ville.",
    s1Picks: ["NP-ARCHIVE-SEPIA", "NP-GALERIES-PASS", "NP-SALON-VERRE-INV", "NP-CONTINENTAL-RULES"],
    defaults: { gear: ["Grapin magnétique"], items: ["Carte Sépia contrefaite"] }
  },
  {
    id: "biomire_doc",
    baseId: "hacker",
    name: "Doc BioMire — Clinique de survie",
    mode: "season1",
    roles: ["support", "tech"],
    style: "Répare, stabilise, recoud, trafique les protocoles de survie.",
    s1Picks: ["BM-HUSH-STITCH", "BM-IMPLANTBAY-CAL", "BM-COLDSTORAGE-STASH", "BM-QUARANTINE-PASS"],
    defaults: { gear: ["Stabilisateur Héritage"], items: ["Mallette de greffes froides"] }
  },
  {
    id: "harborline_smuggler",
    baseId: "gang",
    name: "Contrebandier Harborline — Sous-pont",
    mode: "season1",
    roles: ["combat", "social"],
    style: "Transit sale, planques mobiles, pression portuaire et fuite par l’eau.",
    s1Picks: ["HL-UNDERPIER-MEET", "HL-MANIFEST-FALSE", "HL-DOCKS-INSIDE", "K-HARBOR-OWE"],
    defaults: { gear: ["Balise de traque"], items: ["Conteneur fantôme"] }
  },
  {
    id: "corporate_revenant",
    baseId: "soldat_aug",
    name: "Revenant Corporate — Tour Obsidian",
    mode: "hybrid",
    roles: ["combat", "social"],
    style: "Cadre propre en façade, tueur de couloir en réalité.",
    s1Picks: ["MG-OBSIDIAN-BADGE", "MG-CONTRACT-BUREAU", "RB-WORKSHOP-OPTIM"],
    nexusPicks: ["NX-CORE-FORTRESS", "NX-PHYS-DENSITY"],
    defaults: { gear: ["Armure augmentée", "Armes intelligentes"], items: ["Ordre corporate scellé"] }
  },
  {
    id: "signal_basilica_oracle",
    baseId: "fixer_genie",
    name: "Oracle Basilica — Écho de signal",
    mode: "hybrid",
    roles: ["social", "tech"],
    style: "Manipulation doctrinale, pression symbolique, lecture des anomalies et emprise mentale.",
    s1Picks: ["SB-DATACATH-KEY", "SB-BROADCAST-PULSE", "SB-PRESS-VAULT"],
    nexusPicks: ["NX-SENS-NEXUS", "NX-NEURO-ANTICIP"],
    defaults: { gear: ["Modulateur émotionnel"], items: ["Fragment de chœur archivé"] }
  },
  {
    id: "skyline_wraith",
    baseId: "infil",
    name: "Wraith Skyline — Toits morts",
    mode: "season1",
    roles: ["infil", "tech"],
    style: "Verticalité, angles morts, extraction discrète et disparition immédiate.",
    s1Picks: ["SW-ROOFTOP-KIT", "SW-SKYDOCK-EXFIL", "SB-JAMMER-LOFT", "MG-METROHUB-GHOST"],
    defaults: { gear: ["Grapin magnétique", "Micro-drones espions"], items: ["Harnais de chute silencieux"] }
  },
  {
    id: "rustbelt_gunsmith",
    baseId: "gang",
    name: "Armurier Rustbelt — Atelier gris",
    mode: "season1",
    roles: ["combat", "tech"],
    style: "Fabrique, ajuste, alimente, transforme chaque échange en feu soutenu.",
    s1Picks: ["RB-HARDLINE-SUPP", "RB-HARDLINE-AMMO", "RB-WORKSHOP-OPTIM", "RB-GREYMARKET-TOOLS"],
    defaults: { gear: ["Armes intelligentes"], items: ["Caisse HARDLINE modifiée"] }
  },
  {
    id: "harbor_extractor",
    baseId: "infil",
    name: "Extracteur Harborline — Ligne noire",
    mode: "season1",
    roles: ["infil", "support"],
    style: "Sort les gens, les caisses ou les preuves par l'eau, les docks et les angles morts.",
    s1Picks: ["HL-MANIFEST-FALSE", "HL-TUG-SABO", "HL-UNDERPIER-MEET", "HL-WAREHOUSEK-LOCK"],
    defaults: { gear: ["Balise de traque"], items: ["Trajet maritime fantôme"] }
  },
  {
    id: "vantacore_cleaner",
    baseId: "fixer_genie",
    name: "Cleaner Vantacore — Dissolution",
    mode: "season1",
    roles: ["social", "infil"],
    style: "Nettoie les traces, remplace les noms, enterre les dettes visibles.",
    s1Picks: ["VC-CLEANROOM-WIPE", "VC-BLACKEX-TEMPID", "VC-VAULT19-KEY", "MG-WRITSTEEL-COVER"],
    defaults: { gear: ["Téléphone jetable"], items: ["Registre de remplacement d'identité"] }
  },
  {
    id: "basilica_blackmailer",
    baseId: "fixer_genie",
    name: "Chanteur Basilica — Presse noire",
    mode: "season1",
    roles: ["social", "tech"],
    style: "Fait pression par les archives, les ondes, les aveux et les dossiers montés.",
    s1Picks: ["SB-PRESS-VAULT", "SB-BROADCAST-PULSE", "SB-SIGNAL-SPIRE", "K-PRESS-FILE"],
    defaults: { gear: ["Modulateur émotionnel"], items: ["Compilation d'aveux sous scellés"] }
  },
  {
    id: "paris_curator",
    baseId: "fixer_genie",
    name: "Curateur Nouvelle-Paris — Musée fermé",
    mode: "season1",
    roles: ["social", "infil"],
    style: "Collectionne les accès, les œuvres sensibles et les invités qui ne devraient pas exister.",
    s1Picks: ["NP-MUSEE-NOIR-PASS", "NP-ARCHIVE-SEPIA", "NP-SALON-VERRE-INV", "NP-CONTINENTAL-RULES"],
    defaults: { gear: ["Couverture juridique"], items: ["Catalogue noir annoté"] }
  },
  {
    id: "biomire_reclaimer",
    baseId: "heritage",
    name: "Récupérateur BioMire — Salle froide",
    mode: "hybrid",
    roles: ["support", "tech"],
    style: "Récupère les sujets, rafistole le vivant et sait quand garder un corps pour plus tard.",
    s1Picks: ["BM-HUSH-STITCH", "BM-COLDSTORAGE-STASH", "BM-QUARANTINE-PASS", "BM-IMPLANTBAY-CAL"],
    nexusPicks: ["NX-VITAL-REFUS"],
    defaults: { gear: ["Stabilisateur Héritage"], items: ["Capsule de récupération biomire"] }
  },
  {
    id: "obsidian_director",
    baseId: "baron",
    name: "Directeur Obsidian — Contrat final",
    mode: "hybrid",
    roles: ["social", "combat"],
    style: "Pouvoir corporate froid, ordres courts, violence déléguée puis assumée.",
    s1Picks: ["MG-OBSIDIAN-BADGE", "MG-CONTRACT-BUREAU", "VC-LEDGER-IDSEALED", "SA-FIXERBOOTH-SLOT"],
    nexusPicks: ["NX-CORE-DUALITE", "NX-NEURO-ANTICIP"],
    defaults: { gear: ["Armure augmentée"], items: ["Mandat d'annulation corporate"] }
  },
  {
    id: "blackwater_sweeper",
    baseId: "blackwater",
    name: "BLACKWATER — Sweep terminal",
    mode: "hybrid",
    roles: ["combat", "support"],
    style: "Entre, nettoie, scelle, puis laisse les autres écrire le rapport.",
    s1Picks: ["RB-SUB6-BLACKOUT", "MG-SAFEHOUSE-CENTRAL", "SW-NEEDLE-PERM", "NR-EXIT-TUNNEL"],
    nexusPicks: ["NX-CORE-FORTRESS", "NX-PHYS-DENSITY", "NX-VITAL-REFUS"],
    defaults: { gear: ["Armes intelligentes", "Armure augmentée"], items: ["Ordre Sweep // confirmation noire"] }
  },
  {
    id: "shin_arcade_fox",
    baseId: "hacker",
    name: "Renard Shin Arcade — Slot fantôme",
    mode: "season1",
    roles: ["tech", "social"],
    style: "Glisse entre les rumeurs, les jeux, les booths et les dettes ludiques.",
    s1Picks: ["SA-FIXERBOOTH-SLOT", "SA-VRPIT-TRAIN", "SA-KITSUNE-ETIQUETTE", "SA-NIGHTSTRIP-RUMOR"],
    defaults: { gear: ["Interface neuronale"], items: ["Jeton Kitsune marqué"] }
  }
];

let favOnly = false;
let selectedIndex = 0;
let favs = new Set(JSON.parse(localStorage.getItem(LS_FAVS) || "[]"));

let active = {
  id: null,
  name: "PNJ —",
  tier: "",
  mode: "",
  source: "",
  roles: [],
  stats: { vie: 0, phy: 0, spe: 0, men: 0, soc: 0 },
  energy: 0,
  loadout: [],
  notes: ""
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

async function fetchJson(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Fetch failed for ${file}`);
  return res.json();
}

function flash(msg) {
  const prev = $("typeLine").textContent;
  $("typeLine").textContent = msg;
  setTimeout(() => {
    $("typeLine").textContent = prev;
  }, 900);
}

function badgeTier(tier) {
  if (tier === "civil") return "CIVIL";
  if (tier === "humain") return "HUMAIN";
  if (tier === "top") return "TOP";
  if (tier === "surhumain") return "50+";
  if (tier === "anomalie") return "60+";
  if (tier === "event") return "EVENT";
  return String(tier || "—").toUpperCase();
}

function modeLabel(mode) {
  if (mode === "season1") return "S1";
  if (mode === "season2") return "S2";
  if (mode === "hybrid") return "HYBRIDE";
  return "—";
}

function setReduceFx(on) {
  document.documentElement.classList.toggle("reduceFx", !!on);
  document.documentElement.style.setProperty("--fx", on ? "0" : "1");
  localStorage.setItem(LS_REDUCE, on ? "1" : "0");
}

function deriveCapacityCategory(entry) {
  const hay = normalizeText([entry.name, entry.desc, entry.effect, entry.family, ...(entry.tags || [])].join(" "));
  if (entry.source === "catalogue-nexus") return "nexus";
  if (/(mental|memoire|analyse|sang-froid|lecture|parano|social|negociation)/.test(hay)) return "mental";
  if (/(vision|audit|spectrale|tracking|trace|surveillance|sensor|camouflage)/.test(hay)) return "sens";
  return "phys";
}

function deriveSkillRole(entry) {
  if (entry.role) return entry.role;
  const roles = entry.usable_by_roles || [];
  if (roles.includes("combat")) return "combat";
  if (roles.includes("infil")) return "infil";
  if (roles.includes("tech")) return "tech";
  if (roles.includes("social")) return "social";
  if (entry.source === "catalogue-nexus") return "nexus";
  return "general";
}

function buildCanonicalCapacities() {
  const capacities = [];

  DATA.catalogueS1
    .filter((entry) => ["Passif", "Renforcement", "Modification", "Hybridation", "Stats"].includes(entry.type))
    .forEach((entry) => {
      capacities.push({
        id: entry.id,
        cat: deriveCapacityCategory(entry),
        name: entry.name,
        desc: `${entry.type} · ${entry.effect || entry.desc}`,
        loadout: `${entry.type.toUpperCase()} — ${entry.name} : ${entry.effect || entry.desc}`,
        roles: entry.usable_by_roles || ["general"],
        modes: ["season1", "hybrid"],
        source: entry.source
      });
    });

  DATA.catalogueNexus
    .filter((entry) => entry.kind !== "instabilite")
    .forEach((entry) => {
      capacities.push({
        id: entry.id,
        cat: "nexus",
        name: `[${entry.family}] ${entry.name}`,
        desc: `Classe ${entry.tier} · ${entry.effect}`,
        loadout: `NEXUS — [${entry.family}/${entry.tier}] ${entry.name} : ${entry.effect}`,
        roles: ["combat", "tech", "social", "nexus"],
        modes: entry.usable_by_modes || ["season2", "hybrid"],
        source: entry.source
      });
    });

  return capacities;
}

function buildCanonicalSkills() {
  const skills = [];

  DATA.catalogueS1
    .filter((entry) => ["Action", "Combo", "Équipement"].includes(entry.type))
    .forEach((entry) => {
      skills.push({
        id: entry.id,
        role: deriveSkillRole(entry),
        name: entry.name,
        desc: entry.effect || entry.desc,
        loadout: `${entry.type.toUpperCase()} — ${entry.name} : ${entry.effect || entry.desc}`,
        modes: ["season1", "hybrid"],
        source: entry.source
      });
    });

  DATA.catalogueNexus
    .filter((entry) => entry.kind === "capacite" || entry.kind === "amplificateur" || entry.kind === "instabilite")
    .forEach((entry) => {
      skills.push({
        id: entry.id,
        role: deriveSkillRole(entry),
        name: `[${entry.family}] ${entry.name}`,
        desc: `${entry.effect} | Risque: ${entry.risk}`,
        loadout: `NEXUS — [${entry.family}/${entry.tier}] ${entry.name} : ${entry.effect}`,
        modes: entry.usable_by_modes || ["season2", "hybrid"],
        source: entry.source
      });
    });

  DATA.templates.forEach((template) => {
    (template.s1_picks || []).forEach((pick) => {
      skills.push({
        id: pick.id,
        role: "general",
        name: pick.label,
        desc: pick.effect,
        loadout: `KIT — ${pick.label} : ${pick.effect}`,
        modes: template.modes || [template.mode],
        source: pick.source || "template-mj"
      });
    });
  });

  return skills;
}

function buildGearPool() {
  const gear = new Set();
  DATA.catalogueS1
    .filter((entry) => entry.type === "Équipement")
    .forEach((entry) => gear.add(entry.name));
  DATA.bases.forEach((base) => {
    (base.default_loadout || []).filter((item) => item.type === "gear").forEach((item) => gear.add(item.name));
  });
  DATA.templates.forEach((template) => {
    (template.loadout?.gear || []).forEach((item) => gear.add(item));
  });
  return [...gear].sort((a, b) => a.localeCompare(b, "fr"));
}

function buildItemPool() {
  const items = new Set();
  DATA.catalogueNexus.forEach((entry) => items.add(`${entry.name}`));
  DATA.templates.forEach((template) => {
    (template.loadout?.items || []).forEach((item) => items.add(item));
  });
  return [...items].sort((a, b) => a.localeCompare(b, "fr"));
}

function buildArchetypes() {
  const templatesById = new Map(DATA.templates.map((template) => [template.id, template]));

  const baseArchetypes = DATA.bases.map((base) => {
    const template = templatesById.get(base.id);
    return {
      id: base.id,
      tier: base.tier,
      mode: base.mode,
      modes: base.modes || [base.mode],
      roles: base.roles || [],
      name: base.label,
      style: base.style || template?.summary || "",
      stats: base.stats,
      kit: (template?.s1_picks || []).map((pick) => ({ name: pick.label, desc: pick.effect, source: pick.source })),
      defaults: {
        gear: (template?.loadout?.gear || []).slice(),
        items: (template?.loadout?.items || []).slice()
      },
      allowed_catalogue_tags: base.allowed_catalogue_tags || [],
      allowed_nexus_families: base.allowed_nexus_families || [],
      mj_signature: template?.mj_signature || {},
      source: template?.source || "template-mj"
    };
  });

  const byId = new Map(baseArchetypes.map((entry) => [entry.id, entry]));
  const s1ById = new Map(DATA.catalogueS1.map((entry) => [entry.id, entry]));
  const nexusById = new Map(DATA.catalogueNexus.map((entry) => [entry.id, entry]));

  const curatedOperational = CURATED_OPERATIONAL_ARCHETYPES.map((preset) => {
    const base = byId.get(preset.baseId) || baseArchetypes[0];
    const s1Picks = (preset.s1Picks || []).map((id) => s1ById.get(id)).filter(Boolean);
    const nexusPicks = (preset.nexusPicks || []).map((id) => nexusById.get(id)).filter(Boolean);
    const nexusFamilies = [...new Set(nexusPicks.map((entry) => entry.family))];

    return {
      id: preset.id,
      tier: base.tier,
      mode: preset.mode,
      modes: [preset.mode],
      roles: preset.roles,
      name: preset.name,
      style: preset.style,
      stats: { ...base.stats },
      kit: [
        ...s1Picks.map((entry) => ({
          name: entry.name,
          desc: entry.effect || entry.desc,
          source: "catalogue-s1",
          entryId: entry.id
        })),
        ...nexusPicks.map((entry) => ({
          name: entry.name,
          desc: entry.effect,
          source: "catalogue-nexus",
          entryId: entry.id,
          family: entry.family
        }))
      ],
      defaults: {
        gear: [...(base.defaults?.gear || []), ...(preset.defaults?.gear || [])],
        items: [...(base.defaults?.items || []), ...(preset.defaults?.items || [])]
      },
      allowed_catalogue_tags: base.allowed_catalogue_tags || [],
      allowed_nexus_families: [...new Set([...(base.allowed_nexus_families || []), ...nexusFamilies])],
      mj_signature: {
        style: preset.style,
        routine: preset.roles.join(" / "),
        faille: "",
        notes: ""
      },
      source: preset.mode === "season1" ? "catalogue-s1" : "template-mj"
    };
  });

  const curated = CURATED_NEXUS_ARCHETYPES.map((preset) => {
    const base = byId.get(preset.baseId) || baseArchetypes[0];
    const core = nexusById.get(preset.coreId);
    const picks = preset.picks.map((id) => nexusById.get(id)).filter(Boolean);

    return {
      id: preset.id,
      tier: base.tier,
      mode: preset.mode,
      modes: [preset.mode],
      roles: preset.roles,
      name: preset.name,
      style: preset.style,
      stats: { ...base.stats },
      kit: [
        ...(core ? [{ name: core.name, desc: core.effect, source: "catalogue-nexus", entryId: core.id, family: core.family }] : []),
        ...picks.map((entry) => ({
          name: entry.name,
          desc: entry.effect,
          source: "catalogue-nexus",
          entryId: entry.id,
          family: entry.family
        }))
      ],
      defaults: {
        gear: [...(base.defaults?.gear || []), ...(preset.defaults?.gear || [])],
        items: [...(base.defaults?.items || []), ...(preset.defaults?.items || [])]
      },
      allowed_catalogue_tags: base.allowed_catalogue_tags || [],
      allowed_nexus_families: preset.families,
      mj_signature: {
        style: preset.style,
        routine: preset.roles.join(" / "),
        faille: "",
        notes: ""
      },
      source: "catalogue-nexus"
    };
  });

  return [...curatedOperational, ...curated, ...baseArchetypes];
}

function hydratePack() {
  PACK.capacities = buildCanonicalCapacities();
  PACK.skills = buildCanonicalSkills();
  PACK.gear = buildGearPool();
  PACK.items = buildItemPool();
  PACK.archetypes = buildArchetypes();
}

async function loadData() {
  const [bases, templates, catalogueS1, catalogueNexus, overrides] = await Promise.all([
    fetchJson(DATA_FILES.bases),
    fetchJson(DATA_FILES.templates),
    fetchJson(DATA_FILES.catalogueS1),
    fetchJson(DATA_FILES.catalogueNexus),
    fetchJson(DATA_FILES.overrides)
  ]);

  DATA.bases = bases;
  DATA.templates = templates;
  DATA.catalogueS1 = catalogueS1;
  DATA.catalogueNexus = catalogueNexus;
  DATA.overrides = overrides;

  hydratePack();
}

function currentFilters() {
  const q = ($("q").value || "").toLowerCase().trim();
  const tier = $("tier").value;
  const role = $("role").value;
  const mode = $("modeFilter")?.value || "";
  return { q, tier, role, mode };
}

function getCurrentArchetype() {
  return PACK.archetypes.find((entry) => entry.id === active.id) || PACK.archetypes[0] || null;
}

function filteredArchetypes() {
  const { q, tier, role, mode } = currentFilters();
  let arr = PACK.archetypes.slice();

  if (favOnly) arr = arr.filter((a) => favs.has(a.id));
  if (tier) arr = arr.filter((a) => a.tier === tier);
  if (role) arr = arr.filter((a) => a.roles.includes(role));
  if (mode) arr = arr.filter((a) => a.mode === mode);

  if (q) {
    arr = arr.filter((a) => {
      const hay = `${a.name} ${a.style} ${a.roles.join(" ")} ${a.kit.map((x) => x.name).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return arr;
}

function updateFilterInfo(count) {
  const { tier, role, mode } = currentFilters();
  const bits = [
    count === 1 ? "1 dossier" : `${count} dossiers`,
    tier ? badgeTier(tier) : "tous tiers",
    role ? role : "tous rôles",
    mode ? modeLabel(mode) : "tous modes"
  ];
  $("filterInfo").textContent = bits.join(" · ");
}

function renderList() {
  const list = $("list");
  const arr = filteredArchetypes();
  list.innerHTML = "";
  updateFilterInfo(arr.length);

  if (selectedIndex >= arr.length) selectedIndex = Math.max(0, arr.length - 1);

  arr.forEach((a, i) => {
    const el = document.createElement("div");
    el.className = "card" + (active.id === a.id ? " sel" : "");
    el.innerHTML = `
      <div class="cardTop">
        <div class="cardName">${escapeHTML(a.name)}</div>
        <div class="badge">${badgeTier(a.tier)} · ${modeLabel(a.mode)} ${favs.has(a.id) ? "★" : ""}</div>
      </div>
      <div class="cardDesc">${escapeHTML(a.style)}</div>
      <div class="cardMini">
        ${a.roles.map((r) => `<span class="tag">${escapeHTML(r.toUpperCase())}</span>`).join("")}
        <span class="tag">${a.kit.length} PICKS</span>
        <span class="tag">${escapeHTML(String(a.source || "template-mj").toUpperCase())}</span>
      </div>
    `;
    el.onclick = () => loadArchetype(a.id, { randomize: false });
    el.ondblclick = () => toggleFav(a.id);
    list.appendChild(el);

    if (i === selectedIndex) el.scrollIntoView({ block: "nearest" });
  });
}

function renderBaseSelect() {
  const sel = $("base");
  sel.innerHTML = "";
  PACK.archetypes.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.name} · ${modeLabel(a.mode)}`;
    sel.appendChild(opt);
  });
}

function sectionHeader(text) {
  const el = document.createElement("div");
  el.className = "pick";
  el.innerHTML = `<div class="pickTitle"><b>${escapeHTML(text)}</b><span class="tag">POOL</span></div>`;
  return el;
}

function makePick(title, desc, onClick) {
  const el = document.createElement("div");
  el.className = "pick";
  el.innerHTML = `
    <div class="pickTitle"><b>${escapeHTML(title)}</b><span class="tag">ADD</span></div>
    <div class="pickSmall">${escapeHTML(desc)}</div>
  `;
  el.onclick = onClick;
  el.ondblclick = () => removeLoadoutByTitle(title.replace("+ ", ""));
  return el;
}

function isEntryAllowedForArchetype(entry, archetype) {
  if (!archetype) return true;

  const modeOk = !entry.modes || entry.modes.includes(archetype.mode) || (archetype.mode === "hybrid" && entry.modes.includes("season1"));
  if (!modeOk) return false;

  if (entry.source === "catalogue-s1") {
    if (!archetype.allowed_catalogue_tags?.length) return true;
    const tags = (entry.tags || []).map((tag) => normalizeText(tag));
    const allowed = archetype.allowed_catalogue_tags.map((tag) => normalizeText(tag));
    const roleOk = !entry.roles || entry.roles.includes("general") || entry.roles.some((role) => archetype.roles.includes(role));
    return roleOk || tags.some((tag) => allowed.includes(tag));
  }

  if (entry.source === "catalogue-nexus") {
    if (!archetype.allowed_nexus_families?.length) return archetype.mode !== "season1";
    return archetype.allowed_nexus_families.map((family) => normalizeText(family)).includes(normalizeText(entry.family || entry.cat));
  }

  return true;
}

function renderTabs() {
  const cap = $("tab-cap");
  const skills = $("tab-skills");
  const gear = $("tab-gear");
  const items = $("tab-items");
  const archetype = getCurrentArchetype();

  cap.innerHTML = "";
  skills.innerHTML = "";
  gear.innerHTML = "";
  items.innerHTML = "";

  const capGroups = ["mental", "phys", "sens", "nexus"];
  capGroups.forEach((group) => {
    const entries = PACK.capacities.filter((entry) => entry.cat === group && isEntryAllowedForArchetype(entry, archetype));
    if (!entries.length) return;
    cap.appendChild(sectionHeader(`Capacités: ${group.toUpperCase()}`));
    entries.forEach((entry) => {
      cap.appendChild(makePick(`+ ${entry.name}`, entry.desc, () => addLoadout(entry.loadout)));
    });
  });

  ["combat", "infil", "tech", "social", "general", "nexus"].forEach((group) => {
    const entries = PACK.skills.filter((entry) => entry.role === group && isEntryAllowedForArchetype(entry, archetype));
    if (!entries.length) return;
    skills.appendChild(sectionHeader(`Compétences: ${group.toUpperCase()}`));
    entries.forEach((entry) => {
      skills.appendChild(makePick(`+ ${entry.name}`, entry.desc, () => addLoadout(entry.loadout)));
    });
  });

  PACK.gear
    .filter((entry) => {
      if (!archetype) return true;
      const hay = normalizeText(entry);
      return !archetype.allowed_catalogue_tags?.length ||
        archetype.allowed_catalogue_tags.some((tag) => hay.includes(normalizeText(tag))) ||
        (archetype.defaults?.gear || []).includes(entry);
    })
    .forEach((entry) => {
      gear.appendChild(makePick(`+ ${entry}`, "Gadget / équipement issu du catalogue ou du template", () => addLoadout(`GEAR — ${entry}`)));
    });

  PACK.items
    .filter((entry) => {
      if (!archetype) return true;
      const hay = normalizeText(entry);
      return archetype.mode !== "season1" || (archetype.defaults?.items || []).includes(entry);
    })
    .forEach((entry) => {
      items.appendChild(makePick(`+ ${entry}`, "Item rare / ressource Nexus / élément narratif", () => addLoadout(`ITEM — ${entry}`)));
    });

  document.querySelector('[data-tab="cap"]').textContent = `Capacités (${cap.childElementCount})`;
  document.querySelector('[data-tab="skills"]').textContent = `Compétences (${skills.childElementCount})`;
  document.querySelector('[data-tab="gear"]').textContent = `Gadgets (${gear.childElementCount})`;
  document.querySelector('[data-tab="items"]').textContent = `Items (${items.childElementCount})`;
}

function renderSummary(archetype) {
  if (!archetype) return;

  $("summaryTitle").textContent = archetype.name;
  $("summaryUsage").textContent = archetype.style || "—";
  $("summarySource").textContent = `${modeLabel(archetype.mode)} · ${archetype.source || "template-mj"}`;

  const families = archetype.allowed_nexus_families?.length
    ? archetype.allowed_nexus_families.join(" · ")
    : archetype.allowed_catalogue_tags?.length
      ? archetype.allowed_catalogue_tags.join(" · ")
      : "profil libre / généraliste";
  $("summaryFamilies").textContent = families;

  const badges = $("summaryBadges");
  badges.innerHTML = "";
  [badgeTier(archetype.tier), modeLabel(archetype.mode), ...(archetype.roles || []).map((role) => role.toUpperCase())].forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = label;
    badges.appendChild(chip);
  });
}

function renderLoadoutGroups() {
  const grouped = classifyLoadout(active.loadout);
  const map = {
    loadoutS1: grouped.season1.map((entry) => ({ display: entry, raw: entry })),
    loadoutNexus: grouped.nexus.map((entry) => ({ display: entry, raw: `NEXUS — ${entry}` })),
    loadoutGear: [
      ...grouped.gear.map((entry) => ({ display: `GEAR — ${entry}`, raw: `GEAR — ${entry}` })),
      ...grouped.items.map((entry) => ({ display: `ITEM — ${entry}`, raw: `ITEM — ${entry}` }))
    ],
    loadoutKit: grouped.kits.map((entry) => ({ display: `KIT — ${entry}`, raw: `KIT — ${entry}` }))
  };

  Object.entries(map).forEach(([id, entries]) => {
    const root = $(id);
    root.innerHTML = "";
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "emptyLine";
      empty.textContent = "—";
      root.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const idx = active.loadout.indexOf(entry.raw);
      const line = document.createElement("div");
      line.className = "line";
      line.innerHTML = `${escapeHTML(entry.display)} <span style="float:right;opacity:.7;cursor:pointer" title="Retirer">✕</span>`;
      line.querySelector("span").onclick = () => {
        if (idx >= 0) active.loadout.splice(idx, 1);
        renderSheet();
        autoSave();
      };
      root.appendChild(line);
    });
  });
}

function setActiveFromArchetype(archetype) {
  active.id = archetype.id;
  active.tier = archetype.tier;
  active.mode = archetype.mode;
  active.source = archetype.source;
  active.roles = [...archetype.roles];
  active.stats = { ...archetype.stats };
  active.energy = energyFromSpecial(active.stats.spe);
  active.name = ($("pnjName").value || archetype.name).trim() || archetype.name;

  active.loadout = archetype.kit.map((k) => `KIT — ${k.name} : ${k.desc}`);

  (archetype.defaults?.gear || []).forEach((gear) => active.loadout.push(`GEAR — ${gear}`));
  (archetype.defaults?.items || []).forEach((item) => active.loadout.push(`ITEM — ${item}`));

  active.notes = $("notes").value || "";
  renderTabs();
  renderSummary(archetype);
}

function renderSheet() {
  $("typeLine").textContent = `${badgeTier(active.tier)} // ${modeLabel(active.mode)} // ${active.roles.map((r) => r.toUpperCase()).join(" • ") || "—"}`;
  $("sheetName").textContent = active.name;

  $("sVie").textContent = active.stats.vie;
  $("sEne").textContent = active.energy;
  $("sPhy").textContent = active.stats.phy;
  $("sSpe").textContent = active.stats.spe;
  $("sMen").textContent = active.stats.men;
  $("sSoc").textContent = active.stats.soc;

  const chips = $("chips");
  chips.innerHTML = "";
  [...active.roles, modeLabel(active.mode)].forEach((token) => {
    if (!token) return;
    const c = document.createElement("div");
    c.className = "tag";
    c.textContent = String(token).toUpperCase();
    chips.appendChild(c);
  });

  renderLoadoutGroups();

  $("notes").value = active.notes || "";
  $("base").value = active.id || $("base").value;
}

function addLoadout(str) {
  active.loadout.push(str);
  renderSheet();
  autoSave();
}

function removeLoadoutByTitle(title) {
  const idx = active.loadout.findIndex((entry) => entry.includes(title));
  if (idx >= 0) {
    active.loadout.splice(idx, 1);
    renderSheet();
    autoSave();
  }
}

function tierRandomConfig(tier) {
  if (tier === "civil") return { gear: 1, items: 0 };
  if (tier === "humain") return { gear: 1, items: 0 };
  if (tier === "top") return { gear: 2, items: randInt(0, 1) };
  if (tier === "surhumain") return { gear: 2, items: 1 };
  if (tier === "anomalie") return { gear: 3, items: randInt(1, 2) };
  return { gear: 3, items: 2 };
}

function randomizeBuild(archetype) {
  const mode = archetype.mode;
  const roles = archetype.roles || [];

  const capPool = PACK.capacities.filter((entry) => {
    const roleOk = entry.roles.includes("general") || entry.roles.some((role) => roles.includes(role));
    return roleOk && isEntryAllowedForArchetype(entry, archetype);
  });
  if (capPool.length) addLoadout(pickOne(capPool).loadout);

  const skillPool = PACK.skills.filter((entry) => {
    return (entry.role === "general" || entry.role === "nexus" || roles.includes(entry.role)) && isEntryAllowedForArchetype(entry, archetype);
  });
  if (skillPool.length) addLoadout(pickOne(skillPool).loadout);

  const config = tierRandomConfig(archetype.tier);
  const already = new Set(active.loadout.map((entry) => entry.replace(/^(GEAR|ITEM)\s—\s/, "").trim()));
  const gearPool = PACK.gear.filter((entry) => {
    if (already.has(entry)) return false;
    const hay = normalizeText(entry);
    return !archetype.allowed_catalogue_tags?.length ||
      archetype.allowed_catalogue_tags.some((tag) => hay.includes(normalizeText(tag))) ||
      (archetype.defaults?.gear || []).includes(entry);
  });
  const itemPool = PACK.items.filter((entry) => {
    if (already.has(entry)) return false;
    return archetype.mode !== "season1" || (archetype.defaults?.items || []).includes(entry);
  });

  pickManyUnique(gearPool, config.gear).forEach((entry) => addLoadout(`GEAR — ${entry}`));
  pickManyUnique(itemPool, config.items).forEach((entry) => addLoadout(`ITEM — ${entry}`));
}

function applyDamage(n) {
  active.stats.vie = clampMin0(active.stats.vie - n);
  renderSheet();
  autoSave();
}

function heal(n) {
  active.stats.vie += n;
  renderSheet();
  autoSave();
}

function energyMinus() {
  active.energy = clampMin0(active.energy - 1);
  renderSheet();
  autoSave();
}

function energyPlus() {
  active.energy += 1;
  renderSheet();
  autoSave();
}

function recalcEnergy() {
  active.energy = energyFromSpecial(active.stats.spe);
  renderSheet();
  autoSave();
}

function down() {
  active.stats.vie = 0;
  renderSheet();
  autoSave();
}

function toggleFav(id) {
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  localStorage.setItem(LS_FAVS, JSON.stringify([...favs]));
  renderList();
}

function loadArchetype(id, { randomize = false } = {}) {
  const archetype = PACK.archetypes.find((entry) => entry.id === id);
  if (!archetype) return;

  setActiveFromArchetype(archetype);
  $("pnjName").value = active.name;

  if (randomize) {
    randomizeBuild(archetype);
    flash("Build random OK.");
  }

  renderSummary(archetype);
  renderSheet();
  renderList();
  autoSave();
}

function exportJSON() {
  const out = {
    name: active.name,
    tier: active.tier,
    mode: active.mode,
    roles: active.roles,
    stats: active.stats,
    energy: active.energy,
    loadout: active.loadout,
    notes: $("notes").value || ""
  };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `PNJ_${active.name.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function classifyLoadout(entries) {
  const out = {
    season1: [],
    nexus: [],
    gear: [],
    items: [],
    kits: []
  };

  entries.forEach((entry) => {
    if (entry.startsWith("GEAR — ")) out.gear.push(entry.replace("GEAR — ", ""));
    else if (entry.startsWith("ITEM — ")) out.items.push(entry.replace("ITEM — ", ""));
    else if (entry.startsWith("KIT — ")) out.kits.push(entry.replace("KIT — ", ""));
    else if (entry.startsWith("NEXUS — ")) out.nexus.push(entry.replace("NEXUS — ", ""));
    else out.season1.push(entry);
  });

  return out;
}

function formatSheetText() {
  const grouped = classifyLoadout(active.loadout);

  return [
    "=== GENTLEMEN // FICHE PNJ ===",
    `NOM: ${active.name}`,
    `NATURE: ${badgeTier(active.tier)}`,
    `MODE: ${modeLabel(active.mode)}`,
    `ROLES: ${active.roles.join(", ")}`,
    `SOURCE: ${active.source || "template-mj"}`,
    "",
    "STATS:",
    `VIE: ${active.stats.vie}`,
    `PHYSIQUE: ${active.stats.phy}`,
    `SPECIAL: ${active.stats.spe}`,
    `ENERGIE: ${active.energy}`,
    `MENTAL: ${active.stats.men}`,
    `SOCIAL: ${active.stats.soc}`,
    "",
    "ACQUISITIONS SAISON I:",
    ...(grouped.season1.length ? grouped.season1.map((entry) => `- ${entry}`) : ["- —"]),
    "",
    "ACQUISITIONS NEXUS:",
    ...(grouped.nexus.length ? grouped.nexus.map((entry) => `- ${entry}`) : ["- —"]),
    "",
    "LOADOUT:",
    ...(grouped.gear.length ? grouped.gear.map((entry) => `- GEAR: ${entry}`) : []),
    ...(grouped.items.length ? grouped.items.map((entry) => `- ITEM: ${entry}`) : []),
    ...(grouped.kits.length ? grouped.kits.map((entry) => `- KIT: ${entry}`) : []),
    ...(grouped.gear.length || grouped.items.length || grouped.kits.length ? [] : ["- —"]),
    "",
    "NOTES:",
    $("notes").value || "—"
  ].join("\n");
}

function copySheet() {
  const txt = formatSheetText();
  navigator.clipboard?.writeText(txt).then(() => flash("Copié."));
}

function printSheet() {
  const w = window.open("", "_blank");
  w.document.write(`<pre style="font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap;">${escapeHTML(formatSheetText())}</pre>`);
  w.document.close();
  w.focus();
  w.print();
}

function autoSave() {
  active.notes = $("notes").value || "";
  localStorage.setItem(LS_ACTIVE, JSON.stringify(active));
}

function loadSaved() {
  const raw = localStorage.getItem(LS_ACTIVE);
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw);
    active = {
      id: obj.id || null,
      name: obj.name || "PNJ —",
      tier: obj.tier || "",
      mode: obj.mode || "season1",
      source: obj.source || "template-mj",
      roles: obj.roles || [],
      stats: obj.stats || { vie: 0, phy: 0, spe: 0, men: 0, soc: 0 },
      energy: Number.isFinite(obj.energy) ? obj.energy : energyFromSpecial(obj.stats?.spe),
      loadout: obj.loadout || [],
      notes: obj.notes || ""
    };
    $("pnjName").value = active.name || "";
    $("notes").value = active.notes || "";
    renderSummary(getCurrentArchetype());
    renderSheet();
    return true;
  } catch (_) {
    return false;
  }
}

function resetAll() {
  localStorage.removeItem(LS_ACTIVE);
  active = {
    id: null,
    name: "PNJ —",
    tier: "",
    mode: "",
    source: "",
    roles: [],
    stats: { vie: 0, phy: 0, spe: 0, men: 0, soc: 0 },
    energy: 0,
    loadout: [],
    notes: ""
  };
  $("pnjName").value = "";
  $("notes").value = "";
  renderSheet();
  renderList();
}

function randomArchetype() {
  const arr = filteredArchetypes();
  if (!arr.length) return;
  const picked = arr[Math.floor(Math.random() * arr.length)];
  loadArchetype(picked.id, { randomize: true });
}

function initTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach((entry) => entry.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      ["cap", "skills", "gear", "items"].forEach((suffix) => {
        $("tab-" + suffix).classList.toggle("hidden", suffix !== tab);
      });
    };
  });
}

function initModal() {
  const modal = $("modal");
  $("btnHelp").onclick = () => modal.classList.remove("hidden");
  $("btnClose").onclick = () => modal.classList.add("hidden");
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  };
}

function initKeys() {
  window.addEventListener("keydown", (e) => {
    const modalOpen = !$("modal").classList.contains("hidden");
    if (e.key === "Escape") {
      if (modalOpen) $("modal").classList.add("hidden");
      return;
    }

    const tag = document.activeElement?.tagName?.toLowerCase();
    const typing = tag === "input" || tag === "textarea" || tag === "select";
    if (typing && !(e.ctrlKey && (e.key.toLowerCase() === "s" || e.key.toLowerCase() === "c"))) return;

    const arr = filteredArchetypes();
    if (e.key === "ArrowDown") {
      selectedIndex = Math.min(selectedIndex + 1, Math.max(0, arr.length - 1));
      renderList();
    }
    if (e.key === "ArrowUp") {
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderList();
    }
    if (e.key === "Enter" && arr[selectedIndex]) loadArchetype(arr[selectedIndex].id, { randomize: false });
    if (e.key.toLowerCase() === "f" && active.id) toggleFav(active.id);

    if (["1", "2", "3", "4"].includes(e.key)) applyDamage(parseInt(e.key, 10));
    if (e.key.toLowerCase() === "e") energyMinus();
    if (e.key.toLowerCase() === "r") energyPlus();

    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      autoSave();
      flash("Sauvé.");
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copySheet();
    }
  });
}

function wire() {
  $("q").oninput = () => {
    selectedIndex = 0;
    renderList();
  };
  $("tier").onchange = () => {
    selectedIndex = 0;
    renderList();
  };
  $("role").onchange = () => {
    selectedIndex = 0;
    renderList();
  };
  $("modeFilter").onchange = () => {
    selectedIndex = 0;
    renderList();
  };

  $("btnFavOnly").onclick = () => {
    favOnly = !favOnly;
    $("btnFavOnly").textContent = favOnly ? "★ Favoris (ON)" : "★ Favoris";
    selectedIndex = 0;
    renderList();
  };

  $("btnQuickRand").onclick = randomArchetype;
  $("base").onchange = () => loadArchetype($("base").value, { randomize: false });

  $("pnjName").oninput = () => {
    active.name = $("pnjName").value || active.name;
    renderSheet();
    autoSave();
  };

  document.querySelectorAll("[data-dmg]").forEach((btn) => {
    btn.onclick = () => applyDamage(parseInt(btn.dataset.dmg, 10));
  });

  $("btnHeal1").onclick = () => heal(1);
  $("btnHeal5").onclick = () => heal(5);
  $("btnDown").onclick = down;

  $("btnEminus").onclick = energyMinus;
  $("btnEplus").onclick = energyPlus;
  $("btnRecalc").onclick = recalcEnergy;
  $("btnTurn").onclick = () => flash("Tour reset.");

  $("notes").oninput = () => autoSave();
  $("btnSave").onclick = () => {
    autoSave();
    flash("Sauvé.");
  };
  $("btnExport").onclick = exportJSON;
  $("btnCopy").onclick = copySheet;
  $("btnPrint").onclick = printSheet;
  $("btnResetAll").onclick = resetAll;
  $("reduceFx").onchange = (e) => setReduceFx(e.target.checked);
}

async function init() {
  const reduce = localStorage.getItem(LS_REDUCE) === "1";
  $("reduceFx").checked = reduce;
  setReduceFx(reduce);

  initTabs();
  initModal();
  initKeys();
  wire();

  try {
    await loadData();
  } catch (error) {
    $("typeLine").textContent = "ERREUR CHARGEMENT DONNÉES";
    $("list").innerHTML = `<div class="line">Impossible de charger les données canoniques. Lance le site via serveur local et vérifie <code>pnj-tool/assets/data</code>.</div>`;
    console.error(error);
    return;
  }

  renderBaseSelect();
  renderTabs();
  renderSummary(PACK.archetypes[0] || null);

  const ok = loadSaved();
  if (!ok) loadArchetype(PACK.archetypes[0]?.id, { randomize: false });
  else renderList();
}

init();
