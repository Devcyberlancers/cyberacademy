/*
 * Cyber Academy - Simple & Smooth Scroll Reveal Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.scroll-reveal');

  const checkReveal = () => {
    const triggerBottom = window.innerHeight * 0.85;

    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;

      if (elementTop < triggerBottom) {
        el.classList.add('reveal-active');
      } else {
        // Optional: remove to re-trigger animation when scrolling back up
        // el.classList.remove('reveal-active');
      }
    });
  };

  // Run on load to capture elements already in viewport
  checkReveal();

  window.addEventListener('scroll', checkReveal);
});
