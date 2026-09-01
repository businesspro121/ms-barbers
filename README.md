# MS Barbers — Website

A single-page, no-build-step website for MS Barbers (458 Roman Rd, Bow, London E3 5LU), with 3D scroll-linked motion built on [Motion](https://motion.dev) (the vanilla-JS engine from the Framer Motion team), and a design system generated with the `ui-ux-pro-max` skill (premium black + gold barbershop palette, Cormorant/Montserrat type pairing).

## Structure

```
index.html      — all page content/sections
styles.css      — design tokens + layout + responsive rules
script.js       — nav, scroll-linked 3D parallax, reveal animations, tilt cards
assets/
  ms-barbers-sign.jpg  — logo/nav sign crop
  3.png, 4.png, 5.png  — shop photos (storefront, interior, hanging sign)
  2.png, 6.png, 7.png  — haircut/work photos
  hero-loop.mp4         — background/showcase video
```

No build tools, no npm install required to run — it's plain HTML/CSS/JS. `script.js` loads the `motion` animation library straight from a CDN (`esm.sh`) as an ES module.

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
