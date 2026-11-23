/**
 * Resume where you left off. A classic script (no module, no dependencies) that every page of the hub
 * includes early in <head>: the hub itself (resume.js) and every subject page (../resume.js, ../../resume.js).
 *
 * - Remembers the last lesson page you were on: localStorage `learn.resume.v1` =
 *   { path (relative to the hub, with search + hash), title, y (scrollY), at (ms) }. Device-local on purpose.
 *   Never the hub page itself, never `_tutor/` pages.
 * - Installed app (display-mode standalone): the first hub load of an app session jumps straight to that page
 *   (sessionStorage `learn.session` marks a session as started, so going back to the hub later stays there).
 * - Arriving with sessionStorage `learn.resume.restore` = '1' (the launch jump above, or the hub's "Continue"
 *   card) puts the scroll position back once the page has rendered.
 *
 * The hub's root is derived from this script's own URL, so the site works at any root or path prefix.
 */
(function () {
  'use strict';
  var KEY = 'learn.resume.v1';
  var FLAG = 'learn.resume.restore';
  var SESSION = 'learn.session';
  var MAX_AGE = 30 * 24 * 3600 * 1000;

  var script = document.currentScript;
  // No script URL, or a URL without its trailing slash (the page's inline script is about to add it).
  if (!script || !script.src || !/\/$|\.[a-z]+$/i.test(location.pathname)) return;
  var root = new URL('./', script.src).href;
  var href = location.href;
  if (href.indexOf(root) !== 0) return;
  var path = href.slice(root.length);
  var file = path.split(/[?#]/)[0];
  var isHub = file === '' || file === 'index.html';
  var ignored = /^_tutor\//.test(file);

  function read() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY));
      return r && typeof r.path === 'string' ? r : null;
    } catch (e) {
      return null;
    }
  }
  function session(key, value) {
    try {
      if (value === undefined) return sessionStorage.getItem(key);
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch (e) {}
    return null;
  }
  /** Absolute URL of a saved path, only if it stays inside the hub. */
  function target(r) {
    try {
      var url = new URL(r.path, root).href;
      return url.indexOf(root) === 0 ? url : null;
    } catch (e) {
      return null;
    }
  }

  var installed = false;
  try {
    installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  } catch (e) {}

  // Launch: the installed app opens on the hub; go back to the last page instead, before the hub paints.
  if (isHub && installed && !session(SESSION)) {
    var last = read();
    var url = last && Date.now() - (last.at || 0) < MAX_AGE && target(last);
    session(SESSION, '1');
    if (url && url !== href) {
      session(FLAG, '1');
      document.documentElement.style.visibility = 'hidden';
      location.replace(url);
      return;
    }
  }
  session(SESSION, '1');
  if (isHub || ignored) return;

  // Restore the scroll position once the page (an SPA that renders on load) is tall enough for it.
  // Any wheel, touch, click, key or route change of the user's own wins over the restore.
  var restoring = false;
  var cues = ['wheel', 'touchstart', 'mousedown', 'keydown', 'hashchange'];
  function stop() {
    restoring = false;
    for (var i = 0; i < cues.length; i++) removeEventListener(cues[i], stop);
  }
  if (session(FLAG) === '1') {
    var rec = read();
    session(FLAG, null);
    if (rec && rec.path === path && rec.y > 0) {
      restoring = true;
      for (var i = 0; i < cues.length; i++) addEventListener(cues[i], stop, { passive: true });
      // Hold the position for the whole window, not just once: fonts, figures and images that settle above
      // it would otherwise shift it (and the shifted value would be saved, drifting on every resume).
      var start = 0;
      var tick = function (now) {
        if (!restoring) return;
        if (!start) start = now;
        var max = document.documentElement.scrollHeight - innerHeight;
        var done = now - start > 1500;
        if ((max >= rec.y || done) && Math.abs(scrollY - Math.min(rec.y, max)) > 1) scrollTo(0, Math.min(rec.y, max));
        if (done) stop();
        else requestAnimationFrame(tick);
      };
      // The SPA's router (a module script) has rendered by DOMContentLoaded. Deferred, this script runs
      // before that event even though readyState already says 'interactive'; `load` is the fallback.
      var begun = false;
      var begin = function () {
        if (begun) return;
        begun = true;
        requestAnimationFrame(tick);
      };
      if (document.readyState === 'complete') begin();
      else {
        document.addEventListener('DOMContentLoaded', begin, { once: true });
        addEventListener('load', begin, { once: true });
      }
    }
  }

  function save() {
    if (restoring) return;
    var p = location.href.indexOf(root) === 0 ? location.href.slice(root.length) : null;
    if (p === null) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ path: p, title: document.title, y: Math.round(scrollY), at: Date.now() }));
    } catch (e) {}
  }

  var timer = 0;
  addEventListener('scroll', function () {
    if (!timer) timer = setTimeout(function () {
      timer = 0;
      save();
    }, 400);
  }, { passive: true });
  // After the SPA's own hashchange handler has rendered the new page (and set its title).
  addEventListener('hashchange', function () {
    setTimeout(save, 0);
  });
  addEventListener('load', function () {
    setTimeout(save, 0);
  });
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') save();
  });
})();
