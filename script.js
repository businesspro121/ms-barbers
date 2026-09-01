// MS Barbers — interactions & scroll-linked 3D motion
// Uses "Motion" (the vanilla-JS engine from the Framer Motion team) via ESM CDN.
import { animate, scroll, stagger } from "https://esm.sh/motion@11.15.0";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Nav ---------------- */
const nav = document.getElementById("nav");
const navBurger = document.getElementById("navBurger");
const navLinks = document.getElementById("navLinks");

const onScrollNav = () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 20);
};
onScrollNav();
window.addEventListener("scroll", onScrollNav, { passive: true });

navBurger?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navBurger.setAttribute("aria-expanded", String(isOpen));
});
navLinks?.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navBurger?.setAttribute("aria-expanded", "false");
  })
);

/* ---------------- Footer year ---------------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------------- Hours indicator (derived from known closing time) ---------------- */
const hoursEl = document.getElementById("hoursNow");
if (hoursEl) {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const closeMinutes = 20 * 60; // 8:00 PM
  const openMinutes = 8 * 60; // assume shop opens by 8 AM at the earliest
  const isLikelyOpen = minutesNow >= openMinutes && minutesNow < closeMinutes;
  hoursEl.textContent = isLikelyOpen ? "Open Now" : "Closed Now";
}

/* ---------------- Gallery video (autoplay, muted, looping) ---------------- */
const galleryVideo = document.querySelector(".gallery__video");
if (galleryVideo) {
  galleryVideo.src = "assets/hero-loop.mp4";
  const tryPlay = () => galleryVideo.play().catch(() => {});
  galleryVideo.addEventListener("canplay", tryPlay, { once: true });
  galleryVideo.load();
}

/* ---------------- Reduced motion: skip fancy stuff, show final state ---------------- */
if (prefersReducedMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  const glow = document.getElementById("cursorGlow");
  if (glow) glow.remove();
} else {
  /* ---------------- Site-wide cursor-reactive depth ----------------
     One pointermove listener drives two things everywhere on the page:
     1) a soft gold spotlight that follows the cursor (.cursor-glow)
     2) floating orbs/icons per-section that drift at different depths
        (.parallax-item, depth set via data-depth) — real parallax, not
        just a single isolated widget. Both are rAF-throttled and use
        plain transforms, so they never fight the Motion-driven
        animations elsewhere on the page. */
  const cursorGlow = document.getElementById("cursorGlow");
  const parallaxItems = [...document.querySelectorAll(".parallax-item")];

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let glowRaf = null;

  function updateDepthLayer() {
    glowRaf = null;
    if (cursorGlow) {
      cursorGlow.style.setProperty("--mx", `${pointerX}px`);
      cursorGlow.style.setProperty("--my", `${pointerY}px`);
    }
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = pointerX - cx;
    const dy = pointerY - cy;
    for (const item of parallaxItems) {
      const depth = Number(item.dataset.depth || 0.05);
      item.style.transform = `translate3d(${dx * depth}px, ${dy * depth}px, 0)`;
    }
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!glowRaf) glowRaf = requestAnimationFrame(updateDepthLayer);
    },
    { passive: true }
  );

  updateDepthLayer();
}

if (!prefersReducedMotion) {
  /* ---------------- Hero scroll-linked 3D parallax ---------------- */
  const heroVideo = document.querySelector(".hero__video");
  const heroContent = document.getElementById("heroContent");
  const hero = document.querySelector(".hero");

  if (heroVideo && heroContent && hero) {
    scroll(
      animate(heroVideo, { scale: [1, 1.18], opacity: [1, 0.35] }, { ease: "linear" }),
      { target: hero, offset: ["start start", "end start"] }
    );
    scroll(
      animate(
        heroContent,
        { y: [0, -80], opacity: [1, 0], rotateX: [0, 8] },
        { ease: "linear" }
      ),
      { target: hero, offset: ["start start", "70% start"] }
    );
  }

  /* ---------------- Scroll-triggered reveals (3D tilt-in) ---------------- */
  const revealEls = document.querySelectorAll(".reveal");
  // Reveal only animates position/opacity (never rotateX/rotateY) so it can
  // never collide with the pointer-tilt animation below, which owns rotation
  // on the same elements — two Motion animations fighting over the same
  // transform property on one element causes the loser to freeze mid-fade.
  const revealVariants = {
    up: { y: [48, 0], opacity: [0, 1] },
    left: { x: [-48, 0], opacity: [0, 1] },
    right: { x: [48, 0], opacity: [0, 1] },
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const direction = el.dataset.reveal || "up";
        const delay = Number(el.dataset.delay || 0) * 0.08;
        el.classList.add("is-visible");
        animate(el, revealVariants[direction] || revealVariants.up, {
          duration: 0.8,
          delay,
          easing: [0.16, 1, 0.3, 1],
        });
        io.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ---------------- Pointer-based 3D tilt (sign card + service/review cards) ---------------- */
  const tiltTargets = document.querySelectorAll(".tilt-card, .card-3d");

  tiltTargets.forEach((card) => {
    const strength = card.classList.contains("tilt-card") ? 10 : 6;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      animate(
        card,
        {
          rotateY: px * strength * 2,
          rotateX: py * -strength * 2,
          translateZ: 10,
        },
        { duration: 0.4, easing: [0.16, 1, 0.3, 1] }
      );
    };

    const onLeave = () => {
      animate(
        card,
        { rotateY: 0, rotateX: 0, translateZ: 0 },
        { duration: 0.6, easing: [0.16, 1, 0.3, 1] }
      );
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
  });
}

/* ---------------- 3D showcase: WebGL barber pole ----------------
   A real Three.js scene (not a CSS trick) — a gold-and-black barber
   pole that tilts toward the cursor (or a finger drag on touch) and
   idles with a slow spin + scrolling stripe texture when left alone.
   Loaded lazily so a CDN hiccup here can never break the rest of the
   page, and paused while off-screen to save the user's battery. */
async function initPoleScene() {
  const canvas = document.getElementById("poleCanvas");
  const stage = document.querySelector(".showcase-3d__stage");
  if (!canvas || !stage) return;

  let THREE;
  try {
    THREE = await import("https://esm.sh/three@0.160.0");
  } catch {
    stage.classList.add("is-unavailable");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch {
    stage.classList.add("is-unavailable");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.5);

  scene.add(new THREE.AmbientLight(0xfff4e0, 0.7));
  const keyLight = new THREE.PointLight(0xffd27a, 1.6, 20);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x8ea2ff, 0.6, 20);
  rimLight.position.set(-3, -2, -3);
  scene.add(rimLight);

  // Procedural gold/black diagonal-stripe texture (the classic barber pole)
  const stripeCanvas = document.createElement("canvas");
  stripeCanvas.width = stripeCanvas.height = 256;
  const sctx = stripeCanvas.getContext("2d");
  sctx.fillStyle = "#0c0a09";
  sctx.fillRect(0, 0, 256, 256);
  sctx.save();
  sctx.translate(128, 128);
  sctx.rotate(Math.PI / 4);
  sctx.translate(-256, -256);
  const stripeWidth = 256 / 8;
  for (let i = 0; i < 40; i++) {
    sctx.fillStyle = i % 2 === 0 ? "#c8880f" : "#0c0a09";
    sctx.fillRect(i * stripeWidth, -256, stripeWidth, 1024);
  }
  sctx.restore();
  const stripeTexture = new THREE.CanvasTexture(stripeCanvas);
  stripeTexture.wrapS = THREE.RepeatWrapping;
  stripeTexture.wrapT = THREE.RepeatWrapping;
  stripeTexture.repeat.set(3, 1);

  const group = new THREE.Group();
  group.rotation.z = 0.15;
  scene.add(group);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 3.2, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: stripeTexture, metalness: 0.5, roughness: 0.35 })
  );
  group.add(pole);

  const capMaterial = new THREE.MeshStandardMaterial({ color: 0xc8880f, metalness: 0.9, roughness: 0.2 });
  const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2), capMaterial);
  topCap.position.y = 1.6;
  group.add(topCap);
  const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), capMaterial);
  bottomCap.position.y = -1.6;
  group.add(bottomCap);

  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 12, 32), capMaterial);
  ringTop.position.y = 1.35;
  ringTop.rotation.x = Math.PI / 2;
  group.add(ringTop);
  const ringBottom = ringTop.clone();
  ringBottom.position.y = -1.35;
  group.add(ringBottom);

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let targetX = 0;
  let targetY = 0;
  stage.addEventListener("pointermove", (e) => {
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    targetY = (px - 0.5) * 0.9;
    targetX = (py - 0.5) * -0.6;
  });
  stage.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  let isVisible = true;
  new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0.05 }).observe(stage);

  function animateScene() {
    requestAnimationFrame(animateScene);
    if (!isVisible) return;
    const lerpSpeed = prefersReducedMotion ? 1 : 0.06;
    group.rotation.x += (targetX - group.rotation.x) * lerpSpeed;
    group.rotation.y += (targetY - group.rotation.y) * lerpSpeed;
    if (!prefersReducedMotion) {
      group.rotation.y += 0.0025;
      stripeTexture.offset.x -= 0.0015;
    }
    renderer.render(scene, camera);
  }
  animateScene();
}

initPoleScene();
