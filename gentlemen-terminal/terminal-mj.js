(() => {
  const PASSWORD = "gentlemen";
  const SESSION_KEY = "gentlemen:terminal:mj:clearance";

  const gatePanel = document.getElementById("gatePanel");
  const readyPanel = document.getElementById("readyPanel");
  const authForm = document.getElementById("authForm");
  const authInput = document.getElementById("authInput");
  const authFeedback = document.getElementById("authFeedback");

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
    gatePanel?.classList.add("hidden");
    readyPanel?.classList.remove("hidden");
    if (authFeedback) authFeedback.textContent = "";
  }

  function lock() {
    gatePanel?.classList.remove("hidden");
    readyPanel?.classList.add("hidden");
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") unlock();
  else lock();

  authForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = (authInput?.value || "").trim().toLowerCase();
    if (value === PASSWORD) {
      unlock();
      return;
    }
    if (authFeedback) authFeedback.textContent = "Clearance refusée. Le poste MJ reste scellé.";
    if (authInput) {
      authInput.value = "";
      authInput.focus();
    }
  });
})();
