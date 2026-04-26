(() => {
  const PASSWORD = "burnwood";
  const SESSION_KEY = "gentlemen_archives_unlocked";
  const FILES = [
    { kicker: "DOSSIER I", name: "L'IMPACT", href: "assets/pdf/01-impact.pdf" },
    { kicker: "DOSSIER II", name: "LE TYPE 0", href: "assets/pdf/02-type-0.pdf" },
    { kicker: "DOSSIER III", name: "LA NAISSANCE DE LUMIA ISLAND", href: "assets/pdf/03-naissance-lumia-island.pdf" },
    { kicker: "DOSSIER IV", name: "EXPEDITION HERITAGE (SPATIALE)", href: "assets/pdf/04-expedition-heritage-spatiale.pdf" },
    { kicker: "DOSSIER V", name: "LES NOYAUX NEXUS", href: "assets/pdf/05-noyaux-nexus.pdf" },
    { kicker: "DOSSIER VI", name: "LE CINQUIEME COEUR", href: "assets/pdf/06-cinquieme-coeur.pdf" },
    { kicker: "DOSSIER VII", name: "PROJET HERITAGE", href: "assets/pdf/07-projet-heritage.pdf" },
    { kicker: "DOSSIER VIII", name: "CONCLUSION NON AUTORISEE", href: "assets/pdf/08-conclusion-non-autorisee.pdf" },
  ];

  const dock = document.getElementById("homeDock");
  const tab = document.getElementById("homeTab");
  const panel = document.getElementById("homePanel");

  const form = document.getElementById("archiveAuth");
  const input = document.getElementById("archivePassword");
  const feedback = document.getElementById("archiveFeedback");
  const intro = document.getElementById("archiveIntro");
  const content = document.getElementById("archiveContent");
  const grid = document.getElementById("archiveGrid");

  function renderCards() {
    if (!grid || grid.childElementCount) return;

    for (const file of FILES) {
      const link = document.createElement("a");
      link.className = "archive-card";
      link.href = file.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      link.innerHTML = `
        <span class="archive-kicker">${file.kicker}</span>
        <span class="archive-name">${file.name}</span>
        <span class="archive-meta">PDF</span>
      `;

      grid.appendChild(link);
    }
  }

  function setOpen(open) {
    if (!dock || !tab || !panel) return;
    dock.classList.toggle("open", open);
    tab.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
  }

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
    renderCards();
    intro?.classList.add("hidden");
    content?.classList.remove("hidden");
    if (feedback) feedback.textContent = "";
  }

  function lock() {
    intro?.classList.remove("hidden");
    content?.classList.add("hidden");
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    unlock();
  } else {
    lock();
    input?.focus();
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = (input?.value ?? "").trim().toLowerCase();

    if (value === PASSWORD) {
      unlock();
      return;
    }

    if (feedback) feedback.textContent = "Cle refusee. Niveau d'autorisation insuffisant.";
    if (input) {
      input.value = "";
      input.focus();
    }
  });

  tab?.addEventListener("click", () => {
    const open = !dock.classList.contains("open");
    setOpen(open);
  });

  document.addEventListener("click", (event) => {
    if (!dock || !dock.classList.contains("open")) return;
    if (dock.contains(event.target)) return;
    setOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
})();
