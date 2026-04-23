# Star Photography, LLC

A single-page marketing site for an Orange County–based portrait and wedding photographer. Built as a static site with vanilla HTML, CSS, and JavaScript — no frameworks, no build step.

**Live site:** [star-photography.netlify.app](https://star-photography.netlify.app)

## Sections

- **Hero** — full-bleed image with responsive `srcset` and LCP preload
- **About** — photographer bio
- **Services** — Weddings, Portraits, Destinations
- **Portfolio** — masonry-style gallery that opens into a keyboard-accessible lightbox
- **Reviews** — client testimonials
- **Contact** — Netlify-powered form with honeypot spam protection

## Features

- Scroll-reveal animations via `IntersectionObserver`
- Accessible lightbox: focus trap, `Esc` to close, `←`/`→` to navigate
- Mobile menu with scroll lock and viewport-change handling
- `$100 off` discount popup triggered by time (30s), scroll depth (60%), or exit intent — with 7-day dismiss memory in `localStorage` and a second hidden Netlify form to capture emails
- Responsive Cloudinary images (`f_auto,q_auto` + width-based `srcset`) for fast LCP
- Contact and promo forms submit via `fetch` to Netlify without a page reload

## Tech

- HTML / CSS / JavaScript (no dependencies)
- [Netlify](https://www.netlify.com/) — hosting + forms
- [Cloudinary](https://cloudinary.com/) — image CDN and transforms
- [Google Fonts](https://fonts.google.com/) — Cormorant Garamond + Nunito Sans

## Project structure

```
.
├── index.html        # markup for every section
├── scripts.js        # preloader, nav, reveal, lightbox, forms, promo
└── css/
    └── styles.css    # all styles
```

## Local development

No build step. Serve the directory with any static server, e.g.:

```bash
npx serve .
```

Or use the Netlify CLI to test forms locally:

```bash
netlify dev
```

## Deployment

Pushes to `main` auto-deploy to Netlify. Both `contact` and `promo` forms are registered at build time via the `data-netlify="true"` attributes on the hidden form stubs in [index.html](index.html).
