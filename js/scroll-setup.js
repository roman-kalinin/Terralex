/* scroll-setup.js — Lenis init, GSAP register, nav scroll, dropdown */
// ── GSAP + Lenis smooth scroll ───────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,
});
// Expose for other scripts that need to subscribe to scroll updates.
window.lenis = lenis;

// Hook Lenis into GSAP ticker
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Sync ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);

// Nav: switch to scrolled state + hide/show topbar on scroll direction
const siteHeader = document.getElementById('siteHeader');
let lastScroll = 0;
lenis.on('scroll', ({ scroll }) => {
  siteHeader.classList.toggle('scrolled', scroll > 10);
});

// ── Expertise dropdown toggle ────────────────────────────────────
const navDropdown = document.querySelector('.nav-dropdown');
const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
if (dropdownTrigger) {
  dropdownTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    navDropdown.classList.toggle('open');
  });
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!navDropdown.contains(e.target)) navDropdown.classList.remove('open');
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navDropdown.classList.remove('open');
  });
}
