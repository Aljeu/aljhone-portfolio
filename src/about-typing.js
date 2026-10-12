export function initWordTyping(section, selector, phrase) {
  const text = section?.querySelector(selector);
  if (!text) return () => {};

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0;
  let visible = false;
  let started = false;
  let character = 0;
  let deleting = false;

  const clearTimer = () => {
    clearTimeout(timer);
    timer = 0;
  };

  function schedule(delay) {
    clearTimer();
    if (visible && !document.hidden && !motion.matches) {
      timer = setTimeout(step, delay);
    }
  }

  function step() {
    timer = 0;
    if (!visible || document.hidden || motion.matches) return;

    if (deleting) {
      character = Math.max(0, character - 1);
      text.textContent = phrase.slice(0, character);
      if (character === 0) {
        deleting = false;
        schedule(180);
      } else {
        schedule(34);
      }
      return;
    }

    character = Math.min(phrase.length, character + 1);
    text.textContent = phrase.slice(0, character);
    if (character === phrase.length) {
      deleting = true;
      schedule(1150);
    } else {
      schedule(62);
    }
  }

  function play() {
    started = true;
    clearTimer();
    character = 0;
    deleting = false;
    if (motion.matches) {
      text.textContent = phrase;
      text.classList.remove("is-typing");
      return;
    }
    text.textContent = "";
    text.classList.add("is-typing");
    schedule(0);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio > 0;
    if (visible && !started) play();
    else if (visible) schedule(0);
    else clearTimer();
  });
  observer.observe(section);

  function onVisibilityChange() {
    if (document.hidden) clearTimer();
    else if (visible && started) schedule(0);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function onMotionChange() {
    clearTimer();
    if (motion.matches) {
      text.textContent = phrase;
      text.classList.remove("is-typing");
      return;
    }
    text.classList.add("is-typing");
    character = 0;
    deleting = false;
    text.textContent = "";
    if (visible) {
      started = true;
      schedule(0);
    }
  }
  motion.addEventListener("change", onMotionChange);

  // The navigation uses this callback to replay, not dispose, the animation.
  return play;
}
