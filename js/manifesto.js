import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

export function initManifesto() {
  const text = document.querySelector(".manifesto-text");
  if (!text) return;

  const split = SplitText.create(text, { type: "words" });
  // each word surfaces, from a shade just above the soil to sand
  gsap.fromTo(split.words, { color: "#4a3d31" }, {
    color: "#e9dcc3",
    stagger: 0.1,
    ease: "none",
    scrollTrigger: { trigger: text, start: "top 80%", end: "bottom 45%", scrub: true },
  });
}
