import gsap from "gsap";

export function initMeaning() {
  const section = document.querySelector(".meaning");
  if (!section) return;

  const earth = section.querySelector(".meaning-earth");
  const word = section.querySelector(".meaning-word");
  const caption = section.querySelectorAll(".meaning-caption > *");

  // The template's signature move: the image swings in from above as the
  // section scrolls into view.
  gsap.fromTo(earth, { yPercent: -110, scale: 0.25, rotation: -18 }, {
    yPercent: 0,
    scale: 1,
    rotation: 0,
    ease: "none",
    scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
  });

  gsap
    .timeline({ scrollTrigger: { trigger: section, start: "top top", end: "+=90%", pin: true, scrub: true } })
    .fromTo(word, { clipPath: "inset(0% 50% 0% 50%)", scale: 1.2 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "power2.out", duration: 0.7 }, 0)
    .fromTo(caption, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }, 0.35)
    .to(earth, { scale: 1.08, ease: "none", duration: 1.2 }, 0);
}
