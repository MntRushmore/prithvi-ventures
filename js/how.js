import gsap from "gsap";
import { isLive } from "./phase.js";

// How we work: the section pins and each principle fills in, left to right,
// as you scroll. Its line from the memo appears alongside while it fills.
export function initHow() {
  const section = document.querySelector(".how");
  if (!isLive(section)) return;

  const words = gsap.utils.toArray(".how-word", section);
  const descs = gsap.utils.toArray(".how-desc", section);
  const nums = gsap.utils.toArray(".how-num", section);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 1001px)", () => {
    gsap.set(words, { "--fill": 0 });
    gsap.set(descs, { autoAlpha: 0, y: 24 });

    let active = -1;
    const setActive = (i) => {
      if (i === active) return;
      const prev = active;
      active = i;
      if (descs[prev]) gsap.to(descs[prev], { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in", overwrite: true });
      gsap.fromTo(descs[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.1, ease: "expo.out", overwrite: true });
      nums.forEach((n, j) => n.classList.toggle("is-active", j === i));
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => setActive(Math.min(words.length - 1, Math.floor(self.progress * words.length))),
      },
    });
    words.forEach((word, i) => tl.to(word, { "--fill": 1, duration: 1, ease: "none" }, i));
    setActive(0);

    return () => {
      gsap.set(words, { clearProps: "--fill" });
      gsap.set(descs, { clearProps: "all" });
    };
  });
}
