import gsap from "gsap";
import { introHero } from "./intro.js";

export function initTeam(ctx) {
  const page = document.querySelector(".page.team-page");
  if (!page) return;

  introHero(ctx, ".about-hero");
  if (ctx.reduced) return;

  // Portraits drift up at different speeds as the hero scrolls away.
  const heroScroll = { trigger: ".about-hero", start: "top top", end: "bottom top", scrub: 1 };
  gsap.to(".about-hero-portrait--1", { y: -180, scrollTrigger: heroScroll });
  gsap.to(".about-hero-portrait--2", { y: -300, scrollTrigger: heroScroll });

  gsap.utils.toArray(".person-photo img", page).forEach((img) => {
    gsap.fromTo(img, { yPercent: -10 }, {
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: img.closest(".person-row"), start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}
