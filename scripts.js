// ─── Preloader ───────────────────────────────────────────
const preloader = document.getElementById('preloader');

if (preloader) {
  const dismissPreloader = () => preloader.classList.add('loaded');

  window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 400);
  });

  // Safety: force-dismiss after 6s in case `load` never fires (e.g. broken asset).
  setTimeout(dismissPreloader, 6000);
}

// ─── Navbar scroll state ─────────────────────────────────
const nav = document.getElementById('nav');

if (nav) {
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once in case page loads mid-scroll
}

// ─── Mobile menu toggle ──────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

const toggleMobileMenu = (open) => {
  if (!hamburger || !mobileMenu) return;
  const isOpen = open ?? !hamburger.classList.contains('active');
  hamburger.classList.toggle('active', isOpen);
  mobileMenu.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
};

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => toggleMobileMenu());

  // Close mobile menu when any link is tapped
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // Close when viewport crosses above the mobile breakpoint
  const desktopQuery = window.matchMedia('(min-width: 769px)');
  desktopQuery.addEventListener('change', (e) => {
    if (e.matches && mobileMenu.classList.contains('active')) {
      toggleMobileMenu(false);
    }
  });
}

// ─── Scroll Reveal ──────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // small stagger when multiple elements cross the threshold together
          setTimeout(() => entry.target.classList.add('is-visible'), i * 80);
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // Fallback: just show everything if IntersectionObserver isn't supported
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// ─── Lightbox ───────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

// Populated below if the lightbox is on this page; read by the unified keyboard handler.
let lightboxAPI = null;

if (galleryItems.length && lightbox) {
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCap = document.getElementById('lightboxCaption');
  const btnClose = document.getElementById('lightboxClose');
  const btnPrev = document.getElementById('lightboxPrev');
  const btnNext = document.getElementById('lightboxNext');
  const focusables = [btnClose, btnPrev, btnNext].filter(Boolean);

  let currentIndex = -1;
  let lastFocused = null;

  const showIndex = (index) => {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const img = item.querySelector('img');
    const caption = item.dataset.caption || '';

    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCap.textContent = caption;
  };

  const openLightbox = (index) => {
    lastFocused = document.activeElement;
    showIndex(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    if (lastFocused) lastFocused.focus();
  };

  // Keep Tab / Shift+Tab cycling between the dialog's buttons
  const trapFocus = (e) => {
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Open on gallery-item click
  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  // Controls
  btnClose.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', () => showIndex(currentIndex - 1));
  btnNext.addEventListener('click', () => showIndex(currentIndex + 1));

  // Click on the dim backdrop (but not on the image or buttons) closes
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxAPI = {
    close: closeLightbox,
    prev: () => showIndex(currentIndex - 1),
    next: () => showIndex(currentIndex + 1),
    trapFocus,
  };
}

// ─── Keyboard ────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu?.classList.contains('active')) {
    toggleMobileMenu(false);
    return;
  }

  if (lightboxAPI && lightbox?.classList.contains('is-open')) {
    if (e.key === 'Escape') lightboxAPI.close();
    else if (e.key === 'ArrowLeft') lightboxAPI.prev();
    else if (e.key === 'ArrowRight') lightboxAPI.next();
    else if (e.key === 'Tab') lightboxAPI.trapFocus(e);
  }
});
