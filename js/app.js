// ==========================================
// 10. LẮNG NGHE SỰ KIỆN TỔNG (EVENT LISTENERS)
// ==========================================

// 1. Cảnh báo khi Reload (F5), đóng tab hoặc đóng trình duyệt
window.addEventListener('beforeunload', function (e) {
  if (typeof hasUnsavedFormData === 'function' && hasUnsavedFormData()) {
    e.preventDefault();
    e.returnValue = 'Bạn có dữ liệu chưa lưu. Bạn có chắc chắn muốn thoát ra không?';
    return e.returnValue;
  }
});

// 2. Lắng nghe phím tắt bàn phím
document.addEventListener('keydown', function (e) {
  // Thao tác bấm ESC để đóng Form Thông báo / Form Lịch sử
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

  // Chặn tự động Submit Form khi bấm Enter trên các ô input/select
  if (e.key === 'Enter') {
    if (document.getElementById('login-container')) return;
    if (e.target.tagName === 'TEXTAREA') return;

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      e.preventDefault();
    }
  }
});

// 3. Khởi tạo ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  sessionStorage.clear();
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.getAttribute('data-view')));
  });

  window.addEventListener('resize', () => {
    const newSize = getResponsivePageSize();
    if (state.pageSize !== newSize) {
      state.pageSize = newSize;
      state.page = 1;
      if (typeof currentRenderedView !== 'undefined') {
        currentRenderedView = null;
      }
      render(true);
    }
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
  subscribeAppRealtimeChanges();
  render();
  handleRouteChange();
  updateHeaderDate();
  initNotificationUI();
  initTheme();
});