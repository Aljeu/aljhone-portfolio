export function initServicesSweep(heading) {
  const letters = [...(heading?.querySelectorAll("[data-sweep-letter]") ?? [])];
  if (!letters.length) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let index = 0;
  let timer = 0;

  const clearTimer = () => {
    window.clearTimeout(timer);
    timer = 0;
  };
  const reset = () => {
    index = 0;
    letters.forEach((letter) => letter.classList.remove("is-inverted"));
  };
  const schedule = (delay) => {
    clearTimer();
    if (visible && !document.hidden && !reducedMotion.matches)
      timer = window.setTimeout(step, delay);
  };
  function step() {
    timer = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;
    if (index < letters.length) {
      letters[index++].classList.add("is-inverted");
      schedule(index === letters.length ? 1000 : 145);
      return;
    }
    reset();
    schedule(450);
  }
  function sync() {
    clearTimer();
    if (reducedMotion.matches || document.hidden || !visible) {
      reset();
      return;
    }
    if (index === 0) schedule(450);
    else schedule(0);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio > 0;
    sync();
  });
  observer.observe(heading);
  const onVisibilityChange = sync;
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener("change", sync);

  return () => {
    clearTimer();
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.removeEventListener("change", sync);
  };
}
