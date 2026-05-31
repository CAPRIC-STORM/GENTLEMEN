(() => {
  const PASSWORD = "zeross";
  const SESSION_KEY = "gentlemen_zeross_unlocked";

  const form = document.getElementById("archiveAuth");
  const input = document.getElementById("archivePassword");
  const feedback = document.getElementById("archiveFeedback");
  const intro = document.getElementById("archiveIntro");
  const content = document.getElementById("archiveContent");

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
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

    if (feedback) feedback.textContent = "Signal refuse. Le seuil Zeross ne cede pas.";
    if (input) {
      input.value = "";
      input.focus();
    }
  });
})();
