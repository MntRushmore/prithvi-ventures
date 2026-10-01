import gsap from "gsap";

const OVERLAYS = ".transition-overlay";

const normalize = (path) =>
  path.replace(/\/index(\.html)?$/, "/").replace(/\.html$/, "").replace(/\/$/, "") || "/";

export function initTransition(ctx) {
  const mark = document.querySelector(".transition-mark");

  const reveal = () =>
    new Promise((resolve) => {
      gsap.set(OVERLAYS, { scaleY: 1, transformOrigin: "top" });
      gsap
        .timeline()
        .to(mark, { autoAlpha: 0, y: -24, duration: 0.35, ease: "power2.in" })
        .to(OVERLAYS, { scaleY: 0, duration: 0.75, stagger: -0.08, ease: "power3.inOut" }, "-=0.1")
        // let page intros start while the last curtains are still lifting
        .call(resolve, null, 0.6);
    });

  const cover = () =>
    new Promise((resolve) => {
      gsap.set(OVERLAYS, { scaleY: 0, transformOrigin: "bottom" });
      gsap.set(mark, { autoAlpha: 0, y: 24 });
      gsap
        .timeline({ onComplete: resolve })
        .to(OVERLAYS, { scaleY: 1, duration: 0.6, stagger: 0.08, ease: "power3.inOut" })
        .to(mark, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.25");
    });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;

    const url = new URL(link.getAttribute("href"), location.href);
    if (url.origin !== location.origin) return;

    event.preventDefault();

    if (link.hasAttribute("data-scroll-top")) {
      ctx.menu?.close();
      ctx.lenis.scrollTo(0, { duration: 2 });
      return;
    }

    if (normalize(url.pathname) === normalize(location.pathname)) {
      ctx.menu?.close();
      const target = url.hash && document.querySelector(url.hash);
      ctx.lenis.scrollTo(target || 0, { duration: 1.8 });
      return;
    }

    ctx.menu?.close();
    cover().then(() => {
      window.location.href = url.href;
    });
  });

  // Returning via the back button restores the covered page from bfcache.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) reveal();
  });

  if (ctx.reduced) {
    gsap.set(OVERLAYS, { scaleY: 0 });
    return Promise.resolve();
  }

  return reveal();
}
