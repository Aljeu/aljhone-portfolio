// Deform every line with the same wave field to keep the mesh connected.
export function initFooterMesh(svg) {
  if (!svg) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lines = [...svg.querySelectorAll("path")].map((path) => {
    const original = path.getAttribute("d");
    const points = [...original.matchAll(/([ML])\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)/g)].map(
      ([, command, xValue, yValue]) => {
        const x = Number(xValue);
        const y = Number(yValue);
        // Pin the lower edge so the waves never reveal an empty bottom strip.
        const depth = Math.max(0, Math.min(1, (y + 32) / 400));
        const envelope = Math.sin(Math.PI * depth);
        // Keep nearby rows moving together as the larger wave rolls through.
        const wave = (x / 1600) * Math.PI * 2 + depth * 0.8;
        const crossWave = (x / 1600) * Math.PI * 4 - depth * 0.6;
        return {
          command, x, y,
          a: 44 * envelope * Math.sin(wave),
          b: 44 * envelope * Math.cos(wave),
          c: 8 * envelope * Math.sin(crossWave),
          d: 8 * envelope * Math.cos(crossWave),
        };
      },
    );
    return { path, original, points };
  });

  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let previousTime = null;
  let previousDraw = 0;

  function draw(time) {
    frame = 0;
    if (previousTime !== null) elapsed += Math.min(time - previousTime, 100);
    previousTime = time;
    // Keep the larger ripple fluid, with a maximum of sixty updates per second.
    if (time - previousDraw >= 1000 / 60) {
      previousDraw = time - ((time - previousDraw) % (1000 / 60));
      const phase = ((elapsed % 12000) / 12000) * Math.PI * 2;
      const sin = Math.sin(phase);
      const cos = Math.cos(phase) - 1;
      const sin2 = Math.sin(phase * 2);
      const cos2 = Math.cos(phase * 2) - 1;
      for (const { path, points } of lines) {
        path.setAttribute("d", points.map(({ command, x, y, a, b, c, d }) =>
          `${command}${x},${(y + a * cos - b * sin + c * cos2 - d * sin2).toFixed(2)}`,
        ).join(" "));
      }
    }
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    const running = visible && !document.hidden && !reducedMotion.matches;
    if (!running) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
      if (reducedMotion.matches) {
        elapsed = 0;
        previousDraw = 0;
        lines.forEach(({ path, original }) => path.setAttribute("d", original));
      }
    } else if (!frame) {
      previousTime = null;
      frame = requestAnimationFrame(draw);
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(svg);
  document.addEventListener("visibilitychange", sync);
  reducedMotion.addEventListener("change", sync);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reducedMotion.removeEventListener("change", sync);
    lines.forEach(({ path, original }) => path.setAttribute("d", original));
  };
}
