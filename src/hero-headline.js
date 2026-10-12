const phrases = [
  "Connect",
  "Design",
  "Build",
];

const TYPE_SPEED = 62;
const DELETE_SPEED = 34;
const HOLD_TIME = 1150;
const NEXT_PHRASE_GAP = 180;

export function initHeroHeadline(hero) {
  const typewriter = hero?.querySelector("[data-hero-typewriter]");
  const text = typewriter?.querySelector("[data-hero-typewriter-text]");
  if (!typewriter || !text) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let phraseIndex = 0;
  let characterIndex = 0;
  let deleting = false;
  let visible = false;
  let started = false;
  let timer = 0;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };

  const schedule = (delay) => {
    clearTimer();
    timer = window.setTimeout(step, delay);
  };

  function step() {
    timer = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;

    const phrase = phrases[phraseIndex];
    if (!deleting) {
      characterIndex += 1;
      text.textContent = phrase.slice(0, characterIndex);
      if (characterIndex === phrase.length) {
        deleting = true;
        schedule(HOLD_TIME);
        return;
      }
      schedule(TYPE_SPEED);
      return;
    }

    characterIndex -= 1;
    text.textContent = phrase.slice(0, characterIndex);
    if (characterIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      schedule(NEXT_PHRASE_GAP);
      return;
    }
    schedule(DELETE_SPEED);
  }

  function sync() {
    clearTimer();
    if (reducedMotion.matches) {
      started = false;
      phraseIndex = 0;
      characterIndex = 0;
      deleting = false;
      text.textContent = "";
      typewriter.classList.remove("is-active");
      typewriter.classList.add("is-static");
      return;
    }

    typewriter.classList.remove("is-static");
    if (!visible || document.hidden) return;

    typewriter.classList.add("is-active");
    if (!started) {
      started = true;
      phraseIndex = 0;
      characterIndex = 0;
      deleting = false;
      text.textContent = "";
    }
    schedule(0);
  }

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting && entry.intersectionRatio > 0;
          sync();
        })
      : null;
  if (observer) observer.observe(hero);
  else visible = true;

  const onVisibilityChange = () => sync();
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener("change", sync);
  sync();

  return () => {
    clearTimer();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.removeEventListener("change", sync);
  };
}
