/* =========================
   GENTLEMEN — HOME TERMINAL
   No autoplay audio.
   Audio plays only after user gesture (Enter / click).
   Preferences stored in localStorage.
========================= */

(function () {
  const $ = (sel) => document.querySelector(sel);

  const overlay = $("#overlay");
  const overlayPrompt = $("#overlayPrompt");
  const overlayActions = $("#overlayActions");

  const btnInitWithMusic = $("#btnInitWithMusic");
  const btnInitNoMusic = $("#btnInitNoMusic");

  const btnMusic = $("#btnMusic");
  const musicLabel = $("#musicLabel");
  const btnEffects = $("#btnEffects");
  const effectsLabel = $("#effectsLabel");
  const vol = $("#vol");

  const statusValue = $("#statusValue");
  const sfxState = $("#sfxState");
  const bgmState = $("#bgmState");

  // ====== Preferences ======
  const PREF_KEY = "gentlemen_prefs_v1";
  const defaultPrefs = {
    musicEnabled: true,     // user intention
    volume: 0.65,
    reduceEffects: false,
    sfxEnabled: true
  };

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) return { ...defaultPrefs };
      const parsed = JSON.parse(raw);
      return { ...defaultPrefs, ...parsed };
    } catch {
      return { ...defaultPrefs };
    }
  }
  function savePrefs(p) {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  }

  let prefs = loadPrefs();

  // ====== Reduce effects ======
  function applyReduceEffects() {
    document.body.classList.toggle("reduce-effects", !!prefs.reduceEffects);
    effectsLabel.textContent = prefs.reduceEffects ? "OFF" : "ON";
    btnEffects.setAttribute("aria-pressed", String(!!prefs.reduceEffects));
  }

  // ====== Audio Engine (locked until user gesture) ======
  // Put your files here:
  // assets/audio/bgm-home.mp3 (or .ogg)
  // assets/audio/ui-click.mp3
  // assets/audio/ui-confirm.mp3 (optional)
  const audio = {
    unlocked: false,
    bgm: new Audio("assets/audio/bgm-home.mp3"),
    sfxClick: new Audio("assets/audio/ui-click.mp3"),
    sfxConfirm: new Audio("assets/audio/ui-confirm.mp3")
  };

  audio.bgm.loop = true;

  function setVolumeFromPrefs() {
    const v = Math.max(0, Math.min(1, prefs.volume));
    audio.bgm.volume = v;
    audio.sfxClick.volume = Math.min(1, v + 0.1);
    audio.sfxConfirm.volume = Math.min(1, v + 0.1);
    vol.value = String(Math.round(v * 100));
  }

  function updateAudioUI() {
    // Music button label must reflect both: unlocked + enabled + actually playing
    const playing = !audio.bgm.paused && audio.bgm.currentTime > 0;
    btnMusic.setAttribute("aria-pressed", String(!!prefs.musicEnabled));

    if (!audio.unlocked) {
      musicLabel.textContent = "MUSIQUE: VERROUILLÉE";
      bgmState.textContent = "OFF";
      sfxState.textContent = "OFF";
      return;
    }

    musicLabel.textContent = prefs.musicEnabled ? (playing ? "MUSIQUE: ACTIVE" : "MUSIQUE: PRÊTE") : "MUSIQUE: COUPÉE";
    bgmState.textContent = prefs.musicEnabled ? "ON" : "OFF";
    sfxState.textContent = prefs.sfxEnabled ? "ON" : "OFF";
  }

  async function unlockAudio() {
    if (audio.unlocked) return true;

    // A silent play/pause on a tiny buffer is not needed here; direct play attempt works after gesture.
    // Mark as unlocked as soon as we have a user gesture.
    audio.unlocked = true;
    setVolumeFromPrefs();
    updateAudioUI();
    return true;
  }

  function sfx(kind = "click") {
    if (!audio.unlocked) return;
    if (!prefs.sfxEnabled) return;

    try {
      const snd = kind === "confirm" ? audio.sfxConfirm : audio.sfxClick;
      snd.currentTime = 0;
      snd.play().catch(() => {});
    } catch {}
  }

  async function startBgmIfAllowed() {
    if (!audio.unlocked) return;
    if (!prefs.musicEnabled) return;

    try {
      await audio.bgm.play();
    } catch {
      // If play fails, we keep it ready.
    } finally {
      updateAudioUI();
    }
  }

  function stopBgm() {
    try {
      audio.bgm.pause();
      audio.bgm.currentTime = 0;
    } catch {}
    updateAudioUI();
  }

  // Stop music on page leave (strict)
  window.addEventListener("pagehide", () => stopBgm());
  window.addEventListener("beforeunload", () => stopBgm());

  // ====== Overlay flow ======
  let overlayStage = 0; // 0: "Press Enter", 1: show choices

  function showChoices() {
    overlayStage = 1;
    overlayPrompt.innerHTML = `Choisissez votre protocole audio.`;
    overlayActions.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.style.display = "none";
    statusValue.textContent = "TERMINAL INITIALISÉ • ACCÈS ACCORDÉ";
  }

  async function initTerminal({ withMusic }) {
    await unlockAudio();
    prefs.musicEnabled = !!withMusic;
    savePrefs(prefs);

    sfx(withMusic ? "confirm" : "click");
    hideOverlay();

    // Start music only if enabled and unlocked (user gesture already happened)
    await startBgmIfAllowed();
  }

  // ====== Controls ======
  btnMusic.addEventListener("click", async () => {
    // This click is a valid user gesture: unlock audio now.
    await unlockAudio();
    sfx("click");

    prefs.musicEnabled = !prefs.musicEnabled;
    savePrefs(prefs);

    if (prefs.musicEnabled) {
      await startBgmIfAllowed();
    } else {
      stopBgm();
    }
    updateAudioUI();
  });

  btnEffects.addEventListener("click", () => {
    prefs.reduceEffects = !prefs.reduceEffects;
    savePrefs(prefs);
    applyReduceEffects();
    sfx("click");
  });

  vol.addEventListener("input", () => {
    prefs.volume = Math.max(0, Math.min(1, Number(vol.value) / 100));
    savePrefs(prefs);
    setVolumeFromPrefs();
    updateAudioUI();
  });

  // Click SFX on tiles/buttons with data-sfx
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-sfx]");
    if (!el) return;
    const kind = el.getAttribute("data-sfx") === "confirm" ? "confirm" : "click";
    sfx(kind);
  });

  // Init buttons
  btnInitWithMusic.addEventListener("click", () => initTerminal({ withMusic: true }));
  btnInitNoMusic.addEventListener("click", () => initTerminal({ withMusic: false }));

  // Keyboard shortcuts
  window.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && overlay.style.display !== "none") {
      e.preventDefault();
      // First Enter reveals choice, second Enter uses remembered preference (simple + smooth)
      if (overlayStage === 0) {
        await unlockAudio();
        showChoices();
        updateAudioUI();
        return;
      }
      // If already at choice, Enter => init with saved preference by default
      await initTerminal({ withMusic: !!prefs.musicEnabled });
      return;
    }

    if (e.key.toLowerCase() === "m") {
      // toggle music
      btnMusic.click();
    }

    if (e.key.toLowerCase() === "e") {
      btnEffects.click();
    }
  });

  // ====== First paint ======
  applyReduceEffects();
  setVolumeFromPrefs();
  updateAudioUI();

  // If user previously had reduceEffects etc, apply now.
  // IMPORTANT: we do NOT autoplay music here even if prefs.musicEnabled=true.
  statusValue.textContent = "EN ATTENTE D’INITIALISATION";
})();
