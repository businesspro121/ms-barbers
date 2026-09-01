# MS Barbers — Website

A single-page, no-build-step website for MS Barbers (458 Roman Rd, Bow, London E3 5LU), with 3D scroll-linked motion built on [Motion](https://motion.dev) (the vanilla-JS engine from the Framer Motion team), and a design system generated with the `ui-ux-pro-max` skill (premium black + gold barbershop palette, Cormorant/Montserrat type pairing).

## Structure

```
index.html      — all page content/sections
styles.css      — design tokens + layout + responsive rules + blog/article styles
script.js       — nav, scroll-linked 3D parallax, reveal animations, tilt cards
robots.txt      — explicitly allows search + AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, ...)
sitemap.xml     — lists every page for search engines
blog/
  index.html                              — blog listing
  how-often-should-you-get-a-haircut.html
  skin-fade-vs-taper-fade.html
  first-time-guide-ms-barbers-bow.html
assets/
  ms-barbers-sign.jpg  — logo/nav sign crop
  3.png, 4.png, 5.png  — shop photos (storefront, interior, hanging sign)
  2.png, 6.png, 7.png  — haircut/work photos
  hero-loop.mp4         — background/showcase video
```

No build tools, no npm install required to run — it's plain HTML/CSS/JS. `script.js` loads the `motion` animation library straight from a CDN (`esm.sh`) as an ES module.

## Motion & interactivity

- **Site-wide cursor-reactive depth** — one `pointermove` listener in `script.js` drives things everywhere on the page: a soft gold spotlight that follows the cursor (`.cursor-glow`, `mix-blend-mode: screen` so it only adds light, never muddies text), and floating orb/icon accents per-section (`.parallax-item`, depth set via `data-depth`) that drift at different speeds — layered parallax across About, Services, and Visit.
- **Cursor-tilt cards** — service cards, review cards, and the About section's sign photo (`.card-3d`, `.tilt-card`) rotate toward the pointer via `perspective` + `rotateX/rotateY`.
- **Magnetic buttons** — every `.btn` nudges slightly toward the cursor on hover and eases back on leave.
- **Scroll-linked hero** — the hero video and headline scale/fade/tilt as you scroll past them, tied to scroll progress via Motion's `scroll()`.
- Everything here respects `prefers-reduced-motion`: the cursor-glow and parallax layer are removed entirely, and reveal/tilt animations collapse to their final state instead of animating.

## SEO / AI-visibility setup

- Every page has a unique `<title>`, meta description, canonical URL, and Open Graph tags.
- `index.html` carries `HairSalon` structured data (schema.org JSON-LD) with the real address, phone, rating (5.0/35) and Instagram — deliberately **no** `openingHoursSpecification`, since only "closes 8pm" is known; don't add fake hours to it.
- Each blog post carries `BlogPosting` + `FAQPage` JSON-LD, which is what lets Google, and AI answer engines like ChatGPT/Claude/Gemini/Perplexity, pull direct Q&A snippets out of the page.
- `robots.txt` explicitly allows the major AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, etc.) rather than relying on the wildcard alone.
- All content is static HTML — nothing is hidden behind JS rendering, so any crawler that doesn't execute JavaScript still sees the full text.
- **After publishing**, submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) to speed up indexing.

**Adding a new blog post:** copy an existing post in `blog/`, update its content, `<title>`, meta description, and the two `<script type="application/ld+json">` blocks (`BlogPosting` + `FAQPage`), then add it to `blog/index.html`'s grid and to `sitemap.xml`.

## Before you publish — one thing left to check

**Full opening hours** — only "closes 8pm" was available from the Maps listing. The Visit section shows a live "Open Now / Closed Now" indicator computed from that single data point (assumes opening by 8am). Replace with real weekly hours in `index.html` for accuracy.

More photos can always be added: drop images into `assets/` and add a `<div class="gallery__item">` entry in the Gallery section of `index.html`.

## Run locally

Any static file server works. For example, with Python already on your machine:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Publish on GitHub Pages

```bash
git init
git add .
git commit -m "Initial MS Barbers website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`**. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.
