# AGENTS.md

## Repo state

Greenfield single-page presentation. `presentacion abc del programador.txt` is the sole source of truth — every slide, color, font, animation, and interaction is specified there. No code existed before this session.

## Key facts

- **Stack**: HTML5 + CSS3 + Vanilla JS only. No React, Vue, Tailwind, Bootstrap, Reveal.js, or any framework. All animation, tabs, presenter mode, copy buttons, and typewriter are hand-rolled CSS/JS.
- **Fonts**: Montserrat 800/900 (titles) + Inter 300/400/500/600 (body). Google Fonts loaded via `@import` in CSS. These are spec-mandated, not negotiable.
- **Colors**: `#FFFFFF` bg, `#F8FAFC` alt, `#1E293B` text. Brand accents only appear on topic-relevant slides: Git `#F97316`, Docker `#2496ED`, Linux `#FCC624`, Success `#10B981`, Error `#EF4444`. Rest of presentation is monochromatic.
- **Animations**: Only `fadeIn`, `slideUp`, `zoomIn` allowed (spec constraint). CSS `cubic-bezier(0.22, 1, 0.36, 1)` easing. Staggered via `.d1`–`.d10` delay classes. JS-driven effects (typewriter, branch reveal, kinetic flow, glitch) use `MutationObserver` on slide `.active` class.
- **Navigation**: Scroll wheel (600ms debounce), arrow keys, Home/End, touch swipe (>50px threshold), side nav dots, prev/next buttons. All in `js/app.js`.
- **Presenter mode**: Press `P` → `window.open('index.html?presenter')`. Communication via `BroadcastChannel('abc-presentacion')`. Presenter window shows current slide preview, next slide preview, timer, and `data-notes` from active slide. Notes are hidden from main view.
- **Slide 11 typewriter**: Commands typed character-by-character (30–50ms interval) when slide activates. Uses `MutationObserver`.
- **Slide 19 workshop**: Three tabs (Git/GitHub/Docker) with copy buttons using `navigator.clipboard`. Command blocks in dark `#0F172A` terminal style.
- **Assets** are external files in `assets/`. Brand logos are loaded via `<img src="assets/logos/*.svg">`, photos via `<img src="assets/images/*.jpg">`. User must download and place these files. Generic UI icons remain inline SVG. No external CDN dependencies.
- **No build step, no server needed**. Open `index.html` directly in any browser.
- **Touch support**: passive listeners on `touchstart`/`touchend` for swipe navigation.
- **No git repo, no `.gitignore`, no `vault/`** initialized. This repo is a spec-turned-implementation.
