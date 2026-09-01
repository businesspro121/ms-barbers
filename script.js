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
} else {
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
