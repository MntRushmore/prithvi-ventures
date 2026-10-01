import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

// Load-in for an inner page's hero: the bar draws, the title drops from it,
// then the supporting text rises.
export function introHero(ctx, selector) {
  const root = document.querySelector(selector);
  if (!root || ctx.reduced) return;

  const title = root.querySelector("h1");
  const rises = root.querySelectorAll(".page-hero-lede, .page-hero-footer, .contact-links > *");
  const fades = root.querySelectorAll(".about-hero-portrait");

  const split = SplitText.create(title, { type: "lines", mask: "lines" });
  gsap.set(title, { "--shiro": 0 });
  gsap.set(split.lines, { yPercent: -105 });
  if (rises.length) gsap.set(rises, { autoAlpha: 0, y: 30 });
  if (fades.length) gsap.set(fades, { autoAlpha: 0 });

  ctx.revealed.then(() => {
    const tl = gsap
      .timeline()
      .to(title, { "--shiro": 1, duration: 1.1, ease: "expo.inOut" }, 0)
      .to(split.lines, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: "expo.out" }, 0.4);
    if (rises.length) tl.to(rises, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.6);
    if (fades.length) tl.to(fades, { autoAlpha: 1, duration: 1.4, stagger: 0.1, ease: "power2.out" }, 0.5);
  });
}
