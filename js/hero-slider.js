/* hero-slider.js — Slide auto-advance, progress bars, ticker */
{
  const SLIDE_DURATION = 12000;
  const slides    = document.querySelectorAll('.slide');
  const tickers   = document.querySelectorAll('.ticker-item');
  const bars      = Array.from(tickers).map(t => t.querySelector('.ticker-progress'));
  const BLUR      = [true, false, false];

  let current   = 0;
  let startTime = 0;
  let paused    = false;
  let rafId     = null;

  // rAF loop — drives the progress bar and auto-advances
  function tick() {
    rafId = requestAnimationFrame(tick);
    if (paused) return;
    const elapsed = performance.now() - startTime;
    const p = Math.min(elapsed / SLIDE_DURATION, 1);
    // Move bar: left from -100% to 0%
    bars[current].style.left = (-100 + p * 100) + '%';
    // When done, advance
    if (p >= 1) goTo((current + 1) % slides.length);
  }

  function goTo(index) {
    const prev = current;
    current = index;

    // Reset all tickers
    tickers.forEach((t, i) => {
      t.classList.remove('active');
      bars[i].style.left = '-100%';
    });

    // Old slide out
    slides[prev].classList.remove('active');

    // New slide bg: snap to start state
    const bg = slides[current].querySelector('.slide-bg');
    bg.style.transition = 'none';
    bg.style.transform = 'scale(1.08)';
    bg.style.filter = BLUR[current] ? 'blur(14px)' : 'blur(0px)';

    // Activate
    slides[current].classList.add('active');
    tickers[current].classList.add('active');

    // Animate bg after paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
      bg.style.transition = BLUR[current]
        ? `transform 1.6s ${ease}, filter 1.3s ${ease}`
        : `transform 1.6s ${ease}`;
      bg.style.filter = 'blur(0px)';
      bg.style.transform = 'scale(1.0)';
    }));

    // Reset timer
    startTime = performance.now();
  }

  // Click to jump
  tickers.forEach((t, i) => t.addEventListener('click', () => goTo(i)));

  // No hover pause — slider runs continuously

  // Kick off
  goTo(0);
  rafId = requestAnimationFrame(tick);
}
