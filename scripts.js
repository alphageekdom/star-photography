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
let mobileMenuLastFocused = null;

const toggleMobileMenu = (open) => {
  if (!hamburger || !mobileMenu) return;
  const isOpen = open ?? !hamburger.classList.contains('active');
  hamburger.classList.toggle('active', isOpen);
  mobileMenu.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';

  if (isOpen) {
    mobileMenuLastFocused = document.activeElement;
    // Focus the first link so keyboard users land inside the menu
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) setTimeout(() => firstLink.focus(), 50);
  } else if (mobileMenuLastFocused) {
    mobileMenuLastFocused.focus();
  }
};

// Keep Tab / Shift+Tab cycling between the menu's links while it's open
const trapMobileMenuFocus = (e) => {
  if (!mobileMenu?.classList.contains('active')) return;
  const links = mobileMenu.querySelectorAll('a');
  if (!links.length) return;
  const first = links[0];
  const last = links[links.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
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

// ─── Global keyboard shortcuts ──────────────────────────
// Single keydown listener routes Escape to whichever overlay is open,
// and Arrow/Tab keys to the lightbox when it's active.
document.addEventListener('keydown', (e) => {
  if (mobileMenu?.classList.contains('active')) {
    if (e.key === 'Escape') {
      toggleMobileMenu(false);
      return;
    }
    if (e.key === 'Tab') trapMobileMenuFocus(e);
  }

  if (lightboxAPI && lightbox?.classList.contains('is-open')) {
    if (e.key === 'Escape') lightboxAPI.close();
    else if (e.key === 'ArrowLeft') lightboxAPI.prev();
    else if (e.key === 'ArrowRight') lightboxAPI.next();
    else if (e.key === 'Tab') lightboxAPI.trapFocus(e);
  }
});

// ─── Contact Form (Netlify) ─────────────────────────────
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
  const status = document.getElementById('contactFormStatus');
  const submitBtn = contactForm.querySelector('.contact-form-submit');
  const submitLabel = submitBtn.querySelector('.contact-form-submit-label');

  const setStatus = (message, type) => {
    status.textContent = message;
    status.classList.remove('is-success', 'is-error');
    if (type) status.classList.add(`is-${type}`);
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending…';
    setStatus('', null);

    try {
      const formData = new FormData(contactForm);
      const body = new URLSearchParams(formData).toString();

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) throw new Error('Network response was not ok');

      contactForm.reset();
      setStatus(
        "Thanks — your message is on its way. I'll be in touch soon.",
        'success'
      );
      submitLabel.textContent = 'Message Sent';
      setTimeout(() => {
        submitLabel.textContent = 'Send Message';
        submitBtn.disabled = false;
      }, 3500);
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

// ─── Discount Popup ─────────────────────────────────────
(() => {
  const promo = document.getElementById('promo');
  if (!promo) return;

  const STORAGE_KEY = 'star_promo_v1';
  const DISMISS_DAYS = 7;
  const TIME_TRIGGER_MS = 30_000;
  const SCROLL_TRIGGER_PCT = 0.6;

  // ─ Storage helpers (gracefully no-op if localStorage is unavailable) ─
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
    const windowMs = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (convertedAt && now - convertedAt < windowMs) return true;
    if (dismissedAt && now - dismissedAt < windowMs) return true;
    return false;
  };

  // ─ Open / close ────────────────────────────────────────
  let shown = false;
  let lastFocused = null;

  const openPromo = () => {
    if (shown || shouldSuppress()) return;
    shown = true;
    lastFocused = document.activeElement;
    promo.classList.add('is-open');
    promo.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus the email field for quick typing
    const email = document.getElementById('promoEmail');
    if (email) setTimeout(() => email.focus(), 300);

    teardownTriggers();
  };

  const closePromo = (reason = 'dismissed') => {
    promo.classList.remove('is-open');
    promo.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (reason === 'dismissed') setState({ dismissedAt: Date.now() });
    if (lastFocused) lastFocused.focus();
  };

  // Close on backdrop/close-button/dismiss button
  promo.addEventListener('click', (e) => {
    if (e.target.closest('[data-promo-close]')) closePromo();
  });

  // Keep Tab / Shift+Tab cycling within the dialog's focusable controls
  const getPromoFocusables = () => {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(promo.querySelectorAll(selector)).filter(
      (el) => !el.closest('[hidden]') && el.offsetParent !== null
    );
  };

  // Close on Escape, trap Tab focus while open
  document.addEventListener('keydown', (e) => {
    if (!promo.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closePromo();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getPromoFocusables();
      if (!focusables.length) return;
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
    }
  });

  // ─ Triggers: first of { 30s timer, 60% scroll, exit intent } ─
  let timer = null;
  const onScroll = () => {
    const doc = document.documentElement;
    const pct = (window.scrollY + window.innerHeight) / doc.scrollHeight;
    if (pct >= SCROLL_TRIGGER_PCT) openPromo();
  };
  const onExitIntent = (e) => {
    // Fires when the mouse leaves the top of the viewport toward the address bar
    if (e.clientY <= 0 && e.relatedTarget === null) openPromo();
  };

  const setupTriggers = () => {
    if (shouldSuppress()) return;
    timer = setTimeout(openPromo, TIME_TRIGGER_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onExitIntent);
  };

  const teardownTriggers = () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('mouseout', onExitIntent);
  };

  // Kick off triggers after the page has settled a beat
  window.addEventListener('load', () => {
    setTimeout(setupTriggers, 1500);
  });

  // ─ Form submission ─────────────────────────────────────
  const form = document.getElementById('promoForm');
  const errorEl = document.getElementById('promoError');
  const submitBtn = form.querySelector('.promo-submit');
  const submitLbl = submitBtn.querySelector('.promo-submit-label');
  const emailEl = document.getElementById('promoEmail');

  const offerState = promo.querySelector('[data-state="offer"]');
  const successState = promo.querySelector('[data-state="success"]');
  const codeTextEl = document.getElementById('promoCodeText');

  // Generate a short, readable code per submission: STAR-XXXX
  const generateCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/L/O/0/1
    let out = '';
    for (let i = 0; i < 4; i++)
      out += chars[Math.floor(Math.random() * chars.length)];
    return `STAR-${out}`;
  };

  const showSuccess = (code) => {
    codeTextEl.textContent = code;
    offerState.hidden = true;
    successState.hidden = false;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    emailEl.classList.remove('is-invalid');

    const email = emailEl.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailEl.classList.add('is-invalid');
      errorEl.textContent = 'Please enter a valid email address.';
      emailEl.focus();
      return;
    }

    submitBtn.disabled = true;
    submitLbl.textContent = 'Sending…';

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
      // Treat the submit as successful even if network hiccups —
      // the user still gets their code on screen. Netlify logs anything that arrives.
    } catch {
      /* ignore — still show the code */
    }

    setState({ convertedAt: Date.now(), email });
    showSuccess(code);
  });

  // ─ Copy code to clipboard ─────────────────────────────
  const copyBtn = document.getElementById('promoCopy');
  const copyLabel = copyBtn.querySelector('.promo-copy-label');

  copyBtn.addEventListener('click', async () => {
    const code = codeTextEl.textContent;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers or insecure contexts
      const range = document.createRange();
      range.selectNode(codeTextEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
    }
    copyBtn.classList.add('is-copied');
    copyLabel.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.classList.remove('is-copied');
      copyLabel.textContent = 'Copy';
    }, 2000);
  });
})();
