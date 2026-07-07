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
      }
    });
  };

  checkReveal();
  window.addEventListener('scroll', checkReveal);
});

// Fullscreen Video Modal Controllers
function openVideo(videoSrc) {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  
  if (modal && video) {
    video.src = videoSrc;
    video.load();
    modal.classList.add('is-active');
    video.play();
  }
}

function closeVideo() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  
  if (modal && video) {
    video.pause();
    modal.classList.remove('is-active');
    video.src = "";
  }
}
