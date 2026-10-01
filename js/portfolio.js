import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introHero } from "./intro.js";

gsap.registerPlugin(Flip);

export function initPortfolio(ctx) {
  const page = document.querySelector(".page.portfolio-page");
  if (!page) return;

  introHero(ctx, ".page-hero");

  const items = gsap.utils.toArray(".pf-item", page);

  // Cards fly in from alternating sides, as on the template's work page.
  const flyIns = ctx.reduced
    ? []
    : items.map((item, i) => {
        const fromLeft = i % 2 === 0;
        return gsap.from(item, {
          x: fromLeft ? -400 : 400,
          rotation: fromLeft ? -12 : 12,
          autoAlpha: 0,
          duration: 1.3,
          ease: "power4.out",
          scrollTrigger: { trigger: item, start: "top 90%", once: true },
        });
      });

  // Filter by sector with a FLIP reflow.
  const buttons = page.querySelectorAll(".pf-filter button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });

      // finish pending fly-ins so hidden cards are in their final state
      flyIns.forEach((tween) => {
        tween.progress(1);
        tween.scrollTrigger?.kill(false, true);
      });

      const state = Flip.getState(items);
      items.forEach((item) => {
        item.style.display = filter === "all" || item.dataset.group === filter ? "" : "none";
      });

      Flip.from(state, {
        duration: ctx.reduced ? 0 : 0.9,
        ease: "expo.inOut",
        absolute: true,
        stagger: 0.03,
        onEnter: (els) =>
          gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.25, ease: "expo.out" }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  });
}
