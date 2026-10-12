// Mint's water-plane geometry stays constant; appearance changes only its light and pigments.
export const HERO_SHADER_PALETTES = {
  crimson: {
    light: { colors: ["#F5F4F0", "#E9ADB0", "#C6616D"], brightness: 1.2 },
    dark: { colors: ["#49131A", "#E23D50", "#B72A3B"], brightness: 1.05 },
  },
  mono: {
    light: { colors: ["#F5F4F0", "#D3D3CF", "#A2A5A5"], brightness: 1.2 },
    dark: { colors: ["#282A2B", "#868D91", "#535B61"], brightness: 1.05 },
  },
  royal: {
    light: { colors: ["#FFF6E5", "#8BB8FF", "#1F5AA6"], brightness: 1.15 },
    dark: { colors: ["#081A3D", "#1F5AA6", "#8BB8FF"], brightness: 1.0 },
  },
};

const MINT = {
  control: "props",
  type: "waterPlane",
  animate: "on",
  range: "disabled",
  uTime: 0,
  uAmplitude: 0,
  uDensity: 1.2,
  uFrequency: 0,
  uSpeed: 0.2,
  uStrength: 3.4,
  cAzimuthAngle: 170,
  cDistance: 4.4,
  cPolarAngle: 70,
  cameraZoom: 1,
  positionX: 0,
  positionY: 0.9,
  positionZ: -0.3,
  rotationX: 45,
  rotationY: 0,
  rotationZ: 0,
  reflection: 0.1,
  lightType: "3d",
  envPreset: "city",
  grain: "off",
  shader: "defaults",
  wireframe: false,
  toggleAxis: false,
  enableCameraUpdate: false,
};

const rgb = (hex) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);

export function initHeroShader({
  host,
  hero,
  root = document.documentElement,
}) {
  if (!host || !hero) return { updateAppearance() {}, dispose() {} };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 767px)");
  let disposed = false;
  let failed = false;
  let loading = false;
  let visible = false;
  let reactRoot;
  let renderIsland;
  let renderFrame;
  let shaderSeconds = 0;
  let animationTimestamp = null;
  const appearance = { palette: "crimson", mode: "dark" };
  let target;
  let current;

  function markTransition(changing) {
    const status = changing ? "changing" : "settled";
    if (host.dataset.shaderTransition !== status)
      host.dataset.shaderTransition = status;
  }

  function selectAppearance(palette, mode) {
    appearance.palette = Object.hasOwn(HERO_SHADER_PALETTES, palette)
      ? palette
      : "crimson";
    appearance.mode = mode === "light" ? "light" : "dark";
    const theme = HERO_SHADER_PALETTES[appearance.palette][appearance.mode];
    target = {
      colors: theme.colors.flatMap(rgb),
      brightness: theme.brightness,
    };
    if (!current || failed || (reduced.matches && !renderIsland))
      current = { colors: [...target.colors], brightness: target.brightness };
    markTransition(
      current.colors.some(
        (value, index) => Math.abs(value - target.colors[index]) > 0.001,
      ) || Math.abs(current.brightness - target.brightness) > 0.001,
    );
    host.dataset.shaderPalette = appearance.palette;
    host.dataset.shaderMode = appearance.mode;
  }

  function isRunning() {
    return (
      !disposed &&
      !failed &&
      visible &&
      !document.hidden &&
      !reduced.matches
    );
  }

  function syncMotionState() {
    host.dataset.shaderMotion = reduced.matches ? "reduced" : "continuous";
    host.dataset.shaderRunning = String(isRunning());
  }

  function fail() {
    if (disposed || failed) return;
    failed = true;
    host.dataset.shaderState = "fallback";
    markTransition(false);
    syncMotionState();
    // Leave the theme-aware CSS fallback intact if WebGL or the optional island fails.
    queueMicrotask(() => reactRoot?.unmount());
  }

  function sync() {
    if (disposed || failed) return;
    if (!isRunning()) animationTimestamp = null;
    syncMotionState();
    if (!renderIsland && visible && !document.hidden && !reduced.matches)
      void load();
    renderIsland?.();
    renderFrame?.();
  }

  async function load() {
    if (loading || renderIsland || disposed || failed) return;
    loading = true;
    host.dataset.shaderState = "loading";
    try {
      const [
        React,
        { createRoot },
        { ShaderGradient, ShaderGradientCanvas },
        { useThree, useFrame },
      ] = await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("@shadergradient/react"),
        import("@react-three/fiber"),
      ]);
      if (disposed || failed) return;
      const h = React.createElement;
      let ready = false;

      class ShaderBoundary extends React.Component {
        state = { failed: false };
        static getDerivedStateFromError() {
          return { failed: true };
        }
        componentDidCatch() {
          fail();
        }
        render() {
          return this.state.failed ? null : this.props.children;
        }
      }

      function FrameBridge({ running }) {
        const { setFrameloop, invalidate, scene, gl } = useThree();
        const materialRef = React.useRef();
        const uniformsRef = React.useRef();
        React.useEffect(() => {
          setFrameloop(running ? "always" : "demand");
          renderFrame = invalidate;
          invalidate();
          return () => {
            renderFrame = undefined;
          };
        }, [running, setFrameloop, invalidate]);

        useFrame((_, delta) => {
          const mesh = scene.getObjectByName("shadergradient-mesh");
          const material = mesh?.material;
          if (material && materialRef.current !== material) {
            materialRef.current = material;
            uniformsRef.current = undefined;
            const compile = material.onBeforeCompile;
            material.onBeforeCompile = function (shader, renderer) {
              compile.call(this, shader, renderer);
              uniformsRef.current = shader.uniforms;
            };
            material.needsUpdate = true;
          }
          const uniforms = uniformsRef.current;
          if (!uniforms) {
            invalidate();
            return;
          }
          if (!ready) {
            ready = true;
            host.dataset.shaderState = "ready";
            gl.domElement.setAttribute("aria-hidden", "true");
            gl.domElement.setAttribute("role", "presentation");
          }
          const frameDelta = Math.min(delta, 0.05);
          if (isRunning()) {
            const now = performance.now();
            if (animationTimestamp !== null)
              shaderSeconds += (now - animationTimestamp) / 1000;
            animationTimestamp = now;
          } else animationTimestamp = null;
          if (uniforms.uTime) uniforms.uTime.value = shaderSeconds;
          // Shared lighting changes smoothly without updating React every frame.
          const blend =
            reduced.matches || !visible || document.hidden
              ? 1
              : 1 - Math.exp(-frameDelta * 5);
          let changing = false;
          current.colors.forEach((value, index) => {
            const next = value + (target.colors[index] - value) * blend;
            current.colors[index] = next;
            const channel = ["r", "g", "b"][index % 3];
            const uniform =
              uniforms[`uC${Math.floor(index / 3) + 1}${channel}`];
            if (uniform) uniform.value = next;
            if (Math.abs(next - target.colors[index]) > 0.001) changing = true;
          });
          current.brightness +=
            (target.brightness - current.brightness) * blend;
          scene.traverse((object) => {
            if (object.isAmbientLight)
              object.intensity = current.brightness * Math.PI;
          });
          if (Math.abs(current.brightness - target.brightness) > 0.001)
            changing = true;
          markTransition(changing);
          if (changing) invalidate();
        });
        return null;
      }

      function Island({ running, density }) {
        // Memoizing this element prevents the library from rebuilding its material on resume.
        const gradient = React.useMemo(() => {
          const theme =
            HERO_SHADER_PALETTES[appearance.palette][appearance.mode];
          return h(ShaderGradient, {
            ...MINT,
            color1: theme.colors[0],
            color2: theme.colors[1],
            color3: theme.colors[2],
            brightness: theme.brightness,
          });
        }, []);
        return h(
          ShaderBoundary,
          null,
          h(
            ShaderGradientCanvas,
            {
              style: {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              },
              pixelDensity: density,
              fov: 45,
              pointerEvents: "none",
              lazyLoad: false,
              preserveDrawingBuffer: false,
              powerPreference: "low-power",
            },
            gradient,
            h(FrameBridge, { running }),
          ),
        );
      }

      reactRoot = createRoot(host, {
        onUncaughtError: fail,
        onCaughtError: fail,
      });
      renderIsland = () => {
        if (disposed || failed) return;
        reactRoot.render(
          h(Island, {
            running: isRunning(),
            density: mobile.matches ? 0.75 : 1,
          }),
        );
      };
      renderIsland();
    } catch {
      fail();
    }
  }

  const onContextLost = (event) => {
    event.preventDefault();
    fail();
  };
  selectAppearance(root.dataset.palette, root.dataset.mode);
  host.dataset.shaderState = "fallback";
  host.addEventListener("webglcontextlost", onContextLost, true);
  host.addEventListener("webglcontextcreationerror", fail, true);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  mobile.addEventListener("change", sync);
  const header = document.querySelector(".site-header");
  let observer;
  let headerHeight = -1;
  function observeVisibleHero() {
    if (disposed) return;
    const measuredHeight = Math.ceil(
      header?.getBoundingClientRect().height ||
        parseFloat(
          getComputedStyle(root).getPropertyValue("--header-height"),
        ) ||
        0,
    );
    const bounds = hero.getBoundingClientRect();
    visible =
      Math.min(bounds.bottom, window.innerHeight) -
        Math.max(bounds.top, measuredHeight) >
        1 &&
      bounds.width > 0 &&
      bounds.right > 0 &&
      bounds.left < window.innerWidth;
    if (measuredHeight !== headerHeight) {
      headerHeight = measuredHeight;
      observer?.disconnect();
      if (typeof IntersectionObserver === "function") {
        observer = new IntersectionObserver(
          ([entry]) => {
            visible =
              entry.isIntersecting &&
              entry.intersectionRatio > 0.01 &&
              entry.intersectionRect.height > 1;
            sync();
          },
          {
            rootMargin: `-${headerHeight}px 0px 0px 0px`,
            threshold: [0, 0.01],
          },
        );
        observer.observe(hero);
      }
    }
    sync();
  }
  const headerObserver =
    typeof ResizeObserver === "function" && header
      ? new ResizeObserver(observeVisibleHero)
      : null;
  headerObserver?.observe(header);
  window.addEventListener("resize", observeVisibleHero);
  observeVisibleHero();

  return {
    updateAppearance(palette, mode) {
      if (disposed) return;
      selectAppearance(palette, mode);
      sync();
    },
    dispose() {
      disposed = true;
      observer?.disconnect();
      headerObserver?.disconnect();
      window.removeEventListener("resize", observeVisibleHero);
      host.removeEventListener("webglcontextlost", onContextLost, true);
      host.removeEventListener("webglcontextcreationerror", fail, true);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      mobile.removeEventListener("change", sync);
      reactRoot?.unmount();
      host.dataset.shaderState = "fallback";
    },
  };
}
