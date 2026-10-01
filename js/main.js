import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { inject } from "@vercel/analytics";

import { initNavTheme, initScroll } from "./scroll.js";
import { initTransition } from "./transition.js";
import { initMenu } from "./menu.js";
import { initReel } from "./reel.js";
import { initMeaning } from "./meaning.js";
import { initStory } from "./story.js";
import { initManifesto } from "./manifesto.js";
import { initHighlights } from "./highlights.js";
import { initHow } from "./how.js";
import { initReveals } from "./reveal.js";
import { initTicker } from "./ticker.js";
import { initPortfolio } from "./portfolio.js";
import { initTeam } from "./team.js";
import { initContact } from "./contact.js";

gsap.registerPlugin(ScrollTrigger, SplitText);
inject();

const ctx = {
  reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

let markRevealed;
ctx.revealed = new Promise((resolve) => (markRevealed = resolve));

const fontsReady = () =>
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  ctx.lenis = initScroll(ctx);
  initMenu(ctx);

  // Lines are split by rendered width, so wait for the real fonts. The page
  // stays behind the transition curtains until then.
  await fontsReady();

  // Pinned sections must be created top to bottom.
  initReel(ctx);
  initMeaning(ctx);
  initStory(ctx);
  initManifesto(ctx);
  initHighlights(ctx);
  initHow(ctx);
  initPortfolio(ctx);
  initTeam(ctx);
  initContact(ctx);
  initReveals(ctx);
  initTicker(ctx);
  initNavTheme();

  ScrollTrigger.refresh();

  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) ctx.lenis.scrollTo(target, { immediate: true, force: true });
  }

  initTransition(ctx).then(markRevealed);
});
