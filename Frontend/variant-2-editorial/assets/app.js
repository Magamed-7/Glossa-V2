// =============================================================================
// GLOSSA — Editorial variant — shared behaviour
// Nav active-state, theme toggle, mobile nav, tabs, modal, toast, tooltip helpers.
// Vanilla JS only, no dependencies.
// =============================================================================

(function () {
  'use strict';

  /* ---------- nav active-state ---------- */
  function highlightNav() {
    var here = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
    document.querySelectorAll('[data-nav-link]').forEach(function (link) {
      var target = (link.getAttribute('href') || '').toLowerCase();
      if (target === here) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ---------- theme toggle ---------- */
  var THEME_KEY = 'glossa-editorial-theme';

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var current = theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      btn.setAttribute('aria-pressed', String(current === 'dark'));
    });
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(saved);

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark'
          || (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var next = isDark ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    });
  }

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    var burger = document.querySelector('[data-burger]');
    var panel = document.querySelector('[data-mobilenav]');
    if (!burger || !panel) return;
    var closeBtn = panel.querySelector('[data-mobilenav-close]');

    function open() {
      panel.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('a,button');
      if (first) first.focus();
    }
    function close() {
      panel.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- generic tabs: data-tabs / data-tab / data-tabpanel ---------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-tab]'));
      var panels = root.querySelectorAll('[data-tabpanel]');

      function activate(name, focusTab) {
        tabs.forEach(function (t) {
          var on = t.getAttribute('data-tab') === name;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
        });
        panels.forEach(function (p) {
          p.hidden = p.getAttribute('data-tabpanel') !== name;
        });
        if (focusTab) {
          var el = tabs.filter(function (t) { return t.getAttribute('data-tab') === name; })[0];
          if (el) el.focus();
        }
        if (root.hasAttribute('data-tabs-hash')) {
          history.replaceState(null, '', '#' + name);
        }
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(tab.getAttribute('data-tab')); });
        tab.addEventListener('keydown', function (e) {
          var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          var next = tabs[(i + dir + tabs.length) % tabs.length];
          activate(next.getAttribute('data-tab'), true);
        });
      });

      var initial = (root.hasAttribute('data-tabs-hash') && location.hash.slice(1))
        || root.getAttribute('data-tabs-initial')
        || (tabs[0] && tabs[0].getAttribute('data-tab'));
      if (initial) activate(initial);
    });
  }

  /* ---------- generic modal: data-modal-open="id" / data-modal-close ---------- */
  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-modal-open');
        var overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.add('is-open');
        var focusable = overlay.querySelector('input,button,select,textarea,a');
        if (focusable) focusable.focus();
      });
    });
    document.querySelectorAll('.overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('is-open');
      });
      overlay.querySelectorAll('[data-modal-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { overlay.classList.remove('is-open'); });
      });
      overlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') overlay.classList.remove('is-open');
      });
    });
  }

  /* ---------- toast ---------- */
  function toast(message) {
    var el = document.querySelector('[data-toast]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('data-toast', '');
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }
  window.glossaToast = toast;

  /* ---------- tooltip: data-tooltip-trigger wraps [data-tooltip] text ---------- */
  function initTooltips() {
    document.querySelectorAll('[data-tooltip-trigger]').forEach(function (trigger) {
      var tip = trigger.querySelector('.tooltip');
      if (!tip) return;
      function show() { tip.classList.add('is-visible'); }
      function hide() { tip.classList.remove('is-visible'); }
      trigger.addEventListener('mouseenter', show);
      trigger.addEventListener('mouseleave', hide);
      trigger.addEventListener('focus', show, true);
      trigger.addEventListener('blur', hide, true);
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        tip.classList.toggle('is-visible');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    highlightNav();
    initTheme();
    initMobileNav();
    initTabs();
    initModals();
    initTooltips();
  });
})();
