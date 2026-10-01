# Prithvi Ventures

Website for [Prithvi Ventures](https://www.prithvivc.com): investing in hyper ambitious startups that deliver energy abundance. पृथ्वी / Pṛthvī means “Earth” in Sanskrit.

Built on the motion system from [yfyindia](https://github.com/MntRushmore/yfyindia): Vite, GSAP (ScrollTrigger, SplitText, Flip) and Lenis smooth scrolling, with the page-transition curtains, pinned 3D card flythrough, image-swing and cursor-trail effects carried over.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

Deploys to Vercel as a static site (`vercel.json` sets `cleanUrls`, so `/team` serves `team.html`). Live at https://prithvi-ventures.vercel.app.

## Structure

```
index.html  portfolio.html  team.html  contact.html
partials/        nav, page transition and footer, inlined into every page by vite.config.js
css/             globals (tokens, type), chrome, home, pages
js/main.js       entry; initialises each module in page order
js/reel.js       header film + captions
js/story.js      Kunal's story, a single scroll-driven sequence
js/highlights.js pinned 3D portfolio flythrough
js/how.js        "How we work" fill-in index
public/video/    header film and poster
tools/earth-film Python generator for the header film
```

## Header film

`public/video/earth-epic.mp4` is a seamless 36 s loop of the Earth turning, built from real photographs taken by NASA's DSCOVR/EPIC camera on 26 September 2026 (public domain). To regenerate for another date:

```bash
python3 -m venv .venv && .venv/bin/pip install numpy pillow
.venv/bin/python tools/earth-film/globe.py --date 2026-09-26 --out public/video/earth-epic.mp4
```

The reel is built to take more films. Add a `.reel-slide` with its video in `index.html` and point a caption at it with `data-slide="1"`; the new film wipes in when that caption comes up.

## Content sources

All copy comes from the Prithvi Ventures memo, the founders page, the team bios, and Kunal's story video. Portfolio sectors and links come from the memo; the full company list comes from the memo's portfolio graphic.

Fonts: Eczar (Rosetta, designed by Vaibhav Singh; Latin and Devanagari) for display and Anek Latin (Ek Type, Mumbai) for text, both under the SIL Open Font License.
