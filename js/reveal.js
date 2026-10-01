import gsap from "gsap";

// Shared scroll reveals used across pages.
export function initReveals(ctx) {
  if (ctx.reduced) return;

  [".team-teaser-grid .person", ".join-row", ".wall-name", ".person-body > *"].forEach((selector) => {
    gsap.utils.toArray(selector).forEach((el, i) => {
      gsap.from(el, {
        y: 60,
        autoAlpha: 0,
        duration: 1.1,
        delay: (i % 4) * 0.06,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    });
  });

  const wordmark = document.querySelector(".footer-wordmark");
  if (wordmark) {
    gsap.fromTo(wordmark, { clipPath: "inset(100% 0% 0% 0%)", yPercent: 30 }, {
      clipPath: "inset(0% 0% 0% 0%)",
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: ".site-footer", start: "top 90%", end: "bottom bottom", scrub: true },
    });
  }
}
