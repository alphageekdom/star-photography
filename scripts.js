// ─── Shared helpers ──────────────────────────────────────
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trapTabFocus = (event, focusables) => {
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

const setBodyScrollLocked = (locked) => {
  document.body.style.overflow = locked ? 'hidden' : '';
};

// ─── Preloader ───────────────────────────────────────────
const PRELOADER_DISMISS_DELAY_MS = 400;
const PRELOADER_MAX_WAIT_MS = 6000;

const preloader = document.getElementById('preloader');

if (preloader) {
  const dismissPreloader = () => preloader.classList.add('loaded');

  window.addEventListener('load', () => {
    setTimeout(dismissPreloader, PRELOADER_DISMISS_DELAY_MS);
  });

  // Safety: force-dismiss in case `load` never fires (e.g. broken asset).
  setTimeout(dismissPreloader, PRELOADER_MAX_WAIT_MS);
}

// ─── Navbar scroll state ─────────────────────────────────
const NAV_SCROLLED_THRESHOLD_PX = 60;

const navbar = document.getElementById('nav');

if (navbar) {
  const updateNavbarScrolledState = () => {
    navbar.classList.toggle('scrolled', window.scrollY > NAV_SCROLLED_THRESHOLD_PX);
  };

  window.addEventListener('scroll', updateNavbarScrolledState, { passive: true });
  updateNavbarScrolledState(); // run once in case page loads mid-scroll
}

// ─── Mobile menu toggle ──────────────────────────────────
const MENU_FOCUS_DELAY_MS = 50;
const DESKTOP_MEDIA_QUERY = '(min-width: 769px)';

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let mobileMenuLastFocused = null;

const toggleMobileMenu = (forceOpen) => {
  if (!hamburger || !mobileMenu) return;
  const isOpen = forceOpen ?? !hamburger.classList.contains('active');

  hamburger.classList.toggle('active', isOpen);
  mobileMenu.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
  setBodyScrollLocked(isOpen);

  if (isOpen) {
    mobileMenuLastFocused = document.activeElement;
    // Land on the close button so SR users immediately hear how to exit
    const closeBtn = mobileMenu.querySelector('.mobile-menu-close');
    if (closeBtn) setTimeout(() => closeBtn.focus(), MENU_FOCUS_DELAY_MS);
  } else if (mobileMenuLastFocused) {
    mobileMenuLastFocused.focus();
  }
};

const trapMobileMenuFocus = (event) => {
  if (!mobileMenu?.classList.contains('active')) return;
  trapTabFocus(event, mobileMenu.querySelectorAll('a, button'));
};

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => toggleMobileMenu());

  const mobileMenuCloseBtn = mobileMenu.querySelector('.mobile-menu-close');
  if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener('click', () => toggleMobileMenu(false));
  }

  // Close mobile menu when any link is tapped
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // Close when viewport crosses above the mobile breakpoint
  const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches && mobileMenu.classList.contains('active')) {
      toggleMobileMenu(false);
    }
  });
}

// ─── Scroll Reveal ──────────────────────────────────────
const REVEAL_STAGGER_MS = 80;
const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN = '0px 0px -40px 0px';

const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        // small stagger when multiple elements cross the threshold together
        setTimeout(
          () => entry.target.classList.add('is-visible'),
          index * REVEAL_STAGGER_MS
        );
        observer.unobserve(entry.target);
      });
    },
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // Fallback: show everything if IntersectionObserver isn't supported
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// ─── Lightbox ───────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

// Populated below if the lightbox is on this page; consumed by the global keydown handler.
let lightboxAPI = null;

if (galleryItems.length && lightbox) {
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const focusableControls = [closeBtn, prevBtn, nextBtn].filter(Boolean);

  let currentIndex = -1;
  let lastFocused = null;

  const showIndex = (index) => {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const img = item.querySelector('img');

    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = item.dataset.caption || '';
  };

  const openLightbox = (index) => {
    lastFocused = document.activeElement;
    showIndex(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    setBodyScrollLocked(true);
    closeBtn.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    setBodyScrollLocked(false);
    lightboxImg.src = '';
    if (lastFocused) lastFocused.focus();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => showIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => showIndex(currentIndex + 1));

  // Click on the dim backdrop (but not on the image or buttons) closes
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  lightboxAPI = {
    close: closeLightbox,
    prev: () => showIndex(currentIndex - 1),
    next: () => showIndex(currentIndex + 1),
    trapFocus: (event) => trapTabFocus(event, focusableControls),
  };
}

// ─── Global keyboard shortcuts ──────────────────────────
// Single keydown listener routes Escape to whichever overlay is open,
// and Arrow/Tab keys to the lightbox when it's active.
document.addEventListener('keydown', (event) => {
  if (mobileMenu?.classList.contains('active')) {
    if (event.key === 'Escape') {
      toggleMobileMenu(false);
      return;
    }
    if (event.key === 'Tab') trapMobileMenuFocus(event);
  }

  if (lightboxAPI && lightbox?.classList.contains('is-open')) {
    if (event.key === 'Escape') lightboxAPI.close();
    else if (event.key === 'ArrowLeft') lightboxAPI.prev();
    else if (event.key === 'ArrowRight') lightboxAPI.next();
    else if (event.key === 'Tab') lightboxAPI.trapFocus(event);
  }
});

// ─── Contact Form (Netlify) ─────────────────────────────
const CONTACT_SUCCESS_RESET_MS = 3500;

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  const statusEl = document.getElementById('contactFormStatus');
  const submitBtn = contactForm.querySelector('.contact-form-submit');
  const submitLabel = submitBtn.querySelector('.contact-form-submit-label');
  const emailField = document.getElementById('cf-email');

  const setStatus = (message, type) => {
    statusEl.textContent = message;
    statusEl.classList.remove('is-success', 'is-error');
    if (type) statusEl.classList.add(`is-${type}`);
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    // Stricter than `type="email"` (which accepts e.g. "foo@bar" without a TLD)
    if (emailField && !EMAIL_PATTERN.test(emailField.value.trim())) {
      setStatus('Please enter a valid email address.', 'error');
      emailField.focus();
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending…';
    setStatus('', null);

    try {
      const body = new URLSearchParams(new FormData(contactForm)).toString();

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response.ok) throw new Error('Network response was not ok');

      contactForm.reset();
      setStatus(
        "Thanks — your message is on its way. I'll be in touch soon.",
        'success'
      );
      submitLabel.textContent = 'Message Sent';
      setTimeout(() => {
        submitLabel.textContent = 'Send Message';
        submitBtn.disabled = false;
      }, CONTACT_SUCCESS_RESET_MS);
    } catch {
      setStatus(
        'Something went wrong. Please try again or email info@starphotosllc.com.',
        'error'
      );
      submitLabel.textContent = 'Send Message';
      submitBtn.disabled = false;
    }
  });
}

// ─── Footer copyright year ──────────────────────────────
const yearEl = document.getElementById('footerYear');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ─── Promo: current season word ─────────────────────────
// Meteorological seasons (Northern Hemisphere): Dec–Feb winter, Mar–May spring,
// Jun–Aug summer, Sep–Nov fall. Falls back to "seasonal" if JS is disabled.
const seasonEl = document.getElementById('promoSeason');
if (seasonEl) {
  const seasons = [
    'winter', 'winter',
    'spring', 'spring', 'spring',
    'summer', 'summer', 'summer',
    'fall', 'fall', 'fall',
    'winter',
  ];
  seasonEl.textContent = seasons[new Date().getMonth()];
}

// ─── Discount Popup ─────────────────────────────────────
(() => {
  const promo = document.getElementById('promo');
  if (!promo) return;

  const STORAGE_KEY = 'star_promo_v1';
  const DISMISS_WINDOW_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const TIME_TRIGGER_MS = 30_000;
  const SCROLL_TRIGGER_PCT = 0.6;
  const TRIGGER_SETUP_DELAY_MS = 1500;
  const EMAIL_FOCUS_DELAY_MS = 300;
  const COPY_FEEDBACK_MS = 2000;
  const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // ─ Storage helpers (no-op if localStorage is unavailable) ──────────
  const getState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const setState = (patch) => {
    try {
      const next = { ...getState(), ...patch, updated: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — popup still works per-session */
    }
  };

  const shouldSuppress = () => {
    const { dismissedAt, convertedAt } = getState();
    const windowMs = DISMISS_WINDOW_DAYS * DAY_MS;
    const now = Date.now();
    if (convertedAt && now - convertedAt < windowMs) return true;
    if (dismissedAt && now - dismissedAt < windowMs) return true;
    return false;
  };

  // ─ Open / close ────────────────────────────────────────
  let shown = false;
  let lastFocused = null;

  const getPromoFocusables = () =>
    Array.from(promo.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.closest('[hidden]') && el.offsetParent !== null
    );

  const openPromo = () => {
    if (shown || shouldSuppress()) return;
    shown = true;
    lastFocused = document.activeElement;
    promo.classList.add('is-open');
    promo.setAttribute('aria-hidden', 'false');
    setBodyScrollLocked(true);

    // Focus the email field for quick typing
    const emailField = document.getElementById('promoEmail');
    if (emailField) setTimeout(() => emailField.focus(), EMAIL_FOCUS_DELAY_MS);

    teardownTriggers();
  };

  const closePromo = (reason = 'dismissed') => {
    promo.classList.remove('is-open');
    promo.setAttribute('aria-hidden', 'true');
    setBodyScrollLocked(false);
    if (reason === 'dismissed') setState({ dismissedAt: Date.now() });
    if (lastFocused) lastFocused.focus();
  };

  // Close on backdrop/close-button/dismiss button
  promo.addEventListener('click', (event) => {
    if (event.target.closest('[data-promo-close]')) closePromo();
  });

  // Close on Escape, trap Tab focus while open
  document.addEventListener('keydown', (event) => {
    if (!promo.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closePromo();
      return;
    }
    if (event.key === 'Tab') trapTabFocus(event, getPromoFocusables());
  });

  // ─ Triggers: first of { 30s timer, 60% scroll, exit intent } ─────
  let triggerTimer = null;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrolledPct = (window.scrollY + window.innerHeight) / doc.scrollHeight;
    if (scrolledPct >= SCROLL_TRIGGER_PCT) openPromo();
  };

  const onExitIntent = (event) => {
    // Fires when the mouse leaves the top of the viewport toward the address bar
    if (event.clientY <= 0 && event.relatedTarget === null) openPromo();
  };

  const setupTriggers = () => {
    if (shouldSuppress()) return;
    triggerTimer = setTimeout(openPromo, TIME_TRIGGER_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onExitIntent);
  };

  const teardownTriggers = () => {
    clearTimeout(triggerTimer);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('mouseout', onExitIntent);
  };

  // Kick off triggers after the page has settled a beat
  window.addEventListener('load', () => {
    setTimeout(setupTriggers, TRIGGER_SETUP_DELAY_MS);
  });

  // ─ Form submission ─────────────────────────────────────
  const promoForm = document.getElementById('promoForm');
  const errorEl = document.getElementById('promoError');
  const submitBtn = promoForm.querySelector('.promo-submit');
  const submitLabel = submitBtn.querySelector('.promo-submit-label');
  const emailEl = document.getElementById('promoEmail');

  const offerStateEl = promo.querySelector('[data-state="offer"]');
  const successStateEl = promo.querySelector('[data-state="success"]');
  const codeTextEl = document.getElementById('promoCodeText');

  // Generate a short, readable code per submission: STAR-XXXX
  const generateCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // excludes I/L/O/0/1
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `STAR-${suffix}`;
  };

  const showSuccess = (code) => {
    codeTextEl.textContent = code;
    offerStateEl.hidden = true;
    successStateEl.hidden = false;
  };

  promoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    emailEl.classList.remove('is-invalid');

    const email = emailEl.value.trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      emailEl.classList.add('is-invalid');
      errorEl.textContent = 'Please enter a valid email address.';
      emailEl.focus();
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending…';

    const code = generateCode();

    try {
      const body = new URLSearchParams({
        'form-name': 'promo',
        email,
        code,
        'bot-field': '',
      }).toString();

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      // Succeed visually even on network hiccups — Netlify logs anything that arrives.
    } catch {
      /* ignore — still show the code */
    }

    setState({ convertedAt: Date.now(), email });
    showSuccess(code);
  });

  // ─ Copy code to clipboard ─────────────────────────────
  const copyBtn = document.getElementById('promoCopy');
  const copyLabel = copyBtn.querySelector('.promo-copy-label');

  const copyViaSelection = (targetNode) => {
    const range = document.createRange();
    range.selectNode(targetNode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
  };

  copyBtn.addEventListener('click', async () => {
    const code = codeTextEl.textContent;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers or insecure contexts
      copyViaSelection(codeTextEl);
    }
    copyBtn.classList.add('is-copied');
    copyLabel.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.classList.remove('is-copied');
      copyLabel.textContent = 'Copy';
    }, COPY_FEEDBACK_MS);
  });
})();
