// The site launches in phases. Anything marked data-phase="N" stays hidden
// until PHASE reaches N, and data-until="N" hides it once PHASE passes N.
// Raise PHASE to bring in the next part.
//   1  the intro and the header film, on one screen that doesn't scroll
//   2  पृथ्वी, Kunal's story and the menu
//   3  what we do, portfolio highlights, how we work
//   4  team, join us, footer and the inner pages
export const PHASE = 1;

// true when an element is on the page in this phase
export const isLive = (el) => !!el && !el.closest("[hidden]");

// Returns false when this whole page isn't live yet (the visitor is sent home).
export function applyPhase() {
  document.querySelectorAll("[data-phase], [data-until]").forEach((el) => {
    const { phase = 0, until = Infinity } = el.dataset;
    el.hidden = Number(phase) > PHASE || PHASE > Number(until);
  });

  if (document.querySelector("main.page")?.hidden) {
    location.replace("/");
    return false;
  }

  // nothing below the film yet: hold the page still
  const below = document.querySelectorAll(".home-page > :not(.reel)");
  const still = below.length > 0 && ![...below].some(isLive);
  document.documentElement.classList.toggle("is-still", still);
  return true;
}
