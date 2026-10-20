// ==========================================
// 10. LẮNG NGHE SỰ KIỆN TỔNG (EVENT LISTENERS)
// ==========================================

document.addEventListener('keydown', function (e) {
  // 1. Thao tác bấm ESC để đóng Form Thông báo / Form Lịch sử
  if (e.key === 'Escape' || e.key === 'Esc') {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown && dropdown.classList.contains('open')) {
      dropdown.classList.remove('open');
    }

    if (typeof closeNotificationHistory === 'function') {
      closeNotificationHistory();
    }
    return;
  }

  // 2. Chặn tự động Submit Form khi bấm Enter trên các ô input/select
  if (e.key === 'Enter') {
    if (document.getElementById('login-container')) return;
    if (e.target.tagName === 'TEXTAREA') return;

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      e.preventDefault();
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.getAttribute('data-view')));
  });

  // VUỐT SANG TRÁI ĐỂ ĐÓNG MENU (MOBILE SIDEBAR)
  const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
  if (sidebar) {
    let startX = 0, startY = 0;

    sidebar.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    sidebar.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      if (diffX < -50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (typeof toggleMobileMenu === 'function' && document.body.classList.contains('mobile-menu-open')) {
          toggleMobileMenu();
        } else {
          sidebar.classList.remove('open', 'active', 'show');
          document.body.classList.remove('sidebar-open');
        }
      }
    }, { passive: true });
  }

  await fetchDataFromSupabase();
  render();
  handleRouteChange();
  updateHeaderDate();
  initNotificationUI();
  initTheme();
});