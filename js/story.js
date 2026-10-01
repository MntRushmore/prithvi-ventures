import gsap from "gsap";
import { isLive } from "./phase.js";

// Kunal's story as one scroll-driven sequence:
//   01 the red lights: five pods light up, one per variable, then go out,
//      then a split screen with his portrait and "decisive drivers"
//   02 the history: 1973 to 1991, then the counter crawls to today
//   03 the present: his torn note, as the ground turns forest
//   04 escape velocity: the Earth rises, then falls away

const FIRST_YEAR = 1970;

const tornEdge = () => {
  const top = [];
  const bottom = [];
  for (let i = 0; i <= 36; i++) {
    const x = ((i / 36) * 100).toFixed(2);
    top.push(`${x}% ${(Math.random() * 7).toFixed(1)}px`);
    bottom.unshift(`${x}% calc(100% - ${(Math.random() * 7).toFixed(1)}px)`);
  }
  return `polygon(${top.join(",")},${bottom.join(",")})`;
};

export function initStory(ctx) {
  const story = document.querySelector(".story");
  if (!isLive(story)) return;

  const pin = story.querySelector(".story-pin");
  const $ = (sel) => story.querySelector(sel);
  const $$ = (sel) => gsap.utils.toArray(sel, story);

  const scenes = {
    lights: $(".scene-lights"),
    drivers: $(".scene-drivers"),
    history: $(".scene-history"),
    present: $(".scene-present"),
    escape: $(".scene-escape"),
  };
  const label = (scene) => scene.querySelector(".chapter-label");

  const gantry = $(".gantry");
  const pods = $$(".pod");
  const podLabels = $$(".pod-label");
  const lightsLine = $(".lights-line");
  const lightsSub = $(".lights-sub");

  const photo = $(".drivers-photo");
  const photoImg = $(".drivers-photo img");
  const driversLine = $(".drivers-line");

  const historyLine = $(".history-line");
  const historySub = $(".history-sub");
  const yearEl = $(".history-year");
  const ruler = $(".ruler");
  const marker = $(".ruler-marker");

  const paper = $(".present-paper");
  const presentLine = $(".present-line");
  const presentBody = $$(".present-body");

  const earth = $(".story-earth");
  const escapeLine = $(".escape-line");
  const escapeRest = $$(".escape-body, .escape-sign");

  const ticks = $$(".story-tick");
  const count = $(".story-count");

  paper.style.clipPath = tornEdge();

  // timeline ruler: a tick per year, labels per decade, the two events marked
  const lastYear = new Date().getFullYear() + 4;
  const pos = (year) => ((year - FIRST_YEAR) / (lastYear - FIRST_YEAR)) * 100;
  let rulerHtml = "";
  for (let y = FIRST_YEAR; y <= lastYear; y++) {
    const event = y === 1973 || y === 1991;
    const cls = event ? "tick tick--event" : y % 10 === 0 ? "tick tick--decade" : "tick";
    rulerHtml += `<span class="${cls}" style="left:${pos(y)}%"></span>`;
    if (event) rulerHtml += `<span class="tick-label tick-label--event" style="left:${pos(y)}%">${y}</span>`;
    else if (y % 10 === 0) rulerHtml += `<span class="tick-label" style="left:${pos(y)}%">${y}</span>`;
  }
  story.querySelector(".ruler-ticks").innerHTML = rulerHtml;

  const year = { value: 1973 };
  const renderYear = () => {
    yearEl.textContent = Math.round(year.value);
    marker.style.left = `${pos(year.value)}%`;
  };
  renderYear();

  gsap.set(earth, { xPercent: -50 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  const fadeIn = (targets, at) =>
    tl.fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, stagger: 0.08, ease: "power1.out" }, at);
  const leave = (targets, at) =>
    tl.to(targets, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, at);

  // 01 · the red lights
  tl.set(scenes.lights, { autoAlpha: 1 }, 0)
    .fromTo(gantry, { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0);
  fadeIn(label(scenes.lights), 0.05);
  fadeIn(lightsLine, 0.1);
  fadeIn(lightsSub, 0.35);
  pods.forEach((pod, i) => {
    const at = 0.55 + i * 0.2;
    tl.to(pod, { "--on": 1, duration: 0.02, ease: "none" }, at);
    tl.fromTo(podLabels[i], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.15 }, at);
  });
  // lights out: everything goes dark at once
  tl.to(pods, { "--on": 0, duration: 0.01, ease: "none" }, 1.7)
    .to(podLabels, { autoAlpha: 0, duration: 0.05 }, 1.7)
    .to([label(scenes.lights), lightsSub], { autoAlpha: 0, duration: 0.05 }, 1.7)
    .to(lightsLine, { autoAlpha: 0, duration: 0.05 }, 1.72)
    .to(gantry, { y: "-70vh", duration: 0.3, ease: "power4.in" }, 1.78)
    .set(scenes.lights, { autoAlpha: 0 }, 2.1);

  // 01b · decisive drivers
  tl.set(scenes.drivers, { autoAlpha: 1 }, 1.8)
    .fromTo(photo, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power3.inOut" }, 1.85)
    .fromTo(photoImg, { scale: 1.3 }, { scale: 1, duration: 1.2, ease: "none" }, 1.85);
  fadeIn(label(scenes.drivers), 1.9);
  fadeIn(driversLine, 1.95);
  leave([label(scenes.drivers), driversLine], 2.9);
  tl.to(photo, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.4, ease: "power3.inOut" }, 2.9)
    .set(scenes.drivers, { autoAlpha: 0 }, 3.35);

  // 02 · the history
  tl.set(scenes.history, { autoAlpha: 1 }, 3.0);
  fadeIn(label(scenes.history), 3.05);
  fadeIn(historyLine, 3.1);
  tl.fromTo(yearEl, { autoAlpha: 0, yPercent: 15 }, { autoAlpha: 1, yPercent: 0, duration: 0.4 }, 3.1)
    .fromTo(ruler, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 3.15)
    .to(year, { value: 1991, duration: 0.5, ease: "power2.inOut", onUpdate: renderYear }, 3.45);
  fadeIn(historySub, 3.8);
  // "and then it crawled"
  tl.to(year, { value: new Date().getFullYear(), duration: 0.9, ease: "none", onUpdate: renderYear }, 4.0);
  leave([label(scenes.history), historyLine, historySub], 4.95);
  tl.to([yearEl, ruler], { autoAlpha: 0, duration: 0.3 }, 4.95)
    .set(scenes.history, { autoAlpha: 0 }, 5.3);

  // 03 · the present
  tl.to(pin, { "--story-bg": "#1f3221", "--story-fg": "#e9dcc3", duration: 0.3, ease: "none" }, 5.0)
    .set(scenes.present, { autoAlpha: 1 }, 5.05)
    .fromTo(paper, { y: 140, rotation: 6, autoAlpha: 0 }, { y: 0, rotation: -1.2, autoAlpha: 1, duration: 0.5 }, 5.1);
  fadeIn(label(scenes.present), 5.3);
  fadeIn(presentLine, 5.3);
  fadeIn(presentBody, 5.5);
  tl.to(paper, { y: -90, rotation: -5, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 6.25)
    .set(scenes.present, { autoAlpha: 0 }, 6.65);

  // 04 · escape velocity
  tl.set(scenes.escape, { autoAlpha: 1 }, 6.35)
    .fromTo(earth, { top: "100%", rotation: 16, scale: 1 }, { top: "60%", rotation: 0, duration: 0.8, ease: "power2.out" }, 6.35);
  fadeIn(label(scenes.escape), 6.5);
  fadeIn(escapeLine, 6.5);
  fadeIn(escapeRest, 6.75);
  // ...then it falls away beneath us
  tl.to(earth, { scale: 0.06, rotation: -30, duration: 1, ease: "power2.in" }, 7.3)
    .to({}, { duration: 0.3 }, 8.3);

  let active = -1;
  tl.eventCallback("onUpdate", () => {
    const t = tl.time();
    const i = t < 3.0 ? 0 : t < 5.05 ? 1 : t < 6.35 ? 2 : 3;
    if (i !== active) {
      active = i;
      ticks.forEach((tick, j) => tick.classList.toggle("is-active", j === i));
      count.textContent = `0${i + 1} / 04`;
    }
  });

  const total = tl.duration();
  gsap.timeline({
    scrollTrigger: {
      trigger: story,
      start: "top top",
      end: () => `+=${window.innerHeight * total * 0.85}`,
      pin: pin,
      scrub: ctx.reduced ? true : 0.8,
    },
  }).add(tl);
}
