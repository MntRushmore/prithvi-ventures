import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isLive } from "./phase.js";

// Endless marquee that speeds up with scroll velocity and follows direction.
const BASE_SPEED = 50 / 45; // percent of track width per second

export function initTicker(ctx) {
  gsap.utils.toArray(".ticker-track").filter(isLive).forEach((track) => {
    track.innerHTML += track.innerHTML;
    if (ctx.reduced) return;

    const wrap = gsap.utils.wrap(-50, 0);
    let x = 0;
    let velocity = 0;
    let direction = 1;
    let speed = 1;
    let active = false;

    ScrollTrigger.create({
      trigger: track,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (active = self.isActive),
      onUpdate: (self) => {
        velocity = self.getVelocity();
        direction = self.direction;
      },
    });

    gsap.ticker.add((time, deltaMs) => {
      if (!active) return;
      velocity *= 0.92;
      speed = gsap.utils.interpolate(speed, (1 + Math.min(Math.abs(velocity) / 250, 8)) * direction, 0.1);
      x = wrap(x - BASE_SPEED * speed * (deltaMs / 1000));
      gsap.set(track, { xPercent: x });
    });
  });
}
