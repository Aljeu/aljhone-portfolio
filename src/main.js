import projects from "./data/projects.json";
import { initHeroHeadline } from "./hero-headline.js";
import { initWordTyping } from "./about-typing.js";
import { initServicesSweep } from "./services-sweep.js";
import { initFooterMesh } from "./footer-mesh.js";

const disposeFooterMesh = initFooterMesh(document.querySelector(".footer-mesh"));
if (import.meta.hot) import.meta.hot.dispose(disposeFooterMesh);

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
const previewVideoUrl = (value) =>
  typeof value === "string" &&
  /^\/projects\/previews\/[a-z-]+-preview\.mp4$/.test(value)
    ? value
    : "";
const actualProjects = projects.filter((project) => !project.placeholder);
const projectLink = (project) => `#project/${encodeURIComponent(project.id)}`;
const selected = document.querySelector("#selected-projects");
const detail = document.querySelector("#project-detail");
const homepageSections = [...document.querySelector("#main").children].filter(
  (element) => element !== detail,
);
const pageTitle = document.title;

const replayAbout = initWordTyping(
  document.querySelector("#about"),
  "[data-about-typing]",
  "About",
);
const replayStories = initWordTyping(
  document.querySelector("#stories"),
  "[data-stories-typing]",
  "Stories",
);
initServicesSweep(document.querySelector("#services-title"));
function scrollSection(target, behavior = "smooth") {
  if (!["about", "services"].includes(target.id)) {
    target.scrollIntoView({ block: "start", behavior });
    return;
  }
  const headerHeight = document.querySelector(".site-header").getBoundingClientRect().height;
  const rect = target.getBoundingClientRect();
  const spare = Math.max(0, window.innerHeight - headerHeight - rect.height);
  window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - headerHeight - spare / 2), behavior });
}

let catalogueIndex = 0;
const indicators = document.querySelector("#work-indicators");
const catalogueMotion = matchMedia("(prefers-reduced-motion: reduce)");

selected.innerHTML = actualProjects.map((project, index) => `
  <article class="stack-slide" aria-labelledby="selected-title-${escape(project.id)}" data-index="${index}">
    <div class="stack-copy">
      <p class="stack-category">${escape(project.category)} · ${escape(project.status)}</p>
      <h3 id="selected-title-${escape(project.id)}">${escape(project.title)}</h3>
      <p class="stack-description">${escape(project.description)}</p>
      <p class="stack-role">${escape(project.role)}</p>
      <ul class="stack-tags" aria-label="Technologies">${project.stack.map(item => `<li>${escape(item)}</li>`).join("")}</ul>
      <div class="stack-links">
        <a href="${projectLink(project)}">View project</a>
        ${externalLink(project.repo, "GitHub")}
      </div>
    </div>
    <figure class="stack-media">
      ${previewVideoUrl(project.previewVideo)
        ? `<video class="stack-preview-video" muted playsinline loop preload="none" poster="${imageUrl(project.image)}" role="img" aria-label="Video preview of ${escape(project.title)}"><source data-src="${escape(previewVideoUrl(project.previewVideo))}" type="video/mp4"><img src="${imageUrl(project.image)}" alt="${escape(project.imageAlt)}" loading="lazy" decoding="async" width="1440" height="900"></video>`
        : `<img src="${imageUrl(project.image)}" alt="${escape(project.imageAlt)}" loading="lazy" decoding="async" width="1440" height="900">`}
    </figure>
  </article>`).join("");
indicators.innerHTML = actualProjects.map((project, index) => `
  <button class="stack-dot" type="button" aria-label="Show ${escape(project.title)}" aria-controls="selected-projects" aria-current="${index === 0}" data-index="${index}"></button>`).join("");
const catalogueSlides = [...selected.children];
const catalogueDots = [...indicators.children];

function announceSelected(index) {
  catalogueIndex = index;
  catalogueDots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
  document.querySelector("#work-position").textContent = `${String(index + 1).padStart(2, "0")} / ${String(actualProjects.length).padStart(2, "0")} — ${actualProjects[index].title}`;
}
function selectProject(index) {
  index = Math.max(0, Math.min(actualProjects.length - 1, index));
  selected.scrollTo({
    top: catalogueSlides[index].offsetTop - catalogueSlides[0].offsetTop,
    behavior: catalogueMotion.matches ? "instant" : "smooth",
  });
}
indicators.addEventListener("click", event => {
  const dot = event.target.closest("button[data-index]");
  if (dot) selectProject(Number(dot.dataset.index));
});
selected.addEventListener("keydown", event => {
  if (event.target !== selected) return;
  if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    selectProject(event.key === "Home" ? 0 : event.key === "End" ? actualProjects.length - 1 : catalogueIndex + (event.key === "ArrowDown" ? 1 : -1));
  }
});
const catalogueObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.6) announceSelected(Number(entry.target.dataset.index));
  }
}, { root: selected, threshold: 0.6 });
catalogueSlides.forEach(slide => catalogueObserver.observe(slide));
announceSelected(0);

const projectPreviewVideos = [...selected.querySelectorAll(".stack-preview-video")];
if ("IntersectionObserver" in window && projectPreviewVideos.length) {
  const previewObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (catalogueMotion.matches || !entry.isIntersecting || entry.intersectionRatio < 0.55) {
        video.pause();
        continue;
      }
      const source = video.querySelector("source");
      if (!source.getAttribute("src")) {
        source.setAttribute("src", source.dataset.src);
        video.load();
      }
      video.play().catch(() => {});
    }
  }, { threshold: 0.55 });
  projectPreviewVideos.forEach((video) => previewObserver.observe(video));
  catalogueMotion.addEventListener("change", () => {
    projectPreviewVideos.forEach((video) => {
      if (catalogueMotion.matches) video.pause();
      else {
        previewObserver.unobserve(video);
        previewObserver.observe(video);
      }
    });
  });
}

function externalLink(url, label) {
  const safeUrl = externalUrl(url);
  return safeUrl
    ? `<a class="project-link" href="${escape(safeUrl)}" target="_blank" rel="noopener noreferrer">${escape(label)}<span class="sr-only"> (opens in new tab)</span></a>`
    : "";
}

function showProject(project) {
  homepageSections.forEach((section) => {
    section.hidden = true;
  });
  detail.hidden = false;
  document.title = `${project.title} — Aljhone Agnas`;
  detail.innerHTML = `
    <a class="detail-back text-link" href="#work">Selected work</a>
    <header class="detail-header"><div class="detail-meta"><span>${escape(project.category)}</span><span>${escape(project.status)}</span></div><h1 id="detail-title" tabindex="-1">${escape(project.title)}</h1><p class="lead">${escape(project.summary)}</p></header>
    <figure class="detail-cover"><img src="${imageUrl(project.image)}" alt="${escape(project.imageAlt)}" width="1440" height="900" decoding="async"><figcaption>${escape(project.imageKind)}</figcaption></figure>
    <div class="detail-grid"><div class="detail-content"><h2>The idea</h2><p>${escape(project.description)}</p>${project.decisions?.length ? `<h2>Design considerations</h2><ul>${project.decisions.map((decision) => `<li>${escape(decision)}</li>`).join("")}</ul>` : ""}<h2>Project context</h2><p>${escape(project.context)}</p></div>
    <aside class="detail-aside"><h2>Role</h2><p>${escape(project.role)}</p>${project.stack?.length ? `<h2>Built with</h2><ul class="stack-list">${project.stack.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>` : ""}<div class="detail-links">${externalLink(project.url, "Open live project")}${externalLink(project.repo, "View public repository")}</div></aside></div>
    <div class="detail-next"><a class="text-link" href="/projects.html">Explore the project archive</a><a class="text-link" href="#contact">Have a project in mind?</a></div>`;
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
    location.replace("/projects.html");
    return;
  }
  const returnedFromDetail = showHomepage();
  if (returnedFromDetail) {
    const target =
      document.getElementById(
        hash.slice(1) || history.state?.section || "main",
      ) || document.querySelector("#main");
    requestAnimationFrame(() => {
      scrollSection(target, matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");
      const heading = target.querySelector("h1, h2") || target;
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  }
}
window.addEventListener("hashchange", navigate);
window.addEventListener("popstate", navigate);

// Explicit section links work across pages; ordinary homepage reloads start at the hero.
history.scrollRestoration = "manual";
if (!location.hash.startsWith("#project/")) {
  const initialSection = ["#work", "#about", "#services", "#stories", "#contact"].includes(location.hash)
    ? document.getElementById(location.hash.slice(1))
    : null;
  history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "instant" });
  window.addEventListener(
    "load",
    () => initialSection
      ? scrollSection(initialSection, "instant")
      : window.scrollTo({ top: 0, behavior: "instant" }),
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
  if (id === "about") replayAbout();
  if (id === "stories") replayStories();
  const returnedFromDetail = showHomepage();
  const state = { section: id };
  const url = location.pathname + location.search;
  if (returnedFromDetail) history.pushState(state, "", url);
  else history.replaceState(state, "", url);
  requestAnimationFrame(() => {
    scrollSection(target, matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");
    if (returnedFromDetail || link.classList.contains("skip-link")) {
      const heading = target.querySelector("h1, h2") || target;
      if (!heading.hasAttribute("tabindex"))
        heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  });
});

const header = document.querySelector(".site-header");
const sectionLinks = [...header.querySelectorAll('.main-nav a[href^="#"]')];
const navigationSections = sectionLinks.map((link) => ({
  link,
  section: document.getElementById(link.hash.slice(1)),
}));
function syncActiveNavigation() {
  const readingPosition = header.getBoundingClientRect().bottom +
    Math.max(0, window.innerHeight - header.getBoundingClientRect().bottom) / 2;
  const active = navigationSections.find(({ section }) => {
    if (!section || section.closest("[hidden]")) return false;
    const rect = section.getBoundingClientRect();
    const bottom = section.id === "contact"
      ? document.documentElement.scrollHeight - window.scrollY
      : rect.bottom;
    return rect.top <= readingPosition && bottom > readingPosition;
  });
  sectionLinks.forEach((link) => {
    if (link === active?.link) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
  syncActiveNavigation();
}
function measureHeader() {
  document.documentElement.style.setProperty(
    "--header-height",
    `${Math.ceil(header.getBoundingClientRect().height)}px`,
  );
  syncActiveNavigation();
}
let headerFrame = 0;
function scheduleHeaderSync() {
  if (headerFrame) return;
  headerFrame = requestAnimationFrame(() => {
    headerFrame = 0;
    syncHeader();
  });
}
window.addEventListener("scroll", scheduleHeaderSync, { passive: true });
window.addEventListener("resize", scheduleHeaderSync);
window.addEventListener("hashchange", scheduleHeaderSync);
window.addEventListener("popstate", scheduleHeaderSync);
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
