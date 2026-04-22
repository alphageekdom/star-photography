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
