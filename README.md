# CE Solution Plus — marketing site

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + GSAP/ScrollTrigger + Lenis.
Builds to a fully static, pre-rendered site.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

> On Windows PowerShell, if `npm` is blocked by the script execution policy, use `npm.cmd`.

```bash
npm run typecheck  # tsc --noEmit
npm run build      # static export → ./out
npm run serve:static
```

## Deploy

`npm run build` emits a static `out/` directory. Drop it on any static host:

| Host | Setting |
| --- | --- |
| Vercel / Netlify | Build `npm run build`, publish directory `out` |
| Azure Static Web Apps | App location `/`, output location `out` |
| S3 + CloudFront / IIS / nginx | Upload the contents of `out/` |

Pushes to `main` also build and publish the site to GitHub Pages through
`.github/workflows/deploy-pages.yml`. The workflow supplies the repository base
path automatically, so both Next.js chunks and files under `public/` resolve at
the project Pages URL.

Set `NEXT_PUBLIC_CONTACT_ENDPOINT` (see `.env.example`) to capture contact-form
submissions server-side. Without it the form falls back to a pre-filled mail
client handoff, which still works on a static host.

## Structure

```
src/
  app/            layout (fonts, metadata, JSON-LD), page, globals.css, robots, sitemap
  components/
    layout/       Nav, Footer
    motion/       SmoothScroll (Lenis+GSAP), Reveal, Parallax, KineticText
    sections/     Hero, HeroCanvas, About, Capabilities, Differentiators,
                  MarketsWeServe, TrustStatement, Contact, ContactForm
    ui/           Button, SectionLabel, PlaceholderImage
  content/site.ts All site copy — edit here, not in components
  fonts/          Self-hosted Archivo / Inter / IBM Plex Mono (woff2)
scripts/          Placeholder image plate generator
public/images/    Generated placeholder plates — replace with real photography
reference/        Previous single-file version, kept for reference only
```

## Before launch

- Replace the placeholder plates in `public/images` with cleared photography
  (pass `src="/images/your-photo.jpg"` to `PlaceholderImage`), then delete
  `scripts/generate-placeholder-plates.mjs`.
- Verify everything marked `PLACEHOLDER` in `src/content/site.ts`.
- Set the real LinkedIn and Facebook URLs in `src/content/site.ts`.
- Confirm UEI / CAGE / SAM registration lines in the footer.

## Motion

Scroll animation runs through a single GSAP ticker shared with Lenis. Every
effect checks `prefers-reduced-motion`: Lenis is not instantiated, reveals
render in their final state, the hero canvas paints one static frame, and the
kinetic text stops animating. Reveal targets are hidden pre-paint only when the
inline script in `layout.tsx` confirms JS is enabled and motion is allowed, so
no-JS visitors always get visible content.
