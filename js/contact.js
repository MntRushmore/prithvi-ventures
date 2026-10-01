import gsap from "gsap";
import { EARTH_PHOTOS } from "./data.js";
import { introHero } from "./intro.js";

// Cursor trail from the template's contact page, using real photographs of
// Earth from NASA's DSCOVR/EPIC camera.

const THRESHOLD = 110;
const LIFESPAN = 0.7;

export function initContact(ctx) {
  const page = document.querySelector(".page.contact-page");
  if (!page) return;

  introHero(ctx, ".contact-hero");
  if (ctx.reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const container = page.querySelector(".trail-container");
  let last = null;
  let n = 0;

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (last && Math.hypot(x - last.x, y - last.y) < THRESHOLD) return;
    last = { x, y };

    const img = document.createElement("img");
    img.className = "trail-img";
    img.src = EARTH_PHOTOS[n++ % EARTH_PHOTOS.length];
    img.alt = "";
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    container.appendChild(img);

    const spin = gsap.utils.random(-30, 30);
    gsap
      .timeline({ onComplete: () => img.remove() })
      .fromTo(img, { xPercent: -50, yPercent: -50, scale: 0, rotation: spin }, { scale: 1, duration: 0.75, ease: "expo.out" })
      .to(img, { scale: 0, rotation: spin + 40, duration: 0.9, ease: "expo.in" }, LIFESPAN);
  });
}
