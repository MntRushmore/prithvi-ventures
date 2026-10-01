import gsap from "gsap";

// Load-in for an inner page's hero: the title fades in, then the text under it.
export function introHero(ctx, selector) {
  const root = document.querySelector(selector);
  if (!root || ctx.reduced) return;

  const title = root.querySelector("h1");
  const rises = root.querySelectorAll(".page-hero-lede, .page-hero-footer, .contact-links > *");
  const fades = root.querySelectorAll(".about-hero-portrait");

  gsap.set(title, { autoAlpha: 0 });
  if (rises.length) gsap.set(rises, { autoAlpha: 0 });
  if (fades.length) gsap.set(fades, { autoAlpha: 0 });

  ctx.revealed.then(() => {
    const tl = gsap
      .timeline()
      .to(title, { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, 0);
    if (rises.length) tl.to(rises, { autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power1.out" }, 0.5);
    if (fades.length) tl.to(fades, { autoAlpha: 1, duration: 1.4, stagger: 0.1, ease: "power2.out" }, 0.5);
  });
}
