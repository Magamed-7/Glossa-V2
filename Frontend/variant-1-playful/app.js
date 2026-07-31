// Glossa Playful — shared shell (nav) + interactions (tabs, modal, notifications, theme, filters)
(function () {
  'use strict';

  var ICONS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
    cards: '<rect x="4" y="6" width="12" height="15" rx="3" transform="rotate(-8 10 13)"/><rect x="8" y="4" width="12" height="15" rx="3" fill="var(--color-surface)"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/>',
    grammar: '<path d="M4 20 15 9l3-3 2 2-3 3L6 22H4v-2Z"/><path d="M13 6l5 5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    store: '<path d="M4 9l1-4h14l1 4"/><path d="M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z"/><path d="M9 13a3 3 0 0 0 6 0"/>',
    trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 17h4v4h-4v-4Z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M4.2 7l1.7 1M18 16l1.7 1M4.2 17l1.7-1M18 8l1.7-1M3 12h2M19 12h2"/>',
    bell: '<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.7c0-1 1.1-1.7 2.5-1.7s2.5.8 2.5 1.7-1 1.3-2.5 1.6-2.5.7-2.5 1.7 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7"/>',
    sprout: '<path d="M12 21V11"/><path d="M12 11C12 7 9 5 5 5c0 4 3 6 7 6Z"/><path d="M12 13C12 9.5 14.5 8 18 8c0 3.5-2.5 5.5-6 5Z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a4 4 0 0 1 0 6"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  var NAV_ITEMS = [
    { key: 'dashboard', label: 'Главная', href: 'dashboard.html', icon: 'home', bottom: true },
    { key: 'deck', label: 'Колода', href: 'deck.html', icon: 'cards', bottom: true },
    { key: 'stories', label: 'Истории', href: 'stories.html', icon: 'book', bottom: true },
    { key: 'grammar', label: 'Грамматика', href: 'grammar.html', icon: 'grammar', bottom: false },
    { key: 'ai-chat', label: 'ИИ-чат', href: 'ai-chat.html', icon: 'chat', bottom: true },
    { key: 'community', label: 'Авторам', href: 'community.html', icon: 'store', bottom: false },
    { key: 'leaderboard', label: 'Рейтинг', href: 'leaderboard.html', icon: 'trophy', bottom: false },
    { key: 'profile', label: 'Профиль', href: 'profile.html', icon: 'user', bottom: false },
    { key: 'settings', label: 'Настройки', href: 'settings.html', icon: 'gear', bottom: false }
  ];

  function buildRail(active) {
    var root = document.getElementById('rail-root');
    if (!root) return;
    root.className = 'rail';
    var html = '<a class="logo" href="dashboard.html" aria-label="Glossa — на главную">G</a>';
    NAV_ITEMS.forEach(function (item) {
      html += '<a class="rail-link' + (item.key === active ? ' active' : '') + '" href="' + item.href + '" data-nav="' + item.key + '">' + icon(item.icon) + '<span>' + item.label + '</span></a>';
    });
    root.innerHTML = html;
  }

  function buildTopbar(active) {
    var root = document.getElementById('topbar-root');
    if (!root) return;
    root.className = 'topbar';
    root.innerHTML =
      '<a class="logo-mobile" href="dashboard.html" aria-label="Glossa — на главную"><span class="logo">G</span></a>' +
      '<div class="topbar-actions">' +
        '<span class="pill-stat streak">' + icon('sprout') + '12</span>' +
        '<span class="pill-stat coins">' + icon('coin') + '320</span>' +
        '<a class="icon-btn" href="notifications.html" aria-label="Уведомления" data-nav="notifications">' + icon('bell') + '<span class="dot" aria-hidden="true"></span></a>' +
        '<a class="icon-btn" href="profile.html" aria-label="Профиль" data-nav="profile-avatar">' + icon('user') + '</a>' +
      '</div>';
  }

  function buildBottomNav(active) {
    var root = document.getElementById('bottomnav-root');
    if (!root) return;
    root.className = 'bottom-nav';
    var shown = NAV_ITEMS.filter(function (i) { return i.bottom; });
    var html = '';
    shown.forEach(function (item) {
      html += '<a href="' + item.href + '" class="' + (item.key === active ? 'active' : '') + '" data-nav="' + item.key + '">' + icon(item.icon) + '<span>' + item.label + '</span></a>';
    });
    html += '<button type="button" class="' + (['grammar', 'community', 'leaderboard', 'profile', 'settings'].indexOf(active) > -1 ? 'active' : '') + '" data-more-open>' + icon('more') + '<span>Ещё</span></button>';
    root.innerHTML = html;

    var sheet = document.createElement('div');
    sheet.className = 'modal-overlay';
    sheet.id = 'more-sheet';
    var extra = NAV_ITEMS.filter(function (i) { return !i.bottom; });
    var links = extra.map(function (i) {
      return '<a class="more-sheet-link" href="' + i.href + '">' + icon(i.icon) + '<span>' + i.label + '</span></a>';
    }).join('');
    sheet.innerHTML = '<div class="modal more-sheet"><div class="row between"><h3 class="mb-0">Ещё</h3><button class="icon-btn" data-modal-close aria-label="Закрыть">' + icon('close') + '</button></div><div class="more-sheet-grid">' + links + '</div></div>';
    document.body.appendChild(sheet);
    root.querySelector('[data-more-open]').addEventListener('click', function () {
      sheet.classList.add('is-open');
    });
  }

  function initShell() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    buildRail(page);
    buildTopbar(page);
    buildBottomNav(page);
  }

  function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
      var group = tabs.getAttribute('data-tabs') || 'default';
      tabs.querySelectorAll('.tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          var target = tab.getAttribute('data-tab');
          document.querySelectorAll('.tab-panel[data-tabs-group="' + group + '"]').forEach(function (panel) {
            panel.classList.toggle('active', panel.getAttribute('data-panel') === target);
          });
        });
      });
    });
  }

  function initModals() {
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-modal-open]');
      if (opener) {
        var modal = document.getElementById(opener.getAttribute('data-modal-open'));
        if (modal) { modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
      }
      var closer = e.target.closest('[data-modal-close]');
      if (closer) {
        var wrap = closer.closest('.modal-overlay');
        if (wrap) { wrap.classList.remove('is-open'); document.body.style.overflow = ''; }
      }
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.is-open').forEach(function (m) {
          m.classList.remove('is-open'); document.body.style.overflow = '';
        });
      }
    });
  }

  function initNotifications() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-mark-read]')) {
        var item = e.target.closest('.notif-item');
        if (item) item.classList.remove('unread');
      }
      if (e.target.closest('[data-mark-all-read]')) {
        document.querySelectorAll('.notif-item.unread').forEach(function (i) { i.classList.remove('unread'); });
      }
    });
  }

  function initThemeToggle() {
    var stored = localStorage.getItem('glossa-theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-theme-toggle]');
      if (!toggle) return;
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('glossa-theme', next);
    });
  }

  function initFilters() {
    document.querySelectorAll('[data-filter-group]').forEach(function (group) {
      var target = group.getAttribute('data-filter-group');
      group.querySelectorAll('[data-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var value = btn.getAttribute('data-filter');
          document.querySelectorAll('[data-filterable="' + target + '"]').forEach(function (item) {
            var matches = value === 'all' || item.getAttribute('data-status') === value || item.getAttribute('data-category') === value || item.getAttribute('data-genre') === value;
            item.style.display = matches ? '' : 'none';
          });
        });
      });
    });
  }

  window.Glossa = { icon: icon, ICONS: ICONS };

  document.addEventListener('DOMContentLoaded', function () {
    initShell();
    initTabs();
    initModals();
    initNotifications();
    initThemeToggle();
    initFilters();
  });
})();
