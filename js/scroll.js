import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isLive } from "./phase.js";

export function initScroll({ reduced }) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const lenis = new Lenis({
    lerp: reduced ? 1 : 0.1,
    smoothWheel: !reduced,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const bar = document.querySelector(".scroll-progress");
  const nav = document.querySelector(".site-nav");

  lenis.on("scroll", ({ progress, direction, scroll }) => {
    if (bar) gsap.set(bar, { scaleX: progress });
    if (nav) nav.classList.toggle("is-hidden", direction === 1 && scroll > 240);
  });

  if (import.meta.env.DEV) window.__lenis = lenis;
  return lenis;
}

// Soil-coloured nav while it sits over a light section. Runs after
// the pinned sections exist, so a pinned section is measured by its spacer.
export function initNavTheme() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const sections = gsap.utils.toArray("[data-nav='light']").filter(isLive);
  const active = new Set();
  sections.forEach((section) => {
    const parent = section.parentElement;
    ScrollTrigger.create({
      trigger: parent.classList.contains("pin-spacer") ? parent : section,
      start: "top 60px",
      end: "bottom 60px",
      onToggle: (self) => {
        self.isActive ? active.add(section) : active.delete(section);
        nav.classList.toggle("on-light", active.size > 0);
      },
    });
  });
}
