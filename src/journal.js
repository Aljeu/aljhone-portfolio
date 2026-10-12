const header = document.querySelector(".site-header");
function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
}
function measureHeader() {
  document.documentElement.style.setProperty(
    "--header-height",
    `${Math.ceil(header.getBoundingClientRect().height)}px`,
  );
}
window.addEventListener("scroll", syncHeader, { passive: true });
new ResizeObserver(measureHeader).observe(header);
syncHeader();
measureHeader();

const appearance = document.querySelector(".appearance");
const appearanceTrigger = appearance.querySelector("summary");
const root = document.documentElement;
const themeColors = {
  crimson: { dark: "#7B171C", light: "#F5F4F0" },
  mono: { dark: "#343430", light: "#F5F4F0" },
  royal: { dark: "#081A3D", light: "#FFF6E5" },
};

function syncAppearance() {
  appearance.querySelectorAll("[data-palette]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.palette === root.dataset.palette),
    );
    button.setAttribute(
      "aria-label",
      `${button.dataset.palette[0].toUpperCase()}${button.dataset.palette.slice(1)} color palette`,
    );
  });
  appearance.querySelectorAll("[data-mode]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.mode === root.dataset.mode),
    );
    button.setAttribute(
      "aria-label",
      `${button.dataset.mode[0].toUpperCase()}${button.dataset.mode.slice(1)} mode`,
    );
  });
  document.querySelector('meta[name="theme-color"]').content =
    themeColors[root.dataset.palette][root.dataset.mode];
  root.style.colorScheme = root.dataset.mode;
}
function closeAppearance(returnFocus = true) {
  if (!appearance.open) return;
  appearance.open = false;
  if (returnFocus) appearanceTrigger.focus({ preventScroll: true });
}
appearance.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (
    button.dataset.palette &&
    ["mono", "crimson", "royal"].includes(button.dataset.palette)
  )
    root.dataset.palette = button.dataset.palette;
  if (button.dataset.mode && ["dark", "light"].includes(button.dataset.mode))
    root.dataset.mode = button.dataset.mode;
  syncAppearance();
  try {
    localStorage.setItem(
      "aljhone-appearance",
      JSON.stringify({
        palette: root.dataset.palette,
        mode: root.dataset.mode,
      }),
    );
  } catch {
    /* Appearance still works when storage is unavailable. */
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appearance.open) {
    event.preventDefault();
    closeAppearance();
  }
});
document.addEventListener("click", (event) => {
  if (appearance.open && !appearance.contains(event.target))
    closeAppearance(false);
});
syncAppearance();
document.querySelector("#year").textContent = String(new Date().getFullYear());
