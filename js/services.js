// ==========================================
// 3. AUTHENTICATION & PHÂN QUYỀN
// ==========================================

function getAuthSession() {
  const saved = localStorage.getItem('app_session');
  return saved ? JSON.parse(saved) : { isLoggedIn: false, currentUser: null, remember: false };
}

// Hàm kiểm tra quyền thao tác (thêm mới, sửa, xóa) dựa theo tài khoản đăng nhập
function checkModulePermission(module) {
  const session = getAuthSession();
  const user = session.currentUser || {};

  // Tổng quan và 2 báo cáo chỉ có xem -> không có quyền Thêm/Sửa/Xóa
  if (['dashboard', 'report-inventory', 'report-sales'].includes(module)) {
    return false;
  }

  const permissionMap = {
    'materials': ['material_yn', 'materials_yn', 'material'],
    'customers': ['customers_yn', 'customer_yn', 'customers'],
    'warehouses': ['warehouses_yn', 'warehouse_yn', 'warehouses'],
    'quotations': ['quotations_yn', 'quotation_yn', 'quotations'],
    'sales-orders': ['order_yn', 'saleorder_yn', 'orders_yn', 'sales_orders'],
    'returns': ['return_yn', 'returns_yn', 'returns'],
    'grn': ['grn_yn', 'grns_yn', 'grn']
  };

  const keys = permissionMap[module] || [];
  for (const key of keys) {
    if (user[key] !== undefined && user[key] !== null) {
      return user[key] === true || user[key] === 'true' || user[key] === 1 || user[key] === '1';
    }
  }

  // Nếu không khai báo riêng hoặc không tìm thấy cột thì mặc định không được Thêm/Sửa/Xóa
  return false;
}

async function handleLogin(e) {
  e.preventDefault();
  const un = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  try {
    const { data, error } = await supabaseClient
      .from('userinfo')
      .select('*')
      .eq('username', un)
      .eq('password', pw);

    if (error) throw error;

    if (data && data.length > 0) {
      const foundUser = data[0];
      const session = { isLoggedIn: true, currentUser: foundUser, remember };
      localStorage.setItem('app_session', JSON.stringify(session));

      // XỬ LÝ GHI NHỚ ĐĂNG NHẬP & THEME:
      if (remember) {
        localStorage.setItem('remembered_user', JSON.stringify({
          username: un,
          password: pw,
          remember: true,
          theme: currentTheme
        }));
      } else {
        localStorage.removeItem('remembered_user');
        sessionStorage.setItem('app_session_theme', currentTheme);
      }

      document.querySelector('.app-container').style.display = 'flex';
      updateUserInfoUI();
      navigate('dashboard', 'list');
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  } catch (err) {
    console.error('Lỗi truy vấn đăng nhập:', err);
    showAlert('Không thể kết nối đến máy chủ xác thực.', 'Lỗi kết nối');
  }
}

function handleLogout() {
  localStorage.removeItem('app_session');
  // Chuyển URL trình duyệt thành /minhkhue/login và reload lại trang
  window.history.pushState({}, '', `${BASE_PATH}/login`);
  location.reload();
}

function updateUserInfoUI() {
  const session = getAuthSession();
  if (session.isLoggedIn && session.currentUser) {
    const user = session.currentUser;
    const userAvatarEl = document.querySelector('.user-avatar');
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const sidebarUserEl = document.querySelector('.sidebar-user');

    if (userAvatarEl) {
      userAvatarEl.innerText = (user.fullname || user.username || 'U').substring(0, 2).toUpperCase();
    }

    if (userNameEl) {
      userNameEl.innerText = user.fullname || user.username;
      userNameEl.title = user.fullname || user.username;
    }

    if (userRoleEl) {
      userRoleEl.innerText = user.role || 'USER';
    }

    if (sidebarUserEl) {
      let infoTextContainer = sidebarUserEl.querySelector('.user-info-text');
      if (!infoTextContainer && userNameEl && userRoleEl) {
        infoTextContainer = document.createElement('div');
        infoTextContainer.className = 'user-info-text';
        sidebarUserEl.insertBefore(infoTextContainer, userRoleEl.parentNode === sidebarUserEl ? userRoleEl : null);
        infoTextContainer.appendChild(userNameEl);
        infoTextContainer.appendChild(userRoleEl);
      }

      if (!document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.innerText = 'Đăng xuất';
        logoutBtn.onclick = handleLogout;
        sidebarUserEl.appendChild(logoutBtn);
      }
    }
  }

  // 1. NÚT HOME Ở HEADER TRÊN MOBILE
  const headerLeft = document.querySelector('.app-header > div:first-child') || document.querySelector('.app-header-left') || document.querySelector('.app-header');

  if (headerLeft && !document.getElementById('mobile-home-trigger')) {
    const homeBtn = document.createElement('button');
    homeBtn.id = 'mobile-home-trigger';
    homeBtn.className = 'header-icon-btn mobile-home-btn';
    homeBtn.style.cssText = 'background: var(--card); border: 1px solid var(--border); padding: 8px; cursor: pointer; color: var(--foreground); display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; border-radius: 2px;';
    homeBtn.innerHTML = Icons.home;
    homeBtn.title = 'Trang chủ / Menu';
    homeBtn.onclick = () => {
      if (window.innerWidth <= 768) {
        toggleMobileMenu();
      }
    };
    headerLeft.insertBefore(homeBtn, headerLeft.firstChild);
  }

  // 2. ĐỒNG BỘ NÚT THEME (DARK/LIGHT) VÀ NÚT HOME TRONG SIDEBAR
  const sidebarHeader = document.querySelector('.sidebar-header') || document.querySelector('.logo-brand');
  if (sidebarHeader) {
    sidebarHeader.style.cssText += 'display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; box-sizing: border-box;';

    // Đảm bảo nút logo Home vàng cũng có kích thước chuẩn 36x36px
    const yellowHomeIcon = sidebarHeader.querySelector('.logo-icon, .app-logo, svg');
    if (yellowHomeIcon && yellowHomeIcon.parentElement) {
      yellowHomeIcon.parentElement.style.cssText += 'width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;';
    }

    if (!document.getElementById('theme-toggle-btn-sidebar')) {
      const themeBtn = document.createElement('button');
      themeBtn.id = 'theme-toggle-btn-sidebar';
      themeBtn.className = 'sidebar-theme-btn';
      themeBtn.onclick = (e) => {
        e.stopPropagation();
        toggleTheme();
      };

      sidebarHeader.appendChild(themeBtn);

      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      updateThemeButtonUI(currentTheme);
    }
  }
}

// ==========================================
// CHUYỂN ĐỔI GIAO DIỆN SÁNG - TỐI (THEME SWITCHER)
// ==========================================

function initTheme() {
  let savedTheme = 'dark';

  const savedCredsRaw = localStorage.getItem('remembered_user');
  const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : null;

  if (savedCreds && savedCreds.remember && savedCreds.theme) {
    savedTheme = savedCreds.theme;
  } else {
    const sessionTheme = sessionStorage.getItem('app_session_theme');
    if (sessionTheme) {
      savedTheme = sessionTheme;
    }
  }

  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);

  const savedCredsRaw = localStorage.getItem('remembered_user');
  const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : null;

  if (savedCreds && savedCreds.remember) {
    savedCreds.theme = newTheme;
    localStorage.setItem('remembered_user', JSON.stringify(savedCreds));
  } else {
    sessionStorage.setItem('app_session_theme', newTheme);
  }

  updateThemeButtonUI(newTheme);
}

function updateThemeButtonUI(theme) {
  const btn = document.getElementById('theme-toggle-btn-sidebar') || document.getElementById('theme-toggle-btn');
  if (!btn) return;

  if (theme === 'light') {
    btn.innerHTML = Icons.moon;
    btn.title = 'Chuyển sang Giao diện Tối';
  } else {
    btn.innerHTML = Icons.sun;
    btn.title = 'Chuyển sang Giao diện Sáng';
  }
}

// ==========================================
// 8. CUSTOM MODALS & HỆ THỐNG THÔNG BÁO 
// ==========================================

function initCustomModal() {
  if (document.getElementById('custom-modal-overlay')) return;

  const modalHtml = `
    <div id="custom-modal-overlay" style="
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      font-family: var(--font-jost, sans-serif);
    ">
      <div id="custom-modal-box" style="
        width: 100%;
        max-width: 440px;
        background: var(--card, #141821);
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 2px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 1px rgba(240,160,48,0.3);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        transform: scale(0.95);
        transition: transform 0.2s ease, opacity 0.2s ease;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div id="modal-icon-container" style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 2px;
            background: rgba(240, 160, 48, 0.15);
            border: 1px solid rgba(240, 160, 48, 0.3);
            color: #f0a030;
            flex-shrink: 0;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 id="modal-title" style="
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--foreground, #ffffff);
            letter-spacing: 0.02em;
          ">Thông báo</h3>
        </div>

        <div id="modal-message" style="
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--muted-foreground, #a0aec0);
        "></div>

        <div id="modal-actions" style="
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        ">
          <button id="modal-btn-cancel" style="
            padding: 8px 18px;
            background: transparent;
            border: 1px solid var(--border, rgba(255,255,255,0.15));
            border-radius: 2px;
            color: var(--foreground, #ffffff);
            font-family: var(--font-dm-mono, monospace);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.15s;
          " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">Hủy bỏ</button>

          <button id="modal-btn-confirm" style="
            padding: 8px 20px;
            background: linear-gradient(135deg, #f0a030 0%, #d98818 100%);
            border: none;
            border-radius: 2px;
            color: #000000;
            font-family: var(--font-dm-mono, monospace);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(240, 160, 48, 0.25);
            transition: all 0.15s;
          " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">Xác nhận</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showConfirm(message, title = 'Xác nhận thao tác') {
  initCustomModal();
  return new Promise((resolve) => {
    const overlay = document.getElementById('custom-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    const btnCancel = document.getElementById('modal-btn-cancel');

    titleEl.innerText = title;
    msgEl.innerText = message;
    btnCancel.style.display = 'inline-block';
    btnConfirm.innerText = 'ĐỒNG Ý';

    overlay.style.display = 'flex';

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      overlay.style.display = 'none';
      btnConfirm.removeEventListener('click', handleConfirm);
      btnCancel.removeEventListener('click', handleCancel);
    };

    btnConfirm.addEventListener('click', handleConfirm);
    btnCancel.addEventListener('click', handleCancel);
  });
}

function showAlert(message, title = 'Thông báo hệ thống') {
  initCustomModal();
  return new Promise((resolve) => {
    const overlay = document.getElementById('custom-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    const btnCancel = document.getElementById('modal-btn-cancel');

    titleEl.innerText = title;
    msgEl.innerText = message;
    btnCancel.style.display = 'none';
    btnConfirm.innerText = 'ĐÃ HỂU';

    overlay.style.display = 'flex';

    const handleConfirm = () => {
      overlay.style.display = 'none';
      btnConfirm.removeEventListener('click', handleConfirm);
      resolve(true);
    };

    btnConfirm.addEventListener('click', handleConfirm);
  });
}

function getReadNotifIds() {
  const saved = localStorage.getItem('app_read_notif_ids');
  return saved ? JSON.parse(saved) : [];
}

function markNotifIdAsRead(notifId) {
  const readIds = getReadNotifIds();
  if (!readIds.includes(notifId)) {
    readIds.push(notifId);
    localStorage.setItem('app_read_notif_ids', JSON.stringify(readIds));
  }
  updateNotificationUI();
}

async function fetchNotificationsFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      db.notifications = data;
      updateNotificationUI();
    }
  } catch (err) {
    console.error('Lỗi lấy thông báo:', err);
  }
}

async function addNotification(type, title, detail, targetView, itemId, actorName = '') {
  if (!actorName) {
    const session = getAuthSession();
    actorName = session.currentUser ? (session.currentUser.fullname || session.currentUser.username) : 'Hệ thống';
  }

  const newNotif = {
    id: 'NTF-' + Date.now(),
    type: type,
    title: title,
    detail: detail,
    actor: actorName,
    targetview: targetView,
    itemid: itemId,
    time: getCurrentTimeStr(),
    date: getTodayDateStr()
  };

  try {
    await supabaseClient.from('notifications').insert([newNotif]);
  } catch (err) {
    console.error('Lỗi gửi thông báo:', err);
  }
}

function subscribeRealtimeNotifications() {
  supabaseClient
    .channel('public:notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
      if (payload.new) {
        if (!Array.isArray(db.notifications)) db.notifications = [];
        db.notifications.unshift(payload.new);
        updateNotificationUI();
      }
    })
    .subscribe();
}

function initNotificationUI() {
  const headerRight = document.querySelector('.app-header > div:last-child') || document.querySelector('.app-header-right') || document.querySelector('.app-header');
  if (!headerRight) return;

  let bellBtn = document.getElementById('notif-bell-btn');
  if (!bellBtn) {
    bellBtn = document.createElement('button');
    bellBtn.id = 'notif-bell-btn';
    // Chèn sau phần hiển thị Ngày Tháng
    headerRight.appendChild(bellBtn);
  }

  bellBtn.className = 'header-icon-btn notif-bell-btn';
  bellBtn.style.cssText = 'margin-left: 8px; cursor: pointer; background: transparent; border: none; color: var(--foreground); display: inline-flex; align-items: center; position: relative;';
  bellBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

  let dot = document.getElementById('notif-badge-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.id = 'notif-badge-dot';
    dot.className = 'notif-badge-dot';
    bellBtn.appendChild(dot);
  }

  if (!document.getElementById('notif-dropdown')) {
    const dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.className = 'notif-dropdown';
    document.body.appendChild(dropdown);
  }

  bellBtn.onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('open');
    renderNotificationList();
  };

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const bell = document.getElementById('notif-bell-btn');
    if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  fetchNotificationsFromSupabase();
  subscribeRealtimeNotifications();
}

function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - itemDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < days;
}

function getDayLabel(dateStr) {
  if (!dateStr) return 'Khác';
  const itemDate = new Date(dateStr);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return fmtDateStr(dateStr);
}

function updateNotificationUI() {
  const allList = db.notifications || [];
  const recentList = allList.filter(n => isWithinDays(n.date || n.created_at, 2));
  const readIds = getReadNotifIds();

  const hasUnread = recentList.length > 0 && recentList.some(n => !readIds.includes(n.id));

  const bellBtn = document.getElementById('notif-bell-btn');
  const dot = document.getElementById('notif-badge-dot');

  if (hasUnread) {
    if (dot) dot.style.display = 'block';
    if (bellBtn) bellBtn.classList.add('bell-ring-active');
  } else {
    if (dot) dot.style.display = 'none';
    if (bellBtn) bellBtn.classList.remove('bell-ring-active');
  }

  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown && dropdown.classList.contains('open')) {
    renderNotificationList();
  }
}

function renderNotificationList() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;

  const allList = db.notifications || [];
  const recentList = allList.filter(n => isWithinDays(n.date || n.created_at, 2));
  const readIds = getReadNotifIds();

  let itemsHtml = '';
  if (recentList.length === 0) {
    itemsHtml = `<div style="padding: 32px; text-align: center; color: var(--muted-foreground, #8a94a6); font-size: 13px; font-family: var(--font-dm-mono);">Không có thông báo trong 2 ngày gần đây</div>`;
  } else {
    itemsHtml = recentList.map(item => {
      const isRead = readIds.includes(item.id);
      const formattedDate = fmtDateStr(item.date || item.created_at);
      const timeStr = item.time ? item.time.substring(0, 5) : '';
      const fullTimeDisplay = `${formattedDate} ${timeStr}`.trim();
      const actorDisplay = item.actor || item.user_fullname || 'Hệ thống';

      return `
        <div class="notif-item ${isRead ? '' : 'unread'}" style="padding: 14px 18px; cursor: pointer;" onclick="handleNotificationClick('${item.id}', '${item.targetview}', '${item.itemid}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
            <span style="font-size: 14px; font-weight: 600; color: #ffffff;">${item.title}</span>
            <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); white-space: nowrap;">${fullTimeDisplay}</span>
          </div>
          <div style="font-size: 13px; color: var(--foreground, #e2e8f0); line-height: 1.4;">${item.detail}</div>
          <div style="font-size: 11px; color: #f0a030; font-family: var(--font-dm-mono); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Thực hiện: <strong>${actorDisplay}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  dropdown.innerHTML = `
    <div style="padding: 14px 18px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); display: flex; justify-content: space-between; align-items: center; background: var(--secondary, #1a1e26);">
      <span style="font-family: var(--font-dm-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: var(--foreground);">THÔNG BÁO</span>
      ${recentList.length > 0 ? `<button onclick="markAllNotificationsAsRead()" style="background: none; border: none; color: #f0a030; font-family: var(--font-dm-mono); font-size: 11px; cursor: pointer; text-transform: uppercase; font-weight: 500; white-space: nowrap;">ĐÁNH DẤU ĐỌC HẾT</button>` : ''}
    </div>
    <div style="overflow-y: auto; max-height: 380px;">
      ${itemsHtml}
    </div>
    <div style="padding: 10px; border-top: 1px solid var(--border, rgba(255,255,255,0.1)); background: var(--card, #141821); text-align: center;">
      <button onclick="openNotificationHistory()" style="width: 100%; padding: 8px; background: rgba(240, 160, 48, 0.12); border: 1px solid rgba(240, 160, 48, 0.3); border-radius: 2px; color: #f0a030; font-family: var(--font-dm-mono); font-size: 11px; font-weight: 600; text-transform: uppercase; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(240, 160, 48, 0.25)'" onmouseout="this.style.background='rgba(240, 160, 48, 0.12)'">
        Xem lịch sử thông báo ➔
      </button>
    </div>
  `;

  if (!dropdown.dataset.swipeBound) {
    let dropStartX = 0, dropStartY = 0;
    dropdown.addEventListener('touchstart', (e) => {
      dropStartX = e.touches[0].clientX;
      dropStartY = e.touches[0].clientY;
    }, { passive: true });

    dropdown.addEventListener('touchend', (e) => {
      const dropEndX = e.changedTouches[0].clientX;
      const dropEndY = e.changedTouches[0].clientY;
      const diffX = dropEndX - dropStartX;
      const diffY = dropEndY - dropStartY;

      if (diffX > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        dropdown.classList.remove('open');
      }
    }, { passive: true });

    dropdown.dataset.swipeBound = 'true';
  }
}

function initNotificationHistoryDrawer() {
  if (document.getElementById('notif-history-drawer')) return;

  const overlay = document.createElement('div');
  overlay.id = 'notif-history-overlay';
  overlay.className = 'notif-history-overlay';
  overlay.onclick = closeNotificationHistory;

  const drawer = document.createElement('div');
  drawer.id = 'notif-history-drawer';
  drawer.className = 'notif-history-drawer';

  let drawerStartX = 0, drawerStartY = 0;
  drawer.addEventListener('touchstart', (e) => {
    drawerStartX = e.touches[0].clientX;
    drawerStartY = e.touches[0].clientY;
  }, { passive: true });

  drawer.addEventListener('touchend', (e) => {
    const drawerEndX = e.changedTouches[0].clientX;
    const drawerEndY = e.changedTouches[0].clientY;
    const diffX = drawerEndX - drawerStartX;
    const diffY = drawerEndY - drawerStartY;

    if (diffX > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      closeNotificationHistory();
    }
  }, { passive: true });

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

function openNotificationHistory() {
  initNotificationHistoryDrawer();

  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown) dropdown.classList.remove('open');

  const drawer = document.getElementById('notif-history-drawer');
  const overlay = document.getElementById('notif-history-overlay');

  renderNotificationHistoryContent();

  drawer.classList.add('open');
  overlay.classList.add('active');
}

function closeNotificationHistory() {
  const drawer = document.getElementById('notif-history-drawer');
  const overlay = document.getElementById('notif-history-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function renderNotificationHistoryContent() {
  const drawer = document.getElementById('notif-history-drawer');
  if (!drawer) return;

  const allList = db.notifications || [];
  const monthlyList = allList.filter(n => isWithinDays(n.date || n.created_at, 30));
  const readIds = getReadNotifIds();

  const grouped = {};
  monthlyList.forEach(item => {
    const label = getDayLabel(item.date || item.created_at);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(item);
  });

  let historyHtml = '';
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    historyHtml = `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-size: 13px; font-family: var(--font-dm-mono);">Không có lịch sử thông báo trong 30 ngày qua</div>`;
  } else {
    groupKeys.forEach(dateLabel => {
      const items = grouped[dateLabel];
      historyHtml += `<div class="notif-date-group-title">${dateLabel} (${items.length})</div>`;

      items.forEach(item => {
        const isRead = readIds.includes(item.id);
        const timeStr = item.time ? item.time.substring(0, 5) : '';
        const actorDisplay = item.actor || item.user_fullname || 'Hệ thống';

        historyHtml += `
          <div class="notif-item ${isRead ? '' : 'unread'}" style="padding: 14px 18px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.06)); cursor: pointer;" onclick="handleNotificationClick('${item.id}', '${item.targetview}', '${item.itemid}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px;">
              <span style="font-size: 13.5px; font-weight: 600; color: #ffffff;">${item.title}</span>
              <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); white-space: nowrap;">${timeStr}</span>
            </div>
            <div style="font-size: 12.5px; color: var(--foreground, #e2e8f0); line-height: 1.4;">${item.detail}</div>
            <div style="font-size: 11px; color: #f0a030; font-family: var(--font-dm-mono); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Thực hiện: <strong>${actorDisplay}</strong></span>
            </div>
          </div>
        `;
      });
    });
  }

  drawer.innerHTML = `
    <div style="padding: 16px 20px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); display: flex; justify-content: space-between; align-items: center; background: var(--secondary, #1a1e26);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: var(--foreground);">LỊCH SỬ THÔNG BÁO</span>
      </div>
      <button onclick="closeNotificationHistory()" style="background: none; border: none; color: var(--muted-foreground); cursor: pointer; padding: 4px; display: flex; align-items: center;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--muted-foreground)'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div style="flex: 1; overflow-y: auto;">
      ${historyHtml}
    </div>
  `;
}

function handleNotificationClick(notifId, targetView, itemId) {
  markNotifIdAsRead(notifId);

  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown) dropdown.classList.remove('open');

  closeNotificationHistory();

  if (targetView && itemId && targetView !== 'null' && itemId !== 'null') {
    navigate(targetView, 'view', itemId);
  }
}

function markAllNotificationsAsRead() {
  const list = db.notifications || [];
  list.forEach(n => markNotifIdAsRead(n.id));
}

function subscribeAppRealtimeChanges() {
  const tables = ['materials', 'customers', 'warehouses', 'quotations', 'orders', 'returns', 'grns'];

  tables.forEach(tbl => {
    supabaseClient
      .channel(`public:${tbl}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tbl }, async () => {
        invalidateStockCache();
        await fetchDataFromSupabase();
        // Chỉ vẽ lại màn hình nếu người dùng đang đứng ở danh sách
        if (state.mode === 'list') {
          render();
        }
      })
      .subscribe();
  });
}