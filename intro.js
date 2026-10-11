/* =========================================================
   intro.js — timing and navigation only
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Settings ---------- */
  var HOME_URL          = 'Ahome.html';
  var STORAGE_KEY       = 'introSeen';  // remembered for the current browser tab/session
  var IMAGE_WAIT_MS     = 1200;         // never wait longer than this for the image
  var SAFETY_MS         = 5600;         // backup redirect if the animation event never fires
  var REDUCED_MOTION_MS = 1600;         // how long the static version shows
  var SKIP_FADE_MS      = 300;

  /* ---------- Show the intro once per session ---------- */
  function hasSeen() {
    try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* storage blocked: ignore */ }
  }

  // Add ?replay to the URL (intro.html?replay) to force the intro while testing.
  var forceReplay = /[?&]replay\b/.test(location.search);

  if (!forceReplay && hasSeen()) {
    location.replace(HOME_URL);   // runs before the page paints
    return;
  }

  /* ---------- Navigation ---------- */
  var leaving = false;
  function goHome() {
    if (leaving) return;
    leaving = true;
    markSeen();
    // replace() keeps the intro out of the history, so Back never returns to it
    location.replace(HOME_URL);
  }

  /* ---------- Start ---------- */
  function init() {
    var root  = document.getElementById('intro');
    var img   = document.getElementById('introImage');
    var empty = document.getElementById('introEmpty');
    var skip  = document.getElementById('skipIntro');

    var reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var started = false;

    function start() {
      if (started) return;
      started = true;

      if (reduced) {
        setTimeout(goHome, REDUCED_MOTION_MS);
        return;
      }

      root.classList.add('is-playing');

      // The last animation is the fade-out; navigate only once it has finished.
      root.addEventListener('animationend', function (e) {
        if (e.target === root && e.animationName === 'intro-outro') goHome();
      });
      setTimeout(goHome, SAFETY_MS);
    }

    function showMissingImage() {
      root.classList.add('no-image');
      if (empty) empty.textContent = 'Image not found: ' + img.getAttribute('src');
    }

    // Wait for the image (up to IMAGE_WAIT_MS) so the frame never opens empty.
    var isSvg = /\.svg(\?|#|$)/i.test(img.getAttribute('src') || '');
    if (img.complete) {
      if (!img.naturalWidth && !isSvg) showMissingImage();
      start();
    } else {
      img.addEventListener('load', start);
      img.addEventListener('error', function () { showMissingImage(); start(); });
      setTimeout(start, IMAGE_WAIT_MS);
    }

    // Skip: quick fade to white, then go
    skip.addEventListener('click', function (e) {
      e.preventDefault();
      if (leaving) return;
      root.classList.add('is-skipping');
      setTimeout(goHome, reduced ? 0 : SKIP_FADE_MS);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
