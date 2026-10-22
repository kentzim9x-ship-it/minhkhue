// ==========================================
// 9. RENDER GIAO DIỆN & CÁC TRANG (VIEWS)
// ==========================================

// GIAO DIỆN ĐĂNG NHẬP SANG TRỌNG
function renderLoginForm(container) {
  const savedCredsRaw = localStorage.getItem('remembered_user');
  const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : { username: '', password: '', remember: false };
  const bannerImg = 'https://res.cloudinary.com/puyb3jyd/image/upload/v1792599496/BeautyPlus-OBJECT-REMOVER-1792599386313.jpg';

  container.innerHTML = `
    <style>
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0, 0, 0, 0.3) inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
      }
    </style>

    <div style="
      min-height: 100vh; 
      width: 100%;
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px; 
      font-family: var(--font-jost, sans-serif);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      background: linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url('${bannerImg}') center/cover no-repeat;
    ">

      <!-- FORM ĐĂNG NHẬP CĂN GIỮA MÀN HÌNH -->
      <div style="
        width: 100%;
        max-width: 380px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        z-index: 1;
      ">

        <form onsubmit="handleLogin(event)" style="width: 100%; display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Username Input -->
          <div style="position: relative;">
            <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.7); display: flex;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input 
              type="text" 
              id="login-username" 
              required 
              value="${savedCreds.remember ? (savedCreds.username || '') : ''}"
              placeholder="Nhập tên đăng nhập" 
              style="
                width: 100%; 
                padding: 13px 16px 13px 48px; 
                background: rgba(0, 0, 0, 0.3); 
                border: 1px solid rgba(255, 255, 255, 0.25); 
                border-radius: 25px; 
                color: #ffffff; 
                outline: none; 
                font-size: 14px; 
                backdrop-filter: blur(8px);
                transition: all 0.2s ease;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#f0a030'; this.style.background='rgba(0,0,0,0.45)';"
              onblur="this.style.borderColor='rgba(255, 255, 255, 0.25)'; this.style.background='rgba(0,0,0,0.3)';"
            >
          </div>

          <!-- Password Input kèm Icon Mắt -->
          <div style="position: relative;">
            <span style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.7); display: flex;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input 
              type="password" 
              id="login-password" 
              required 
              value="${savedCreds.remember ? (savedCreds.password || '') : ''}"
              placeholder="Nhập mật khẩu" 
              style="
                width: 100%; 
                padding: 13px 48px 13px 48px; 
                background: rgba(0, 0, 0, 0.3); 
                border: 1px solid rgba(255, 255, 255, 0.25); 
                border-radius: 25px; 
                color: #ffffff; 
                outline: none; 
                font-size: 14px; 
                backdrop-filter: blur(8px);
                transition: all 0.2s ease;
                box-sizing: border-box;
              "
              onfocus="this.style.borderColor='#f0a030'; this.style.background='rgba(0,0,0,0.45)';"
              onblur="this.style.borderColor='rgba(255, 255, 255, 0.25)'; this.style.background='rgba(0,0,0,0.3)';"
            >
            <!-- Toggle Password Icon Button -->
            <span 
              id="toggle-password-btn"
              onclick="togglePasswordVisibility()" 
              style="
                position: absolute; 
                right: 18px; 
                top: 50%; 
                transform: translateY(-50%); 
                cursor: pointer; 
                color: rgba(255, 255, 255, 0.7); 
                display: flex; 
                align-items: center;
                transition: color 0.2s;
              "
              onmouseover="this.style.color='#f0a030'"
              onmouseout="this.style.color='rgba(255, 255, 255, 0.7)'"
              title="Ẩn/Hiện mật khẩu"
            >
              <svg id="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
          </div>

          <!-- Nút tích Ghi nhớ đăng nhập -->
          <div style="display: flex; align-items: center; justify-content: flex-start; padding: 0 4px; margin-left: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255, 255, 255, 0.85); cursor: pointer; user-select: none;">
              <input 
                type="checkbox" 
                id="login-remember" 
                ${savedCreds.remember ? 'checked' : ''} 
                style="cursor: pointer; accent-color: #f0a030; width: 16px; height: 16px;"
              >
              Ghi nhớ đăng nhập
            </label>
          </div>

          <!-- Thông báo lỗi -->
          <div id="login-error" style="color: #f87171; font-size: 12px; display: none; background: rgba(0,0,0,0.45); border: 1px solid rgba(248, 113, 113, 0.3); padding: 8px 12px; border-radius: 20px; text-align: center;">
            Tài khoản hoặc mật khẩu không chính xác!
          </div>

          <!-- Nút Đăng Nhập -->
          <button 
            type="submit" 
            style="
              width: 100%; 
              padding: 13px; 
              margin-top: 4px; 
              background: #d9534f; 
              border: none; 
              border-radius: 25px !important;; 
              color: #ffffff; 
              font-family: var(--font-jost, sans-serif); 
              font-size: 15px; 
              font-weight: 600; 
              cursor: pointer; 
              transition: all 0.2s ease;
              box-shadow: 0 4px 15px rgba(217, 83, 79, 0.4);
            "
            onmouseover="this.style.background='#c9302c'; this.style.transform='translateY(-1px)';"
            onmouseout="this.style.background='#d9534f'; this.style.transform='none';"
          >
            Đăng Nhập
          </button>
        </form>

      </div>
    </div>
  `;
}

// Hàm hỗ trợ bật/tắt hiển thị mật khẩu
function togglePasswordVisibility() {
  const pwdInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('eye-icon');

  if (!pwdInput) return;

  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    pwdInput.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

function render() {
  const appContainer = document.querySelector('.app-container');
  const c = document.getElementById('app-content');
  const session = getAuthSession();

  // CHƯA ĐĂNG NHẬP: Hiển thị Form Login & Đẩy URL về /minhkhue/login
  if (!session.isLoggedIn) {
    if (appContainer) appContainer.style.display = 'none';
    let loginBox = document.getElementById('login-container');
    if (!loginBox) {
      loginBox = document.createElement('div');
      loginBox.id = 'login-container';
      document.body.appendChild(loginBox);
    }

    // Tự động thay đổi URL trên thanh địa chỉ về /minhkhue/login nếu đang ở URL khác
    const targetLoginUrl = `${BASE_PATH}/login`;
    if (window.location.pathname !== targetLoginUrl) {
      window.history.pushState({ view: 'login' }, '', targetLoginUrl);
    }

    renderLoginForm(loginBox);
    return;
  } else {
    // ĐÃ ĐĂNG NHẬP: Gỡ Form Login và mở ứng dụng
    const loginBox = document.getElementById('login-container');
    if (loginBox) loginBox.remove();
    if (appContainer) appContainer.style.display = 'flex';
    updateUserInfoUI();
  }

  const activeId = document.activeElement ? document.activeElement.id : null;

  c.innerHTML = '';
  updateGlobalMaterialDatalist();

  if (state.mode !== 'list') {
    switch (state.view) {
      case 'materials': renderMaterialForm(c); break;
      case 'customers': renderCustomerForm(c); break;
      case 'warehouses': renderWarehouseForm(c); break;
      case 'quotations': renderQuotationForm(c); break;
      case 'sales-orders': renderSalesOrderForm(c); break;
      case 'returns': renderReturnForm(c); break;
      case 'grn': renderGRNForm(c); break;
    }
  } else {
    switch (state.view) {
      case 'dashboard': renderDashboard(c); break;
      case 'materials': renderMaterialsList(c); break;
      case 'customers': renderCustomersList(c); break;
      case 'warehouses': renderWarehousesList(c); break;
      case 'quotations': renderQuotationsList(c); break;
      case 'sales-orders': renderOrdersList(c); break;
      case 'returns': renderReturnsList(c); break;
      case 'grn': renderGRNList(c); break;
      case 'report-inventory': renderReportInventory(c); break;
      case 'report-sales': renderReportSales(c); break;
    }
  }

  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      try {
        if (typeof el.selectionStart !== 'undefined' && el.type !== 'number' && el.type !== 'email') {
          const len = el.value ? el.value.length : 0;
          el.setSelectionRange(len, len);
        }
      } catch (err) { }
    }
  }
}

// BÁO CÁO DOANH THU & DASHBOARD
function getSalesAnalyticsData() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthLabels = [];
  const monthlyMap = {};

  for (let i = 8; i >= 0; i--) {
    let d = new Date(currentYear, currentMonth - 1 - i, 1);
    let y = d.getFullYear();
    let m = d.getMonth() + 1;
    let key = `${y}-${String(m).padStart(2, '0')}`;
    let label = `Tháng ${m}`;
    monthLabels.push({ key, label, year: y, month: m });
    monthlyMap[key] = { month: label, revenue: 0, orders: 0, returns: 0 };
  }

  let currentMonthRevenue = 0;
  let currentMonthOrders = 0;

  (db.orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (['completed', 'processing', 'hoàn thành', 'đang xử lý'].includes(status)) {
      const dateStr = o.date || '';
      const key = dateStr.substring(0, 7);
      const total = Number(o.total || 0);

      if (monthlyMap[key]) {
        monthlyMap[key].revenue += total;
        monthlyMap[key].orders += 1;
      }

      const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      if (key === currentKey) {
        currentMonthRevenue += total;
        currentMonthOrders += 1;
      }
    }
  });

  (db.returns || []).forEach(r => {
    const status = (r.status || '').toLowerCase();
    if (['processed', 'approved', 'đã xử lý', 'đã duyệt'].includes(status)) {
      const dateStr = r.date || '';
      const key = dateStr.substring(0, 7);
      if (monthlyMap[key]) {
        monthlyMap[key].returns += 1;
      }
    }
  });

  const salesDataReal = monthLabels.map(m => monthlyMap[m.key]);

  let ytdRevenue = 0;
  let ytdOrders = 0;
  (db.orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (['completed', 'processing', 'hoàn thành', 'đang xử lý'].includes(status)) {
      if (o.date && o.date.startsWith(String(currentYear))) {
        ytdRevenue += Number(o.total || 0);
        ytdOrders += 1;
      }
    }
  });

  const customerMap = {};
  (db.orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (['completed', 'processing', 'hoàn thành', 'đang xử lý'].includes(status)) {
      const cName = o.customer || 'Khách lẻ';
      if (!customerMap[cName]) customerMap[cName] = { name: cName, revenue: 0, orders: 0 };
      customerMap[cName].revenue += Number(o.total || 0);
      customerMap[cName].orders += 1;
    }
  });

  const topCustomersReal = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue);

  const notifList = db.notifications || [];
  const recentActivityReal = notifList.slice(0, 6).map(n => {
    const formattedDate = fmtDateStr(n.date || n.created_at);
    const timeStr = n.time ? n.time.substring(0, 5) : '';
    const fullDateTime = `${formattedDate} ${timeStr}`.trim();

    return {
      time: fullDateTime || '—',
      event: n.title || 'Thông báo',
      detail: n.detail || '',
      actor: n.actor || n.user_fullname || ''
    };
  });

  return {
    salesDataReal,
    currentMonthRevenue,
    currentMonthOrders,
    ytdRevenue,
    ytdOrders,
    topCustomersReal,
    recentActivityReal
  };
}

function renderDashboard(c) {
  const {
    salesDataReal,
    currentMonthRevenue,
    currentMonthOrders,
    recentActivityReal
  } = getSalesAnalyticsData();

  const openQuotationsCount = (db.quotations || []).filter(q => ['draft', 'accepted', 'bản nháp', 'đã chấp nhận'].includes((q.status || '').toLowerCase())).length;

  const totalOrdersCount = (db.orders || []).length;
  const completedOrdersCount = (db.orders || []).filter(o => ['completed', 'hoàn thành'].includes((o.status || '').toLowerCase())).length;
  const completionRate = totalOrdersCount > 0 ? ((completedOrdersCount / totalOrdersCount) * 100).toFixed(1) : '100.0';

  const activityHtml = recentActivityReal.map(a => `
    <div style="padding: 12px 18px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: flex-start; justify-content: space-between;">
      <div style="font-size: 13px; font-weight: 500; flex: 1;">
        <div style="color: var(--foreground); font-weight: 600;">${a.event}</div>
        <div style="font-size: 12px; color: var(--muted-foreground); margin-top: 2px;">${a.detail}</div>
        ${a.actor ? `<div style="font-size: 11px; color: #f0a030; font-family: var(--font-dm-mono); margin-top: 4px;">Thực hiện: ${a.actor}</div>` : ''}
      </div>
      <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); white-space: nowrap; margin-left: 12px;">${a.time}</span>
    </div>
  `).join('');

  const currentMonthStr = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div class="kpi-grid">
        <div class="kpi-card"><span class="kpi-label">Doanh thu tháng này</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(currentMonthRevenue)}</span></div><span class="kpi-sub">${currentMonthStr}</span></div>
        <div class="kpi-card"><span class="kpi-label">Đơn hàng tháng này</span><div class="kpi-value-row"><span class="kpi-value">${fmt(currentMonthOrders)}</span></div><span class="kpi-sub">${currentMonthStr}</span></div>
        <div class="kpi-card"><span class="kpi-label">Báo giá chưa khóa</span><div class="kpi-value-row"><span class="kpi-value">${openQuotationsCount}</span></div><span class="kpi-sub">nháp + chấp nhận</span></div>
        <div class="kpi-card"><span class="kpi-label">Tỷ lệ hoàn thành</span><div class="kpi-value-row"><span class="kpi-value">${completionRate}%</span></div><span class="kpi-sub">giao đúng hạn</span></div>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;" class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Doanh Thu Hàng Tháng</div>
          <div style="height: 200px;"><canvas id="chart-rev"></canvas></div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card);">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Hoạt Động Mới Nhất</div>
          <div>
            ${activityHtml || '<div style="padding: 20px; text-align: center; color: var(--muted-foreground); font-size: 12px;">Chưa có hoạt động gần đây</div>'}
          </div>
        </div>
      </div>
    </div>
  `;

  const ctx = document.getElementById('chart-rev').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesDataReal.map(d => d.month),
      datasets: [{
        label: 'Doanh thu',
        data: salesDataReal.map(d => d.revenue),
        borderColor: '#f0a030',
        backgroundColor: 'rgba(240,160,48,0.15)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#252a33' }, ticks: { color: '#6b7585' } },
        y: { grid: { color: '#252a33' }, ticks: { color: '#6b7585' } }
      }
    }
  });
}

function renderMaterialsList(c) {
  const hasPermission = checkModulePermission('materials');

  const filtered = db.materials.filter(m => {
    if (state.filter !== 'all' && m.status !== state.filter) return false;
    if (state.search && !m.name.toLowerCase().includes(state.search.toLowerCase()) && !m.id.toLowerCase().includes(state.search.toLowerCase())) return false;
    return true;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const kpiHtml = [
    { label: 'Tổng số SKU', value: fmt(db.materials.length), color: 'var(--foreground)' },
    { label: 'Tổng tồn kho', value: fmt(db.materials.reduce((a, i) => a + i.stock, 0)), color: '#f0a030' },
    { label: 'Đang tạm giữ', value: fmt(db.materials.reduce((a, i) => a + i.reserved, 0)), color: '#60a5fa' },
    { label: 'Thấp/Cảnh báo', value: fmt(db.materials.filter(i => ['low', 'critical', 'out'].includes(i.status)).length), color: '#f87171' }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${s.color};">${s.value}</div>
    </div>
  `).join('');

  const headersHtml = [
    'Mã Hàng', 'Tên Hàng', 'Đơn Vị', 'Danh Mục', 'Vị Trí Lưu Kho', 'Tồn Kho Ban Đầu', 'Đơn Giá', 'Trạng Thái',
    'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa',
    'Hành Động'
  ].map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tồn Kho Ban Đầu' || h === 'Đơn Giá' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`).join('');

  const rowsHtml = paginatedItems.map(m => `
  <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', '${hasPermission ? 'edit' : 'view'}', '${m.id}')" onclick="navigate('materials', 'view', '${m.id}')">
    <td data-label="Mã Hàng" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
    <td data-label="Tên Hàng" style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
    <td data-label="Đơn Vị" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
    <td data-label="Danh Mục" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
    <td data-label="Vị Trí Lưu Kho" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
    <td data-label="Tồn Kho Ban Đầu" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${m.stock ?? 0}</td>
    <td data-label="Đơn Giá" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
    <td data-label="Trạng Thái" style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'CÒN HÀNG' : m.status.toUpperCase()}</span></td>
    
    <td data-label="Người Tạo" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(m.user_id0)}</td>
    <td data-label="Ngày Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(m.date0)}</td>
    <td data-label="Giờ Táo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(m.time0)}</td>
    <td data-label="Người Sửa" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(m.user_id2)}</td>
    <td data-label="Ngày Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(m.date2)}</td>
    <td data-label="Giờ Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(m.time2)}</td>

    <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'view', '${m.id}')">${Icons.view} Xem</button>
        ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>` : ''}
        ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>` : ''}
      </div>
    </td>
  </tr>
`).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>
      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['ok', 'Đủ hàng'], ['low', 'Sắp hết'], ['critical', 'Nguy cấp'], ['out', 'Hết hàng']])}
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên hàng..." value="${state.search}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('materials', 'add')">${Icons.plus} Thêm Mới Hàng Hóa</button>` : ''}
        </div>
      </div>     

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderCustomersList(c) {
  const hasPermission = checkModulePermission('customers');

  const filtered = db.customers.filter(c => {
    const matchStatus = (state.filter === 'all' || c.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();
    const matchSearch = !searchKey ||
      (c.name && c.name.toLowerCase().includes(searchKey)) ||
      (c.id && c.id.toLowerCase().includes(searchKey)) ||
      (c.contact && c.contact.toLowerCase().includes(searchKey)) ||
      (c.address && c.address.toLowerCase().includes(searchKey));
    return matchStatus && matchSearch;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const totalCount = db.customers.length;
  const activeCount = db.customers.filter(c => c.status === 'active').length;
  const suspendedCount = db.customers.filter(c => c.status === 'suspended' || c.status === 'inactive').length;

  const kpiHtml = [
    { label: 'TỔNG KHÁCH HÀNG', value: fmt(totalCount), color: 'var(--foreground)' },
    { label: 'ĐANG HOẠT ĐỘNG', value: fmt(activeCount), color: '#34d399' },
    { label: 'TẠM KHÓA / NGỪNG', value: fmt(suspendedCount), color: '#f87171' }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${s.color};">${s.value}</div>
    </div>
  `).join('');

  const headersHtml = [
    'Mã KH', 'Tên Công Ty / KH', 'Người Liên Hệ', 'Email', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa', 'Hành Động'
  ].map(h => `
    <th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">
      ${h}
    </th>
  `).join('');

  const rowsHtml = paginatedItems.map(c => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('customers', '${hasPermission ? 'edit' : 'view'}', '${c.id}')" onclick="navigate('customers', 'view', '${c.id}')">
      <td data-label="Mã Khách Hàng" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary); text-align: left;">${c.id || '—'}</td>
      <td data-label="Tên Công Ty / Khách Hàng" style="padding: 11px 16px; font-size: 13px; font-weight: 500; text-align: left;">${c.name || '—'}</td>
      <td data-label="Người Liên Hệ" style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.contact || '—'}</td>
      <td data-label="Email" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); text-align: left;">${c.email || '—'}</td>
      <td data-label="Số Điện Thoại" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; text-align: left;">${c.phone || '—'}</td>
      <td data-label="Địa Chỉ" style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.address || c.diachi || '—'}</td>
      <td data-label="Trạng Thái" style="padding: 11px 16px; text-align: left;"><span class="badge ${getBadgeClass(c.status)}">${c.status === 'active' ? 'hoạt động' : (c.status === 'suspended' ? 'tạm khóa' : (c.status || 'hoạt động'))}</span></td>

      <td data-label="Người Tạo" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(c.user_id0)}</td>
      <td data-label="Ngày Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(c.date0)}</td>
      <td data-label="Giờ Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(c.time0)}</td>
      <td data-label="Người Sửa" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(c.user_id2)}</td>
      <td data-label="Ngày Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(c.date2)}</td>
      <td data-label="Giờ Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(c.time2)}</td>
    
      <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'view', '${c.id}')">${Icons.view} Xem</button>
          ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'edit', '${c.id}')">${Icons.edit} Sửa</button>` : ''}
          ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('customers', '${c.id}')">${Icons.trash} Xóa</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>
      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['active', 'Đang Hoạt Động'], ['inactive', 'Ngừng Hoạt Động'], ['suspended', 'Tạm Khóa']])}
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên, liên hệ, địa chỉ..." value="${state.search}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('customers', 'add')">${Icons.plus} Thêm Mới Khách Hàng</button>` : ''}
        </div>
      </div>     

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderWarehousesList(c) {
  const hasPermission = checkModulePermission('warehouses');

  const cardsHtml = db.warehouses.map(w => {
    const pct = Math.round((w.used / w.capacity) * 100);
    const barColor = pct > 90 ? '#f87171' : pct > 75 ? '#fbbf24' : 'var(--primary)';
    return `
      <div style="border: 1px solid var(--border); background: var(--card); position: relative; cursor: pointer;" ondblclick="navigate('warehouses', '${hasPermission ? 'edit' : 'view'}', '${w.id}')" onclick="navigate('warehouses', 'view', '${w.id}')">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: var(--primary); font-family: var(--font-dm-mono); font-size: 14px; font-weight: 500;">${w.code || w.id}</span>
            <span style="color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">${w.name}</span>
          </div>
          <span class="badge ${getBadgeClass(w.status)}">${getWarehouseStatusLabel(w.status)}</span>
        </div>
        <div style="padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div><div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">VỊ TRÍ</div><div style="font-size: 12px;">${w.location}</div></div>
          <div><div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">QUẢN LÝ</div><div style="font-size: 13px;">${w.manager}</div></div>
          <div style="grid-column: span 2;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em;">SỨC CHỨA</span>
              <span style="font-family: var(--font-dm-mono); font-size: 11px; color: ${pct > 75 ? barColor : 'var(--foreground)'}">${fmt(w.used || 0)} / ${fmt(w.capacity || 0)} đơn vị (${pct || 0}%)</span>
            </div>
            <div style="height: 3px; background: var(--muted);"><div style="width: ${pct || 0}%; height: 100%; background: ${barColor};"></div></div>
          </div>
        </div>
        <div style="padding: 10px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('warehouses', 'view', '${w.id}')">${Icons.view} Xem</button>
          ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('warehouses', 'edit', '${w.id}')">${Icons.edit} Sửa</button>` : ''}
          ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('warehouses', '${w.id}')">${Icons.trash} Xóa</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: flex-end;">
        ${hasPermission ? `<button class="btn-primary" onclick="navigate('warehouses', 'add')">${Icons.plus} Thêm Mới Kho</button>` : ''}
      </div>
      <div class="grid-2">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function renderQuotationsList(c) {
  const hasPermission = checkModulePermission('quotations');

  const filtered = db.quotations.filter(q => {
    const matchStatus = (state.filter === 'all' || q.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();
    const custId = (q.customerId || q.customerid || '').toLowerCase();
    const custName = (q.customer || '').toLowerCase();
    const qId = (q.id || '').toLowerCase();

    const matchSearch = !searchKey ||
      custName.includes(searchKey) ||
      custId.includes(searchKey) ||
      qId.includes(searchKey);

    return matchStatus && matchSearch;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const kpiHtml = [
    ['all', 'Tất cả'],
    ['draft', 'Bản nháp'],
    ['accepted', 'Đã chấp nhận'],
    ['expired', 'Hết hạn']
  ].map(([s, label]) => {
    const count = s === 'all' ? db.quotations.length : db.quotations.filter(q => q.status === s).length;
    const color = s === 'all' ? 'var(--foreground)' : s === 'draft' ? 'var(--muted-foreground)' : s === 'accepted' ? '#34d399' : '#f87171';
    return `
      <div style="background-color: var(--card); padding: 16px 20px;">
        <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${label}</div>
        <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${color};">${count}</div>
      </div>
    `;
  }).join('');

  const headersHtml = ['Mã Báo Giá', 'Khách Hàng', 'Ngày Lập', 'Phát Hành', 'Hiệu Lực Đến', 'Số Dòng', 'Tổng Tiền', 'Trạng Thái', 'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = paginatedItems.map(q => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('quotations', '${hasPermission ? 'edit' : 'view'}', '${q.id}')" onclick="navigate('quotations', 'view', '${q.id}')">
      <td data-label="Mã Báo Giá" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${q.id}</td>
      <td data-label="Khách Hàng" style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${q.customer}</td>
      <td data-label="Ngày Lập" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.date || '—'}</td>
      <td data-label="Phát Hành" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validbegin || q.validBegin || '—'}</td>
      <td data-label="Hiệu Lực Đến" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validUntil}</td>
      <td data-label="Số Dòng" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(q.lineItems || []).length}</td>
      <td data-label="Tổng Tiền" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(q.total)}</td>
      <td data-label="Trạng Thái" style="padding: 12px 16px;"><span class="badge ${getBadgeClass(q.status)}">${getStatusLabel(q.status)}</span></td>

      <td data-label="Người Tạo" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(q.user_id0)}</td>
      <td data-label="Ngày Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(q.date0)}</td>
      <td data-label="Giờ Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(q.time0)}</td>
      <td data-label="Người Sửa" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(q.user_id2)}</td>
      <td data-label="Ngày Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(q.date2)}</td>
      <td data-label="Giờ Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(q.time2)}</td>

      <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('quotations', 'view', '${q.id}')">${Icons.view} Xem</button>
        ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('quotations', 'edit', '${q.id}')">${Icons.edit} Sửa</button>` : ''}
        ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('quotations', '${q.id}')">${Icons.trash} Xóa</button>` : ''}
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['accepted', 'Đã chấp nhận'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối'], ['expired', 'Hết hạn']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên khách hàng..." value="${state.search || ''}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('quotations', 'add')">${Icons.plus} Tạo Báo Giá Mới</button>` : ''}
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu phù hợp</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderOrdersList(c) {
  const hasPermission = checkModulePermission('sales-orders');

  const filtered = db.orders.filter(o => {
    const matchStatus = (state.filter === 'all' || o.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();
    const custId = (o.customerId || o.customerid || '').toLowerCase();
    const custName = (o.customer || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();

    const matchSearch = !searchKey ||
      custName.includes(searchKey) ||
      custId.includes(searchKey) ||
      orderId.includes(searchKey);

    return matchStatus && matchSearch;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const kpiHtml = [
    { label: 'Tổng đơn hàng', val: db.orders.length, color: 'var(--foreground)' },
    { label: 'Hoàn thành', val: db.orders.filter(o => o.status === 'completed' || o.status === 'delivered').length, color: '#34d399' },
    { label: 'Đang xử lý', val: db.orders.filter(o => o.status === 'processing').length, color: '#fbbf24' },
    { label: 'Chờ xử lý', val: db.orders.filter(o => o.status === 'pending').length, color: 'var(--muted-foreground)' },
    { label: 'Đã Hủy', val: db.orders.filter(o => o.status === 'cancelled').length, color: '#f87171' },
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${s.color};">${s.val}</div>
    </div>
  `).join('');

  const headersHtml = [
    'Mã Đơn Hàng', 'Khách Hàng', 'Ngày Tạo', 'Mã Kho', 'Số Dòng', 'Tổng Tiền', 'Trạng Thái',
    'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa',
    'Hành Động'
  ].map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`).join('');

  const rowsHtml = paginatedItems.map(o => `
  <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('sales-orders', '${hasPermission ? 'edit' : 'view'}', '${o.id}')" onclick="navigate('sales-orders', 'view', '${o.id}')">
    <td data-label="Mã Đơn Hàng" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${o.id}</td>
    <td data-label="Khách Hàng" style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${o.customer}</td>
    <td data-label="Ngày Tạo" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${o.date}</td>
    <td data-label="Mã Kho" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${o.warehouseCode || o.warehouse_code || '—'}</td>
    <td data-label="Số Dòng" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(o.lineItems || o.lineitems || []).length || o.items || 0}</td>
    <td data-label="Tổng Tiền" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(o.total)}</td>
    <td data-label="Trạng Thái" style="padding: 12px 16px;"><span class="badge ${getBadgeClass(o.status)}">${getStatusLabel(o.status)}</span></td>

    <td data-label="Người Tạo" style="padding: 12px 16px; font-size: 12px;">${getUserFullName(o.user_id0)}</td>
    <td data-label="Ngày Tạo" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(o.date0)}</td>
    <td data-label="Giờ Tạo" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(o.time0)}</td>
    <td data-label="Người Sửa" style="padding: 12px 16px; font-size: 12px;">${getUserFullName(o.user_id2)}</td>
    <td data-label="Ngày Sửa" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(o.date2)}</td>
    <td data-label="Giờ Sửa" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(o.time2)}</td>

    <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
      <button class="btn-action" onclick="event.stopPropagation(); navigate('sales-orders', 'view', '${o.id}')">${Icons.view} Xem</button>
      ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('sales-orders', 'edit', '${o.id}')">${Icons.edit} Sửa</button>` : ''}
      ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('sales-orders', '${o.id}')">${Icons.trash} Xóa</button>` : ''}
    </td>
  </tr>
`).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['completed', 'Hoàn thành'], ['processing', 'Đang xử lý'], ['pending', 'Chờ xử lý'], ['cancelled', 'Đã hủy']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên khách hàng..." value="${state.search || ''}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('sales-orders', 'add')">${Icons.plus} Tạo Đơn Hàng Mới</button>` : ''}
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu phù hợp</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderReturnsList(c) {
  const hasPermission = checkModulePermission('returns');

  const filtered = db.returns.filter(r => {
    const matchStatus = (state.filter === 'all' || r.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();
    const rId = (r.id || '').toLowerCase();
    const orderId = (r.orderId || '').toLowerCase();
    const customer = (r.customer || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();

    const matchSearch = !searchKey ||
      rId.includes(searchKey) ||
      orderId.includes(searchKey) ||
      customer.includes(searchKey) ||
      reason.includes(searchKey);

    return matchStatus && matchSearch;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const kpiHtml = [
    { label: 'Tổng số lượt đổi trả', val: db.returns.length, color: 'var(--foreground)' },
    { label: 'Đã xử lý', val: db.returns.filter(r => r.status === 'processed').length, color: '#34d399' },
    { label: 'Đã duyệt', val: db.returns.filter(r => r.status === 'approved').length, color: '#60a5fa' },
    { label: 'Chờ duyệt', val: db.returns.filter(r => r.status === 'pending').length, color: '#fbbf24' }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${s.color};">${s.val}</div>
    </div>
  `).join('');

  const headersHtml = ['Mã Đổi Trả', 'Tham Chiếu Đơn', 'Khách Hàng', 'Ngày Tạo', 'Lý Do', 'Số Dòng', 'Tổng Hoàn Tiền', 'Trạng Thái', 'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Hoàn Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = paginatedItems.map(r => {
    const totalLines = (r.lineItems || r.lineitems || []).length;
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('returns', '${hasPermission ? 'edit' : 'view'}', '${r.id}')" onclick="navigate('returns', 'view', '${r.id}')">
        <td data-label="Mã Đổi Trả" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${r.id}</td>
        <td data-label="Tham Chiếu Đơn" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.orderId || '—'}</td>
        <td data-label="Khách Hàng" style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${r.customer}</td>
        <td data-label="Ngày Tạo" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.date}</td>
        <td data-label="Lý Do" style="padding: 12px 16px; font-size: 13px;">${r.reason}</td>
        <td data-label="Số Dòng" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td data-label="Tổng Hoàn Tiền" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; color: #f87171; text-align: right;">${fmtUSD(r.total)}</td>
        <td data-label="Trạng Thái" style="padding: 12px 16px;"><span class="badge ${getBadgeClass(r.status)}">${getStatusLabel(r.status)}</span></td>

      <td data-label="Người Tạo" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(r.user_id0)}</td>
      <td data-label="Ngày Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(r.date0)}</td>
      <td data-label="Giờ Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(r.time0)}</td>
      <td data-label="Người Sửa" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(r.user_id2)}</td>
      <td data-label="Ngày Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(r.date2)}</td>
      <td data-label="Giờ Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(r.time2)}</td>

        <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('returns', 'view', '${r.id}')">${Icons.view} Xem</button>
          ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('returns', 'edit', '${r.id}')">${Icons.edit} Sửa</button>` : ''}
          ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('returns', '${r.id}')">${Icons.trash} Xóa</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['processed', 'Đã xử lý'], ['approved', 'Đã duyệt'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, khách hàng, lý do..." value="${state.search || ''}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('returns', 'add')">${Icons.plus} Tạo Phiếu Đổi Trả</button>` : ''}
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderGRNList(c) {
  const hasPermission = checkModulePermission('grn');

  const filtered = db.grns.filter(g => {
    const matchStatus = (state.filter === 'all' || g.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();
    const gId = (g.id || '').toLowerCase();
    const supplier = (g.supplier || '').toLowerCase();
    const wCode = (g.warehouseCode || g.warehouse_code || '').toLowerCase();

    const matchSearch = !searchKey ||
      gId.includes(searchKey) ||
      supplier.includes(searchKey) ||
      wCode.includes(searchKey);

    return matchStatus && matchSearch;
  });

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + state.pageSize);

  const kpiHtml = [
    { label: 'Tổng số phiếu nhập', val: db.grns.length, color: 'var(--foreground)' },
    { label: 'Đã nhận hàng', val: db.grns.filter(g => g.status === 'Đã nhận' || g.status === 'received').length, color: '#fbbf24' },
    { label: 'Đã xác minh', val: db.grns.filter(g => g.status === 'Đã xác minh' || g.status === 'verified').length, color: '#34d399' }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: ${s.color};">${s.val}</div>
    </div>
  `).join('');

  const headersHtml = ['Mã Nhập Kho', 'Nhà Cung Cấp', 'Ngày Nhập', 'Mã Kho', 'Số Dòng', 'Tổng Giá Trị', 'Trạng Thái', 'Người Tạo', 'Ngày Tạo', 'Giờ Tạo', 'Người Sửa', 'Ngày Sửa', 'Giờ Sửa', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Giá Trị' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = paginatedItems.map(g => {
    const totalLines = (g.lineItems || []).length;
    const wCode = g.warehouseCode || g.warehouse_code || '—';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('grn', '${hasPermission ? 'edit' : 'view'}', '${g.id}')" onclick="navigate('grn', 'view', '${g.id}')">
        <td data-label="Mã Nhập Kho" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${g.id}</td>
        <td data-label="Nhà Cung Cấp" style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${g.supplier || '—'}</td>      
        <td data-label="Ngày Nhập" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${g.date}</td>
        <td data-label="Mã Kho" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${wCode}</td>
        <td data-label="Số Dòng" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td data-label="Tổng Giá Trị" style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(g.totalValue)}</td>
        <td data-label="Trạng Thái" style="padding: 12px 16px;"><span class="badge ${getBadgeClass(g.status)}">${getStatusLabel(g.status)}</span></td>

      <td data-label="Người Tạo" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(g.user_id0)}</td>
      <td data-label="Ngày Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(g.date0)}</td>
      <td data-label="Giờ Tạo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(g.time0)}</td>
      <td data-label="Người Sửa" style="padding: 11px 16px; font-size: 12px;">${getUserFullName(g.user_id2)}</td>
      <td data-label="Ngày Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(g.date2)}</td>
      <td data-label="Người Sửa" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(g.time2)}</td>

        <td data-label="Hành Động" style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('grn', 'view', '${g.id}')">${Icons.view} Xem</button>
          ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('grn', 'edit', '${g.id}')">${Icons.edit} Sửa</button>` : ''}
          ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('grn', '${g.id}')">${Icons.trash} Xóa</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['Bản nháp', 'Bản nháp'], ['Đã nhận', 'Đã nhận'], ['Đã xác minh', 'Đã xác minh']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã phiếu, nhà cung cấp..." value="${state.search || ''}" oninput="state.search=this.value; state.page=1; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          ${hasPermission ? `<button class="btn-primary" onclick="navigate('grn', 'add')">${Icons.plus} Nhập Kho Mới</button>` : ''}
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${filtered.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không tìm thấy dữ liệu</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;
}

function renderReportInventory(c) {
  const materials = db.materials;
  const hasPermission = checkModulePermission('materials');

  if (state.reportInvSearch === undefined) state.reportInvSearch = '';

  const getActualStock = (m) => {
    const invList = (db.inventory || []).filter(i => i.sku === m.id || i.material_id === m.id);
    if (invList.length > 0) {
      return invList.reduce((sum, inv) => sum + Number(inv.ton_thuc_te ?? inv.stock ?? 0), 0);
    }
    return m.stock ?? 0;
  };

  const getFilteredList = () => {
    const searchKey = (state.reportInvSearch || '').trim().toLowerCase();
    return materials.filter(m => {
      const matchCat = (state.filter === 'all' || m.category === state.filter);
      const matchSearch = !searchKey ||
        (m.id && m.id.toLowerCase().includes(searchKey)) ||
        (m.name && m.name.toLowerCase().includes(searchKey));
      return matchCat && matchSearch;
    });
  };

  const filtered = getFilteredList();

  // TÍNH TOÁN PHÂN TRANG
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const visibleList = filtered.slice(startIndex, startIndex + state.pageSize);

  const totalVal = filtered.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0);
  const reservedVal = filtered.reduce((s, m) => s + (m.reserved || 0) * (m.cost || 0), 0);
  const alertCount = filtered.filter(m => ['low', 'critical', 'out'].includes(m.status)).length;

  const categories = Array.from(new Set(materials.map(m => m.category)));
  const catBreakdown = categories.map(cat => {
    const items = materials.filter(m => m.category === cat);
    return { category: cat, count: items.length, value: items.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0) };
  }).sort((a, b) => b.value - a.value);
  const maxVal = catBreakdown[0]?.value || 1;

  const kpiHtml = [
    { label: 'Tổng số SKU', value: fmt(materials.length), sub: 'đang hoạt động' },
    { label: 'Giá trị tồn thực tế', value: fmtUSD(materials.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0)), sub: 'theo giá vốn' },
    { label: 'Giá trị đã giữ', value: fmtUSD(materials.reduce((s, m) => s + (m.reserved || 0) * (m.cost || 0), 0)), sub: 'cam kết đơn hàng' },
    { label: 'Sản phẩm cảnh báo', value: fmt(materials.filter(m => ['low', 'critical', 'out'].includes(m.status)).length), sub: 'dưới mức định mức' },
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 22px; font-weight: 300; margin-bottom: 4px;">${s.value}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${s.sub}</div>
    </div>
  `).join('');

  const catBreakdownHtml = catBreakdown.map(cat => `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-family: var(--font-dm-mono); font-size: 11px; width: 100px; color: var(--muted-foreground);">${cat.category}</span>
      <div style="flex: 1; height: 8px; background: var(--muted);"><div style="width: ${(cat.value / maxVal) * 100}%; height: 100%; background: var(--primary);"></div></div>
      <span style="font-family: var(--font-dm-mono); font-size: 11px; width: 90px; text-align: right;">${fmtUSD(cat.value)}</span>
    </div>
  `).join('');

  const alertsHtml = materials.filter(m => ['low', 'critical', 'out'].includes(m.status)).map(m => `
    <div style="padding: 8px 12px; border: 1px solid var(--border); background: var(--secondary);">
      <div style="font-size: 12px; font-weight: 500;">${m.name}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${m.id} · ${getActualStock(m)} / ${m.reorder ?? 0} đơn vị</div>
    </div>
  `).join('');

  const headersHtml = ['Mã Hàng (SKU)', 'Tên Hàng', 'ĐVT', 'Danh Mục', 'Vị Trí', 'Tồn Đầu Kỳ', 'Tồn Thực Tế', 'Tạm Giữ', 'Có Thể Bán', 'Mức Cảnh Báo', 'Giá Vốn', 'Trạng Thái']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Trạng Thái' ? 'right' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const renderRows = (list) => {
    return list.map(m => {
      const tonThucTe = getActualStock(m);
      const tonDauKy = m.stock ?? 0;
      const tamGiu = m.reserved ?? 0;
      const coTheBan = tonThucTe - tamGiu;

      return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', '${hasPermission ? 'edit' : 'view'}', '${m.id}')" onclick="navigate('materials', 'view', '${m.id}')">
        <td data-label="Mã Hàng (SKU)" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
        <td data-label="Tên Hàng" style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
        <td data-label="ĐVT" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
        <td data-label="Danh Mục" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
        <td data-label="Vị Trí" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
        <td data-label="Tồn Đầu Kỳ" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tonDauKy}</td>
        <td data-label="Tồn Thực Tế" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; font-weight: 600; color: var(--primary);">${tonThucTe}</td>
        <td data-label="Tạm Giữ" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tamGiu}</td>
        <td data-label="Có Thể Bán" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${coTheBan}</td>
        <td data-label="Mức Cảnh Báo" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${m.reorder ?? 0}</td>
        <td data-label="Giá Vốn" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
        <td data-label="Trạng Thái" style="padding: 11px 16px; text-align: right;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'Đủ hàng' : m.status}</span></td>
      </tr>
    `;
    }).join('');
  };

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px;" class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Giá Trị Tồn Kho Theo Danh Mục</div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${catBreakdownHtml}
          </div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 12px;">Cảnh Báo Hàng Tồn Kho</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${alertsHtml}
          </div>
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;" id="inventory-report-table-box">
        
        <div style="padding: 13px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <span style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Báo Cáo Tồn Kho Chi Tiết & Định Giá</span>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--secondary); padding: 0 10px; border-radius: 2px; width: 220px;">
              <span style="color: var(--muted-foreground);">${Icons.search}</span>
              <input type="text" id="report-inv-search-input" placeholder="Tìm mã, tên hàng..." value="${state.reportInvSearch}" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 12px; width: 100%; padding: 6px 0;">
            </div>

            <div style="display: flex; gap: 1px;">
              ${['all', ...categories].map(cat => `
                <button onclick="state.filter='${cat}'; state.page=1; render();" style="padding: 5px 12px; font-family: var(--font-dm-mono); font-size: 10px; text-transform: uppercase; background: ${state.filter === cat ? 'var(--primary)' : 'var(--muted)'}; color: ${state.filter === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer;">${cat === 'all' ? 'Tất cả' : cat}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="padding: 8px 20px 4px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); background: var(--secondary);">
          <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);" id="report-inv-summary-text">
            Đang hiển thị <strong>${totalItems === 0 ? 0 : startIndex + 1}-${Math.min(startIndex + state.pageSize, totalItems)}/${totalItems}</strong> mặt hàng · Tổng giá trị: <strong style="color: var(--primary);">${fmtUSD(totalVal)}</strong> · Đã tạm giữ: ${fmtUSD(reservedVal)} · Cảnh báo: ${alertCount}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${headersHtml}
            </tr>
          </thead>
          <tbody id="report-inv-tbody">
            ${renderRows(visibleList)}
          </tbody>
        </table>

        <div id="report-inv-empty-msg" style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px; display: ${filtered.length === 0 ? 'block' : 'none'};">
          Không tìm thấy dữ liệu mặt hàng phù hợp
        </div>

      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>
    </div>
  `;

  // Xử lý ô Tìm kiếm
  const searchInput = document.getElementById('report-inv-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.reportInvSearch = e.target.value;
      state.page = 1;
      render();
    });
  }
}

function renderReportSales(c) {
  const {
    salesDataReal,
    ytdRevenue,
    ytdOrders
  } = getSalesAnalyticsData();

  const totalReturnsCount = (db.returns || []).filter(r => ['processed', 'approved', 'đã xử lý', 'đã duyệt'].includes((r.status || '').toLowerCase())).length;
  const returnRatePercent = ytdOrders > 0 ? ((totalReturnsCount / ytdOrders) * 100).toFixed(1) : '0.0';
  const avgOrderValue = ytdOrders > 0 ? (ytdRevenue / ytdOrders) : 0;

  // State lọc Tháng & Khách hàng
  if (!state.reportSalesMonth) {
    state.reportSalesMonth = String(new Date().getMonth() + 1);
  }
  if (state.reportSalesCustomer === undefined) {
    state.reportSalesCustomer = '';
  }

  const currentYear = new Date().getFullYear();
  const selectedMonthNum = parseInt(state.reportSalesMonth, 10) || (new Date().getMonth() + 1);
  const selectedCustomer = state.reportSalesCustomer;

  // Lọc dữ liệu đơn hàng theo tháng
  const filteredOrdersForMonth = (db.orders || []).filter(o => {
    const status = (o.status || '').toLowerCase();
    if (!['completed', 'processing', 'hoàn thành', 'đang xử lý'].includes(status)) return false;
    if (!o.date) return false;
    const parts = o.date.split('-');
    if (parts.length >= 2) {
      const oYear = parseInt(parts[0], 10);
      const oMonth = parseInt(parts[1], 10);
      return oYear === currentYear && oMonth === selectedMonthNum;
    }
    return false;
  });

  // Top khách hàng trong tháng
  const customerMap = {};
  filteredOrdersForMonth.forEach(o => {
    const cName = o.customer || 'Khách lẻ';
    if (!customerMap[cName]) customerMap[cName] = { name: cName, revenue: 0, orders: 0 };
    customerMap[cName].revenue += Number(o.total || 0);
    customerMap[cName].orders += 1;
  });
  const topCustomersReal = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue);

  // Tổng hợp mã hàng theo khách hàng
  const itemSummaryMap = {};
  filteredOrdersForMonth.forEach(o => {
    if (!selectedCustomer || (o.customer && o.customer.trim().toLowerCase() === selectedCustomer.trim().toLowerCase())) {
      const items = Array.isArray(o.lineItems || o.lineitems) ? (o.lineItems || o.lineitems) : [];
      items.forEach(item => {
        const sku = item.sku || '—';
        const name = item.name || '—';
        const qty = Number(item.qty || 0);
        const price = Number(item.unitPrice || 0);
        const disc = Number(item.discount || 0);
        const tax = Number(item.tax || 0);
        const lineSub = qty * price * (1 - disc / 100);
        const lineTotal = lineSub * (1 + tax / 100);

        if (!itemSummaryMap[sku]) {
          itemSummaryMap[sku] = { sku, name, qty: 0, totalAmount: 0 };
        }
        itemSummaryMap[sku].qty += qty;
        itemSummaryMap[sku].totalAmount += lineTotal;
      });
    }
  });

  const detailItemsList = Object.values(itemSummaryMap).sort((a, b) => b.totalAmount - a.totalAmount);

  // TÍNH TOÁN PHÂN TRANG CHO BẢNG THỐNG KÊ CHI TIẾT SẢN PHẨM BÁN
  const totalItems = detailItemsList.length;
  const totalPages = Math.ceil(totalItems / state.pageSize) || 1;
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const paginatedDetailItems = detailItemsList.slice(startIndex, startIndex + state.pageSize);

  const customersHtml = topCustomersReal.slice(0, 5).map((cus, i) => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td data-label="" style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); width: 28px;">${String(i + 1).padStart(2, '0')}</td>
      <td data-label="" style="padding: 9px 14px; font-size: 13px;">${cus.name}</td>
      <td data-label="" style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(cus.revenue)}</td>
      <td data-label="" style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 11px; text-align: right; color: var(--muted-foreground);">${cus.orders} đơn</td>
    </tr>
  `).join('');

  const detailHeaders = ['Mã Hàng (SKU)', 'Tên Hàng Hóa', 'Tổng Số Lượng', 'Tổng Số Tiền']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Tổng Số Lượng' || h === 'Tổng Số Tiền' ? 'right' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const detailRows = paginatedDetailItems.map(item => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td data-label="Mã Hàng (SKU)" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${item.sku}</td>
      <td data-label="Tên Hàng Hóa" style="padding: 11px 16px; font-size: 13px; font-weight: 500;">${item.name}</td>
      <td data-label="Tổng Số Lượng" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmt(item.qty)}</td>
      <td data-label="Tổng Số Tiền" style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right; color: var(--primary);">${fmtUSD(item.totalAmount)}</td>
    </tr>
  `).join('');

  const customerSelectOptions = (db.customers || []).map(cust => `
    <option value="${cust.name}" ${selectedCustomer === cust.name ? 'selected' : ''}>${cust.name}</option>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- KPI CARDS -->
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        <div class="kpi-card"><span class="kpi-label">Doanh Thu Lũy Kế Năm</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(ytdRevenue)}</span></div><span class="kpi-sub">Năm ${currentYear}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tổng Đơn Bán</span><div class="kpi-value-row"><span class="kpi-value">${fmt(ytdOrders)}</span></div><span class="kpi-sub">Năm ${currentYear}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tỷ Lệ Trả Hàng</span><div class="kpi-value-row"><span class="kpi-value">${returnRatePercent}%</span></div><span class="kpi-sub">theo số lượt đổi trả</span></div>
        <div class="kpi-card"><span class="kpi-label">Giá Trị Đơn Trung Bình</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(avgOrderValue)}</span></div><span class="kpi-sub">AOV năm ${currentYear}</span></div>
      </div>

      <!-- BIỂU ĐỒ DOANH SỐ & TOP KHÁCH HÀNG -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;" class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Biểu Đồ Doanh Thu & Sản Lượng Đơn Bán</div>
          <div style="height: 220px;"><canvas id="chart-sales"></canvas></div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Top Khách Hàng (Tháng ${selectedMonthNum})</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${customersHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--muted-foreground); font-size: 12px;">Chưa có dữ liệu khách hàng</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BẢNG THỐNG KÊ CHI TIẾT THEO KHÁCH HÀNG -->
      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <div style="padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--foreground);">
              Thống Kê Chi Tiết Theo Khách Hàng ${selectedCustomer ? `(${selectedCustomer})` : ''} - Tháng ${selectedMonthNum}/${currentYear}
            </span>
            <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--primary);">
              Tổng số mặt hàng: ${detailItemsList.length}
            </span>
          </div>

          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <label style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase;">Tháng:</label>
              <select class="form-select" style="width: 110px; padding: 5px 8px; font-size: 12px;" onchange="state.reportSalesMonth=this.value; state.page=1; render();">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${selectedMonthNum === (i + 1) ? 'selected' : ''}>Tháng ${i + 1}</option>`).join('')}
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <label style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase;">Khách hàng:</label>
              <select class="form-select" style="width: 200px; padding: 5px 8px; font-size: 12px;" onchange="state.reportSalesCustomer=this.value; state.page=1; render();">
                <option value="">-- Tất cả khách hàng --</option>
                ${customerSelectOptions}
              </select>
            </div>
          </div>

        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${detailHeaders}
            </tr>
          </thead>
          <tbody>
            ${detailRows}
          </tbody>
        </table>
        ${detailItemsList.length === 0 ? `<div style="padding: 40px; text-align: center; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 12px;">Không có dữ liệu đơn hàng trong tháng đã chọn</div>` : ''}
      </div>

      <!-- THANH ĐIỀU HƯỚNG PHÂN TRANG -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--card); border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
        <span style="font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
          Hiển thị ${totalItems === 0 ? 0 : startIndex + 1} - ${Math.min(startIndex + state.pageSize, totalItems)} / Tổng ${totalItems} mục
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page--; render();">❮ Trước</button>
          <span style="font-family: var(--font-dm-mono); font-size: 11px; padding: 0 8px; color: var(--foreground);">Trang ${state.page} / ${totalPages}</span>
          <button ${state.page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} class="btn-action" onclick="state.page++; render();">Sau ❯</button>
        </div>
      </div>

    </div>
  `;

  new Chart(document.getElementById('chart-sales').getContext('2d'), {
    type: 'line',
    data: {
      labels: salesDataReal.map(d => d.month),
      datasets: [
        { yAxisID: 'yRev', label: 'Doanh thu', data: salesDataReal.map(d => d.revenue), borderColor: '#f0a030', tension: 0.3 },
        { yAxisID: 'yOrd', label: 'Đơn hàng', data: salesDataReal.map(d => d.orders), borderColor: '#60a5fa', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        yRev: { position: 'left', grid: { color: '#252a33' } },
        yOrd: { position: 'right', grid: { drawOnChartArea: false } },
        x: { grid: { color: '#252a33' } }
      }
    }
  });
}

function renderTableSkeleton(columnsCount = 8, rowsCount = 5) {
  const headers = Array.from({ length: columnsCount }).map(() =>
    `<th style="padding: 11px 16px;"><div class="skeleton-box skeleton-row" style="width: 70%;"></div></th>`
  ).join('');

  const rows = Array.from({ length: rowsCount }).map(() => `
    <tr style="border-bottom: 1px solid var(--border);">
      ${Array.from({ length: columnsCount }).map(() => `
        <td style="padding: 11px 16px;"><div class="skeleton-box skeleton-row"></div></td>
      `).join('')}
    </tr>
  `).join('');

  return `
    <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead><tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}