/* s3-counters.js — Number counter animation */
// ── Section 3: Numbers ──────────────────────────────────────────

// Counter animation
ScrollTrigger.create({
  trigger: '.s3-grid',
  start: 'top 80%',
  once: true,
  onEnter: () => {
    document.querySelectorAll('.s3-count').forEach(el => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const useComma = el.hasAttribute('data-comma');
      function fmt(n) {
        var v = Math.round(n);
        return (useComma ? v.toLocaleString() : String(v)) + suffix;
      }
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate() { el.textContent = fmt(obj.val); },
        onComplete() { el.textContent = fmt(target); }
      });
    });
  }
});
