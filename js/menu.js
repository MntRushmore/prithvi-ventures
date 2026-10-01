import gsap from "gsap";
import { isLive } from "./phase.js";

export function initMenu(ctx) {
  const btn = document.querySelector(".menu-toggle-btn");
  const overlay = document.querySelector(".nav-overlay");
  if (!isLive(btn) || !overlay) return;

  const nav = btn.closest(".site-nav");
  const labels = btn.querySelectorAll(".open-label, .close-label");
  const links = overlay.querySelectorAll(".nav-item a");
  const footer = overlay.querySelectorAll(".nav-footer-item");

  const path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  overlay.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.path === path);
  });

  overlay.inert = true;
  let isOpen = false;
  let tl;

  const open = () => {
    isOpen = true;
    overlay.inert = false;
    overlay.style.pointerEvents = "all";
    btn.classList.add("menu-open");
    nav?.classList.add("is-menu-open");
    btn.setAttribute("aria-expanded", "true");
    ctx.lenis?.stop();

    tl?.kill();
    tl = gsap
      .timeline()
      .to(labels, { yPercent: -100, duration: 0.45, ease: "power3.inOut" }, 0)
      .to(overlay, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0)
      .fromTo(links, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.1)
      .to(footer, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: "expo.out" }, 0.3);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    overlay.inert = true;
    overlay.style.pointerEvents = "none";
    btn.classList.remove("menu-open");
    nav?.classList.remove("is-menu-open");
    btn.setAttribute("aria-expanded", "false");
    ctx.lenis?.start();

    tl?.kill();
    tl = gsap
      .timeline()
      .to(labels, { yPercent: 0, duration: 0.45, ease: "power3.inOut" }, 0)
      .to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(links, { yPercent: 100 });
          gsap.set(footer, { y: "100%", opacity: 0 });
        },
      }, 0);
  };

  btn.addEventListener("click", () => (isOpen ? close() : open()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  ctx.menu = { close };
}
