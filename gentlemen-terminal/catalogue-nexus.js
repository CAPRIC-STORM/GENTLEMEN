(() => {
  const PASSWORD = "ulysse";
  const SESSION_KEY = "gentlemen:catalogue:nexus:ulysse";

  const LS = {
    reduceFx: "gentlemen:reduceFx",
    mute: "gentlemen:mute",
    vol: "gentlemen:vol",
    audioEver: "gentlemen:audioEverUnlocked",
    destinyBase: "gentlemen:nexus:destinyBase",
    destinySelection: "gentlemen:nexus:destinySelection"
  };

  const FAMILY_ORDER = [
    "Tous",
    "Noyau",
    "Physique",
    "Sensoriel",
    "Organique",
    "Neurocognitif",
    "Thermique",
    "Vital",
    "Nexus",
    "Apex",
    "Instabilité"
  ];

  const CATALOGUE = [
    {
      id: "NX-CORE-PREDATOR",
      name: "Noyau Prédateur",
      family: "Noyau",
      tier: "B",
      cost: 3,
      tags: ["Apex", "traque", "instinct"],
      desc: "La matrice du sujet se réécrit pour privilégier poursuite, réaction et lecture du terrain vivant.",
      effect: "Déverrouille les branches griffes, perception de chasse et accélérations réflexes.",
      req: "Saison I : personnage habitué à la traque, à la rue ou à la chasse humaine.",
      risk: "L’instinct prend parfois la priorité sur le protocole.",
      lore: "Dérivation cohérente de Kardia et des modèles de prédation Héritage."
    },
    {
      id: "NX-CORE-FORTRESS",
      name: "Noyau Forteresse",
      family: "Noyau",
      tier: "B",
      cost: 3,
      tags: ["résistance", "os", "densité"],
      desc: "Le corps devient un bastion, plus dense, plus dur, plus difficile à rompre.",
      effect: "Déverrouille les branches ossature, blindage tissulaire et refus d’effondrement.",
      req: "Saison I : personnage orienté tenue de ligne, encaissement ou protection.",
      risk: "Lourdeur progressive, rigidité ou dégradation fine du mouvement.",
      lore: "Écho direct aux lignées El Cid et Sisyphe."
    },
    {
      id: "NX-CORE-BRASIER",
      name: "Noyau Brasier",
      family: "Noyau",
      tier: "A",
      cost: 5,
      tags: ["combustion", "pression", "déflagration"],
      desc: "Le sujet génère une instabilité thermique interne convertible en propulsion, ignition ou onde de choc.",
      effect: "Déverrouille les branches chaleur, combustion et surpression.",
      req: "Saison I : survivance à un arc violent ou rôle d’assaut majeur.",
      risk: "Surchauffe, emballement, besoin de purge.",
      lore: "Dérivation explicite des traces Regulus."
    },
    {
      id: "NX-CORE-CRYOFORME",
      name: "Noyau Cryoforme",
      family: "Noyau",
      tier: "A",
      cost: 5,
      tags: ["froid", "arrêt", "contrôle"],
      desc: "Le corps remplace l’élan par la neutralisation : ralentir, figer, casser la chaîne thermique.",
      effect: "Déverrouille les branches gel, inertie locale et choc thermique négatif.",
      req: "Saison I : personnage de contrôle, discipline ou précision méthodique.",
      risk: "Déconnexion affective, extrémités instables, létalité involontaire.",
      lore: "Parenté évidente avec Dégel."
    },
    {
      id: "NX-CORE-DUALITE",
      name: "Noyau Dualité",
      family: "Noyau",
      tier: "A",
      cost: 6,
      tags: ["deux consciences", "synchro", "calcul"],
      desc: "Le Nexus ne renforce pas seulement le sujet : il le divise et aligne les deux pôles de son action.",
      effect: "Déverrouille anticipation, partition cognitive, reprise instantanée.",
      req: "Saison I : personnage mental, stratège ou sujet déjà fracturé par le récit.",
      risk: "Décrochage, interférence, identité poreuse.",
      lore: "Lecture moderne des cas Aspros / Deuteros."
    },
    {
      id: "NX-PHYS-CLAWS",
      name: "Griffes de Rupture",
      family: "Physique",
      tier: "B",
      cost: 2,
      tags: ["corps", "contact", "ouverture"],
      desc: "L’ossature distale se prolonge en lames organiques rétractiles.",
      effect: "Le sujet gagne une option de neutralisation rapprochée violente et silencieuse.",
      req: "Noyau Prédateur.",
      risk: "Blessures d’auto-usage si la poussée émotionnelle déborde.",
      lore: "Version stabilisée des extrusions de chasse de Kardia."
    },
    {
      id: "NX-PHYS-DENSITY",
      name: "Densité de Choc",
      family: "Physique",
      tier: "B",
      cost: 2,
      tags: ["poids", "impact", "stabilité"],
      desc: "Le sujet peut charger sa masse sur un court instant pour devenir impossible à déplacer.",
      effect: "Excellente tenue d’angle, percée ou encaissement sur fenêtre courte.",
      req: "Noyau Forteresse.",
      risk: "Fatigue structurelle, fracture secondaire si surcharge répétée.",
      lore: "Proche des réponses vectorielles observées sur Sisyphe."
    },
    {
      id: "NX-SENS-THERMAL",
      name: "Lecture Thermique",
      family: "Sensoriel",
      tier: "C",
      cost: 1,
      tags: ["vision", "chasse", "surveillance"],
      desc: "Le sujet distingue les gradients de chaleur, les stress de matière et les silhouettes masquées.",
      effect: "Détection facilitée des présences, fuites et corps cachés.",
      req: "Prédateur ou Cryoforme recommandé.",
      risk: "Surcharge sensorielle dans les environnements denses.",
      lore: "Capacité fréquente chez les sujets à réécriture de perception."
    },
    {
      id: "NX-SENS-NEXUS",
      name: "Perception Nexus",
      family: "Sensoriel",
      tier: "B",
      cost: 3,
      tags: ["lumen", "vibration", "anomalie"],
      desc: "Le sujet perçoit les tensions Nexus, zones mal stabilisées, reliquats d’expérience et signatures anormales.",
      effect: "Repère les lieux, objets ou organismes connectés à l’Héritage.",
      req: "Lien narratif avec Burnwood, Lumen ou dossier Héritage.",
      risk: "Hallucinations d’écho et confusion entre trace et présence.",
      lore: "Très recherché par les Barons et les cellules de récupération."
    },
    {
      id: "NX-ORG-COMBUST",
      name: "Fluide Hyper-combustible",
      family: "Organique",
      tier: "A",
      cost: 4,
      tags: ["fluide", "ignition", "arme"],
      desc: "Le corps sécrète un composé interne exploitable comme projection, charge incendiaire ou propulsion.",
      effect: "Le sujet gagne un panel offensif ou moteur extrêmement spectaculaire.",
      req: "Noyau Brasier.",
      risk: "Rupture interne, emballement, vulnérabilité à la sur-sollicitation.",
      lore: "Héritage direct des schémas Regulus."
    },
    {
      id: "NX-ORG-CHITINE",
      name: "Plaques Tissulaires",
      family: "Organique",
      tier: "B",
      cost: 3,
      tags: ["armure", "tissu", "survie"],
      desc: "La peau prend localement une forme semi-minérale de protection.",
      effect: "Résistance passive et réduction des dommages de contact.",
      req: "Noyau Forteresse.",
      risk: "Aspect inhumain croissant, douleur de mue, perte de finesse.",
      lore: "Apparue dans plusieurs lignées de survie BioMire."
    },
    {
      id: "NX-NEURO-SECOND-MIND",
      name: "Esprit Secondaire",
      family: "Neurocognitif",
      tier: "A",
      cost: 5,
      tags: ["calcul", "backup", "synchronisation"],
      desc: "Une conscience auxiliaire prend en charge lecture des menaces, continuité du plan et micro-corrections.",
      effect: "Le sujet garde du contrôle même sous pression intense.",
      req: "Noyau Dualité.",
      risk: "Dialogue interne permanent, dissociation ou lutte d’autorité.",
      lore: "Lecture fonctionnelle de la dualité cognitive Aspros / Deuteros."
    },
    {
      id: "NX-NEURO-ANTICIP",
      name: "Anticipation Vectorielle",
      family: "Neurocognitif",
      tier: "B",
      cost: 3,
      tags: ["réaction", "timing", "combat"],
      desc: "Le cerveau ne voit pas l’avenir : il calcule si vite qu’il y ressemble.",
      effect: "Fenêtres d’esquive, lecture de rythme, réponse optimisée.",
      req: "Noyau Dualité ou Perception Nexus.",
      risk: "Épuisement nerveux et migraines d’après-combat.",
      lore: "Très utilisée par les sujets non destructifs du Projet Héritage."
    },
    {
      id: "NX-THERM-PURGE",
      name: "Purge de Chaleur",
      family: "Thermique",
      tier: "B",
      cost: 2,
      tags: ["surpression", "décharge", "respiration"],
      desc: "Le sujet évacue la charge interne sous forme d’onde chaude ou de souffle violent.",
      effect: "Réinitialise la montée thermique et peut repousser l’environnement immédiat.",
      req: "Noyau Brasier.",
      risk: "Destruction collatérale, exposition, trace évidente.",
      lore: "Indispensable aux sujets thermiques durables."
    },
    {
      id: "NX-THERM-CRYO-LANCE",
      name: "Lance Cryogène",
      family: "Thermique",
      tier: "A",
      cost: 4,
      tags: ["projection", "gel", "arrêt"],
      desc: "Le sujet concentre l’arrêt thermique dans un point, une ligne ou un cône très bref.",
      effect: "Neutralise surface, articulation ou espace de passage.",
      req: "Noyau Cryoforme.",
      risk: "Fracture involontaire des corps et structures visées.",
      lore: "Descendance claire de Dégel."
    },
    {
      id: "NX-VITAL-REFUS",
      name: "Refus d’Effondrement",
      family: "Vital",
      tier: "A",
      cost: 5,
      tags: ["survie", "endurance", "acharnement"],
      desc: "Le corps considère la chute comme une information facultative.",
      effect: "Le sujet continue, tient, revient ou encaisse là où un humain normal s’arrête.",
      req: "Noyau Forteresse ou parcours de survie majeur en Saison I.",
      risk: "Dégradation masquée, casse retardée, fin brutale une fois l’élan terminé.",
      lore: "Formulation la plus jouable de la résilience vectorielle de Sisyphe."
    },
    {
      id: "NX-VITAL-DRAIN",
      name: "Drain Vital",
      family: "Vital",
      tier: "A",
      cost: 5,
      tags: ["seuil", "vie", "captation"],
      desc: "Le sujet détourne ou aspire l’énergie biologique présente autour de lui.",
      effect: "Stabilise le sujet ou affaiblit sa cible à coût moral élevé.",
      req: "Lien sombre, arc moral lourd ou dérive Héritage assumée.",
      risk: "Corruption psychique, dépendance, rejet par le groupe.",
      lore: "Écho des anomalies Manigoldo, version domestiquée mais jamais saine."
    },
    {
      id: "NX-NEXUS-HARMONY",
      name: "Harmonie Nexus",
      family: "Nexus",
      tier: "S",
      cost: 8,
      tags: ["réparation", "stabilisation", "prime"],
      desc: "Le sujet ne domine pas la force : il l’accorde, la recoud et l’apaise.",
      effect: "Peut stabiliser organisme, structure ou champ Nexus de manière exceptionnelle.",
      req: "Sujet central de campagne ou lignée exceptionnelle validée MJ.",
      risk: "Épuisement absolu, sacrifice, focalisation du récit sur le sujet.",
      lore: "Mode Prime Vector — Harmonie."
    },
    {
      id: "NX-NEXUS-AUTHORITY",
      name: "Autorité Nexus",
      family: "Nexus",
      tier: "Ω",
      cost: 10,
      tags: ["écrasement", "réécriture", "catastrophe"],
      desc: "Le sujet n’interagit plus avec la biologie : il la réécrit autour de lui.",
      effect: "Capacité catastrophique capable de tordre totalement le rapport de force.",
      req: "Réservé MJ / fin de cycle / événement majeur.",
      risk: "Perte de sujet, effondrement de zone, dette cosmique.",
      lore: "Mode Prime Vector' — Autorité."
    },
    {
      id: "NX-APEX-CHIMERA",
      name: "Package Apex Chimère",
      family: "Apex",
      tier: "S",
      cost: 7,
      tags: ["prédateur", "hybride", "package"],
      desc: "Le corps adopte plusieurs solutions de chasse à la fois : vitesse, griffes, lecture, bond.",
      effect: "Bundle supérieur de traque et domination rapprochée.",
      req: "Noyau Prédateur + au moins 2 acquisitions de branche.",
      risk: "Déshumanisation visible et montée des pulsions de chasse.",
      lore: "Réservé aux profils acceptant de perdre de l’humain pour gagner de l’efficacité."
    },
    {
      id: "NX-APEX-BASTION",
      name: "Package Bastion",
      family: "Apex",
      tier: "S",
      cost: 7,
      tags: ["forteresse", "tenue", "mur"],
      desc: "Le sujet devient un verrou vivant, une zone de refus plus qu’un simple combattant.",
      effect: "Bundle majeur de tenue, encaissement et résistance structurelle.",
      req: "Noyau Forteresse + Refus d’Effondrement.",
      risk: "Rigidité, masse, aspect de plus en plus inhumain.",
      lore: "Version mature des lignées El Cid / Sisyphe."
    },
    {
      id: "NX-INSTAB-FEVER",
      name: "Fièvre de Résonance",
      family: "Instabilité",
      tier: "C",
      cost: -1,
      tags: ["contrepartie", "montée", "fatigue"],
      desc: "Le corps répond trop bien au Nexus et s’échauffe après activation.",
      effect: "Gain de 1 point si tu acceptes la montée de fièvre après les usages lourds.",
      req: "Aucune.",
      risk: "Pénalité temporaire, vulnérabilité ou scène de faiblesse.",
      lore: "Contrepartie simple, fréquente et très jouable."
    },
    {
      id: "NX-INSTAB-HUNGER",
      name: "Faim d’Activation",
      family: "Instabilité",
      tier: "B",
      cost: -2,
      tags: ["contrepartie", "manque", "dépendance"],
      desc: "Une fois goûtée, l’activation réclame d’être répétée.",
      effect: "Gain de 2 points si le sujet supporte une pulsion de réusage ou de consommation.",
      req: "Aucune.",
      risk: "Compulsion, prise de risque, fracture sociale.",
      lore: "Très forte sur les lignées thermiques et vitales."
    },
    {
      id: "NX-INSTAB-FRACTURE",
      name: "Fracture Identitaire",
      family: "Instabilité",
      tier: "A",
      cost: -3,
      tags: ["contrepartie", "esprit", "double"],
      desc: "Le sujet n’est plus toujours sûr d’être le seul à signer ses décisions.",
      effect: "Gain de 3 points si la conscience se fissure à mesure que la puissance monte.",
      req: "Dualité ou forte exposition Nexus.",
      risk: "Voix, trous, dialogues intérieurs, scènes de perte de contrôle.",
      lore: "Très cohérent avec les branches neurocognitives."
    },
    {
      id: "NX-INSTAB-MARK",
      name: "Marque Héritage",
      family: "Instabilité",
      tier: "B",
      cost: -2,
      tags: ["contrepartie", "visible", "trace"],
      desc: "La mutation laisse un signe visible : texture, lumière, regard, chaleur ou voix.",
      effect: "Gain de 2 points si l’inhumain devient identifiable à l’œil ou au capteur.",
      req: "Aucune.",
      risk: "Reconnaissance, peur, traque, rumeur.",
      lore: "Très bon prix d’entrée pour pousser la DA du personnage."
    }
  ];

  const $ = (sel, root = document) => root.querySelector(sel);

  let currentFamily = "Tous";
  let currentQuery = "";
  let currentItem = null;
  let destinyBase = 8;
  let selectedIds = new Set();
  let audioUnlocked = false;
  const SFX = { click: null, confirm: null };
  let bgm = null;

  function createAudio(path, loop = false) {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.loop = loop;
    return audio;
  }

  function getMute() { return localStorage.getItem(LS.mute) === "1"; }
  function getVol() {
    const raw = localStorage.getItem(LS.vol);
    const vol = raw === null ? 0.42 : Number(raw);
    return Number.isFinite(vol) ? Math.max(0, Math.min(1, vol)) : 0.42;
  }

  function applyVolumes() {
    const vol = getMute() ? 0 : getVol();
    if (SFX.click) SFX.click.volume = Math.min(1, vol * 0.95);
    if (SFX.confirm) SFX.confirm.volume = Math.min(1, vol);
    if (bgm) bgm.volume = Math.min(1, vol * 0.55);
  }

  function setAudioDebug(msg) {
    const el = $("#audioDebug");
    if (el) el.textContent = msg;
  }

  function setMute(on) {
    $("#btnMute")?.setAttribute("aria-pressed", on ? "true" : "false");
    $("#muteState") && ($("#muteState").textContent = on ? "MUTE: ON" : "MUTE: OFF");
    localStorage.setItem(LS.mute, on ? "1" : "0");
    applyVolumes();
    if (on) {
      try { bgm?.pause(); } catch {}
      setAudioDebug("AUDIO: MUET");
    } else if (audioUnlocked && bgm) {
      const p = bgm.play();
      if (p?.catch) {
        p.then(() => setAudioDebug("AUDIO: OK")).catch(() => setAudioDebug("AUDIO: BGM BLOQUÉ"));
      } else {
        setAudioDebug("AUDIO: OK");
      }
    }
  }

  function setVol(v01) {
    const value = Math.max(0, Math.min(1, v01));
    localStorage.setItem(LS.vol, String(value));
    applyVolumes();
  }

  function safePlay(audio) {
    if (!audioUnlocked || getMute() || !audio) return;
    try { audio.currentTime = 0; } catch {}
    const promise = audio.play();
    if (promise?.catch) promise.catch(() => {});
  }

  async function unlockAudio() {
    if (audioUnlocked) {
      if (!getMute() && bgm) {
        const p = bgm.play();
        if (p?.catch) {
          p.then(() => setAudioDebug("AUDIO: OK")).catch(() => setAudioDebug("AUDIO: BLOCAGE NAV"));
        } else {
          setAudioDebug("AUDIO: OK");
        }
      }
      return;
    }

    SFX.click = createAudio("assets/audio/ui-click.mp3");
    SFX.confirm = createAudio("assets/audio/ui-confirm.mp3");
    bgm = createAudio("assets/audio/ulysse-theme.mp3", true);

    try {
      SFX.click.volume = 0;
      await SFX.click.play();
      SFX.click.pause();
      SFX.click.currentTime = 0;
      audioUnlocked = true;
      localStorage.setItem(LS.audioEver, "1");
    } catch {
      audioUnlocked = false;
      setAudioDebug("AUDIO: UNLOCK REFUSÉ");
    }

    const button = $("#btnUnlockAudio");
    if (button) {
      button.disabled = audioUnlocked;
      const label = button.querySelector(".btnLabel");
      if (label) label.textContent = audioUnlocked ? "AUDIO PRÊT" : "INITIALISER AUDIO";
    }

    applyVolumes();
    if (audioUnlocked && SFX.confirm) safePlay(SFX.confirm);
    if (audioUnlocked && !getMute() && bgm) {
      try {
        const play = bgm.play();
        if (play?.catch) {
          play.then(() => setAudioDebug("AUDIO: OK")).catch(() => setAudioDebug("AUDIO: BGM BLOQUÉ"));
        } else {
          setAudioDebug("AUDIO: OK");
        }
      } catch {}
    } else if (audioUnlocked) {
      setAudioDebug("AUDIO: MUET");
    }
  }

  function stopAllAudio() {
    [SFX.click, SFX.confirm, bgm].forEach((audio) => {
      if (!audio) return;
      try { audio.pause(); } catch {}
      try { audio.currentTime = 0; } catch {}
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      try { bgm?.pause(); } catch {}
      return;
    }
    if (audioUnlocked && bgm && !getMute()) {
      const p = bgm.play();
      if (p?.catch) {
        p.then(() => setAudioDebug("AUDIO: OK")).catch(() => setAudioDebug("AUDIO: BGM BLOQUÉ"));
      } else {
        setAudioDebug("AUDIO: OK");
      }
    }
  });

  window.addEventListener("pagehide", stopAllAudio);

  function wireGlobalSfx() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const inter = target.closest("button, a, input[type='range']");
      if (!inter) return;
      if (inter.id === "btnUnlockAudio" || inter.id === "closeDrawer") safePlay(SFX.confirm);
      else safePlay(SFX.click);
    }, true);
  }

  function getReduceFx() { return localStorage.getItem(LS.reduceFx) === "1"; }
  function setReduceFx(on) {
    $("#app")?.classList.toggle("reduceFx", !!on);
    $("#btnReduceEffects")?.setAttribute("aria-pressed", on ? "true" : "false");
    $("#fxState") && ($("#fxState").textContent = on ? "FX: OFF" : "FX: ON");
    localStorage.setItem(LS.reduceFx, on ? "1" : "0");
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function filteredItems() {
    const q = normalize(currentQuery);
    return CATALOGUE.filter((item) => {
      if (currentFamily !== "Tous" && item.family !== currentFamily) return false;
      if (!q) return true;
      const haystack = normalize([
        item.name,
        item.family,
        item.tier,
        item.desc,
        item.effect,
        item.tags.join(" "),
        item.lore
      ].join(" "));
      return haystack.includes(q);
    });
  }

  function loadBuilderState() {
    const rawBase = Number(localStorage.getItem(LS.destinyBase));
    destinyBase = Number.isFinite(rawBase) && rawBase >= 0 ? rawBase : 8;

    try {
      const stored = JSON.parse(localStorage.getItem(LS.destinySelection) || "[]");
      selectedIds = new Set(Array.isArray(stored) ? stored : []);
    } catch {
      selectedIds = new Set();
    }
  }

  function saveBuilderState() {
    localStorage.setItem(LS.destinyBase, String(destinyBase));
    localStorage.setItem(LS.destinySelection, JSON.stringify([...selectedIds]));
  }

  function getSelectedItems() {
    return [...selectedIds]
      .map((id) => CATALOGUE.find((item) => item.id === id))
      .filter(Boolean);
  }

  function renderBudget() {
    const selectedItems = getSelectedItems();
    const spent = selectedItems.filter((item) => item.cost > 0).reduce((sum, item) => sum + item.cost, 0);
    const gain = selectedItems.filter((item) => item.cost < 0).reduce((sum, item) => sum + Math.abs(item.cost), 0);
    const left = destinyBase + gain - spent;

    if ($("#destinyBase")) $("#destinyBase").value = String(destinyBase);
    if ($("#destinySpent")) $("#destinySpent").textContent = String(spent);
    if ($("#destinyGain")) $("#destinyGain").textContent = String(gain);
    if ($("#destinyLeft")) $("#destinyLeft").textContent = String(left);
    if ($("#selectionCount")) $("#selectionCount").textContent = String(selectedItems.length);

    const list = $("#selectionList");
    if (!list) return;

    if (!selectedItems.length) {
      list.innerHTML = `<div class="selectionEmpty mono tiny">Aucune entrée sélectionnée pour le moment.</div>`;
      return;
    }

    list.innerHTML = selectedItems.map((item) => `
      <div class="selectionItem">
        <div class="selectionInfo">
          <strong>${item.name}</strong>
          <span>${item.family} · ${item.cost >= 0 ? `${item.cost} PD` : `+${Math.abs(item.cost)} PD`}</span>
        </div>
        <button class="selectionRemove" type="button" data-remove-id="${item.id}" aria-label="Retirer ${item.name}">×</button>
      </div>
    `).join("");

    list.querySelectorAll("[data-remove-id]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedIds.delete(button.dataset.removeId);
        saveBuilderState();
        renderBudget();
        renderGrid();
        renderDrawerAction();
      });
    });
  }

  function renderDrawerAction() {
    const action = $("#dAction");
    if (!action || !currentItem) return;
    const selected = selectedIds.has(currentItem.id);
    const label = action.querySelector(".btnLabel");
    if (label) label.textContent = selected ? "RETIRER DE LA SÉLECTION" : "AJOUTER À LA SÉLECTION";
  }

  function toggleSelection(id) {
    if (!id) return;
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    saveBuilderState();
    renderBudget();
    renderGrid();
    renderDrawerAction();
  }

  function renderFamilyChips() {
    const wrap = $("#familyChips");
    if (!wrap) return;
    wrap.innerHTML = FAMILY_ORDER.map((family) => `
      <button class="chip ${family === currentFamily ? "active" : ""}" type="button" data-family="${family}">
        ${family}
      </button>
    `).join("");

    wrap.querySelectorAll("[data-family]").forEach((button) => {
      button.addEventListener("click", () => {
        currentFamily = button.dataset.family || "Tous";
        renderFamilyChips();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const items = filteredItems();
    const grid = $("#grid");
    const count = $("#count");
    if (!grid || !count) return;

    count.textContent = String(items.length);
    grid.innerHTML = items.map((item) => `
      <button class="card ${selectedIds.has(item.id) ? "selected" : ""}" type="button" data-id="${item.id}">
        <div class="cardTop">
          <div class="cardTitle">${item.name}</div>
          <div class="classTag">${item.tier}</div>
        </div>
        <div class="cardMeta">
          <span class="metaPill">${item.family}</span>
          <span class="costTag">${item.cost >= 0 ? `${item.cost} PD` : `+${Math.abs(item.cost)} PD`}</span>
        </div>
        <div class="cardDesc">${item.desc}</div>
      </button>
    `).join("");

    grid.querySelectorAll("[data-id]").forEach((button) => {
      button.addEventListener("click", () => openDrawer(button.dataset.id));
    });
  }

  function openDrawer(id) {
    currentItem = CATALOGUE.find((item) => item.id === id) || null;
    if (!currentItem) return;
    $("#dTitle").textContent = currentItem.name;
    $("#dMeta").textContent = `${currentItem.family} · Classe ${currentItem.tier}`;
    $("#dDesc").textContent = currentItem.desc;
    $("#dEffect").textContent = currentItem.effect;
    $("#dCost").textContent = `${currentItem.cost >= 0 ? `${currentItem.cost} PD` : `Gain ${Math.abs(currentItem.cost)} PD`} · Classe ${currentItem.tier}`;
    $("#dReq").textContent = currentItem.req;
    $("#dRisk").textContent = currentItem.risk;
    $("#dLore").textContent = currentItem.lore;
    $("#dPills").innerHTML = currentItem.tags.map((tag) => `<span class="metaPill">${tag}</span>`).join("");
    renderDrawerAction();
    $("#drawer")?.classList.add("open");
    $("#drawer")?.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    $("#drawer")?.classList.remove("open");
    $("#drawer")?.setAttribute("aria-hidden", "true");
  }

  function unlockContent() {
    sessionStorage.setItem(SESSION_KEY, "1");
    $("#lockBox")?.classList.add("hidden");
    $("#unlockedSide")?.classList.remove("hidden");
    $("#heroSection")?.classList.remove("hidden");
    $("#matrixSection")?.classList.remove("hidden");
    $("#filtersBlock")?.classList.remove("hidden");
    $("#planGrid")?.classList.remove("hidden");
    $("#catalogueBlock")?.classList.remove("hidden");
    $("#authFeedback").textContent = "";
    renderFamilyChips();
    renderGrid();
    renderBudget();
  }

  function lockContent() {
    $("#lockBox")?.classList.remove("hidden");
    $("#unlockedSide")?.classList.add("hidden");
    $("#heroSection")?.classList.add("hidden");
    $("#matrixSection")?.classList.add("hidden");
    $("#filtersBlock")?.classList.add("hidden");
    $("#planGrid")?.classList.add("hidden");
    $("#catalogueBlock")?.classList.add("hidden");
  }

  function setDock(open) {
    const dock = $("#homeDock");
    const tab = $("#homeTab");
    const panel = $("#homePanel");
    if (!dock || !tab || !panel) return;
    dock.classList.toggle("open", open);
    tab.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
  }

  function init() {
    loadBuilderState();
    setReduceFx(getReduceFx());
    $("#vol") && ($("#vol").value = String(Math.round(getVol() * 100)));
    setMute(getMute());
    wireGlobalSfx();

    if (sessionStorage.getItem(SESSION_KEY) === "1") unlockContent();
    else lockContent();

    $("#authForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = ($("#authInput")?.value || "").trim().toLowerCase();
      if (value === PASSWORD) {
        unlockContent();
        safePlay(SFX.confirm);
        return;
      }
      $("#authFeedback").textContent = "Clearance refusée. Le protocole reste scellé.";
      if ($("#authInput")) {
        $("#authInput").value = "";
        $("#authInput").focus();
      }
    });

    $("#q")?.addEventListener("input", (event) => {
      currentQuery = event.target.value;
      renderGrid();
    });

    $("#clearQ")?.addEventListener("click", () => {
      currentQuery = "";
      if ($("#q")) $("#q").value = "";
      renderGrid();
    });

    $("#destinyBase")?.addEventListener("input", (event) => {
      const next = Number(event.target.value);
      destinyBase = Number.isFinite(next) && next >= 0 ? next : 0;
      saveBuilderState();
      renderBudget();
    });

    $("#resetSelection")?.addEventListener("click", () => {
      selectedIds = new Set();
      saveBuilderState();
      renderBudget();
      renderGrid();
      renderDrawerAction();
    });

    $("#closeDrawer")?.addEventListener("click", closeDrawer);
    $("#drawer")?.addEventListener("click", (event) => {
      if (event.target === $("#drawer")) closeDrawer();
    });

    $("#dAction")?.addEventListener("click", () => {
      if (!currentItem) return;
      toggleSelection(currentItem.id);
    });

    $("#btnUnlockAudio")?.addEventListener("click", unlockAudio);
    $("#btnMute")?.addEventListener("click", () => setMute(!getMute()));
    $("#vol")?.addEventListener("input", (event) => setVol(Number(event.target.value) / 100));
    $("#btnReduceEffects")?.addEventListener("click", () => setReduceFx(!getReduceFx()));

    $("#homeTab")?.addEventListener("click", () => {
      const dock = $("#homeDock");
      setDock(!dock?.classList.contains("open"));
    });

    document.addEventListener("click", (event) => {
      const dock = $("#homeDock");
      if (!dock?.classList.contains("open")) return;
      if (dock.contains(event.target)) return;
      setDock(false);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        setDock(false);
      }
    });

    renderBudget();
  }

  init();
})();
