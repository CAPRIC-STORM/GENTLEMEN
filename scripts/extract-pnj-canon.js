const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "pnj-tool", "assets", "data");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Unable to extract block between "${startNeedle}" and "${endNeedle}"`);
  }
  return source.slice(start + startNeedle.length, end).trim();
}

function evalLiteral(literal) {
  const clean = literal.trim().replace(/;\s*$/, "");
  return Function(`"use strict"; return (${clean});`)();
}

function inferUsableRoles(entry) {
  const hay = normalizeText(
    [entry.name, entry.type, entry.district, entry.desc, entry.effect, entry.req, entry.notes, ...(entry.tags || [])].join(" ")
  );
  const roles = new Set();

  if (/(tir|arme|combat|melee|rafale|neutralisation|munition|silencieux|explosif|blindage|armure)/.test(hay)) roles.add("combat");
  if (/(infiltration|discret|effacement|trace|ghost|passage|lockpick|cam|camouflage|surv)/.test(hay)) roles.add("infil");
  if (/(hack|drone|tech|implant|systeme|blackout|substation|bouclier energetique|outil|interface)/.test(hay)) roles.add("tech");
  if (/(social|contact|fixer|negociation|invitation|couverture|rumeur|legal|contrat|elite)/.test(hay)) roles.add("social");
  if (/(medical|soins|stabiliser|safe|asile|reparer)/.test(hay)) roles.add("support");

  return roles.size ? [...roles] : ["general"];
}

function inferUsableTiers(entry) {
  const hay = normalizeText([entry.req, entry.notes, entry.effect, entry.tags?.join(" ")].join(" "));
  if (/(special >= 55|soc >= 55|ment >= 50|tech >= 50)/.test(hay)) return ["top", "surhumain", "anomalie", "event"];
  if (/(>= 45|>= 40)/.test(hay)) return ["humain", "top", "surhumain", "anomalie", "event"];
  return ["civil", "humain", "top", "surhumain", "anomalie", "event"];
}

function inferPnjWeight(entry) {
  if (entry.cost < 0) return 0.35;
  if (entry.cost === 0) return 0.6;
  if (entry.cost === 1) return 1;
  if (entry.cost === 2) return 0.95;
  if (entry.cost === 3) return 0.8;
  if (entry.cost >= 4) return 0.55;
  return 0.75;
}

function inferNexusKind(entry) {
  const family = normalizeText(entry.family);
  if (family === "noyau") return "noyau";
  if (family === "instabilite") return "instabilite";
  if (family === "apex") return "amplificateur";
  return "capacite";
}

function inferCompatibleNoyaux(entry) {
  const req = normalizeText(entry.req);
  const lore = normalizeText(entry.lore);
  const hay = `${req} ${lore} ${normalizeText(entry.name)}`;
  const map = [
    ["predateur", "NX-CORE-PREDATOR"],
    ["forteresse", "NX-CORE-FORTRESS"],
    ["brasier", "NX-CORE-BRASIER"],
    ["cryoforme", "NX-CORE-CRYOFORME"],
    ["dualite", "NX-CORE-DUALITE"],
    ["prime", "NX-NEXUS-HARMONY"]
  ];
  const found = map.filter(([token]) => hay.includes(token)).map(([, id]) => id);
  return found.length ? found : [];
}

function inferModesForArchetype(archetype) {
  const hay = normalizeText(`${archetype.name} ${archetype.style} ${(archetype.defaults?.items || []).join(" ")}`);
  if (/(heritage|nexus|blackwater|sujet 0|type 0|prime)/.test(hay)) return ["season2", "hybrid"];
  if (/(augmente|implant|drone|corpo|fixer|baron)/.test(hay)) return ["season1", "hybrid"];
  return ["season1"];
}

function inferAllowedNexusFamilies(archetype) {
  const hay = normalizeText(`${archetype.name} ${archetype.style} ${(archetype.defaults?.items || []).join(" ")}`);
  const families = new Set();
  if (/(heritage|blackwater|nexus)/.test(hay)) {
    ["Noyau", "Physique", "Sensoriel", "Organique", "Neurocognitif", "Thermique", "Vital", "Nexus", "Apex", "Instabilite"].forEach((family) => {
      families.add(family);
    });
  }
  if (/(augment|soldat|tank)/.test(hay)) {
    ["Physique", "Organique", "Vital"].forEach((family) => families.add(family));
  }
  if (/(fixer|baron|social)/.test(hay)) {
    ["Neurocognitif", "Nexus"].forEach((family) => families.add(family));
  }
  return [...families];
}

function inferAllowedCatalogueTags(archetype) {
  const roles = archetype.roles || [];
  const tags = new Set();
  if (roles.includes("combat")) ["weapon_shop", "ammo", "safe", "contracts", "combat"].forEach((tag) => tags.add(tag));
  if (roles.includes("infil")) ["secure", "trace", "underground", "passage", "disparition"].forEach((tag) => tags.add(tag));
  if (roles.includes("tech")) ["workshop", "tool", "drone", "implant", "augmentation"].forEach((tag) => tags.add(tag));
  if (roles.includes("social")) ["contact", "fixer", "social", "negociation", "identity", "legal"].forEach((tag) => tags.add(tag));
  if (roles.includes("support")) ["medical", "storage", "safe"].forEach((tag) => tags.add(tag));
  return [...tags];
}

function main() {
  const catalogueSource = read(path.join(ROOT, "gentlemen-terminal", "catalogue.js"));
  const nexusSource = read(path.join(ROOT, "gentlemen-terminal", "catalogue-nexus.js"));
  const pnjToolSource = read(path.join(ROOT, "pnj-tool", "main.js"));

  const catalogueLiteral = extractBetween(
    catalogueSource,
    "const CATALOGUE = ",
    "/* ===================== BASE STATS"
  );
  const nexusLiteral = extractBetween(
    nexusSource,
    "const CATALOGUE = ",
    "\n\n  const $ ="
  );
  const packLiteral = extractBetween(
    pnjToolSource,
    "const PACK = ",
    "// ---------- STATE ----------"
  );

  const catalogue = evalLiteral(catalogueLiteral);
  const nexus = evalLiteral(nexusLiteral);
  const pack = evalLiteral(packLiteral);

  const catalogueS1 = catalogue.map((entry) => ({
    ...entry,
    usable_by_roles: inferUsableRoles(entry),
    usable_by_tiers: inferUsableTiers(entry),
    pnj_weight: inferPnjWeight(entry),
    source: "catalogue-s1"
  }));

  const catalogueNexus = nexus.map((entry) => ({
    ...entry,
    kind: inferNexusKind(entry),
    compatible_noyaux: inferCompatibleNoyaux(entry),
    usable_by_modes: inferNexusKind(entry) === "instabilite" ? ["season2", "hybrid"] : ["season2", "hybrid"],
    pnj_weight: entry.cost < 0 ? 0.45 : entry.cost >= 7 ? 0.35 : 0.8,
    source: "catalogue-nexus"
  }));

  const pnjBases = pack.archetypes.map((archetype) => ({
    id: archetype.id,
    label: archetype.name,
    mode: inferModesForArchetype(archetype)[0],
    modes: inferModesForArchetype(archetype),
    tier: archetype.tier,
    roles: archetype.roles,
    stats: archetype.stats,
    style: archetype.style,
    allowed_catalogue_tags: inferAllowedCatalogueTags(archetype),
    allowed_nexus_families: inferAllowedNexusFamilies(archetype),
    default_loadout: [
      ...(archetype.defaults?.gear || []).map((name) => ({ type: "gear", name })),
      ...(archetype.defaults?.items || []).map((name) => ({ type: "item", name }))
    ],
    default_notes: ""
  }));

  const pnjTemplates = pack.archetypes.map((archetype) => ({
    id: archetype.id,
    name: archetype.name,
    base_id: archetype.id,
    mode: inferModesForArchetype(archetype)[0],
    modes: inferModesForArchetype(archetype),
    summary: archetype.style,
    s1_picks: archetype.kit.map((skill, index) => ({
      id: `${archetype.id}:kit:${index + 1}`,
      label: skill.name,
      effect: skill.desc,
      source: "template-mj"
    })),
    nexus_core: null,
    nexus_picks: [],
    loadout: {
      gear: archetype.defaults?.gear || [],
      items: archetype.defaults?.items || []
    },
    mj_signature: {
      style: archetype.style,
      routine: archetype.roles.join(" / "),
      faille: "",
      notes: ""
    },
    source: "template-mj"
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "catalogue-s1.json"), JSON.stringify(catalogueS1, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT_DIR, "catalogue-nexus.json"), JSON.stringify(catalogueNexus, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT_DIR, "pnj-bases.json"), JSON.stringify(pnjBases, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT_DIR, "pnj-templates.json"), JSON.stringify(pnjTemplates, null, 2) + "\n");

  console.log(JSON.stringify({
    catalogueS1: catalogueS1.length,
    catalogueNexus: catalogueNexus.length,
    pnjBases: pnjBases.length,
    pnjTemplates: pnjTemplates.length
  }, null, 2));
}

main();
