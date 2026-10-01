import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EARTH_PHOTOS, HIGHLIGHTS } from "./data.js";

// Pinned section: sector titles slide horizontally while portfolio cards fly
// toward the camera in 3D (adapted from the template's featured work).

const POS_SMALL = [
  { y: 100, x: 1000 }, { y: 1500, x: 100 }, { y: 1250, x: 1950 }, { y: 1500, x: 850 },
  { y: 200, x: 2100 }, { y: 250, x: 600 }, { y: 1100, x: 1650 }, { y: 1000, x: 800 },
  { y: 900, x: 2200 }, { y: 150, x: 1600 }, { y: 700, x: 1200 }, { y: 400, x: 2000 },
];

const POS_LARGE = [
  { y: 800, x: 5000 }, { y: 2000, x: 3000 }, { y: 240, x: 4450 }, { y: 1200, x: 3450 },
  { y: 500, x: 2200 }, { y: 750, x: 1100 }, { y: 1850, x: 3350 }, { y: 2200, x: 1300 },
  { y: 3000, x: 1950 }, { y: 500, x: 4500 }, { y: 1500, x: 2600 }, { y: 400, x: 3800 },
];

const PANELS = 5;
const TICKS = 40;
const COLORS = [
  ["var(--clay)", "var(--sand)"],
  ["var(--forest)", "var(--sand)"],
  ["var(--ochre)", "var(--soil)"],
  ["var(--moss)", "var(--sand)"],
];

function cardMarkup() {
  const cards = HIGHLIGHTS.map((co, i) => {
    const [bg, fg] = COLORS[i % COLORS.length];
    return `<div class="hl-card" style="--c:${bg};--ci:${fg}">
      <p class="small">${co.sector}</p>
      <p class="hl-card-name">${co.name}</p>
    </div>`;
  });
  EARTH_PHOTOS.forEach((src, i) => {
    cards.splice(2 + i * 4, 0, `<div class="hl-card hl-card--image"><img src="${src}" alt="" /></div>`);
  });
  return cards.join("");
}

export function initHighlights() {
  const section = document.querySelector(".highlights");
  if (!section) return;

  const cardsWrap = section.querySelector(".hl-cards");
  const titles = section.querySelector(".hl-titles");
  const indicator = section.querySelector(".hl-indicator");

  cardsWrap.innerHTML = cardMarkup();
  const cards = gsap.utils.toArray(".hl-card", cardsWrap);
  indicator.innerHTML = '<div class="indicator"></div>'.repeat(TICKS);
  const ticks = indicator.querySelectorAll(".indicator");

  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 1001px)", large: "(min-width: 1600px)" }, (context) => {
    if (!context.conditions.desktop) return;

    const positions = context.conditions.large ? POS_LARGE : POS_SMALL;
    cards.forEach((card, i) => gsap.set(card, { x: positions[i].x, y: positions[i].y, z: -1500, scale: 0 }));

    const stagger = 0.07;
    const state = { p: 0 };
    let lit = -1;

    const render = () => {
      const p = state.p;
      gsap.set(titles, { x: -window.innerWidth * (PANELS - 1) * p });
      cards.forEach((card, i) => {
        const local = gsap.utils.clamp(0, 1, (p - i * stagger) * 2);
        gsap.set(card, { z: -1500 + 3000 * local, scale: gsap.utils.clamp(0, 1, local * 10) });
      });
      const on = Math.floor(p * TICKS);
      if (on !== lit) {
        lit = on;
        ticks.forEach((t, i) => t.classList.toggle("is-on", i <= on));
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * 5}`,
      pin: true,
      onUpdate: (self) =>
        gsap.to(state, { p: self.progress, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: render }),
    });

    render();
    return () => {
      trigger.kill();
      gsap.set(titles, { clearProps: "x" });
    };
  });
}
