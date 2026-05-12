const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const splash = document.querySelector("[data-splash]");

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

function closeNav() {
  nav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

function hideSplash() {
  splash.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
}

window.addEventListener("load", () => {
  window.setTimeout(hideSplash, 550);
});

window.setTimeout(hideSplash, 2200);
