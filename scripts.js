// ─── Preloader ───────────────────────────────────────────
const preloader = document.getElementById('preloader');
const dismissPreloader = () => preloader.classList.add('loaded');

window.addEventListener('load', () => {
  setTimeout(dismissPreloader, 400);
});

// Safety: force-dismiss after 6s in case `load` never fires (e.g. broken asset).
setTimeout(dismissPreloader, 6000);

// ─── Navbar scroll state ─────────────────────────────────
const nav = document.getElementById('nav');

const handleScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
};

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll(); // run once in case page loads mid-scroll

// ─── Mobile menu toggle ──────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

const toggleMobileMenu = (open) => {
  const isOpen = open ?? !hamburger.classList.contains('active');
  hamburger.classList.toggle('active', isOpen);
  mobileMenu.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
};

hamburger.addEventListener('click', () => toggleMobileMenu());

// Close mobile menu when any link is tapped
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => toggleMobileMenu(false));
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
    toggleMobileMenu(false);
  }
});

// Close when viewport crosses above the mobile breakpoint
const desktopQuery = window.matchMedia('(min-width: 769px)');
desktopQuery.addEventListener('change', (e) => {
  if (e.matches && mobileMenu.classList.contains('active')) {
    toggleMobileMenu(false);
  }
});

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
