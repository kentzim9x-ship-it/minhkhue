// ==========================================
// 1. CẤU HÌNH, STATE & GIAO DIỆN CƠ BẢN
// ==========================================

const BASE_PATH = '/minhkhue'; // Đường dẫn gốc trên GitHub Pages

// STATE MANAGEMENT
let state = {
  view: 'dashboard',
  mode: 'list',
  filter: 'all',
  search: '',
  formData: null
};

const viewMeta = {
  dashboard: { tag: 'TỔNG QUAN', title: 'Tổng Quan' },
  materials: { tag: 'DỮ LIỆU DANH MỤC', title: 'Danh Mục Hàng Hóa' },
  customers: { tag: 'DỮ LIỆU DANH MỤC', title: 'Danh Sách Khách Hàng' },
  warehouses: { tag: 'DỮ LIỆU DANH MỤC', title: 'Danh Sách Kho Hàng' },
  quotations: { tag: 'GIAO DỊCH', title: 'Bảng Báo Giá' },
  'sales-orders': { tag: 'GIAO DỊCH', title: 'Đơn Bán Hàng' },
  returns: { tag: 'GIAO DỊCH', title: 'Đổi Trả Hàng Bán' },
  grn: { tag: 'GIAO DỊCH', title: 'Phiếu Nhập Kho' },
  'report-inventory': { tag: 'BÁO CÁO', title: 'Báo Cáo Tồn Kho' },
  'report-sales': { tag: 'BÁO CÁO', title: 'Báo Cáo Bán Hàng' },
};

const Icons = {
  home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  view: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="3"/><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z"/></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" /></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8" /></svg>`,
  plus: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="2"><line x1="6.5" y1="1" x2="6.5" y2="12" /><line x1="1" y1="6.5" x2="12" y2="6.5" /></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2L4 7l5 5" /></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5" /><line x1="10" y1="10" x2="14" y2="14" /></svg>`
};

// Tạo lớp Overlay để bấm ra ngoài đóng Menu
const overlayEl = document.createElement('div');
overlayEl.className = 'mobile-overlay';
overlayEl.onclick = toggleMobileMenu;
document.body.appendChild(overlayEl);

function toggleMobileMenu() {
  document.body.classList.toggle('mobile-menu-open');
  overlayEl.classList.toggle('active');
}

// ==========================================
// 2. KẾT NỐI DB SUPABASE & REALTIME STOCK
// ==========================================

// Supabase Client Initialization
const SUPABASE_URL = 'https://gzmczqeczlrujhzleaoa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oBZ4Z1bekEMIjq_wmPFsyg_V68Y3dWE';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bổ sung users vào db toàn cục
let db = {
  materials: [],
  customers: [],
  warehouses: [],
  quotations: [],
  orders: [],
  returns: [],
  grns: [],
  users: [] // <--- Thêm mảng users
};

async function fetchDataFromSupabase() {
  try {
    const [custRes, matRes, whRes, invRes, quoRes, ordRes, retRes, grnRes, userRes] = await Promise.all([
      supabaseClient.from('customers').select('*'),
      supabaseClient.from('materials').select('*'),
      supabaseClient.from('warehouses').select('*'),
      supabaseClient.from('inventory').select('*'),
      supabaseClient.from('quotations').select('*'),
      supabaseClient.from('orders').select('*'),
      supabaseClient.from('returns').select('*'),
      supabaseClient.from('grns').select('*'),
      supabaseClient.from('userinfo').select('*') // <--- Lấy bảng userinfo
    ]);

    db.customers = custRes.data || [];
    db.materials = matRes.data || [];
    db.warehouses = whRes.data || [];
    db.inventory = invRes.data || [];
    db.users = userRes.data || [];

    db.quotations = (quoRes.data || []).map(q => ({
      ...q,
      date: q.date ? String(q.date).split('T')[0] : '',
      validbegin: (q.validbegin || q.validBegin) ? String(q.validbegin || q.validBegin).split('T')[0] : '',
      validUntil: (q.validUntil || q.validuntil) ? String(q.validUntil || q.validuntil).split('T')[0] : '',
      lineItems: Array.isArray(q.lineItems || q.lineitems) ? (q.lineItems || q.lineitems) : []
    })).sort(sortDescById);

    db.orders = (ordRes.data || []).map(o => ({
      ...o,
      date: o.date ? String(o.date).split('T')[0] : '',
      quotationId: o.quotation_id || o.quotationId || o.quotationid || null,
      warehouseCode: o.warehouse_code || o.warehouseCode || o.warehouse || '',
      lineItems: Array.isArray(o.lineItems || o.lineitems) ? (o.lineItems || o.lineitems) : []
    })).sort(sortDescById);

    db.returns = (retRes.data || []).map(r => ({
      ...r,
      date: r.date ? String(r.date).split('T')[0] : '',
      warehouseCode: r.warehouse_code || r.warehouseCode || '',
      orderId: r.order_id || r.orderId || '',
      notes: r.notes || '',
      lineItems: Array.isArray(r.lineItems || r.lineitems) ? (r.lineItems || r.lineitems) : []
    })).sort(sortDescById);

    db.grns = (grnRes.data || []).map(g => {
      let parsedItems = [];
      try {
        if (Array.isArray(g.lineitems || g.lineItems)) {
          parsedItems = g.lineitems || g.lineItems;
        } else if (typeof (g.lineitems || g.lineItems) === 'string') {
          parsedItems = JSON.parse(g.lineitems || g.lineItems);
        }
      } catch (e) {
        parsedItems = [];
      }

      return {
        ...g,
        supplier: g.supplier || '',
        warehouseCode: g.warehousecode || g.warehouseCode || '',
        warehousecode: g.warehousecode || g.warehouseCode || '',
        date: g.date ? String(g.date).split('T')[0] : '',
        status: g.status || 'Đã nhận',
        notes: g.notes || '',
        totalValue: g.totalvalue ?? g.totalValue ?? 0,
        totalvalue: g.totalvalue ?? g.totalValue ?? 0,
        lineItems: parsedItems,
        lineitems: parsedItems
      };
    }).sort(sortDescById);

  } catch (err) {
    console.error('Lỗi khi tải dữ liệu từ Supabase:', err);
  }
}

function syncRealtimeStockToSupabase(sku, warehouseCode, realStock) {
  if (!sku || !warehouseCode) return;
  setTimeout(async () => {
    try {
      const invIndex = (db.inventory || []).findIndex(i =>
        (i.sku === sku || i.material_id === sku) &&
        (i.warehouse_code === warehouseCode || i.warehouse_id === warehouseCode || i.warehouseCode === warehouseCode)
      );

      if (invIndex !== -1) {
        db.inventory[invIndex].ton_thuc_te = realStock;
        await supabaseClient
          .from('inventory')
          .update({ ton_thuc_te: realStock })
          .eq('id', db.inventory[invIndex].id);
      } else {
        const newRecord = {
          sku: sku,
          warehouse_code: warehouseCode,
          ton_thuc_te: realStock,
          stock: 0
        };
        const { data, error } = await supabaseClient.from('inventory').insert([newRecord]).select();
        if (!error && data && data.length > 0) {
          db.inventory.push(data[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật ton_thuc_te:', err);
    }
  }, 0);
}

function calculateRealtimeStock(sku, warehouseCode, currentDocId = null) {
  if (!sku) return 0;

  let initialStock = 0;
  if (warehouseCode && db.inventory && db.inventory.length > 0) {
    const inv = db.inventory.find(i =>
      (i.sku === sku || i.material_id === sku) &&
      (i.warehouse_code === warehouseCode || i.warehouse_id === warehouseCode || i.warehouseCode === warehouseCode)
    );
    if (inv) {
      initialStock = Number(inv.stock ?? inv.qty ?? inv.quantity ?? 0);
    }
  } else {
    const mat = db.materials.find(m => m.id === sku);
    if (mat) initialStock = Number(mat.stock || 0);
  }

  let totalGRN = 0;
  (db.grns || []).forEach(g => {
    if (currentDocId && String(g.id) === String(currentDocId)) return;
    const status = (g.status || '').toLowerCase();
    const gWh = g.warehouseCode || g.warehousecode || g.warehouse_code || '';

    if (gWh === warehouseCode && ['verified', 'received', 'đã nhận', 'đã xác minh'].includes(status)) {
      (g.lineItems || g.lineitems || []).forEach(item => {
        if (item.sku === sku) {
          totalGRN += Number(item.receivedQty || item.qtyImport || item.qty || 0);
        }
      });
    }
  });

  let totalOrders = 0;
  (db.orders || []).forEach(o => {
    if (currentDocId && String(o.id) === String(currentDocId)) return;
    const status = (o.status || '').toLowerCase();
    const oWh = o.warehouseCode || o.warehousecode || o.warehouse_code || '';

    if (oWh === warehouseCode && ['processing', 'completed', 'đang xử lý', 'hoàn thành'].includes(status)) {
      (o.lineItems || o.lineitems || []).forEach(item => {
        if (item.sku === sku) {
          totalOrders += Number(item.qty || 0);
        }
      });
    }
  });

  let totalReturns = 0;
  (db.returns || []).forEach(r => {
    if (currentDocId && String(r.id) === String(currentDocId)) return;
    const status = (r.status || '').toLowerCase();
    const rWh = r.warehouseCode || r.warehousecode || r.warehouse_code || '';

    if (rWh === warehouseCode && ['approved', 'processed', 'đã duyệt', 'đã xử lý'].includes(status)) {
      (r.lineItems || r.lineitems || []).forEach(item => {
        if (item.sku === sku) {
          totalReturns += Number(item.qtyReturned || item.qty || 0);
        }
      });
    }
  });

  const realtimeStock = Number((initialStock + totalGRN - totalOrders - totalReturns).toFixed(2));

  if (warehouseCode) {
    syncRealtimeStockToSupabase(sku, warehouseCode, realtimeStock);
  }

  return realtimeStock;
}

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

      // XỬ LÝ GHI NHỚ ĐĂNG NHẬP:
      if (remember) {
        localStorage.setItem('remembered_user', JSON.stringify({ username: un, password: pw, remember: true }));
      } else {
        // Bỏ tích -> Xóa sạch dữ liệu đã lưu
        localStorage.removeItem('remembered_user');
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
      userNameEl.title = user.fullname || user.username; // Tooltip khi đè chuột
    }

    if (userRoleEl) {
      userRoleEl.innerText = user.role || 'USER';
    }

    if (sidebarUserEl) {
      // Đảm bảo cấu trúc các thẻ lồng nhau gọn gàng
      let infoTextContainer = sidebarUserEl.querySelector('.user-info-text');
      if (!infoTextContainer && userNameEl && userRoleEl) {
        infoTextContainer = document.createElement('div');
        infoTextContainer.className = 'user-info-text';
        sidebarUserEl.insertBefore(infoTextContainer, userRoleEl.parentNode === sidebarUserEl ? userRoleEl : null);
        infoTextContainer.appendChild(userNameEl);
        infoTextContainer.appendChild(userRoleEl);
      }

      // Khởi tạo nút Đăng xuất
      if (!document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.innerText = 'Đăng xuất';
        logoutBtn.onclick = handleLogout;
        sidebarUserEl.appendChild(logoutBtn);
      }
    }
  }

  // Thêm nút Home cho Header trên Mobile
  const headerLeft = document.querySelector('.app-header > div:first-child') || document.querySelector('.app-header');
  if (headerLeft && !document.getElementById('mobile-home-trigger')) {
    const homeBtn = document.createElement('button');
    homeBtn.id = 'mobile-home-trigger';
    homeBtn.className = 'header-icon-btn mobile-home-btn';
    homeBtn.innerHTML = Icons.home;
    homeBtn.onclick = toggleMobileMenu;
    headerLeft.insertBefore(homeBtn, headerLeft.firstChild);
  }

  // Gán sự kiện đóng Mobile Drawer khi bấm Logo/Header
  const logoBrand = document.querySelector('.logo-brand, .app-brand, .sidebar-header');
  if (logoBrand) {
    logoBrand.style.cursor = 'pointer';
    logoBrand.onclick = () => {
      if (window.innerWidth <= 768 && document.body.classList.contains('mobile-menu-open')) {
        toggleMobileMenu();
      }
    };
  }
}

// ==========================================
// 4. TIỆN ÍCH (HELPERS) & FORMATTER
// ==========================================

function sortDescById(a, b) {
  return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
}

// Hàm chuyển đổi từ user_id sang fullname
function getUserFullName(userId) {
  if (!userId) return '—';
  const user = (db.users || []).find(u => String(u.id) === String(userId) || String(u.username) === String(userId));
  return user ? (user.fullname || user.username || userId) : userId;
}

// Hàm hỗ trợ định dạng ngày VN (DD/MM/YYYY) nếu ngày lưu dạng YYYY-MM-DD
function fmtDateStr(dateStr) {
  if (!dateStr) return '—';
  if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

// Hàm hỗ trợ cắt bỏ giây nếu cần (HH:mm:ss -> HH:mm)
function fmtTimeStr(timeStr) {
  if (!timeStr) return '—';
  return String(timeStr).substring(0, 5);
}

function getBadgeClass(status) {
  const s = String(status || '').toLowerCase().trim();
  const map = {
    'completed': 'badge-emerald', 'hoàn thành': 'badge-emerald', 'approved': 'badge-emerald', 'đã duyệt': 'badge-emerald',
    'processed': 'badge-emerald', 'đã xử lý': 'badge-emerald', 'accepted': 'badge-emerald', 'đã chấp nhận': 'badge-emerald',
    'verified': 'badge-emerald', 'đã xác minh': 'badge-emerald', 'active': 'badge-emerald', 'hoạt động': 'badge-emerald',
    'ok': 'badge-emerald', 'đủ hàng': 'badge-emerald', 'processing': 'badge-amber', 'đang xử lý': 'badge-amber',
    'received': 'badge-amber', 'đã nhận': 'badge-amber', 'maintenance': 'badge-amber', 'bảo trì': 'badge-amber',
    'low': 'badge-amber', 'sắp hết': 'badge-amber', 'shipped': 'badge-blue', 'delivered': 'badge-blue',
    'pending': 'badge-zinc', 'chờ xử lý': 'badge-zinc', 'chờ duyệt': 'badge-zinc', 'draft': 'badge-zinc',
    'bản nháp': 'badge-zinc', 'inactive': 'badge-zinc', 'ngừng hoạt động': 'badge-zinc', 'expired': 'badge-red',
    'hết hạn': 'badge-red', 'cancelled': 'badge-red', 'đã hủy': 'badge-red', 'rejected': 'badge-red',
    'từ chối': 'badge-red', 'suspended': 'badge-red', 'tạm khóa': 'badge-red', 'closed': 'badge-red',
    'đóng cửa': 'badge-red', 'critical': 'badge-red', 'out': 'badge-red', 'hết hàng': 'badge-red'
  };
  return map[s] || 'badge-zinc';
}

function getStatusLabel(status) {
  const s = String(status || '').toLowerCase().trim();
  const map = {
    'approved': 'Đã duyệt', 'processed': 'Đã xử lý', 'processing': 'Đang xử lý', 'completed': 'Hoàn thành',
    'pending': 'Chờ xử lý', 'accepted': 'Đã chấp nhận', 'draft': 'Bản nháp', 'expired': 'Hết hạn',
    'verified': 'Đã xác minh', 'received': 'Đã nhận', 'active': 'Hoạt động', 'inactive': 'Ngừng hoạt động',
    'suspended': 'Tạm khóa', 'maintenance': 'Bảo trì', 'closed': 'Đóng cửa', 'cancelled': 'Đã hủy',
    'rejected': 'Từ chối', 'ok': 'Đủ hàng', 'low': 'Sắp hết', 'critical': 'Nguy cấp', 'out': 'Hết hàng'
  };
  return map[s] || (status ? String(status).toUpperCase() : '—');
}

function getWarehouseStatusLabel(status) {
  const map = { 'active': 'HOẠT ĐỘNG', 'maintenance': 'BẢO TRÌ', 'closed': 'ĐÓNG CỬA' };
  return map[status?.toLowerCase()] || (status ? status.toUpperCase() : 'HOẠT ĐỘNG');
}

function getBreadcrumb(backLabel, current, module) {
  return `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
      <button onclick="navigate('${module}', 'list')" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); font-family: var(--font-dm-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 0; display: flex; align-items: center; gap: 6px;">
        ${Icons.back}${backLabel}
      </button>
      <span style="color: var(--border); font-family: var(--font-dm-mono); font-size: 11px;">/</span>
      <span style="font-family: var(--font-dm-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--foreground);">${current}</span>
    </div>
  `;
}

function getFilterBar(options) {
  const buttonsHtml = options.map(([val, label]) => `
    <button onclick="state.filter='${val}'; render();" style="padding: 6px 14px; font-family: var(--font-dm-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; background: ${state.filter === val ? 'var(--primary)' : 'transparent'}; color: ${state.filter === val ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer; transition: all 0.15s;">${label}</button>
  `).join('');

  return `
    <div style="display: flex; gap: 1px; background: var(--muted); width: fit-content; max-width: 100%; overflow-x: auto;">
      ${buttonsHtml}
    </div>
  `;
}

function generateAutoId(module) {
  const collection = db[module === 'sales-orders' ? 'orders' : module] || [];

  if (module === 'materials') {
    const maxNum = collection.reduce((m, x) => {
      const match = (x.id || '').match(/SKU-(\d+)/i);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `SKU-${String(maxNum + 1).padStart(4, '0')}`;
  }

  if (module === 'customers') {
    const maxNum = collection.reduce((m, x) => {
      const match = (x.id || '').match(/CUS-(\d+)/i);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `CUS-${String(maxNum + 1).padStart(4, '0')}`;
  }

  if (module === 'warehouses') {
    const maxNum = collection.reduce((m, x) => {
      const match = ((x.code || x.id) || '').match(/(?:WH|KHO)-(\d+)/i);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `WH-${String(maxNum + 1).padStart(2, '0')}`;
  }

  if (module === 'quotations') {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `BBG-${yy}${mm}`;

    const maxNum = collection.reduce((m, x) => {
      if (!x.id) return m;
      const regex = new RegExp(`^${prefix}-(\\d+)`, 'i');
      const match = x.id.match(regex);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);

    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }

  if (module === 'sales-orders') {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `DHB-${yy}${mm}`;

    const maxNum = collection.reduce((m, x) => {
      if (!x.id) return m;
      const regex = new RegExp(`^${prefix}-(\\d+)`, 'i');
      const match = x.id.match(regex);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);

    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }

  if (module === 'returns') {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `DTHB-${yy}${mm}`;

    const maxNum = collection.reduce((m, x) => {
      if (!x.id) return m;
      const regex = new RegExp(`^${prefix}-(\\d+)`, 'i');
      const match = x.id.match(regex);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);

    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }

  if (module === 'grn') {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PNK-${yy}${mm}`;

    const list = Array.isArray(db.grns) ? db.grns : [];

    const maxNum = list.reduce((m, x) => {
      const currentId = String(x.id || '');
      const regex = new RegExp(`^${prefix}-?(\\d+)`, 'i');
      const match = currentId.match(regex);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);

    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }
}

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const firstDay = `${year}-${month}-01`;
  const lastDayNum = new Date(year, now.getMonth() + 1, 0).getDate();
  const lastDay = `${year}-${month}-${String(lastDayNum).padStart(2, '0')}`;

  return { firstDay, lastDay };
}

function parseDateParts(dateStr) {
  let dayStr = '02', monthStr = '10', yearStr = '2026';
  if (dateStr) {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        yearStr = parts[0];
        monthStr = parts[1];
        dayStr = parts[2];
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        dayStr = parts[0].padStart(2, '0');
        monthStr = parts[1].padStart(2, '0');
        yearStr = parts[2];
      }
    }
  } else {
    const today = new Date();
    dayStr = String(today.getDate()).padStart(2, '0');
    monthStr = String(today.getMonth() + 1).padStart(2, '0');
    yearStr = String(today.getFullYear());
  }
  return { dayStr, monthStr, yearStr };
}

function getCustomerAddress(customerNameOrId) {
  if (!customerNameOrId) return '—';
  const cust = (db.customers || []).find(c =>
    (c.name && c.name.trim().toLowerCase() === customerNameOrId.trim().toLowerCase()) ||
    (c.id && c.id.trim().toLowerCase() === customerNameOrId.trim().toLowerCase())
  );
  return cust ? (cust.address || cust.diachi || '—') : '—';
}

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonthStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function getCurrentTimeStr() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

function parseNumberInput(val) {
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).trim();
  const cleanStr = str.replace(/[^0-9-]/g, '');
  return cleanStr ? Number(cleanStr) : 0;
}

function formatVNDInput(val) {
  const num = parseNumberInput(val);
  return num ? num.toLocaleString('vi-VN') : '0';
}

function fmt(n) { return new Intl.NumberFormat('en-US').format(n); }

function fmtUSD(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
}

function updateHeaderDate() {
  const dateElement = document.getElementById('header-date');
  if (!dateElement) return;

  const now = new Date();
  const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('vi-VN', options);

  dateElement.innerText = formattedDate;
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(^|\s)\S/g, function (firstLetter) {
    return firstLetter.toUpperCase();
  });
}

function toUpperCaseStr(str) {
  if (!str) return '';
  return str.toUpperCase();
}

// ==========================================
// 5. ĐIỀU HƯỚNG & ROUTING (NAVIGATION)
// ==========================================

function navigate(view, mode = 'list', itemId = null) {
  if ((mode === 'add' || mode === 'edit') && !checkModulePermission(view)) {
    showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép thực hiện thao tác này!', 'Cảnh báo quyền');
    mode = 'list';
  }

  state.view = view;
  state.mode = mode;
  state.filter = 'all';
  state.search = '';

  const meta = viewMeta[view] || { tag: 'HỆ THỐNG', title: 'NEXSTOCK' };
  const tagEl = document.getElementById('view-tag');
  const titleEl = document.getElementById('view-title');

  if (tagEl) tagEl.innerText = meta.tag;
  if (titleEl) titleEl.innerText = mode === 'list' ? meta.title : (mode === 'add' ? `Thêm ${meta.title} Mới` : (mode === 'view' ? `Xem ${meta.title}` : `Chỉnh Sửa Mục`));

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === view);
  });

  if (mode !== 'list') initFormData(view, itemId);

  // Tạo URL dạng /minhkhue/view/mode/id
  let targetPath = `${BASE_PATH}/${view}`;
  if (mode === 'add') targetPath += '/add';
  if (mode === 'edit' && itemId) targetPath += `/edit/${itemId}`;
  if (mode === 'view' && itemId) targetPath += `/view/${itemId}`;

  if (document.body.classList.contains('mobile-menu-open')) {
    toggleMobileMenu();
  }

  if (window.location.pathname !== targetPath) {
    window.history.pushState({ view, mode, itemId }, '', targetPath);
  }

  render();

  window.scrollTo({ top: 0, behavior: 'instant' });
  const contentBox = document.getElementById('app-content');
  if (contentBox) contentBox.scrollTop = 0;
}

function handleRouteChange() {
  let pathname = window.location.pathname;
  if (pathname.startsWith(BASE_PATH)) {
    pathname = pathname.substring(BASE_PATH.length);
  }
  pathname = pathname.replace(/^\/+|\/+$/g, '');

  // Nếu URL là /minhkhue/login hoặc trống
  if (pathname === 'login') {
    localStorage.removeItem('app_session'); // Mặc định đăng xuất khi truy cập URL /login
    render();
    return;
  }

  if (!pathname) {
    navigate('dashboard', 'list');
    return;
  }

  const parts = pathname.split('/');
  const view = parts[0];
  let mode = parts[1] || 'list';
  const itemId = parts[2] || null;

  if (viewMeta[view]) {
    if ((mode === 'add' || mode === 'edit') && !checkModulePermission(view)) {
      showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép thực hiện thao tác này!', 'Cảnh báo quyền');
      mode = 'list';
    }

    state.view = view;
    state.mode = mode;
    state.filter = 'all';
    state.search = '';

    const meta = viewMeta[view];
    const tagEl = document.getElementById('view-tag');
    const titleEl = document.getElementById('view-title');

    if (tagEl) tagEl.innerText = meta.tag;
    if (titleEl) titleEl.innerText = mode === 'list' ? meta.title : (mode === 'add' ? `Thêm ${meta.title} Mới` : (mode === 'view' ? `Xem ${meta.title}` : `Chỉnh Sửa Mục`));

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    if (mode !== 'list') {
      initFormData(view, itemId);
    }

    render();

    window.scrollTo({ top: 0, behavior: 'instant' });
    const contentBox = document.getElementById('app-content');
    if (contentBox) contentBox.scrollTop = 0;
  } else {
    navigate('dashboard', 'list');
  }
}

window.addEventListener('popstate', handleRouteChange);

// ==========================================
// 6. XỬ LÝ DỮ LIỆU & FORM (DATA HANDLERS)
// ==========================================

function updateField(field, value, type = 'text') {
  if (!state.formData) return;
  state.formData[field] = (type === 'number') ? Number(value) : value;

  if (field === 'warehouseCode' && Array.isArray(state.formData.lineItems)) {
    state.formData.lineItems.forEach(line => {
      line.warehouseCode = value;
    });
    render();
  }
}

function updateLine(lineId, field, value, type = 'text') {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  const line = state.formData.lineItems.find(l => l.lineId === lineId);
  if (!line) return;

  line[field] = (type === 'number') ? Number(value) : value;

  let subtotal = 0, discountTotal = 0, taxTotal = 0, total = 0;

  state.formData.lineItems.forEach(l => {
    let lineTotal = 0;

    if (state.view === 'quotations' || state.view === 'sales-orders') {
      const qty = Number(l.qty) || 0;
      const price = Number(l.unitPrice) || 0;
      const disc = Number(l.discount) || 0;
      const tax = Number(l.tax) || 0;
      const lineSub = qty * price * (1 - disc / 100);
      lineTotal = lineSub * (1 + tax / 100);

      subtotal += qty * price;
      discountTotal += qty * price * (disc / 100);
      taxTotal += lineSub * (tax / 100);
    } else if (state.view === 'returns') {
      const qty = Number(l.qtyReturned) || 0;
      const price = Number(l.unitPrice) || 0;
      lineTotal = qty * price;
      total += lineTotal;
    } else if (state.view === 'grn') {
      const qty = Number(l.receivedQty ?? l.qtyImport ?? 1) || 0;
      const price = Number(l.unitCost) || 0;
      lineTotal = qty * price;
      total += lineTotal;
    }

    // Cập nhật text "Thành Tiền" ở từng dòng đang nhập
    const skuInput = document.getElementById(`line-item-${l.lineId}-sku`);
    if (skuInput && skuInput.parentElement) {
      const divs = skuInput.parentElement.querySelectorAll('div');
      if (divs.length > 0) divs[0].innerText = fmtUSD(lineTotal);
    }
  });

  if (state.view === 'quotations' || state.view === 'sales-orders') {
    total = subtotal - discountTotal + taxTotal;
    state.formData.subtotal = subtotal; state.formData.discountTotal = discountTotal; state.formData.tax = taxTotal; state.formData.total = total;
  } else if (state.view === 'returns') {
    state.formData.total = total;
  } else if (state.view === 'grn') {
    state.formData.totalValue = total;
  }

  // CẬP NHẬT KHUNG TỔNG TIỀN (BẮT CHUẨN 100%)
  const summaryDivs = document.querySelectorAll('div[style*="justify-content: space-between"]');
  summaryDivs.forEach(div => {
    const spans = div.querySelectorAll('span');
    if (spans.length >= 2) {
      const lbl = spans[0].innerText.trim().toLowerCase(); // Đưa về chữ thường để so sánh
      const valSpan = spans[spans.length - 1]; // Lấy giá trị ở cuối

      if (lbl === 'tạm tính') valSpan.innerText = fmtUSD(subtotal);
      else if (lbl === 'chiết khấu') valSpan.innerText = '-' + fmtUSD(discountTotal);
      else if (lbl === 'tổng thuế') valSpan.innerText = fmtUSD(taxTotal);
      else if (lbl === 'tổng cộng' || lbl === 'tổng hoàn tiền' || lbl === 'tổng giá trị') {
        valSpan.innerText = fmtUSD(total);
      }
    }
  });
}

function handleLineItemKeyDown(e, module, lineIndex, fieldName) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();

    const targetInput = e.target;
    if (targetInput && state.formData && Array.isArray(state.formData.lineItems)) {
      const currentLine = state.formData.lineItems[lineIndex];
      if (currentLine && fieldName) {
        if (fieldName === 'unitPrice' || fieldName === 'unitCost') {
          currentLine[fieldName] = parseNumberInput(targetInput.value);
        } else if (['qty', 'qtyReturned', 'receivedQty', 'discount', 'tax'].includes(fieldName)) {
          currentLine[fieldName] = Number(targetInput.value) || 0;
        } else {
          currentLine[fieldName] = targetInput.value;
        }
      }
    }

    const lineItems = state.formData?.lineItems || [];
    const isLastRow = lineIndex === lineItems.length - 1;
    const isUnitPriceField = (fieldName === 'unitPrice' || fieldName === 'unitCost');

    if (isLastRow && isUnitPriceField) {
      addLineItem(module, true);
    } else if (!isLastRow) {
      const nextLineId = lineItems[lineIndex + 1].lineId;
      setTimeout(() => {
        const nextInput = document.getElementById(`line-item-${nextLineId}-${fieldName}`);
        if (nextInput) {
          nextInput.focus();
          if (typeof nextInput.select === 'function') nextInput.select();
        }
      }, 50);
    }
  }
}

function addLineItem(module, focusNewName = false) {
  if (!state.formData) return;
  if (!Array.isArray(state.formData.lineItems)) state.formData.lineItems = [];
  const newLineId = Date.now().toString();
  const base = { lineId: newLineId, sku: '', name: '' };

  if (module === 'quotations') {
    state.formData.lineItems.push({ ...base, qty: 1, unitPrice: 0, discount: 0, tax: 0 });
  }
  if (module === 'sales-orders') {
    const currentWh = state.formData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    state.formData.lineItems.push({
      ...base,
      warehouseCode: currentWh,
      qty: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0
    });
  }
  if (module === 'returns') state.formData.lineItems.push({ ...base, qtyReturned: 1, unitPrice: 0 });
  if (module === 'grn') state.formData.lineItems.push({ ...base, receivedQty: 1, unitCost: 0 });

  render();

  if (focusNewName) {
    setTimeout(() => {
      const nameInput = document.getElementById(`line-item-${newLineId}-name`);
      if (nameInput) {
        nameInput.focus();
        if (typeof nameInput.select === 'function') nameInput.select();
      }
    }, 50);
  }
}

function removeLineItem(lineId) {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  state.formData.lineItems = state.formData.lineItems.filter(l => l.lineId !== lineId);
  render();
}

async function saveForm(module) {
  const session = getAuthSession();
  const currentUserId = session.currentUser ? session.currentUser.id : 'Hệ Thống';
  const currentUserFullname = session.currentUser ? (session.currentUser.fullname || session.currentUser.username) : 'Hệ Thống';

  if (!checkModulePermission(module)) {
    alert('Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác lưu!');
    return;
  }

  if (['quotations', 'sales-orders', 'returns', 'grn'].includes(module)) {
    const lineItems = state.formData?.lineItems || [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.name || !item.name.trim()) {
        alert('Tên Hàng không được để trống.');
        setTimeout(() => {
          const nameInput = document.getElementById(`line-item-${item.lineId}-name`);
          if (nameInput) {
            nameInput.focus();
            if (typeof nameInput.select === 'function') nameInput.select();
          }
        }, 50);
        return;
      }
    }
  }

  const tableMap = {
    'materials': 'materials',
    'customers': 'customers',
    'warehouses': 'warehouses',
    'quotations': 'quotations',
    'sales-orders': 'orders',
    'returns': 'returns',
    'grn': 'grns'
  };
  const tableName = tableMap[module];
  const targetKey = module === 'sales-orders' ? 'orders' : (module === 'grn' ? 'grns' : module);

  let rawData = JSON.parse(JSON.stringify(state.formData));

  const currentDate = getTodayDateStr();
  const currentTime = getCurrentTimeStr();

  if (state.mode === 'add') {
    rawData.user_id0 = currentUserId;
    rawData.date0 = currentDate;
    rawData.time0 = currentTime;

    rawData.user_id2 = currentUserId;
    rawData.date2 = currentDate;
    rawData.time2 = currentTime;
  } else if (state.mode === 'edit') {
    const existing = db[targetKey].find(item => String(item.id) === String(rawData.id));
    if (existing) {
      rawData.user_id0 = existing.user_id0 || currentUserId;
      rawData.date0 = existing.date0 || currentDate;
      rawData.time0 = existing.time0 || currentTime;
    } else {
      rawData.user_id0 = currentUserId;
      rawData.date0 = currentDate;
      rawData.time0 = currentTime;
    }

    rawData.user_id2 = currentUserId;
    rawData.date2 = currentDate;
    rawData.time2 = currentTime;
  }

  if (module === 'customers') {
    if (rawData.paymentTerms !== undefined) rawData.paymentterms = rawData.paymentTerms;
    if (rawData.creditLimit !== undefined) rawData.creditlimit = rawData.creditLimit;
  }

  if (module === 'quotations') {
    if (state.mode === 'add' && rawData.customer) {
      db.quotations.forEach(q => {
        if (q.customer === rawData.customer) q.status = 'expired';
      });
      await supabaseClient.from('quotations').update({ status: 'expired' }).eq('customer', rawData.customer).neq('status', 'expired');
    }
    rawData.validuntil = rawData.validUntil;
    rawData.validbegin = rawData.validbegin || rawData.validBegin || rawData.date;
    rawData.lineitems = rawData.lineItems;
    delete rawData.discountTotal;
    delete rawData.subtotal;
    delete rawData.validUntil;
    delete rawData.validBegin;
    delete rawData.lineItems;
  }

  let dbPayload = { ...rawData };
  let supabasePayload = { ...rawData };

  if (module === 'returns') {
    const warehouseCode = rawData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehouse_code = warehouseCode;
    dbPayload.orderId = rawData.orderId || null;
    dbPayload.order_id = rawData.orderId || null;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;

    supabasePayload.warehouse_code = warehouseCode;
    supabasePayload.order_id = rawData.orderId || null;
    supabasePayload.lineitems = lineItems;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.orderId;
    delete supabasePayload.lineItems;
  }

  if (module === 'grn') {
    const warehouseCode = rawData.warehouseCode || rawData.warehousecode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : (Array.isArray(rawData.lineitems) ? rawData.lineitems : []);
    const totalValue = rawData.totalValue ?? rawData.totalvalue ?? 0;

    if (!Array.isArray(db.grns)) db.grns = [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehousecode = warehouseCode;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;
    dbPayload.totalValue = totalValue;
    dbPayload.totalvalue = totalValue;

    supabasePayload.warehousecode = warehouseCode;
    supabasePayload.lineitems = lineItems;
    supabasePayload.totalvalue = totalValue;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.warehouse_code;
    delete supabasePayload.lineItems;
    delete supabasePayload.totalValue;
    delete supabasePayload.total_value;
  }

  if (module === 'sales-orders') {
    const warehouseCode = rawData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehouse_code = warehouseCode;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;
    dbPayload.quotationId = rawData.quotationId || null;
    dbPayload.quotation_id = rawData.quotationId || null;

    supabasePayload.warehouse_code = warehouseCode;
    supabasePayload.quotation_id = rawData.quotationId || null;
    supabasePayload.lineitems = lineItems;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.quotationId;
    delete supabasePayload.quotationid;
    delete supabasePayload.discountTotal;
    delete supabasePayload.discounttotal;
    delete supabasePayload.subtotal;
    delete supabasePayload.lineItems;
  }

  try {
    if (state.mode === 'add') {
      const { error } = await supabaseClient.from(tableName).insert([supabasePayload]);
      if (error) throw error;
      db[targetKey].unshift(dbPayload);

      if (module === 'quotations') {
        addNotification(
          'quotation_add',
          'Báo Giá Mới Đã Tạo',
          `Đã tạo thành công báo giá ${dbPayload.id} cho KH: ${dbPayload.customer || 'Khách hàng'}`,
          'quotations',
          dbPayload.id,
          currentUserFullname
        );
      }

    } else {
      const { error } = await supabaseClient.from(tableName).update(supabasePayload).eq('id', dbPayload.id);
      if (error) throw error;
      const idx = db[targetKey].findIndex(item => item.id === dbPayload.id);
      if (idx !== -1) db[targetKey][idx] = dbPayload;

      if (module === 'quotations') {
        addNotification(
          'quotation_edit',
          'Cập Nhật Báo Giá',
          `Báo giá ${dbPayload.id} (${dbPayload.customer || 'Khách hàng'}) đã được cập nhật`,
          'quotations',
          dbPayload.id,
          currentUserFullname
        );
      }
    }

    if (['quotations', 'orders', 'returns', 'grns'].includes(targetKey)) {
      db[targetKey].sort(sortDescById);
    }

    fetchDataFromSupabase();
    navigate(module, 'list');
  } catch (error) {
    console.error('Lỗi lưu Supabase:', error);
    showAlert('Lưu thất bại: ' + (error.message || error), 'Lỗi');
  }
}

async function deleteItem(module, id) {
  if (!checkModulePermission(module)) {
    await showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép xóa!', 'Cảnh báo quyền');
    return;
  }

  const confirmDelete = await showConfirm(`Bạn có chắc chắn muốn xóa thông tin có ID: ${id}?`, 'Xác nhận xóa');

  if (confirmDelete) {
    const tableMap = {
      'materials': 'materials',
      'customers': 'customers',
      'warehouses': 'warehouses',
      'quotations': 'quotations',
      'sales-orders': 'orders',
      'returns': 'returns',
      'grn': 'grns'
    };
    const tableName = tableMap[module];
    const targetKey = module === 'sales-orders' ? 'orders' : (module === 'grn' ? 'grns' : module);

    if (Array.isArray(db[targetKey])) {
      db[targetKey] = db[targetKey].filter(item => String(item.id) !== String(id));
    }
    render();

    const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
    if (error) {
      await showAlert('Xóa trên CSDL thất bại: ' + error.message, 'Lỗi kết nối');
      await fetchDataFromSupabase();
      render();
    }
  }
}

function initFormData(module, id) {
  const keyMap = { 'sales-orders': 'orders', 'grn': 'grns' };
  const targetKey = keyMap[module] || module;
  const collection = db[targetKey] || [];

  if (id) {
    state.formData = JSON.parse(JSON.stringify(collection.find(x => String(x.id) === String(id))));
  } else {
    const autoId = generateAutoId(module);
    if (module === 'materials') {
      state.formData = {
        id: autoId, name: '', unit: '', category: 'Hoa Quả', location: '', stock: 0, reorder: 0, cost: 0, status: 'ok'
      };
    }

    if (module === 'customers') {
      state.formData = {
        id: autoId, name: '', type: 'B2B', contact: '', email: '', phone: '', address: '', creditLimit: 0, paymentTerms: 'Net 30', status: 'active'
      };
    }

    if (module === 'warehouses') {
      state.formData = {
        id: autoId, code: autoId, name: '', location: '', capacity: 0, used: 0, manager: '', status: 'active'
      };
    }

    if (module === 'quotations') {
      const today = getTodayDateStr();
      const firstDay = getFirstDayOfMonthStr();
      const { lastDay } = getMonthRange();
      state.formData = {
        id: autoId, customer: '', date: today, validbegin: firstDay, validUntil: lastDay, status: 'accepted', notes: '',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0 }]
      };
    }

    if (module === 'sales-orders') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId,
        customer: '',
        warehouseCode: defaultWh,
        quotationId: null,
        date: getTodayDateStr(),
        status: 'completed',
        notes: '',
        tax: 0,
        total: 0,
        lineItems: [
          {
            lineId: Date.now().toString(),
            warehouseCode: defaultWh,
            sku: '',
            name: '',
            qty: 1,
            unitPrice: 0,
            discount: 0,
            tax: 0
          }
        ]
      };
    }

    if (module === 'returns') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId, warehouseCode: defaultWh, orderId: '', customer: '', date: getTodayDateStr(), reason: 'Hàng lỗi/hỏng', notes: '', status: 'processed',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', qtyReturned: 1, unitPrice: 0 }]
      };
    }

    if (module === 'grn') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId,
        supplier: '',
        warehouseCode: defaultWh,
        notes: '',
        date: getTodayDateStr(),
        status: 'Đã nhận',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', receivedQty: 1, unitCost: 0 }]
      };
    }
  }
}

// ==========================================
// 7. CÁC HÀM XỬ LÝ CHỌN LỌC TỰ ĐỘNG DỮ LIỆU
// ==========================================

function updateGlobalMaterialDatalist() {
  let dl = document.getElementById('global-materials-list');
  if (!dl) {
    dl = document.createElement('datalist');
    dl.id = 'global-materials-list';
    document.body.appendChild(dl);
  }
  dl.innerHTML = (db.materials || []).map(m => {
    const safeName = m.name || '';
    const safeId = m.id || '';
    const safeCost = m.cost || 0;
    return `<option value="${safeName}">${safeId} - ${safeName} (${fmtUSD(safeCost)})</option>`;
  }).join('');
}

function handleOrderSelectInReturn(orderId) {
  if (!state.formData || state.mode === 'view') return;
  state.formData.orderId = orderId;

  if (!orderId) {
    state.formData.customer = '';
    state.formData.lineItems = [{
      lineId: Date.now().toString(),
      sku: '',
      name: '',
      qtyReturned: 1,
      unitPrice: 0
    }];
    render();
    return;
  }

  const targetOrder = db.orders.find(o => o.id === orderId);

  if (targetOrder) {
    state.formData.customer = targetOrder.customer || '';
    state.formData.lineItems = (targetOrder.lineItems || []).map(item => ({
      lineId: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      sku: item.sku || '',
      name: item.name || '',
      qtyReturned: item.qty || 1,
      unitPrice: item.unitPrice || 0
    }));
  }
  render();
}

function handleMaterialSelectInLine(lineId, selectedName) {
  if (!state.formData || state.mode === 'view') return;
  const line = (state.formData.lineItems || []).find(l => l.lineId === lineId);
  if (!line) return;

  const valStr = selectedName ? String(selectedName).trim() : '';
  if (!valStr) {
    line.name = '';
    line.sku = '';
    render();
    return;
  }

  let cleanName = valStr;
  if (valStr.includes(' - ')) {
    const parts = valStr.split(' - ');
    cleanName = parts.length > 1 ? parts.slice(1).join(' - ').split(' (')[0].trim() : valStr;
  }

  const mat = (db.materials || []).find(m =>
    (m.name && m.name.toLowerCase() === cleanName.toLowerCase()) ||
    (m.id && m.id.toLowerCase() === valStr.toLowerCase())
  );

  if (mat) {
    line.name = mat.name || '';
    line.sku = mat.id || '';
    line.unitPrice = mat.cost || 0;
    line.unitCost = mat.cost || 0;
  } else {
    line.name = cleanName;
  }

  render();
}

function handleCustomerSelectInQuotation(customerName) {
  if (!state.formData || state.mode === 'view') return;
  const safeCustomer = String(customerName || '').trim();
  state.formData.customer = safeCustomer;

  if (!safeCustomer) {
    state.formData.lineItems = [{
      lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
    render();
    return;
  }

  const latestQuotation = (db.quotations || [])
    .filter(q => q && q.customer === safeCustomer)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  if (latestQuotation && Array.isArray(latestQuotation.lineItems) && latestQuotation.lineItems.length > 0) {
    state.formData.lineItems = latestQuotation.lineItems.map(item => ({
      lineId: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      sku: item.sku || '',
      name: item.name || '',
      qty: item.qty ?? 1,
      unitPrice: item.unitPrice ?? 0,
      discount: item.discount ?? 0,
      tax: item.tax ?? 0
    }));
  } else {
    state.formData.lineItems = [{
      lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
  }

  render();
}

async function handleCustomerSelectInOrder(customerName) {
  if (!state.formData || state.mode === 'view') return;
  const safeCustomer = String(customerName || '').trim();
  state.formData.customer = safeCustomer;

  if (!safeCustomer) {
    state.formData.quotationId = null;
    state.formData.lineItems = [{
      lineId: Date.now().toString(),
      warehouseCode: state.formData.warehouseCode || '',
      sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
    render();
    return;
  }

  const orderDate = state.formData.date || getTodayDateStr();

  const activeQuotation = (db.quotations || [])
    .filter(q => {
      if (!q || q.customer !== safeCustomer) return false;
      if ((q.status || '').toLowerCase() !== 'accepted') return false;

      const vBegin = q.validbegin || q.validBegin || q.date || '';
      const vUntil = q.validUntil || q.validuntil || '';

      if (vBegin && vUntil) {
        return orderDate >= vBegin && orderDate <= vUntil;
      }
      return false;
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  if (activeQuotation) {
    const confirmImport = await showConfirm(
      "Bạn có muốn nhập toàn bộ mã hàng, đơn giá theo Bảng báo giá không?",
      "Áp dụng báo giá"
    );

    if (confirmImport) {
      state.formData.quotationId = activeQuotation.id || null;
      if (Array.isArray(activeQuotation.lineItems) && activeQuotation.lineItems.length > 0) {
        state.formData.lineItems = activeQuotation.lineItems.map(item => ({
          lineId: Date.now().toString() + Math.random().toString(36).substr(2, 4),
          warehouseCode: state.formData.warehouseCode || '',
          sku: item.sku || '',
          name: item.name || '',
          qty: item.qty ?? 1,
          unitPrice: item.unitPrice ?? 0,
          discount: item.discount ?? 0,
          tax: item.tax ?? 0
        }));
      }
    } else {
      state.formData.quotationId = null;
    }
  } else {
    state.formData.quotationId = null;
  }

  render();
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
  const headerRight = document.querySelector('.app-header > div:last-child') || document.querySelector('.app-header');
  if (!headerRight) return;

  let bellBtn = document.getElementById('notif-bell-btn');
  if (!bellBtn) {
    const existingBell = headerRight.querySelector('button, .bell-icon, [class*="bell"]');
    if (existingBell) {
      bellBtn = existingBell;
      bellBtn.id = 'notif-bell-btn';
    } else {
      bellBtn = document.createElement('button');
      bellBtn.id = 'notif-bell-btn';
      headerRight.appendChild(bellBtn);
    }
  }

  bellBtn.className = 'header-icon-btn notif-bell-btn';
  bellBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

  const dot = document.createElement('div');
  dot.id = 'notif-badge-dot';
  dot.className = 'notif-badge-dot';
  bellBtn.appendChild(dot);

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

// ==========================================
// 9. RENDER GIAO DIỆN & CÁC TRANG (VIEWS)
// ==========================================

// GIAO DIỆN ĐĂNG NHẬP SANG TRỌNG
function renderLoginForm(container) {
  // Chỉ lấy tài khoản lưu nếu có dữ liệu trong remembered_user
  const savedCredsRaw = localStorage.getItem('remembered_user');
  const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : { username: '', password: '', remember: false };
  const bannerImg = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80';

  container.innerHTML = `
    <style>
      /* Style ép trình duyệt giữ nền tối khi tự động điền mật khẩu */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #1e232d inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
      }
    </style>

    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px; 
      font-family: var(--font-jost, sans-serif);
      position: relative;
      overflow: hidden;
      background: #0c0e12;
    ">
      
      <!-- Background mờ toàn trang -->
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle at center, rgba(12, 14, 18, 0.65) 0%, rgba(12, 14, 18, 0.95) 80%, #0c0e12 100%),
                    url('${bannerImg}') center/cover no-repeat;
        filter: blur(8px);
        transform: scale(1.05);
        z-index: 0;
      "></div>

      <!-- Main Login Card -->
      <div style="
        width: 100%; 
        max-width: 900px; 
        min-height: 520px;
        background: rgba(20, 24, 33, 0.9); 
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 2px; 
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 1px rgba(240, 160, 48, 0.3); 
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        overflow: hidden;
        position: relative;
        z-index: 1;
      " class="login-split-card">

        <!-- Cột trái: Banner -->
        <div style="
          flex: 1; 
          background: radial-gradient(circle at center, rgba(20, 24, 33, 0.6) 0%, rgba(13, 16, 22, 0.95) 100%), 
                      url('${bannerImg}') center/cover no-repeat; 
          padding: 40px; 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center;
          text-align: center;
          position: relative;
        " class="login-banner-col">
          
          <div style="max-width: 320px; position: relative; z-index: 2;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: rgba(240, 160, 48, 0.15); border: 1px solid rgba(240, 160, 48, 0.35); border-radius: 2px; margin-bottom: 20px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f0a030" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <h1 style="font-size: 30px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em; margin: 0 0 10px 0;">
              MINH KHUÊ <span style="color: #f0a030;">LMS</span>
            </h1>
            <p style="font-size: 13px; color: #a0aec0; font-family: var(--font-dm-mono, monospace); line-height: 1.6; margin: 0;">
              Hệ thống quản lý kho hàng, báo giá và theo dõi đơn bán hàng tập trung
            </p>
          </div>
        </div>

        <!-- Cột phải: Form nhập liệu -->
        <div style="
          flex: 1; 
          padding: 48px 40px; 
          display: flex; 
          flex-direction: column; 
          justify-content: center;
          background: rgba(20, 24, 33, 0.95);
        ">
          
          <div style="margin-bottom: 28px;">
            <h2 style="font-size: 22px; font-weight: 600; color: #ffffff; margin: 0 0 6px 0;">Đăng Nhập Hệ Thống</h2>
            <p style="font-size: 12px; color: #8a94a6; font-family: var(--font-dm-mono, monospace);">Vui lòng nhập thông tin tài khoản của bạn</p>
          </div>

          <form onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 20px;">
            
            <div style="position: relative;">
              <label style="display: block; font-size: 11px; font-family: var(--font-dm-mono, monospace); color: #f0a030; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Tên tài khoản</label>
              <input 
                type="text" 
                id="login-username" 
                required 
                value="${savedCreds.remember ? (savedCreds.username || '') : ''}"
                placeholder="Nhập tên tài khoản..." 
                style="
                  width: 100%; 
                  padding: 10px 0; 
                  background: transparent; 
                  border: none; 
                  border-bottom: 1px solid rgba(255, 255, 255, 0.15); 
                  color: #ffffff; 
                  outline: none; 
                  font-size: 14px; 
                  transition: border-color 0.2s;
                  box-sizing: border-box;
                "
                onfocus="this.style.borderColor='#f0a030';"
                onblur="this.style.borderColor='rgba(255, 255, 255, 0.15)';"
              >
            </div>

            <div style="position: relative;">
              <label style="display: block; font-size: 11px; font-family: var(--font-dm-mono, monospace); color: #8a94a6; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Mật khẩu</label>
              <div style="display: flex; align-items: center; position: relative;">
                <input 
                  type="password" 
                  id="login-password" 
                  required 
                  value="${savedCreds.remember ? (savedCreds.password || '') : ''}"
                  placeholder="Nhập mật khẩu..." 
                  style="
                    width: 100%; 
                    padding: 10px 32px 10px 0; 
                    background: transparent; 
                    border: none; 
                    border-bottom: 1px solid rgba(255, 255, 255, 0.15); 
                    color: #ffffff; 
                    outline: none; 
                    font-size: 14px; 
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                  "
                  onfocus="this.style.borderColor='#f0a030';"
                  onblur="this.style.borderColor='rgba(255, 255, 255, 0.15)';"
                >
                <span 
                  id="toggle-password-btn"
                  onclick="togglePasswordVisibility()" 
                  style="position: absolute; right: 0; cursor: pointer; color: #8a94a6; display: flex; align-items: center;"
                  onmouseover="this.style.color='#f0a030'"
                  onmouseout="this.style.color='#8a94a6'"
                  title="Ẩn/Hiện mật khẩu"
                >
                  <svg id="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </span>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #a0aec0; cursor: pointer; user-select: none;">
                <input 
                  type="checkbox" 
                  id="login-remember" 
                  ${savedCreds.remember ? 'checked' : ''} 
                  style="cursor: pointer; accent-color: #f0a030; width: 15px; height: 15px;"
                >
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div id="login-error" style="color: #f87171; font-size: 12px; display: none; background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2); padding: 8px 12px; border-radius: 2px; text-align: center;">
              Tài khoản hoặc mật khẩu không chính xác!
            </div>

            <button 
              type="submit" 
              style="
                width: 100%; 
                padding: 12px; 
                margin-top: 10px; 
                background: linear-gradient(135deg, #f0a030 0%, #d98818 100%); 
                border: none; 
                border-radius: 2px; 
                color: #000000; 
                font-family: var(--font-jost, sans-serif); 
                font-size: 14px; 
                font-weight: 600; 
                cursor: pointer; 
                transition: all 0.2s ease;
                box-shadow: 0 4px 15px rgba(240, 160, 48, 0.25);
              "
              onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(240, 160, 48, 0.4)';"
              onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(240, 160, 48, 0.25)';"
            >
              Đăng Nhập
            </button>
          </form>

          <div style="margin-top: 28px; text-align: center;">
            <p style="font-size: 11px; color: #8a94a6; font-family: var(--font-dm-mono, monospace); margin-bottom: 12px;">Nền tảng hỗ trợ liên kết</p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #38bdf8; display: flex; align-items: center; justify-content: center; color: #ffffff; cursor: pointer;">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </div>
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; color: #ffffff; cursor: pointer;">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </div>
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #ef4444; display: flex; align-items: center; justify-content: center; color: #ffffff; cursor: pointer;">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42s1.95-4.42 4.34-4.42c1.36 0 2.27.58 2.79 1.08l1.9-1.83C15.47 5.69 13.89 5 12 5 8.13 5 8.13 5 12s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H12z"></path></svg>
              </div>
            </div>
          </div>

        </div>

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

  const rowsHtml = filtered.map(m => `
  <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', '${hasPermission ? 'edit' : 'view'}', '${m.id}')" onclick="navigate('materials', 'view', '${m.id}')">
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
    <td style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${m.stock ?? 0}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
    <td style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'CÒN HÀNG' : m.status.toUpperCase()}</span></td>
    
    <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(m.user_id0)}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(m.date0)}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(m.time0)}</td>
    <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(m.user_id2)}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(m.date2)}</td>
    <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(m.time2)}</td>

    <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
      <button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'view', '${m.id}')">${Icons.view} Xem</button>
      ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>` : ''}
      ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>` : ''}
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
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên hàng..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const rowsHtml = filtered.map(c => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('customers', '${hasPermission ? 'edit' : 'view'}', '${c.id}')" onclick="navigate('customers', 'view', '${c.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary); text-align: left;">${c.id || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; font-weight: 500; text-align: left;">${c.name || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.contact || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); text-align: left;">${c.email || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; text-align: left;">${c.phone || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.address || c.diachi || '—'}</td>
      <td style="padding: 11px 16px; text-align: left;"><span class="badge ${getBadgeClass(c.status)}">${c.status === 'active' ? 'hoạt động' : (c.status === 'suspended' ? 'tạm khóa' : (c.status || 'hoạt động'))}</span></td>

      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(c.user_id0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(c.date0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(c.time0)}</td>
      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(c.user_id2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(c.date2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(c.time2)}</td>
    
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'view', '${c.id}')">${Icons.view} Xem</button>
        ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'edit', '${c.id}')">${Icons.edit} Sửa</button>` : ''}
        ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('customers', '${c.id}')">${Icons.trash} Xóa</button>` : ''}
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
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên, liên hệ, địa chỉ..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const rowsHtml = filtered.map(q => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('quotations', '${hasPermission ? 'edit' : 'view'}', '${q.id}')" onclick="navigate('quotations', 'view', '${q.id}')">
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${q.id}</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${q.customer}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.date || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validbegin || q.validBegin || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validUntil}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(q.lineItems || []).length}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(q.total)}</td>
      <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(q.status)}">${getStatusLabel(q.status)}</span></td>

      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(q.user_id0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(q.date0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(q.time0)}</td>
      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(q.user_id2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(q.date2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(q.time2)}</td>

      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
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
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên khách hàng..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const rowsHtml = filtered.map(o => `
  <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('sales-orders', '${hasPermission ? 'edit' : 'view'}', '${o.id}')" onclick="navigate('sales-orders', 'view', '${o.id}')">
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${o.id}</td>
    <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${o.customer}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${o.date}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${o.warehouseCode || o.warehouse_code || '—'}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(o.lineItems || o.lineitems || []).length || o.items || 0}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(o.total)}</td>
    <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(o.status)}">${getStatusLabel(o.status)}</span></td>

    <td style="padding: 12px 16px; font-size: 12px;">${getUserFullName(o.user_id0)}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(o.date0)}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(o.time0)}</td>
    <td style="padding: 12px 16px; font-size: 12px;">${getUserFullName(o.user_id2)}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(o.date2)}</td>
    <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(o.time2)}</td>

    <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
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
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên khách hàng..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const rowsHtml = filtered.map(r => {
    const totalLines = (r.lineItems || r.lineitems || []).length;
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('returns', '${hasPermission ? 'edit' : 'view'}', '${r.id}')" onclick="navigate('returns', 'view', '${r.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${r.id}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.orderId || '—'}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${r.customer}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.date}</td>
        <td style="padding: 12px 16px; font-size: 13px;">${r.reason}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; color: #f87171; text-align: right;">${fmtUSD(r.total)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(r.status)}">${getStatusLabel(r.status)}</span></td>

      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(r.user_id0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(r.date0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(r.time0)}</td>
      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(r.user_id2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(r.date2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(r.time2)}</td>

        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
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
            <input type="text" id="global-search" placeholder="Tìm theo mã, khách hàng, lý do..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const rowsHtml = filtered.map(g => {
    const totalLines = (g.lineItems || []).length;
    const wCode = g.warehouseCode || g.warehouse_code || '—';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('grn', '${hasPermission ? 'edit' : 'view'}', '${g.id}')" onclick="navigate('grn', 'view', '${g.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${g.id}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${g.supplier || '—'}</td>      
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${g.date}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${wCode}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(g.totalValue)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(g.status)}">${getStatusLabel(g.status)}</span></td>

      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(g.user_id0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(g.date0)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(g.time0)}</td>
      <td style="padding: 11px 16px; font-size: 12px;">${getUserFullName(g.user_id2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtDateStr(g.date2)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${fmtTimeStr(g.time2)}</td>

        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
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
            <input type="text" id="global-search" placeholder="Tìm theo mã phiếu, nhà cung cấp..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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
    </div>
  `;
}

function renderMaterialForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  c.innerHTML = `
    <div style="max-width: 900px;">
      ${getBreadcrumb('Sản Phẩm & Vật Tư', isView ? `Xem ${d.id}` : (state.mode === 'edit' ? `Sửa ${d.id}` : 'Thêm Sản Phẩm Mới'), 'materials')}
      <form onsubmit="event.preventDefault(); saveForm('materials');">
        <input type="hidden" value="${d.id || ''}">

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">01</span>
            <span class="section-title">Thông tin cơ bản</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Tên sản phẩm *</label>
              <input 
  type="text" 
  class="form-input" 
  value="${d.name || ''}" 
  ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : `
    oninput="this.value = toTitleCase(this.value); updateField('name', this.value);"
    onchange="this.value = toTitleCase(this.value); updateField('name', this.value);"
  `} 
  placeholder="Nhập tên sản phẩm..." 
  required
>
            </div>
            <div class="form-group">
              <label class="form-label">Đơn vị tính *</label>
              <input 
  type="text" 
  class="form-input" 
  value="${d.unit || ''}" 
  ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : `
    oninput="this.value = toUpperCaseStr(this.value); updateField('unit', this.value);"
    onchange="this.value = toUpperCaseStr(this.value); updateField('unit', this.value);"
  `} 
  placeholder="CÁI, HỘP, BỘ, KG..." 
  required
>
            </div>
            <div class="form-group">
              <label class="form-label">Danh mục</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'category\', this.value)"'}>
                ${['Hoa Quả', 'Rau Củ', 'Khác'].map(cat => `<option value="${cat}" ${d.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">02</span>
            <span class="section-title">Kho hàng & Chi phí (Tùy chọn)</span>
          </div>
          <div class="section-body grid-4">
            <div class="form-group">
              <label class="form-label">Vị trí lưu kho</label>
              <input type="text" class="form-input" value="${d.location || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'location\', this.value)"'} placeholder="Ví dụ: A-12-03">
            </div>
            <div class="form-group">
              <label class="form-label">Tồn kho ban đầu</label>
              <input type="number" step="any" inputmode="decimal" class="form-input" value="${d.stock ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'stock\', this.value, \'number\'); d.status = this.value==0?\'out\':(this.value<=(d.reorder||0)?\'low\':\'ok\');"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Mức định mức</label>
              <input type="number" step="any" inputmode="decimal" class="form-input" value="${d.reorder ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'reorder\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Đơn giá (VNĐ)</label>
              <input type="number" step="any" inputmode="numeric" class="form-input" value="${d.cost ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'cost\', this.value, \'number\')"'} >
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button type="button" class="btn-cancel" onclick="navigate('materials')">${isView ? 'Quay lại' : 'Hủy'}</button>
          ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Lưu sản phẩm' : 'Cập nhật'}</button>` : ''}
        </div>
      </form>
    </div>
  `;
}

function renderCustomerForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  c.innerHTML = `
    <div style="max-width: 900px;">
      ${getBreadcrumb('Khách hàng', isView ? `Xem ${d.id}` : (state.mode === 'edit' ? `Chỉnh sửa ${d.id}` : 'Thêm mới khách hàng'), 'customers')}
      <form onsubmit="event.preventDefault(); saveForm('customers');">
        <input type="hidden" value="${d.id || ''}">

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">01</span>
            <span class="section-title">Thông tin khách hàng</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Tên công ty / Khách hàng *</label>
              <input type="text" class="form-input" value="${d.name || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : `
    oninput="this.value = toTitleCase(this.value); updateField('name', this.value);"
    onchange="this.value = toTitleCase(this.value); updateField('name', this.value);"
  `} placeholder="Nhập tên công ty hoặc tên khách hàng..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Loại khách hàng</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'type\', this.value)"'}>
                ${['Khách vãng lai', 'Khách hàng tiềm năng', 'Khách hàng trung thành', 'Khách hàng cũ', 'Khách hàng tiêu cực'].map(t => `<option value="${t}" ${d.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Người liên hệ</label>
              <input type="text" class="form-input" value="${d.contact || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : `
    oninput="this.value = toTitleCase(this.value); updateField('contact', this.value);"
    onchange="this.value = toTitleCase(this.value); updateField('contact', this.value);"
  `} placeholder="Tên người đại diện...">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" value="${d.email || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'email\', this.value)"'} placeholder="example@domain.com">
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" inputmode="tel" class="form-input" value="${d.phone || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'phone\', this.value)"'} placeholder="090x xxx xxx">
            </div>
            <div class="form-group" style="grid-column: span 3;">
              <label class="form-label">Địa chỉ</label>
              <input type="text" class="form-input" value="${d.address || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'address\', this.value)"'} placeholder="Nhập địa chỉ trụ sở/giao hàng...">
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">02</span>
            <span class="section-title">Điều khoản thương mại</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group">
              <label class="form-label">Hạn mức tín dụng (VNĐ)</label>
              <input type="number" step="any" inputmode="numeric" class="form-input" value="${d.creditLimit ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'creditLimit\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Điều khoản thanh toán</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'paymentTerms\', this.value)"'}>
                ${['Thanh toán ngay', 'Thanh toán gối đầu', 'Thanh toán cuối tháng', 'Net 30', 'Net 60'].map(t => `<option value="${t}" ${d.paymentTerms === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="active" ${d.status === 'active' ? 'selected' : ''}>Đang hoạt động</option>
                <option value="inactive" ${d.status === 'inactive' ? 'selected' : ''}>Ngừng hoạt động</option>
                <option value="suspended" ${d.status === 'suspended' ? 'selected' : ''}>Tạm khóa</option>
              </select>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button type="button" class="btn-cancel" onclick="navigate('customers')">${isView ? 'Quay lại' : 'Hủy'}</button>
          ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Lưu khách hàng' : 'Cập nhật'}</button>` : ''}
        </div>
      </form>
    </div>
  `;
}

function renderWarehouseForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';

  c.innerHTML = `
    <div style="max-width: 900px;">
      ${getBreadcrumb('Kho hàng', isView ? `Xem ${d.code || ''}` : (state.mode === 'edit' ? `Chỉnh sửa ${d.code || ''}` : 'Thêm mới kho hàng'), 'warehouses')}
      <form onsubmit="event.preventDefault(); saveForm('warehouses');">
        <input type="hidden" value="${d.id || ''}">

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">01</span>
            <span class="section-title">Thông tin kho hàng</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group">
              <label class="form-label">Mã kho (Tự động) *</label>
              <input type="text" class="form-input" value="${d.code || ''}" readonly style="background: var(--muted); cursor: not-allowed; color: var(--primary);" title="Mã kho tự động sinh">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Tên kho *</label>
              <input type="text" class="form-input" value="${d.name || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'name\', this.value)"'} placeholder="Nhập tên kho hàng..." required>
            </div>
            <div class="form-group" style="grid-column: span 3;">
              <label class="form-label">Địa chỉ / Vị trí *</label>
              <input type="text" class="form-input" value="${d.location || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'location\', this.value)"'} placeholder="Nhập địa chỉ kho hàng..." required>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">02</span>
            <span class="section-title">Sức chứa & Quản lý</span>
          </div>
          <div class="section-body grid-4">
            <div class="form-group">
              <label class="form-label">Sức chứa (Đơn vị)</label>
              <input type="number" step="any" inputmode="decimal" class="form-input" value="${d.capacity ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'capacity\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Đã sử dụng</label>
              <input type="number" step="any" inputmode="decimal" class="form-input" value="${d.used ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'used\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Quản lý kho</label>
              <input type="text" class="form-input" value="${d.manager || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'manager\', this.value)"'} placeholder="Tên quản lý kho...">
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="active" ${d.status === 'active' ? 'selected' : ''}>Đang hoạt động</option>
                <option value="maintenance" ${d.status === 'maintenance' ? 'selected' : ''}>Bảo trì</option>
                <option value="closed" ${d.status === 'closed' ? 'selected' : ''}>Đóng cửa</option>
              </select>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button type="button" class="btn-cancel" onclick="navigate('warehouses')">${isView ? 'Quay lại' : 'Hủy'}</button>
          ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Lưu kho hàng' : 'Cập nhật'}</button>` : ''}
        </div>
      </form>
    </div>
  `;
}

function renderQuotationForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  const isEdit = state.mode === 'edit';
  d.lineItems = Array.isArray(d.lineItems) ? d.lineItems : [];

  d.subtotal = d.lineItems.reduce((s, l) => s + ((l.qty || 0) * (l.unitPrice || 0)), 0);
  d.discountTotal = d.lineItems.reduce((s, l) => s + ((l.qty || 0) * (l.unitPrice || 0) * ((l.discount || 0) / 100)), 0);

  d.tax = d.lineItems.reduce((s, l) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    return s + (lineSub * ((l.tax || 0) / 100));
  }, 0);

  d.total = d.subtotal - d.discountTotal + d.tax;

  const customerOptions = (db.customers || []).map(cust =>
    `<option value="${cust.name}" ${d.customer === cust.name ? 'selected' : ''}>${cust.name}</option>`
  ).join('');

  const gridLayout = isView
    ? "90px minmax(180px, 1.5fr) 65px 80px 100px 70px 70px 120px"
    : "90px minmax(180px, 1.5fr) 65px 80px 100px 70px 70px 120px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    const lineTotal = lineSub * (1 + (l.tax || 0) / 100);
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';

    return `
    <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 8px; padding: 10px 24px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động">
      
      <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'quotations\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
      
      <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính">
      
      <input type="number" id="line-item-${l.lineId}-qty" step="any" inputmode="decimal" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qty ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'qty')" onchange="updateLine('${l.lineId}', 'qty', this.value, 'number')"`}>
      
      <input 
        type="text" 
        id="line-item-${l.lineId}-unitPrice"
        inputmode="numeric"
        class="form-input" 
        style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" 
        value="${(l.unitPrice ?? 0).toLocaleString('vi-VN')}" 
        ${isView ? 'readonly' : `
          onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'unitPrice')"
          onfocus="this.value = parseNumberInput(this.value) || ''" 
          onblur="this.value = formatVNDInput(this.value)" 
          onchange="updateLine('${l.lineId}', 'unitPrice', parseNumberInput(this.value), 'number')"
        `}
      >
      
      <input type="number" id="line-item-${l.lineId}-discount" step="any" inputmode="decimal" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.discount ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'discount')" onchange="updateLine('${l.lineId}', 'discount', this.value, 'number')"`}>
      
      <input type="number" id="line-item-${l.lineId}-tax" step="any" inputmode="decimal" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.tax ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'tax')" onchange="updateLine('${l.lineId}', 'tax', this.value, 'number')"`}>
      
      <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500;">${fmtUSD(lineTotal)}</div>
      ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
    </div>
  `;
  }).join('');

  c.innerHTML = `
    <div style="max-width: 1050px;">
      ${getBreadcrumb('Báo giá', isView ? `Xem ${d.id || ''}` : (isEdit ? `Chỉnh sửa ${d.id || ''}` : 'Tạo báo giá mới'), 'quotations')}
      <form onsubmit="event.preventDefault(); saveForm('quotations');">
        
        <input type="hidden" value="${d.id || ''}">

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">01</span>
            <span class="section-title">Thông tin báo giá</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Khách hàng *</label>
              <select class="form-select" ${(isView || isEdit) ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="handleCustomerSelectInQuotation(this.value)"'} required>
                <option value="">-- Chọn khách hàng --</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="accepted" ${d.status === 'accepted' ? 'selected' : ''}>Đã chấp nhận</option>
                <option value="draft" ${d.status === 'draft' ? 'selected' : ''}>Bản nháp</option>
                <option value="expired" ${d.status === 'expired' ? 'selected' : ''}>Hết hạn</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày lập phiếu *</label>
              <input type="date" class="form-input" value="${d.date || getTodayDateStr()}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'date\', this.value)"'} required>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày phát hành *</label>
              <input type="date" class="form-input" value="${d.validbegin || d.validBegin || getFirstDayOfMonthStr()}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'validbegin\', this.value)"'} required>
            </div>
            <div class="form-group">
              <label class="form-label">Hiệu lực đến *</label>
              <input type="date" class="form-input" value="${d.validUntil || d.validuntil || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'validUntil\', this.value)"'} required>
            </div>

            <div class="form-group" style="grid-column: span 3; margin-top: 6px;">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-textarea" rows="2" style="resize: vertical; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" ${isView ? 'readonly' : 'onchange="updateField(\'notes\', this.value)"'} placeholder="Nhập thông tin ghi chú (tùy chọn)...">${d.notes || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px;">
              <span class="section-num">02</span>
              <span class="section-title">Danh mục sản phẩm</span>
            </div>
            ${!isView ? `<button type="button" class="btn-action" onclick="addLineItem('quotations')">${Icons.plus} Thêm dòng</button>` : ''}
          </div>
          
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 8px; padding: 8px 24px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 900px;">
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tên sản phẩm</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">ĐVT</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Số Lượng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Đơn Giá</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Chiết Khấu %</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thuế %</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thành tiền</span>
              ${!isView ? `<span></span>` : ''}
            </div>

            <div style="min-width: 850px;">
              ${linesHtml}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; padding: 16px 24px;">
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 260px;">
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Tạm tính</span><span style="font-family: var(--font-dm-mono);">${fmtUSD(d.subtotal)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Chiết khấu</span><span style="font-family: var(--font-dm-mono);">-${fmtUSD(d.discountTotal)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Tổng Thuế</span><span style="font-family: var(--font-dm-mono);">${fmtUSD(d.tax)}</span></div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 2px;"><span class="form-label" style="font-weight: 600;">Tổng cộng</span><span style="font-family: var(--font-dm-mono); font-size: 15px; color: var(--primary); font-weight: 500;">${fmtUSD(d.total)}</span></div>
            </div>
          </div>
        </div>

        <div class="action-bar" style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn-cancel" onclick="navigate('quotations')">${isView ? 'Quay lại' : 'Hủy'}</button>
          <div style="display: flex; gap: 8px;">
          <!-- Nút xuất PDF & Chia sẻ Zalo -->
            ${isView ? `<button type="button" class="btn-primary" onclick="exportQuotationToPDF()" style="background: #e11d48; color: #ffffff; padding: 8px 16px; cursor: pointer;">
              Xuất PDF
            </button>` : ''}
            ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Tạo báo giá' : 'Cập nhật'}</button>` : ''}
          </div>
        </div>
      </form>
    </div>
  `;
}

function renderSalesOrderForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  const isEdit = state.mode === 'edit';
  d.lineItems = Array.isArray(d.lineItems) ? d.lineItems : [];

  if (!d.warehouseCode && db.warehouses.length > 0) {
    d.warehouseCode = db.warehouses[0].code || db.warehouses[0].id;
  }

  d.lineItems.forEach(l => {
    l.warehouseCode = d.warehouseCode;
  });

  d.subtotal = d.lineItems.reduce((s, l) => s + ((l.qty || 0) * (l.unitPrice || 0)), 0);
  d.discountTotal = d.lineItems.reduce((s, l) => s + ((l.qty || 0) * (l.unitPrice || 0) * ((l.discount || 0) / 100)), 0);
  d.tax = d.lineItems.reduce((s, l) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    return s + (lineSub * ((l.tax || 0) / 100));
  }, 0);
  d.total = d.subtotal - d.discountTotal + d.tax;

  const customerOptions = (db.customers || []).map(cust =>
    `<option value="${cust.name || ''}" ${d.customer === cust.name ? 'selected' : ''}>${cust.name || ''}</option>`
  ).join('');

  const warehouseOptions = (db.warehouses || []).map(w => {
    const wCode = w.code || w.id;
    return `<option value="${wCode}" ${d.warehouseCode === wCode ? 'selected' : ''}>${wCode} - ${w.name}</option>`;
  }).join('');

  const gridLayout = isView
    ? "90px minmax(180px, 1.5fr) 60px 80px 65px 65px 90px 70px 60px 120px"
    : "90px minmax(180px, 1.5fr) 60px 80px 65px 65px 90px 70px 60px 120px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    const lineTotal = lineSub * (1 + (l.tax || 0) / 100);

    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
    <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động">
      
      <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'sales-orders\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
      
      <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 6px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính từ danh mục hàng">
      
      <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho từ mục 01">
      
      <input type="number" id="line-item-${l.lineId}-qty" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qty ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'qty')" onchange="updateLine('${l.lineId}', 'qty', this.value, 'number')"`}>
      
      <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
      
      <input 
        type="text" 
        id="line-item-${l.lineId}-unitPrice"
        inputmode="numeric"
        class="form-input" 
        style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" 
        value="${(l.unitPrice ?? 0).toLocaleString('vi-VN')}" 
        ${isView ? 'readonly' : `
          onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'unitPrice')"
          onfocus="this.value = parseNumberInput(this.value) || ''" 
          onblur="this.value = formatVNDInput(this.value)" 
          onchange="updateLine('${l.lineId}', 'unitPrice', parseNumberInput(this.value), 'number')"
        `}
      >
      
      <input type="number" id="line-item-${l.lineId}-discount" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.discount ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'discount')" onchange="updateLine('${l.lineId}', 'discount', this.value, 'number')"`}>
      
      <input type="number" id="line-item-${l.lineId}-tax" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.tax ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'tax')" onchange="updateLine('${l.lineId}', 'tax', this.value, 'number')"`}>
      
      <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500; font-size: 12px;">${fmtUSD(lineTotal)}</div>
      ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
    </div>
  `;
  }).join('');

  c.innerHTML = `
    <div style="max-width: 1050px;">
      ${getBreadcrumb('Đơn bán hàng', isView ? `Xem ${d.id || ''}` : (isEdit ? `Chỉnh sửa ${d.id || ''}` : 'Tạo đơn bán hàng mới'), 'sales-orders')}
      <form onsubmit="event.preventDefault(); saveForm('sales-orders');">
        
        <input type="hidden" value="${d.id || ''}">

        <div class="section-panel">
          <div class="section-header">
            <span class="section-num">01</span>
            <span class="section-title">Thông tin đơn bán hàng</span>
          </div>
          <div class="section-body grid-3">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Khách hàng *</label>
              <select class="form-select" ${(isView || isEdit) ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="handleCustomerSelectInOrder(this.value)"'} required>
                <option value="">-- Chọn khách hàng --</option>
                ${customerOptions}
              </select>
              ${d.quotationId ? `<div style="font-size: 11px; color: var(--primary); font-family: var(--font-dm-mono); margin-top: 4px;">✔ Đã tự động áp dụng Báo giá: ${d.quotationId}</div>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Mã kho (Xuất kho) *</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'warehouseCode\', this.value)"'} required>
                ${warehouseOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                <option value="processing" ${d.status === 'processing' ? 'selected' : ''}>Đang xử lý</option>
                <option value="pending" ${d.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
                <option value="cancelled" ${d.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày tạo đơn *</label>
              <input type="date" class="form-input" value="${d.date || getTodayDateStr()}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'date\', this.value)"'} required>
            </div>
            <div class="form-group" style="grid-column: span 3;">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-textarea" rows="2" style="resize: vertical; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" ${isView ? 'readonly' : 'onchange="updateField(\'notes\', this.value)"'} placeholder="Nhập ghi chú đơn hàng (tùy chọn)...">${d.notes || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px;">
              <span class="section-num">02</span>
              <span class="section-title">Danh mục sản phẩm</span>
            </div>
            ${!isView ? `<button type="button" class="btn-action" onclick="addLineItem('sales-orders')">${Icons.plus} Thêm dòng</button>` : ''}
          </div>
          
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 1000px;">
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tên sản phẩm</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">ĐVT</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Kho</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Số Lượng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tồn</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Đơn giá</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Chiết Khấu %</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thuế %</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thành tiền</span>
              ${!isView ? `<span></span>` : ''}
            </div>

            <div style="min-width: 900px;">
              ${linesHtml}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; padding: 16px 24px;">
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 260px;">
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Tạm tính</span><span style="font-family: var(--font-dm-mono);">${fmtUSD(d.subtotal)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Chiết khấu</span><span style="font-family: var(--font-dm-mono);">-${fmtUSD(d.discountTotal)}</span></div>
              <div style="display: flex; justify-content: space-between;"><span class="form-label">Tổng Thuế</span><span style="font-family: var(--font-dm-mono);">${fmtUSD(d.tax)}</span></div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 2px;"><span class="form-label" style="font-weight: 600;">Tổng cộng</span><span style="font-family: var(--font-dm-mono); font-size: 15px; color: var(--primary); font-weight: 500;">${fmtUSD(d.total)}</span></div>
            </div>
          </div>
        </div>

        <div class="action-bar" style="display: flex; justify-content: space-between; align-items: center;">
          <button type="button" class="btn-cancel" onclick="navigate('sales-orders')">${isView ? 'Quay lại' : 'Hủy'}</button>
          <div style="display: flex; gap: 8px;">
            ${isView ? `<button type="button" class="btn-primary" onclick="exportSalesOrderToPDF()" style="background: #e11d48; color: #ffffff; padding: 8px 16px; cursor: pointer;">
              Xuất PDF
            </button>` : ''}
            ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Tạo đơn hàng' : 'Cập nhật'}</button>` : ''}
          </div>
        </div>
      </form>
    </div>
  `;
}

function renderReturnForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  const isEdit = state.mode === 'edit';
  const hasOrder = Boolean(d.orderId);

  d.lineItems = Array.isArray(d.lineItems) ? d.lineItems : [];
  d.total = d.lineItems.reduce((s, l) => s + ((l.qtyReturned || 0) * (l.unitPrice || 0)), 0);

  if (!d.warehouseCode && db.warehouses.length > 0) {
    d.warehouseCode = db.warehouses[0].code || db.warehouses[0].id;
  }

  const warehouseOptions = (db.warehouses || []).map(w => {
    const wCode = w.code || w.id;
    return `<option value="${wCode}" ${d.warehouseCode === wCode ? 'selected' : ''}>${wCode} - ${w.name}</option>`;
  }).join('');

  const customerOptions = (db.customers || []).map(cust =>
    `<option value="${cust.name || ''}" ${d.customer === cust.name ? 'selected' : ''}>${cust.name || ''}</option>`
  ).join('');

  const orderOptions = (db.orders || []).map(o =>
    `<option value="${o.id}" ${d.orderId === o.id ? 'selected' : ''}>${o.id} - ${o.customer || 'Khách không tên'}</option>`
  ).join('');

  const gridLayout = isView ? "90px 1fr 65px 75px 65px 65px 100px 110px" : "90px 1fr 65px 75px 65px 65px 100px 110px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
      <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
        <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng không cho sửa">
        
        <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'returns\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
        
        <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính lấy từ Material">
        
        <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho lấy từ mục 01 xuống">
        
        <input type="number" id="line-item-${l.lineId}-qtyReturned" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qtyReturned ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'returns', ${idx}, 'qtyReturned')" onchange="updateLine('${l.lineId}', 'qtyReturned', this.value, 'number')"`}>
        
        <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
        
        <input 
          type="text" 
          id="line-item-${l.lineId}-unitPrice"
          inputmode="numeric"
          class="form-input" 
          style="padding: 6px 6px; text-align: right; ${(isView || hasOrder) ? 'background: var(--muted); cursor: not-allowed;' : ''}" 
          value="${(l.unitPrice ?? 0).toLocaleString('vi-VN')}" 
          ${(isView || hasOrder) ? 'readonly' : `
            onkeydown="handleLineItemKeyDown(event, 'returns', ${idx}, 'unitPrice')"
            onfocus="this.value = parseNumberInput(this.value) || ''" 
            onblur="this.value = formatVNDInput(this.value)" 
            onchange="updateLine('${l.lineId}', 'unitPrice', parseNumberInput(this.value), 'number')"
          `}
        >
        
        <div style="font-family: var(--font-dm-mono); text-align: right; color: #f87171; font-weight: 500; font-size: 12px;">${fmtUSD((l.qtyReturned || 0) * (l.unitPrice || 0))}</div>
        ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
      </div>
    `;
  }).join('');

  c.innerHTML = `
    <div style="max-width: 1050px;">
      ${getBreadcrumb('Đổi trả hàng bán', isView ? `Xem ${d.id}` : (isEdit ? `Chỉnh sửa ${d.id}` : 'Tạo phiếu đổi trả mới'), 'returns')}
      <form onsubmit="event.preventDefault(); saveForm('returns');">
        <div class="section-panel">
          <div class="section-header"><span class="section-num">01</span><span class="section-title">Thông tin phiếu đổi trả</span></div>
          <div class="section-body grid-3">
            <div class="form-group">
              <label class="form-label">Đơn hàng bán (Tùy chọn)</label>
              <select class="form-select" ${(isView || isEdit) ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="handleOrderSelectInReturn(this.value)"'}>
                <option value="">-- Không theo đơn hàng --</option>
                ${orderOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tên khách hàng *</label>
              <select class="form-select" ${(isView || isEdit || hasOrder) ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'customer\', this.value)"'} required>
                <option value="">-- Chọn khách hàng --</option>
                ${customerOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mã kho *</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'warehouseCode\', this.value)"'} required>
                ${warehouseOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Lý do *</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'reason\', this.value)"'}>
                ${['Hàng lỗi/hỏng', 'Giao nhầm sản phẩm', 'Đặt hàng thừa', 'Hủy đơn hàng', 'Hư hỏng do vận chuyển', 'Khác'].map(w => `<option value="${w}" ${d.reason === w ? 'selected' : ''}>${w}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày đổi trả *</label>
              <input type="date" class="form-input" value="${d.date || getTodayDateStr()}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'date\', this.value)"'} required>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="processed" ${d.status === 'processed' ? 'selected' : ''}>Đã xử lý</option>
                <option value="approved" ${d.status === 'approved' ? 'selected' : ''}>Đã duyệt</option>
                <option value="pending" ${d.status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                <option value="rejected" ${d.status === 'rejected' ? 'selected' : ''}>Từ chối</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 3;">
              <label class="form-label">Ghi chú nhập tay</label>
              <textarea class="form-textarea" rows="2" style="resize: vertical; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" ${isView ? 'readonly' : 'onchange="updateField(\'notes\', this.value)"'} placeholder="Nhập ghi chú chi tiết...">${d.notes || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px;"><span class="section-num">02</span><span class="section-title">Danh sách hàng đổi trả</span></div>
            ${!isView ? `<button type="button" class="btn-action" onclick="addLineItem('returns')">${Icons.plus} Thêm dòng</button>` : ''}
          </div>
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 850px;">
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tên Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">ĐVT</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Kho</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">SL Trả Lại</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tồn</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Đơn giá</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thành tiền</span>
              ${!isView ? `<span></span>` : ''}
            </div>

            <div style="min-width: 850px;">
              ${linesHtml}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; padding: 16px 24px;">
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; min-width: 260px;"><span class="form-label" style="font-weight: 600;">Tổng hoàn tiền</span><span style="font-family: var(--font-dm-mono); font-size: 15px; color: #f87171; font-weight: 500;">${fmtUSD(d.total)}</span></div>
          </div>
        </div>

        <div class="action-bar">
          <button type="button" class="btn-cancel" onclick="navigate('returns')">${isView ? 'Quay lại' : 'Hủy'}</button>
          ${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Tạo phiếu đổi trả' : 'Cập nhật'}</button>` : ''}
        </div>
      </form>
    </div>
  `;
}

function renderGRNForm(c) {
  const d = state.formData || {};
  const isView = state.mode === 'view';
  d.lineItems = Array.isArray(d.lineItems) ? d.lineItems : [];

  if (!d.warehouseCode && db.warehouses.length > 0) {
    d.warehouseCode = db.warehouses[0].code || db.warehouses[0].id;
  }

  d.lineItems.forEach(l => {
    l.warehouseCode = d.warehouseCode;
  });

  d.totalValue = d.lineItems.reduce((s, l) => s + ((l.receivedQty || l.qtyImport || 0) * (l.unitCost || 0)), 0);

  const warehouseOptions = (db.warehouses || []).map(w => {
    const wCode = w.code || w.id;
    return `<option value="${wCode}" ${d.warehouseCode === wCode ? 'selected' : ''}>${wCode} - ${w.name}</option>`;
  }).join('');

  const gridLayout = isView ? "90px 1fr 65px 75px 65px 65px 100px 110px" : "90px 1fr 65px 75px 65px 65px 100px 110px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);
    const qtyVal = l.receivedQty ?? l.qtyImport ?? 1;

    return `
      <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
        <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động điền theo tên hàng">
        
        <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'grn\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
        
        <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính lấy từ danh mục">
        
        <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho từ mục 01 xuống">
        
        <input type="number" id="line-item-${l.lineId}-receivedQty" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${qtyVal}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'grn', ${idx}, 'receivedQty')" onchange="updateLine('${l.lineId}', 'receivedQty', this.value, 'number'); updateLine('${l.lineId}', 'qtyImport', this.value, 'number');"`}>
        
        <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế tính tự động">
        
        <input 
          type="text" 
          id="line-item-${l.lineId}-unitCost"
          inputmode="numeric"
          class="form-input" 
          style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" 
          value="${(l.unitCost ?? 0).toLocaleString('vi-VN')}" 
          ${isView ? 'readonly' : `
            onkeydown="handleLineItemKeyDown(event, 'grn', ${idx}, 'unitCost')"
            onfocus="this.value = parseNumberInput(this.value) || ''" 
            onblur="this.value = formatVNDInput(this.value)" 
            onchange="updateLine('${l.lineId}', 'unitCost', parseNumberInput(this.value), 'number')"
          `}
        >
        
        <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500; font-size: 12px;">${fmtUSD((qtyVal) * (l.unitCost || 0))}</div>
        ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
      </div>
    `;
  }).join('');

  c.innerHTML = `
    <div style="max-width: 1050px;">
      ${getBreadcrumb('Phiếu nhập kho', isView ? `Xem ${d.id}` : (state.mode === 'edit' ? `Chỉnh sửa ${d.id}` : 'Tạo phiếu nhập kho mới'), 'grn')}
      <form onsubmit="event.preventDefault(); saveForm('grn');">
        <div class="section-panel">
          <div class="section-header"><span class="section-num">01</span><span class="section-title">Chi tiết nhập kho</span></div>
          <div class="section-body grid-3">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Nhà cung cấp *</label>
              <input type="text" class="form-input" value="${d.supplier || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'supplier\', this.value)"'} placeholder="Nhập tên nhà cung cấp..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Mã kho *</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'warehouseCode\', this.value)"'} required>
                ${warehouseOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ngày nhập kho *</label>
              <input type="date" class="form-input" value="${d.date || getTodayDateStr()}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'date\', this.value)"'} required>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'status\', this.value)"'}>
                <option value="Đã nhận" ${d.status === 'Đã nhận' || d.status === 'received' ? 'selected' : ''}>Đã nhận</option>
                <option value="Bản nháp" ${d.status === 'Bản nháp' || d.status === 'draft' ? 'selected' : ''}>Bản nháp</option>
                <option value="Đã xác minh" ${d.status === 'Đã xác minh' || d.status === 'verified' ? 'selected' : ''}>Đã xác minh</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 3;">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-textarea" rows="2" style="resize: vertical; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" ${isView ? 'readonly' : 'onchange="updateField(\'notes\', this.value)"'} placeholder="Nhập ghi chú phiếu nhập kho...">${d.notes || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="section-panel">
          <div class="section-header" style="justify-content: space-between;">
            <div style="display:flex; gap:10px;"><span class="section-num">02</span><span class="section-title">Danh sách hàng thực nhận</span></div>
            ${!isView ? `<button type="button" class="btn-action" onclick="addLineItem('grn')">${Icons.plus} Thêm dòng</button>` : ''}
          </div>
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 850px;">
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tên Hàng</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">ĐVT</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Mã Kho</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">SL Nhập</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Tồn</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Giá nhập</span>
              <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; text-align: center;">Thành tiền</span>
              ${!isView ? `<span></span>` : ''}
            </div>

            <div style="min-width: 850px;">
              ${linesHtml}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; padding: 16px 24px;">
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; min-width: 260px;"><span class="form-label" style="font-weight: 600;">Tổng giá trị</span><span style="font-family: var(--font-dm-mono); font-size: 15px; color: var(--primary); font-weight: 500;">${fmtUSD(d.totalValue)}</span></div>
          </div>
        </div>

        <div class="action-bar"><button type="button" class="btn-cancel" onclick="navigate('grn')">${isView ? 'Quay lại' : 'Hủy'}</button>${!isView ? `<button type="submit" class="btn-submit">${state.mode === 'add' ? 'Tạo phiếu nhập' : 'Cập nhật'}</button>` : ''}</div>
      </form>
    </div>
  `;
}

function renderReportInventory(c) {
  const materials = db.materials;
  const hasPermission = checkModulePermission('materials');

  if (state.reportInvSearch === undefined) state.reportInvSearch = '';
  if (!state.reportInvLimit) state.reportInvLimit = 20;

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
  const visibleList = filtered.slice(0, state.reportInvLimit);

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

  const headersHtml = ['Mã Hàng (SKU)', 'Tên Sản Phẩm', 'ĐVT', 'Danh Mục', 'Vị Trí', 'Tồn Đầu Kỳ', 'Tồn Thực Tế', 'Tạm Giữ', 'Có Thể Bán', 'Mức Cảnh Báo', 'Giá Vốn', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const renderRows = (list) => {
    return list.map(m => {
      const tonThucTe = getActualStock(m);
      const tonDauKy = m.stock ?? 0;
      const tamGiu = m.reserved ?? 0;
      const coTheBan = tonThucTe - tamGiu;

      return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', '${hasPermission ? 'edit' : 'view'}', '${m.id}')" onclick="navigate('materials', 'view', '${m.id}')">
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
        <td style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tonDauKy}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; font-weight: 600; color: var(--primary);">${tonThucTe}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tamGiu}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${coTheBan}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${m.reorder ?? 0}</td>
        <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
        <td style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'Đủ hàng' : m.status}</span></td>
        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          ${hasPermission ? `<button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>` : `<button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'view', '${m.id}')">${Icons.view} Xem</button>`}
          ${hasPermission ? `<button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>` : ''}
        </td>
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
            <!-- Ô TÌM KIẾM DÙNG SỰ KIỆN CẬP NHẬT ĐỘNG, GIỮ NGUYÊN FOCUS CON TRỎ -->
            <div style="display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--secondary); padding: 0 10px; border-radius: 2px; width: 220px;">
              <span style="color: var(--muted-foreground);">${Icons.search}</span>
              <input type="text" id="report-inv-search-input" placeholder="Tìm mã, tên hàng..." value="${state.reportInvSearch}" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 12px; width: 100%; padding: 6px 0;">
            </div>

            <div style="display: flex; gap: 1px;">
              ${['all', ...categories].map(cat => `
                <button onclick="state.filter='${cat}'; state.reportInvLimit=20; render();" style="padding: 5px 12px; font-family: var(--font-dm-mono); font-size: 10px; text-transform: uppercase; background: ${state.filter === cat ? 'var(--primary)' : 'var(--muted)'}; color: ${state.filter === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer;">${cat === 'all' ? 'Tất cả' : cat}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <div style="padding: 8px 20px 4px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); background: var(--secondary);">
          <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);" id="report-inv-summary-text">
            Đang hiển thị <strong>${visibleList.length}/${filtered.length}</strong> mặt hàng · Tổng giá trị: <strong style="color: var(--primary);">${fmtUSD(totalVal)}</strong> · Đã tạm giữ: ${fmtUSD(reservedVal)} · Cảnh báo: ${alertCount}
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

        <div id="report-inv-loadmore-btn" style="padding: 16px; text-align: center; border-top: 1px solid var(--border); background: var(--secondary); display: ${visibleList.length < filtered.length ? 'block' : 'none'};">
          <button onclick="state.reportInvLimit += 10; render();" style="padding: 8px 24px; background: var(--primary); color: var(--primary-foreground); border: none; font-family: var(--font-dm-mono); font-size: 11px; font-weight: 600; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            Tải thêm 10 mã hàng ➔
          </button>
        </div>

      </div>
    </div>
  `;

  // Xử lý ô Tìm kiếm không bị giật / mất focus khi nhập
  const searchInput = document.getElementById('report-inv-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.reportInvSearch = e.target.value;
      state.reportInvLimit = 20;

      const newFiltered = getFilteredList();
      const newVisible = newFiltered.slice(0, state.reportInvLimit);
      const newTotalVal = newFiltered.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0);
      const newReservedVal = newFiltered.reduce((s, m) => s + (m.reserved || 0) * (m.cost || 0), 0);
      const newAlertCount = newFiltered.filter(m => ['low', 'critical', 'out'].includes(m.status)).length;

      // Cập nhật tbody
      const tbody = document.getElementById('report-inv-tbody');
      if (tbody) tbody.innerHTML = renderRows(newVisible);

      // Cập nhật dòng tổng kết
      const summaryText = document.getElementById('report-inv-summary-text');
      if (summaryText) {
        summaryText.innerHTML = `Đang hiển thị <strong>${newVisible.length}/${newFiltered.length}</strong> mặt hàng · Tổng giá trị: <strong style="color: var(--primary);">${fmtUSD(newTotalVal)}</strong> · Đã tạm giữ: ${fmtUSD(newReservedVal)} · Cảnh báo: ${newAlertCount}`;
      }

      // Cập nhật ẩn/hiển thị thông báo rỗng & nút tải thêm
      const emptyMsg = document.getElementById('report-inv-empty-msg');
      if (emptyMsg) emptyMsg.style.display = newFiltered.length === 0 ? 'block' : 'none';

      const loadMoreBtn = document.getElementById('report-inv-loadmore-btn');
      if (loadMoreBtn) loadMoreBtn.style.display = newVisible.length < newFiltered.length ? 'block' : 'none';
    });
  }

  // Tự động lazy load khi cuộn trang
  setTimeout(() => {
    const contentBox = document.getElementById('app-content');
    if (contentBox && !contentBox.dataset.lazyBound) {
      contentBox.addEventListener('scroll', () => {
        if (state.view === 'report-inventory') {
          const scrollBottom = contentBox.scrollHeight - contentBox.scrollTop - contentBox.clientHeight;
          if (scrollBottom < 100) {
            const currentFiltered = getFilteredList();
            if (state.reportInvLimit < currentFiltered.length) {
              state.reportInvLimit += 10;
              render();
            }
          }
        }
      });
      contentBox.dataset.lazyBound = 'true';
    }
  }, 100);
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

  const customersHtml = topCustomersReal.slice(0, 5).map((cus, i) => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); width: 28px;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding: 9px 14px; font-size: 13px;">${cus.name}</td>
      <td style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(cus.revenue)}</td>
      <td style="padding: 9px 14px; font-family: var(--font-dm-mono); font-size: 11px; text-align: right; color: var(--muted-foreground);">${cus.orders} đơn</td>
    </tr>
  `).join('');

  const detailHeaders = ['Mã Hàng (SKU)', 'Tên Hàng Hóa', 'Tổng Số Lượng', 'Tổng Số Tiền']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Tổng Số Lượng' || h === 'Tổng Số Tiền' ? 'right' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const detailRows = detailItemsList.map(item => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${item.sku}</td>
      <td style="padding: 11px 16px; font-size: 13px; font-weight: 500;">${item.name}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmt(item.qty)}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right; color: var(--primary);">${fmtUSD(item.totalAmount)}</td>
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

      <!-- BẢNG THỐNG KÊ CHI TIẾT THEO KHÁCH HÀNG (GỘP HEADER TIÊU ĐỀ & BỘ LỌC CẢM ỨNG) -->
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
              <select class="form-select" style="width: 110px; padding: 5px 8px; font-size: 12px;" onchange="state.reportSalesMonth=this.value; render();">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${selectedMonthNum === (i + 1) ? 'selected' : ''}>Tháng ${i + 1}</option>`).join('')}
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <label style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase;">Khách hàng:</label>
              <select class="form-select" style="width: 200px; padding: 5px 8px; font-size: 12px;" onchange="state.reportSalesCustomer=this.value; render();">
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

// ==========================================
// HÀM BỔ TRỢ CHUNG: TẠO VÀ CHIA SẺ FILE PDF QUA ZALO / TẢI VỀ PC
// ==========================================
async function generateAndSharePDF(htmlElement, fileName, shareTitle) {
  if (typeof html2pdf === 'undefined') {
    showAlert('Thư viện html2pdf chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const fullFileName = `${fileName}.pdf`;
  const opt = {
    margin: [10, 10, 10, 10],
    filename: fullFileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const worker = html2pdf().set(opt).from(htmlElement);
    const pdfBlob = await worker.output('blob');
    const file = new File([pdfBlob], fullFileName, { type: 'application/pdf' });

    // Kiểm tra & Kích hoạt chia sẻ qua Zalo/Ứng dụng trên di động
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: `Gửi ${shareTitle} qua Zalo`
        });
        return;
      } catch (shareErr) {
        if (shareErr.name !== 'AbortError') console.warn('Lỗi khi chia sẻ:', shareErr);
      }
    }

    // Tải trực tiếp file PDF về máy nếu dùng PC
    html2pdf().set(opt).from(htmlElement).save();
  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    showAlert('Có lỗi xảy ra trong quá trình tạo file PDF!', 'Lỗi');
  }
}

// ==========================================
// 1. XUẤT PDF BẢNG BÁO GIÁ
// ==========================================
async function exportQuotationToPDF() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const fromDateVN = formatDateVN(d.validbegin || d.validBegin || d.date);
  const toDateVN = formatDateVN(d.validUntil || d.validuntil);
  const items = (d.lineItems || d.lineitems || []);

  let totalQty = 0;
  let totalAmount = 0;

  const maxRows = Math.max(items.length, 12);
  let rowsHtml = '';

  for (let i = 0; i < maxRows; i++) {
    if (i < items.length) {
      const l = items[i];
      const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
      const unitName = mat ? (mat.unit || '—') : (l.unit || '—');
      const qty = Number(l.qty) || 0;
      const price = Number(l.unitPrice) || 0;
      const discount = Number(l.discount) || 0;
      const tax = Number(l.tax) || 0;

      const lineSub = qty * price * (1 - discount / 100);
      const lineTotal = lineSub * (1 + tax / 100);

      totalQty += qty;
      totalAmount += lineTotal;

      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${i + 1}</td>
          <td style="border: 1px solid #000; text-align: left; font-size: 11pt; padding: 3px 6px;">${l.name || ''}</td>
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${unitName}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${discount ? discount + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${tax ? tax + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
        </tr>
      `;
    } else {
      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
        </tr>
      `;
    }
  }

  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.boxSizing = 'border-box';
  container.style.padding = '10px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Times New Roman', serif";

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <tr>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
          Xã Sơn Đồng – TP Hà Nội<br>
          ĐT: 0936.35.31.37
        </td>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          Giấy phép ĐKKD số: 01U8005300<br>
          Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
          MST: 0110640531
        </td>
      </tr>
    </table>

    <div style="font-size: 16pt; font-weight: bold; text-align: center; margin: 15px 0 12px 0;">
      CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
    </div>

    <table style="width: 100%; font-size: 11pt; margin-bottom: 12px; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 3px 0;">Khách hàng: ${d.customer || ''}</td>
        <td style="width: 50%; padding: 3px 0;">Bảng báo giá: ${d.id || ''}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0;">Địa chỉ: ${custAddress}</td>
        <td style="padding: 3px 0;">Ngày hiệu lực: từ ngày ${fromDateVN} - đến ngày ${toDateVN}</td>
      </tr>
    </table>

    <div style="border: 1.5px solid #000000; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: 1px solid #000000; font-size: 11pt;">
        <thead>
          <tr style="background-color: #8db4e2; font-weight: bold; text-align: center; height: 26px;">
            <td style="border: 1px solid #000000; width: 4%;">STT</td>
            <td style="border: 1px solid #000000; width: 32%;">Tên Hàng</td>
            <td style="border: 1px solid #000000; width: 8%;">ĐVT</td>
            <td style="border: 1px solid #000000; width: 12%;">Đơn Giá</td>
            <td style="border: 1px solid #000000; width: 11%;">Số Lượng</td>
            <td style="border: 1px solid #000000; width: 8%;">CK%</td>
            <td style="border: 1px solid #000000; width: 8%;">Thuế%</td>
            <td style="border: 1px solid #000000; width: 17%;">Thành Tiền</td>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="height: 26px; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #000000; text-align: center;">Tổng Cộng</td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
      <div style="width: 250px; text-align: center; font-size: 11pt;">
        <div>Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
        <div style="font-weight: bold; margin-top: 4px; margin-bottom: 55px;">Đại diện nhà cung cấp</div>
        <div style="font-weight: bold;">BÙI CAO NHÂM</div>
      </div>
    </div>
  `;

  await generateAndSharePDF(container, `BaoGia_${d.id || 'Export'}`, `Bảng Báo Giá ${d.id || ''}`);
}

// ==========================================
// 2. XUẤT PDF ĐƠN BÁN HÀNG
// ==========================================
async function exportSalesOrderToPDF() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const items = (d.lineItems || d.lineitems || []);

  let totalQty = 0;
  let totalAmount = 0;

  const maxRows = Math.max(items.length, 12);
  let rowsHtml = '';

  for (let i = 0; i < maxRows; i++) {
    if (i < items.length) {
      const l = items[i];
      const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
      const unitName = mat ? (mat.unit || '—') : (l.unit || '—');
      const qty = Number(l.qty) || 0;
      const price = Number(l.unitPrice) || 0;
      const discount = Number(l.discount) || 0;
      const tax = Number(l.tax) || 0;

      const lineSub = qty * price * (1 - discount / 100);
      const lineTotal = lineSub * (1 + tax / 100);

      totalQty += qty;
      totalAmount += lineTotal;

      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${i + 1}</td>
          <td style="border: 1px solid #000; text-align: left; font-size: 11pt; padding: 3px 6px;">${l.name || ''}</td>
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${unitName}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${discount ? discount + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${tax ? tax + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
        </tr>
      `;
    } else {
      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
        </tr>
      `;
    }
  }

  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.boxSizing = 'border-box';
  container.style.padding = '10px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Times New Roman', serif";

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <tr>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
          Xã Sơn Đồng – TP Hà Nội<br>
          ĐT: 0936.35.31.37
        </td>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          Giấy phép ĐKKD số: 01U8005300<br>
          Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
          MST: 0110640531
        </td>
      </tr>
    </table>

    <div style="font-size: 16pt; font-weight: bold; text-align: center; margin: 15px 0 12px 0;">
      CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
    </div>

    <table style="width: 100%; font-size: 11pt; margin-bottom: 12px; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 3px 0;">Khách hàng: ${d.customer || ''}</td>
        <td style="width: 50%; padding: 3px 0;">Đơn hàng bán: ${d.id || ''}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0;">Địa chỉ: ${custAddress}</td>
        <td style="padding: 3px 0;">Ghi chú: ${d.notes || ''}</td>
      </tr>
    </table>

    <div style="border: 1.5px solid #000000; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: 1px solid #000000; font-size: 11pt;">
        <thead>
          <tr style="background-color: #8db4e2; font-weight: bold; text-align: center; height: 26px;">
            <td style="border: 1px solid #000000; width: 4%;">STT</td>
            <td style="border: 1px solid #000000; width: 32%;">Tên Hàng</td>
            <td style="border: 1px solid #000000; width: 8%;">ĐVT</td>
            <td style="border: 1px solid #000000; width: 12%;">Đơn Giá</td>
            <td style="border: 1px solid #000000; width: 11%;">Số Lượng</td>
            <td style="border: 1px solid #000000; width: 8%;">CK%</td>
            <td style="border: 1px solid #000000; width: 8%;">Thuế%</td>
            <td style="border: 1px solid #000000; width: 17%;">Thành Tiền</td>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="height: 26px; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #000000; text-align: center;">Tổng Cộng</td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
      <div style="width: 250px; text-align: center; font-size: 11pt;">
        <div>Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
        <div style="font-weight: bold; margin-top: 4px; margin-bottom: 55px;">Đại diện nhà cung cấp</div>
        <div style="font-weight: bold;">BÙI CAO NHÂM</div>
      </div>
    </div>
  `;

  await generateAndSharePDF(container, `DonHang_${d.id || 'Export'}`, `Đơn Bán Hàng ${d.id || ''}`);
}

// ==========================================
// 1. Xuất Excel Báo Giá (ĐÃ NÂNG CẤP XUẤT .XLSX & CHIA SẺ ZALO)
// ==========================================
function exportQuotationToExcel() {
  const d = state.formData;
  if (!d) return;

  if (typeof XLSX === 'undefined') {
    showAlert('Thư viện XLSX chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const fromDateVN = formatDateVN(d.validbegin || d.validBegin || d.date);
  const toDateVN = formatDateVN(d.validUntil || d.validuntil);

  // Tạo mảng dữ liệu 2 chiều cho SheetJS
  const sheetData = [
    ["ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1", "", "", "", "Giấy phép ĐKKD số: 01U8005300", "", "", ""],
    ["Xã Sơn Đồng – TP Hà Nội", "", "", "", "Địa chỉ nhận hóa đơn: nhambc@gmail.com", "", "", ""],
    ["ĐT: 0936.35.31.37", "", "", "", "MST: 0110640531", "", "", ""],
    ["CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ", "", "", "", "", "", "", ""],
    [`Khách hàng: ${d.customer || ''}`, "", "", "", `Bảng báo giá: ${d.id || ''}`, "", "", ""],
    [`Địa chỉ: ${custAddress}`, "", "", "", `Ngày hiệu lực: từ ngày ${fromDateVN} - đến ngày ${toDateVN}`, "", "", ""],
    [""], // Dòng trống
    ["STT", "Tên Hàng", "ĐVT", "Đơn Giá", "Số Lượng", "CK%", "Thuế%", "Thành Tiền"]
  ];

  let totalQty = 0;
  let totalAmount = 0;
  const items = (d.lineItems || d.lineitems || []);

  items.forEach((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : (l.unit || '—');
    const qty = Number(l.qty) || 0;
    const price = Number(l.unitPrice) || 0;
    const discount = Number(l.discount) || 0;
    const tax = Number(l.tax) || 0;

    const lineSub = qty * price * (1 - discount / 100);
    const lineTotal = lineSub * (1 + tax / 100);

    totalQty += qty;
    totalAmount += lineTotal;

    sheetData.push([
      idx + 1,
      l.name || '',
      unitName,
      price,
      qty,
      `${discount}%`,
      `${tax}%`,
      Math.round(lineTotal)
    ]);
  });

  // Thêm dòng Tổng cộng và Chữ ký
  sheetData.push(
    ["Tổng Cộng", "", "", "", totalQty, "", "", Math.round(totalAmount)],
    [""],
    ["", "", "", "", "", `Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", ""],
    ["", "", "", "", "", "Đại diện nhà cung cấp", "", ""],
    [""],
    [""],
    ["", "", "", "", "", "BÙI CAO NHÂM", "", ""]
  );

  // Tạo Worksheet và thêm Merges ô
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Tiêu đề công ty
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    { s: { r: sheetData.length - 7, c: 0 }, e: { r: sheetData.length - 7, c: 3 } }, // Tổng cộng label
    { s: { r: sheetData.length - 5, c: 5 }, e: { r: sheetData.length - 5, c: 7 } }, // Ngày tháng
    { s: { r: sheetData.length - 4, c: 5 }, e: { r: sheetData.length - 4, c: 7 } }, // Chức danh
    { s: { r: sheetData.length - 1, c: 5 }, e: { r: sheetData.length - 1, c: 7 } }  // Tên người ký
  ];

  // Căn chỉnh độ rộng cột chuẩn
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 32 }, // Tên Hàng
    { wch: 10 }, // ĐVT
    { wch: 14 }, // Đơn Giá
    { wch: 10 }, // Số Lượng
    { wch: 8 },  // CK%
    { wch: 8 },  // Thuế%
    { wch: 16 }  // Thành Tiền
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BaoGia");

  // Tiến hành tải xuống hoặc mở bảng Share Zalo
  downloadOrShareXLSX(wb, `BaoGia_${d.id || 'Export'}`);
}

// ==========================================
// 2. Xuất Excel Đơn Bán Hàng (ĐÃ NÂNG CẤP XUẤT .XLSX & CHIA SẺ ZALO)
// ==========================================
function exportSalesOrderToExcel() {
  const d = state.formData;
  if (!d) return;

  if (typeof XLSX === 'undefined') {
    showAlert('Thư viện XLSX chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);

  const sheetData = [
    ["ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1", "", "", "", "Giấy phép ĐKKD số: 01U8005300", "", "", ""],
    ["Xã Sơn Đồng – TP Hà Nội", "", "", "", "Địa chỉ nhận hóa đơn: nhambc@gmail.com", "", "", ""],
    ["ĐT: 0936.35.31.37", "", "", "", "MST: 0110640531", "", "", ""],
    ["CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ", "", "", "", "", "", "", ""],
    [`Khách hàng: ${d.customer || ''}`, "", "", "", `Đơn hàng bán: ${d.id || ''}`, "", "", ""],
    [`Địa chỉ: ${custAddress}`, "", "", "", `Ghi chú: ${d.notes || ''}`, "", "", ""],
    [""], // Dòng trống
    ["STT", "Tên Hàng", "ĐVT", "Đơn Giá", "Số Lượng", "CK%", "Thuế%", "Thành Tiền"]
  ];

  let totalQty = 0;
  let totalAmount = 0;
  const items = (d.lineItems || d.lineitems || []);

  items.forEach((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : (l.unit || '—');
    const qty = Number(l.qty) || 0;
    const price = Number(l.unitPrice) || 0;
    const discount = Number(l.discount) || 0;
    const tax = Number(l.tax) || 0;

    const lineSub = qty * price * (1 - discount / 100);
    const lineTotal = lineSub * (1 + tax / 100);

    totalQty += qty;
    totalAmount += lineTotal;

    sheetData.push([
      idx + 1,
      l.name || '',
      unitName,
      price,
      qty,
      `${discount}%`,
      `${tax}%`,
      Math.round(lineTotal)
    ]);
  });

  sheetData.push(
    ["Tổng Cộng", "", "", "", totalQty, "", "", Math.round(totalAmount)],
    [""],
    ["", "", "", "", "", `Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", ""],
    ["", "", "", "", "", "Đại diện nhà cung cấp", "", ""],
    [""],
    [""],
    ["", "", "", "", "", "BÙI CAO NHÂM", "", ""]
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    { s: { r: sheetData.length - 7, c: 0 }, e: { r: sheetData.length - 7, c: 3 } },
    { s: { r: sheetData.length - 5, c: 5 }, e: { r: sheetData.length - 5, c: 7 } },
    { s: { r: sheetData.length - 4, c: 5 }, e: { r: sheetData.length - 4, c: 7 } },
    { s: { r: sheetData.length - 1, c: 5 }, e: { r: sheetData.length - 1, c: 7 } }
  ];

  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DonHang");

  downloadOrShareXLSX(wb, `DonHang_${d.id || 'Export'}`);
}

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
});