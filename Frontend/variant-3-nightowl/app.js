/* Glossa Nightowl — shared behaviors: nav state, mobile sidebar, clock, tabs, modals, pills. */
(function () {
  'use strict';

  function currentPage() {
    var path = window.location.pathname.split('/').pop() || 'dashboard.html';
    return path;
  }

  function initNavActiveState() {
    var page = currentPage();
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      var target = link.getAttribute('href');
      if (target === page) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function initMobileSidebar() {
    var toggle = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar || !overlay) return;

    function open() {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      var firstLink = sidebar.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }
    function close() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      var isOpen = sidebar.classList.contains('is-open');
      isOpen ? close() : open();
    });
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) close();
    });
  }

  function initLiveClock() {
    var els = document.querySelectorAll('[data-live-clock]');
    if (!els.length) return;
    function tick() {
      var now = new Date();
      var hh = String(now.getHours()).padStart(2, '0');
      var mm = String(now.getMinutes()).padStart(2, '0');
      var ss = String(now.getSeconds()).padStart(2, '0');
      var str = hh + ':' + mm + ':' + ss;
      els.forEach(function (el) { el.textContent = str; });
    }
    tick();
    setInterval(tick, 1000);
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;
      var panelWrap = document.getElementById(group.getAttribute('data-tabs'));

      function activate(tab, focus) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute('aria-selected', selected ? 'true' : 'false');
          t.tabIndex = selected ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(tab, false); });
        tab.addEventListener('keydown', function (e) {
          var idx = i;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') idx = 0;
          else if (e.key === 'End') idx = tabs.length - 1;
          else return;
          e.preventDefault();
          activate(tabs[idx], true);
        });
      });
      void panelWrap;
    });
  }

  function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modal = document.getElementById(btn.getAttribute('data-modal-open'));
        if (!modal) return;
        modal.classList.add('is-open');
        var focusable = modal.querySelector('input, button, textarea, select, a');
        if (focusable) focusable.focus();
      });
    });
    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('is-open');
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('is-open');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-overlay.is-open').forEach(function (m) {
        m.classList.remove('is-open');
      });
    });
  }

  function initPillGroups() {
    document.querySelectorAll('[data-pill-group]').forEach(function (group) {
      var multi = group.getAttribute('data-pill-group') === 'multi';
      var pills = group.querySelectorAll('.pill-btn');
      pills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          if (multi) {
            var next = pill.getAttribute('aria-pressed') !== 'true';
            pill.setAttribute('aria-pressed', String(next));
          } else {
            pills.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
            pill.setAttribute('aria-pressed', 'true');
          }
          group.dispatchEvent(new CustomEvent('pillchange'));
        });
      });
    });
  }

  function initSegmented() {
    document.querySelectorAll('.segmented').forEach(function (seg) {
      var buttons = seg.querySelectorAll('button');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', 'true');
          seg.dispatchEvent(new CustomEvent('segchange', { detail: { value: btn.getAttribute('data-value') } }));
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavActiveState();
    initMobileSidebar();
    initLiveClock();
    initTabs();
    initModals();
    initPillGroups();
    initSegmented();
  });

  window.Glossa = window.Glossa || {};
})();
