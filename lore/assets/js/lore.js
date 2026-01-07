(() => {
  const $ = (s) => document.querySelector(s);

  // ===== UI PREFS (FX / DIM) =====
  const toggleFx = $("#toggleFx");
  const toggleDim = $("#toggleDim");
  const scrollTop = $("#scrollTop");

  const LS_UI = {
    fx: "gentlemen_fx",
    dim: "gentlemen_dim",
  };

  function applyUIPrefs() {
    const fx = localStorage.getItem(LS_UI.fx) ?? "on";
    const dim = localStorage.getItem(LS_UI.dim) ?? "off";

    document.body.classList.toggle("fx-off", fx === "off");
    document.body.classList.toggle("fx-on", fx !== "off");
    document.body.classList.toggle("dim", dim === "on");
  }

  toggleFx?.addEventListener("click", () => {
    const isOff = document.body.classList.contains("fx-off");
    localStorage.setItem(LS_UI.fx, isOff ? "on" : "off");
    applyUIPrefs();
  });

  toggleDim?.addEventListener("click", () => {
    const isDim = document.body.classList.contains("dim");
    localStorage.setItem(LS_UI.dim, isDim ? "off" : "on");
    applyUIPrefs();
  });

  scrollTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  applyUIPrefs();

  // ===== FIND (highlight in lore) =====
  const loreEl = $("#loreText");
  const input = $("#findInput");
  const prevBtn = $("#findPrev");
  const nextBtn = $("#findNext");
  const clearBtn = $("#findClear");
  const countEl = $("#findCount");

  let matches = [];
  let activeIndex = -1;
  let originalHTML = loreEl ? loreEl.innerHTML : "";

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function clearFind() {
    if (!loreEl) return;
    loreEl.innerHTML = originalHTML;
    matches = [];
    activeIndex = -1;
    countEl.textContent = "";
  }

  function setActive(i) {
    if (!matches.length) return;
    matches.forEach(m => m.classList.remove("active"));
    activeIndex = (i + matches.length) % matches.length;
    matches[activeIndex].classList.add("active");
    matches[activeIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    countEl.textContent = `${activeIndex + 1}/${matches.length}`;
  }

  function runFind(q) {
    if (!loreEl) return;
    clearFind();
    if (!q || q.trim().length < 2) return;

    const needle = q.trim();
    const re = new RegExp(escapeRegExp(needle), "gi");

    loreEl.innerHTML = originalHTML.replace(re, (m) => `<mark class="find">${m}</mark>`);
    matches = Array.from(loreEl.querySelectorAll("mark.find"));

    if (matches.length) setActive(0);
    else countEl.textContent = "0/0";
  }

  input?.addEventListener("input", (e) => runFind(e.target.value));
  nextBtn?.addEventListener("click", () => setActive(activeIndex + 1));
  prevBtn?.addEventListener("click", () => setActive(activeIndex - 1));
  clearBtn?.addEventListener("click", () => { input.value = ""; clearFind(); });

  const obs = loreEl ? new MutationObserver(() => {
    if (!loreEl.querySelector("mark.find")) originalHTML = loreEl.innerHTML;
  }) : null;
  obs?.observe(loreEl, { childList: true, subtree: true, characterData: true });

  // ===== AUDIO (GLOBAL PREFS + CUT ON LEAVE, FIXED) =====
  const audio = $("#bgAudio");
  const audioMenu = $("#audioMenu");
  const toggleAudioMenu = $("#toggleAudioMenu");
  const closeAudioMenu = $("#closeAudioMenu");

  const audioInit = $("#audioInit");
  const audioPlayPause = $("#audioPlayPause");
  const audioMute = $("#audioMute");
  const audioVolume = $("#audioVolume");
  const audioVolVal = $("#audioVolVal");

  const LS_A = {
    unlocked: "gentlemen_audio_unlocked",
    on: "gentlemen_audio_on",         // global mute preference (true = sound)
    volume: "gentlemen_audio_volume", // global volume (0..1)
  };

  function fmtVol(v) {
    const n = Math.max(0, Math.min(1, Number(v) || 0));
    return n.toFixed(2);
  }

  function setButtonsVisibility(unlocked) {
    if (!audioInit || !audioPlayPause || !audioMute || !audioVolume || !audioVolVal) return;
    audioInit.classList.toggle("hidden", unlocked);
    audioPlayPause.classList.toggle("hidden", !unlocked);
    audioMute.classList.toggle("hidden", !unlocked);
    audioVolume.classList.toggle("hidden", !unlocked);
    audioVolVal.classList.toggle("hidden", !unlocked);
  }

  function applyAudioPrefs() {
    if (!audio) return;

    const vol = localStorage.getItem(LS_A.volume);
    audio.volume = vol !== null ? Number(vol) : 0.4;

    if (audioVolume) audioVolume.value = String(audio.volume);
    if (audioVolVal) audioVolVal.textContent = fmtVol(audio.volume);

    const isOn = (localStorage.getItem(LS_A.on) ?? "false") === "true";
    audio.muted = !isOn;

    if (audioMute) audioMute.textContent = isOn ? "MUTE" : "UNMUTE";
    if (audioPlayPause) audioPlayPause.textContent = audio.paused ? "PLAY" : "PAUSE";

    const unlocked = (localStorage.getItem(LS_A.unlocked) ?? "false") === "true";
    setButtonsVisibility(unlocked);
  }

  function openAudioMenu() {
    if (!audioMenu) return;
    audioMenu.classList.add("open");
    audioMenu.setAttribute("aria-hidden", "false");
  }

  function closeAudioMenuFn() {
    if (!audioMenu) return;
    audioMenu.classList.remove("open");
    audioMenu.setAttribute("aria-hidden", "true");
  }

  toggleAudioMenu?.addEventListener("click", () => {
    if (!audioMenu) return;
    const open = audioMenu.classList.contains("open");
    open ? closeAudioMenuFn() : openAudioMenu();
  });

  closeAudioMenu?.addEventListener("click", closeAudioMenuFn);

  document.addEventListener("click", (e) => {
    if (!audioMenu || !toggleAudioMenu) return;
    const isOpen = audioMenu.classList.contains("open");
    if (!isOpen) return;
    const t = e.target;
    if (audioMenu.contains(t) || toggleAudioMenu.contains(t)) return;
    closeAudioMenuFn();
  });

  // ✅ INIT (user gesture) — unlock + start with sound ON
  audioInit?.addEventListener("click", async () => {
    if (!audio) return;
    try {
      localStorage.setItem(LS_A.unlocked, "true");
      localStorage.setItem(LS_A.on, "true"); // enable sound globally

      applyAudioPrefs();
      await audio.play();

      applyAudioPrefs();
      openAudioMenu();
    } catch (err) {
      console.warn("Audio blocked:", err);
    }
  });

  // PLAY/PAUSE
  audioPlayPause?.addEventListener("click", async () => {
    if (!audio) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
      applyAudioPrefs();
    } catch (err) {
      console.warn("Audio play blocked:", err);
    }
  });

  // MUTE (global pref)
  audioMute?.addEventListener("click", () => {
    const isOn = (localStorage.getItem(LS_A.on) ?? "false") === "true";
    localStorage.setItem(LS_A.on, (!isOn).toString());
    applyAudioPrefs();
  });

  // VOLUME (global pref)
  audioVolume?.addEventListener("input", () => {
    const v = Number(audioVolume.value);
    localStorage.setItem(LS_A.volume, String(v));
    applyAudioPrefs();
  });

  // Sync if another page/menu changes volume/mute later
  window.addEventListener("storage", (e) => {
    if (![LS_A.on, LS_A.volume, LS_A.unlocked].includes(e.key)) return;
    applyAudioPrefs();
  });

  // ✅ CUT ON LEAVE (FIXED)
  // On coupe la musique quand on quitte, MAIS on ne modifie PAS le mute global.
  function cutAudioOnly() {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    // no change to LS_A.on
    applyAudioPrefs();
  }

  window.addEventListener("pagehide", cutAudioOnly);
  window.addEventListener("beforeunload", cutAudioOnly);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") cutAudioOnly();
  });

  applyAudioPrefs();
})();

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
