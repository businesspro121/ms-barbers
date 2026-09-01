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
  craft-detail.mp4      — AI-generated cinematic clip (scissors + steam, gold light) in the "Every Detail, Considered" section — not footage of the real shop; swap for a real product shot whenever one's available
book.html         — accounts + booking page (sign in, profile, card on file, appointment requests)
book.js            — talks to Supabase (auth + database) and Stripe from the browser
book.css           — booking page styles
config.js          — PUBLIC keys for Supabase/Stripe (placeholders until you set accounts up — see below)
supabase/
  schema.sql                              — database tables + security rules; run once in Supabase
  functions/create-setup-intent/index.ts  — the one bit of server code, for saving a card via Stripe
```

No build tools, no npm install required to run — it's plain HTML/CSS/JS. `script.js` loads the `motion` animation library straight from a CDN (`esm.sh`) as an ES module.

## Motion & interactivity

- **Site-wide cursor-reactive depth** — one `pointermove` listener in `script.js` drives things everywhere on the page: a soft gold spotlight that follows the cursor (`.cursor-glow`, `mix-blend-mode: screen` so it only adds light, never muddies text), and floating orb/icon accents per-section (`.parallax-item`, depth set via `data-depth`) that drift at different speeds — layered parallax across About, Services, and Visit.
- **Cursor-tilt cards** — service cards, review cards, and the About section's sign photo (`.card-3d`, `.tilt-card`) rotate toward the pointer via `perspective` + `rotateX/rotateY`.
- **Magnetic buttons** — every `.btn` nudges slightly toward the cursor on hover and eases back on leave.
- **Scroll-linked hero** — the hero video and headline scale/fade/tilt as you scroll past them, tied to scroll progress via Motion's `scroll()`.
- **Scroll progress bar** — a thin gold line at the very top of every page fills left-to-right as you scroll.
- **Image parallax** — the About sign photo and every Gallery photo drift vertically at their own pace as they cross the viewport (`scroll()` bound per-element, offset `["start end", "end start"]`).
- **Count-up numbers** — the rating and review-count stats animate from 0 up to their real value the first time they scroll into view (`[data-count-to]` in `index.html`).
- **Gallery lightbox** — click any Gallery photo to view it full-size with prev/next arrows, arrow-key navigation, and Escape/click-outside to close. Add a new photo to the lightbox by wrapping it in a `<button class="gallery__zoom" data-lightbox data-src="..." data-alt="...">` like the existing ones in `index.html`.
- **Page transitions** — navigating between pages (home → blog → book) crossfades natively via the CSS View Transitions API (`@view-transition` in `styles.css`). Chrome/Edge animate it; Safari/Firefox without support just do a normal instant navigation — no fallback code needed either way.
- Everything here respects `prefers-reduced-motion`: the cursor-glow and parallax layer are removed entirely, page transitions and reveal/tilt animations collapse to their final state instead of animating.

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

## Setting up accounts and logins

`book.html` needs three free/cheap accounts before it works — GitHub Pages can only serve static files, so the database, login, and payment pieces live in separate services that the page talks to. Until you do this, the page just shows a "Booking isn't switched on yet" message — it won't break anything else on the site.

**What this gets you:** customers sign in with Google or email, save their name/age/preferred cut, optionally save a card on file (no charge — Stripe just stores it for later), and submit booking requests that land in a database you can query. There's no live calendar/slot-conflict checking yet — each request is a "please confirm" that the shop follows up on by phone, same as a contact form with memory.

### 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) → sign up → **New Project**. Pick any name/region, save the database password somewhere safe.
2. Once it's created: **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, click **Run**. This creates the `profiles` and `bookings` tables with security rules that make sure a customer can only ever see their own data.
3. **Project Settings → API** — copy the **Project URL** and the **anon/public key**. These go in `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Also set `SUPABASE_FUNCTIONS_URL` to the Project URL with `/functions/v1` appended.

### 2. Turn on Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com): create a project → **APIs & Services → OAuth consent screen** (External, fill in app name/logo) → **Credentials → Create Credentials → OAuth client ID** (type: Web application).
2. Authorized redirect URI: Supabase tells you the exact one to paste — it's in **Supabase Dashboard → Authentication → Providers → Google**. Copy the Client ID and Client Secret from Google into that same Supabase screen, toggle Google **on**.
3. That's it — the "Continue with Google" button on `book.html` will work once this is done.

### 3. Create a Stripe account (for the "card on file" feature)

1. Sign up at [stripe.com](https://stripe.com). You can build and test everything in **Test mode** (top-right toggle) before ever submitting real business/bank details — only flip to Live mode when you're ready to take real cards.
2. **Developers → API keys**: copy the **Publishable key** (`pk_test_...`) into `config.js` as `STRIPE_PUBLISHABLE_KEY`. Copy the **Secret key** (`sk_test_...`) — this one is *not* for `config.js`, it goes into Supabase in the next step.
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from this project folder:
   ```bash
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase functions deploy create-setup-intent
   ```
   This deploys `supabase/functions/create-setup-intent` — the only piece of this whole system that runs on a server, because saving a card requires Stripe's secret key, which must never appear in the site's public JavaScript.

### 4. Fill in `config.js` and you're live

Once all four values in `config.js` are real (not the `YOUR-...` placeholders), commit and push — `book.html` switches itself on automatically, no code changes needed.

### A note on the credit card question specifically

Nothing in this setup ever stores a card number in your database or on GitHub. Stripe's own form (loaded via `js.stripe.com`) collects the card directly in the customer's browser and sends it straight to Stripe — your database only ever holds a Stripe customer ID, which is useless to anyone without your Stripe account login. That split is what keeps you out of PCI-DSS compliance territory; building your own card storage instead of using Stripe would be both far more work and a real legal/security liability.

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
