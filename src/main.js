import projects from "./data/projects.json";
import { initHeroHeadline } from "./hero-headline.js";

const escape = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const externalUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};
const imageUrl = (value) =>
  typeof value === "string" &&
  /^\/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg|svg)$/.test(value)
    ? value
    : "";
const arrow =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const actualProjects = projects.filter((project) => !project.placeholder);
const projectLink = (project) => `#project/${encodeURIComponent(project.id)}`;
const selected = document.querySelector("#selected-projects");
const archive = document.querySelector("#archive-projects");
const status = document.querySelector("#filter-status");
const detail = document.querySelector("#project-detail");
const homepageSections = [...document.querySelector("#main").children].filter(
  (element) => element !== detail,
);
const pageTitle = document.title;

const catalogueMedia = matchMedia("(max-width: 760px)");
let catalogueIndex = 0;

function renderSelected() {
  const count = catalogueMedia.matches ? 1 : 2;
  catalogueIndex =
    ((catalogueIndex % actualProjects.length) + actualProjects.length) %
    actualProjects.length;
  selected.innerHTML = Array.from({ length: count }, (_, offset) =>
    actualProjects[(catalogueIndex + offset) % actualProjects.length],
  )
    .map(
      (project) => `
  <article class="project-card project-${escape(project.id)}">
    <a class="project-cover" href="${projectLink(project)}" aria-label="Explore ${escape(project.title)}">
      <img src="${imageUrl(project.image)}" alt="${escape(project.imageAlt)}" loading="lazy" decoding="async" width="1440" height="900">
      <span class="project-cover-action" aria-hidden="true">Explore project ${arrow}</span>
    </a>
    <div class="project-meta"><span>${escape(project.category)}</span><span>${escape(project.status)}</span></div>
    <h3 class="project-title"><a href="${projectLink(project)}">${escape(project.title)} ${arrow}</a></h3>
    <p class="project-summary">${escape(project.summary)}</p>
  </article>`,
    )
    .join("");
  const previous = document.querySelector("#work-previous");
  const next = document.querySelector("#work-next");
  const position = document.querySelector("#work-position");
  if (previous) previous.disabled = false;
  if (next) next.disabled = false;
  if (position)
    position.textContent = `${catalogueIndex + 1} / ${actualProjects.length}`;
}
document.querySelector("#work-previous")?.addEventListener("click", () => {
  catalogueIndex =
    (catalogueIndex - 1 + actualProjects.length) % actualProjects.length;
  renderSelected();
});
document.querySelector("#work-next")?.addEventListener("click", () => {
  catalogueIndex = (catalogueIndex + 1) % actualProjects.length;
  renderSelected();
});
catalogueMedia.addEventListener("change", renderSelected);
renderSelected();

function renderArchive(category = "All") {
  const visible = actualProjects.filter(
    (project) => category === "All" || project.category === category,
  );
  archive.innerHTML = visible
    .map(
      (project) => `
    <a class="archive-row" href="${projectLink(project)}">
      <span class="archive-row-title">${escape(project.title)}<span class="archive-row-summary">${escape(project.summary)}</span></span>
      <span class="archive-category">${escape(project.category)}</span>
      <span class="archive-status">${escape(project.status)}</span>
      <span class="archive-arrow" aria-hidden="true">${arrow}</span>
    </a>`,
    )
    .join("");
  status.textContent = `${visible.length} ${visible.length === 1 ? "project" : "projects"} shown${category === "All" ? "" : ` in ${category}`}.`;
  document
    .querySelectorAll("[data-category]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === category),
      ),
    );
  const future = projects.find((project) => project.placeholder);
  const futureSlot = document.querySelector(".future-slot");
  futureSlot.hidden =
    !future || (category !== "All" && category !== future.category);
  if (future) {
    futureSlot.innerHTML = `<span>${escape(future.status)}</span><p>${escape(future.title)}<span class="future-description">${escape(future.summary)}</span></p><span>More to come</span>`;
  }
}
document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) renderArchive(button.dataset.category);
});
renderArchive();

function externalLink(url, label) {
  const safeUrl = externalUrl(url);
  return safeUrl
    ? `<a class="project-link" href="${escape(safeUrl)}" target="_blank" rel="noopener noreferrer">${escape(label)} ${arrow}<span class="sr-only"> (opens in new tab)</span></a>`
    : "";
}

function showProject(project) {
  homepageSections.forEach((section) => {
    section.hidden = true;
  });
  detail.hidden = false;
  document.title = `${project.title} — Aljhone Agnas`;
  detail.innerHTML = `
    <a class="detail-back text-link" href="#work"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg> Selected work</a>
    <header class="detail-header"><div class="detail-meta"><span>${escape(project.category)}</span><span>${escape(project.status)}</span></div><h1 id="detail-title" tabindex="-1">${escape(project.title)}</h1><p class="lead">${escape(project.summary)}</p></header>
    <figure class="detail-cover"><img src="${imageUrl(project.image)}" alt="${escape(project.imageAlt)}" width="1440" height="900" decoding="async"><figcaption>${escape(project.imageKind)}</figcaption></figure>
    <div class="detail-grid"><div class="detail-content"><h2>The idea</h2><p>${escape(project.description)}</p>${project.decisions?.length ? `<h2>Design considerations</h2><ul>${project.decisions.map((decision) => `<li>${escape(decision)}</li>`).join("")}</ul>` : ""}<h2>Project context</h2><p>${escape(project.context)}</p></div>
    <aside class="detail-aside"><h2>Role</h2><p>${escape(project.role)}</p>${project.stack?.length ? `<h2>Built with</h2><ul class="stack-list">${project.stack.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}<div class="detail-links">${externalLink(project.url, "Open live project")}${externalLink(project.repo, "View public repository")}</div></aside></div>
    <div class="detail-next"><a class="text-link" href="#archive">Explore the project archive ${arrow}</a><a class="text-link" href="#contact">Have a project in mind? ${arrow}</a></div>`;
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("#detail-title").focus({ preventScroll: true });
}

function showHomepage() {
  const wasDetail = !detail.hidden;
  detail.hidden = true;
  homepageSections.forEach((section) => {
    section.hidden = false;
  });
  document.title = pageTitle;
  return wasDetail;
}

function navigate() {
  let hash;
  try {
    hash = decodeURIComponent(location.hash);
  } catch {
    hash = "";
  }
  if (hash.startsWith("#project/")) {
    const project = actualProjects.find((item) => item.id === hash.slice(9));
    if (project) {
      showProject(project);
      return;
    }
    // Unknown project bookmarks return to the archive without trapping visitors.
    history.replaceState(
      { section: "archive" },
      "",
      location.pathname + location.search,
    );
    hash = "#archive";
  }
  const returnedFromDetail = showHomepage();
  if (returnedFromDetail) {
    const target =
      document.getElementById(
        hash.slice(1) || history.state?.section || "main",
      ) || document.querySelector("#main");
    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
      const heading = target.querySelector("h1, h2") || target;
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  }
}
window.addEventListener("hashchange", navigate);
window.addEventListener("popstate", navigate);

// Only project URLs are bookmarks. A normal homepage refresh starts at the hero.
history.scrollRestoration = "manual";
if (!location.hash.startsWith("#project/")) {
  history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "instant" });
  window.addEventListener(
    "load",
    () => window.scrollTo({ top: 0, behavior: "instant" }),
    { once: true },
  );
}
navigate();

document.addEventListener("click", (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target.closest("a");
  if (!link || link.target || link.hasAttribute("download")) return;
  const href = link.getAttribute("href");
  const homeWordmark = link.classList.contains("wordmark") && href === "/";
  if (!homeWordmark && (!href?.startsWith("#") || href.startsWith("#project/")))
    return;
  const id = homeWordmark ? "main" : href.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const returnedFromDetail = showHomepage();
  const state = { section: id };
  const url = location.pathname + location.search;
  if (returnedFromDetail) history.pushState(state, "", url);
  else history.replaceState(state, "", url);
  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    if (returnedFromDetail || link.classList.contains("skip-link")) {
      const heading = target.querySelector("h1, h2") || target;
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  });
});

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
const hero = document.querySelector(".hero");
initHeroHeadline(hero);
const shaderHost = hero.querySelector(".hero-shader");
let heroShader;
// Essential page content and appearance choices work before graphics load.
import("./hero-shader.js")
  .then(({ initHeroShader }) => {
    heroShader = initHeroShader({
      host: shaderHost,
      hero,
      root,
    });
    heroShader.updateAppearance(root.dataset.palette, root.dataset.mode);
  })
  .catch(() => {
    shaderHost.dataset.shaderState = "fallback";
  });
const themeColors = {
  crimson: { dark: "#7B171C", light: "#F5F4F0" },
  mono: { dark: "#343430", light: "#F5F4F0" },
  warm: { dark: "#66321F", light: "#F5F1E8" },
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
  heroShader?.updateAppearance(root.dataset.palette, root.dataset.mode);
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
    ["mono", "crimson", "warm"].includes(button.dataset.palette)
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
