import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Fullscreen film reel. Captions advance on a timer drawn in the progress
// segments. Each caption names the film (slide) it plays over via
// data-slide; when the next caption uses a different film, the new film
// wipes in. With one film, captions simply change over it.

export function initReel(ctx) {
  const reel = document.querySelector(".reel");
  if (!reel) return;

  const frame = reel.querySelector(".reel-frame");
  const ui = reel.querySelector(".reel-ui");
  const slides = gsap.utils.toArray(".reel-slide", reel);
  const captions = gsap.utils.toArray(".reel-caption", reel);
  const segs = gsap.utils.toArray(".reel-seg", reel);
  const bars = segs.map((seg) => seg.querySelector(".reel-seg-bar i"));
  const extras = captions.map((c) => c.querySelectorAll(".reel-kicker, .reel-sub, .reel-link"));
  const splits = captions.map((c) =>
    SplitText.create(c.querySelector(".reel-title"), { type: "lines", mask: "lines", autoSplit: true })
  );

  const slideOf = (i) => Number(captions[i].dataset.slide ?? i) || 0;
  const duration = (i) => parseFloat(captions[i].dataset.duration) || 7;

  // media > ken-burns wrapper > video
  const kbs = slides.map((slide) => {
    const video = slide.querySelector("video");
    const kb = document.createElement("div");
    kb.className = "reel-kb";
    video.replaceWith(kb);
    kb.appendChild(video);
    return kb;
  });

  const media = (s) => slides[s].querySelector(".reel-media");
  const video = (s) => slides[s].querySelector("video");

  let index = 0;
  let progress = null;
  let busy = false;
  let visible = true;

  const play = (s) => {
    const v = video(s);
    if (!v || ctx.reduced) return;
    v.preload = "auto";
    v.play()?.catch(() => {});
  };
  const pause = (s) => video(s)?.pause();

  const captionIn = (i, delay = 0) => {
    const c = captions[i];
    const title = c.querySelector(".reel-title");
    gsap.set(c, { autoAlpha: 1 });
    return gsap
      .timeline({ delay })
      .fromTo(title, { "--shiro": 0, "--shiro-origin": "left" }, { "--shiro": 1, duration: 1, ease: "expo.inOut" })
      .fromTo(splits[i].lines, { yPercent: -105 }, { yPercent: 0, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0.4)
      .fromTo(extras[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: "power3.out" }, 0.6);
  };

  const captionOut = (i) => {
    const c = captions[i];
    const title = c.querySelector(".reel-title");
    return gsap
      .timeline({ onComplete: () => gsap.set(c, { autoAlpha: 0 }) })
      .to(extras[i], { autoAlpha: 0, y: -10, duration: 0.4, stagger: 0.03, ease: "power2.in" }, 0)
      .to(splits[i].lines, { yPercent: 105, duration: 0.6, stagger: 0.04, ease: "power3.in" }, 0)
      .set(title, { "--shiro-origin": "right" }, 0)
      .to(title, { "--shiro": 0, duration: 0.6, ease: "power3.inOut" }, 0.15);
  };

  const runProgress = (i) => {
    progress?.kill();
    segs.forEach((seg, j) => seg.classList.toggle("is-active", j === i));
    bars.forEach((bar, j) => gsap.set(bar, { scaleX: j < i ? 1 : 0 }));
    if (ctx.reduced) return;
    progress = gsap.fromTo(bars[i], { scaleX: 0 }, {
      scaleX: 1,
      duration: duration(i),
      ease: "none",
      onComplete: () => goTo((i + 1) % captions.length),
    });
    if (!visible) progress.pause();
  };

  const wipe = (from, to) => {
    const a = slides[from];
    const b = slides[to];
    play(to);
    gsap.set(b, { autoAlpha: 1, zIndex: 2, clipPath: "inset(0% 0% 0% 100%)" });
    gsap.set(a, { zIndex: 1 });
    return gsap
      .timeline({
        onComplete: () => {
          gsap.set(a, { autoAlpha: 0, clearProps: "clipPath" });
          gsap.set(media(from), { xPercent: 0, scale: 1 });
          pause(from);
        },
      })
      .to(b, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
      .fromTo(media(to), { xPercent: 12, scale: 1.2 }, { xPercent: 0, scale: 1, duration: 1.5, ease: "expo.inOut" }, 0)
      .to(media(from), { xPercent: -10, duration: 1.3, ease: "expo.inOut" }, 0);
  };

  const goTo = (next) => {
    if (next === index || busy) return;
    busy = true;
    const prev = index;
    index = next;

    if (slideOf(next) !== slideOf(prev)) wipe(slideOf(prev), slideOf(next));
    captionOut(prev);
    captionIn(next, 0.55).eventCallback("onComplete", () => (busy = false));
    runProgress(next);
  };

  segs.forEach((seg, i) => seg.addEventListener("click", () => goTo(i)));

  const setVisible = (v) => {
    visible = v;
    if (v) {
      play(slideOf(index));
      progress?.resume();
    } else {
      pause(slideOf(index));
      progress?.pause();
    }
  };

  ScrollTrigger.create({
    trigger: reel,
    start: "top top",
    end: "bottom top",
    onLeave: () => setVisible(false),
    onEnterBack: () => setVisible(true),
  });
  document.addEventListener("visibilitychange", () => setVisible(!document.hidden));

  // initial state, behind the page transition
  slides.forEach((s, i) => gsap.set(s, { autoAlpha: i === slideOf(0) ? 1 : 0 }));
  gsap.set(captions, { autoAlpha: 0 });
  play(slideOf(0));

  const scrollOut = () =>
    gsap
      .timeline({ scrollTrigger: { trigger: reel, start: "top top", end: "bottom top", scrub: true } })
      .fromTo(frame, { clipPath: "inset(0% 0% 0% 0%)" }, {
        clipPath: "inset(6% 3% 6% 3%)",
        ease: "none",
        immediateRender: false,
      }, 0)
      .to(reel.querySelector(".reel-slides"), { yPercent: 20, ease: "none" }, 0)
      .to(ui, { yPercent: -15, autoAlpha: 0, ease: "none" }, 0);

  if (ctx.reduced) {
    gsap.set(captions[0], { autoAlpha: 1 });
    runProgress(0);
    scrollOut();
    return;
  }

  gsap.set(frame, { clipPath: "inset(18% 30% 18% 30%)" });
  gsap.set(".reel-progress", { autoAlpha: 0, y: 24 });

  ctx.revealed.then(() => {
    gsap
      .timeline()
      .to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" }, 0)
      .fromTo(kbs[slideOf(0)], { scale: 1.3 }, { scale: 1, duration: 2.1, ease: "expo.inOut" }, 0)
      .add(captionIn(0), 0.9)
      .to(".reel-progress", { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out" }, 1.3)
      .call(() => {
        runProgress(0);
        scrollOut();
      }, null, 1.5);
  });
}
