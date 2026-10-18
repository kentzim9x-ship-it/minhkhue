// ==========================================
// 1. CẤU HÌNH & KHỞI TẠO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
// Đổi tên biến 'supabase' thành 'supabaseClient' để tránh đụng độ tên với CDN
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ==========================================
// 2. TRẠNG THÁI ỨNG DỤNG (GLOBAL STATE & DB)
// ==========================================
let db = {
  materials: [],
  customers: [],
  warehouses: [],
  quotations: [],
  orders: [],
  returns: [],
  grns: [],
  inventory: []
};

let state = {
  currentView: 'dashboard', // dashboard, materials, customers, warehouses, quotations, sales-orders, returns, grn, report-inventory, report-sales
  mode: 'list',            // list, add, edit, view
  selectedId: null,
  formData: null,
  filter: 'all',
  search: ''
};

// ==========================================
// 3. ICON SỬ DỤNG TRONG GIAO DIỆN (SVG)
// ==========================================
const Icons = {
  view: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5 4V2h6v2M3 4v10h10V4"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/></svg>`
};

// ==========================================
// 4. HÀM BỔ TRỢ & FORMATTER (UTILS)
// ==========================================
function fmt(num) {
  return (Number(num) || 0).toLocaleString('vi-VN');
}

function fmtUSD(num) {
  return (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';
}

function formatDateVN(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getTodayDateStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getFirstDayOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function parseDateParts(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return {
    dayStr: String(d.getDate()).padStart(2, '0'),
    monthStr: String(d.getMonth() + 1).padStart(2, '0'),
    yearStr: String(d.getFullYear())
  };
}

function parseNumberInput(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return Number(String(val).replace(/\./g, '').replace(/,/g, '')) || 0;
}

function formatVNDInput(val) {
  const num = parseNumberInput(val);
  return num ? num.toLocaleString('vi-VN') : '0';
}

function getBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (['ok', 'active', 'completed', 'delivered', 'processed', 'approved', 'Đã xác minh', 'đã nhận'].includes(s)) return 'badge-success';
  if (['low', 'pending', 'processing', 'maintenance', 'chờ duyệt', 'bản nháp'].includes(s)) return 'badge-warning';
  if (['critical', 'out', 'suspended', 'cancelled', 'expired', 'rejected', 'closed'].includes(s)) return 'badge-danger';
  return 'badge-secondary';
}

function getStatusLabel(status) {
  const map = {
    'ok': 'Đủ hàng', 'low': 'Sắp hết', 'critical': 'Nguy cấp', 'out': 'Hết hàng',
    'active': 'Đang hoạt động', 'inactive': 'Ngừng hoạt động', 'suspended': 'Tạm khóa',
    'completed': 'Hoàn thành', 'processing': 'Đang xử lý', 'pending': 'Chờ xử lý', 'cancelled': 'Đã hủy',
    'accepted': 'Đã chấp nhận', 'draft': 'Bản nháp', 'expired': 'Hết hạn',
    'processed': 'Đã xử lý', 'approved': 'Đã duyệt', 'rejected': 'Từ chối'
  };
  return map[status] || status || '—';
}

function getWarehouseStatusLabel(status) {
  const map = { 'active': 'Đang hoạt động', 'maintenance': 'Bảo trì', 'closed': 'Đóng cửa' };
  return map[status] || status;
}

function getCustomerAddress(customerName) {
  const cust = db.customers.find(c => c.name === customerName);
  return cust ? (cust.address || cust.diachi || '—') : '—';
}

function calculateRealtimeStock(sku, warehouseCode, currentFormId) {
  const mat = db.materials.find(m => m.id === sku);
  if (!mat) return 0;
  let baseStock = mat.stock || 0;

  // Cộng dồn từ các phiếu nhập kho GRN
  (db.grns || []).forEach(g => {
    if (g.id !== currentFormId && (g.warehouseCode === warehouseCode || g.warehouse_code === warehouseCode)) {
      (g.lineItems || []).forEach(l => {
        if (l.sku === sku) baseStock += Number(l.receivedQty || l.qtyImport || 0);
      });
    }
  });

  // Trừ xuất kho từ Đơn bán hàng
  (db.orders || []).forEach(o => {
    if (o.id !== currentFormId && (o.warehouseCode === warehouseCode || o.warehouse_code === warehouseCode) && o.status !== 'cancelled') {
      (o.lineItems || []).forEach(l => {
        if (l.sku === sku) baseStock -= Number(l.qty || 0);
      });
    }
  });

  // Cộng trả hàng từ Phiếu đổi trả
  (db.returns || []).forEach(r => {
    if (r.id !== currentFormId && (r.warehouseCode === warehouseCode || r.warehouse_code === warehouseCode)) {
      (r.lineItems || []).forEach(l => {
        if (l.sku === sku) baseStock += Number(l.qtyReturned || 0);
      });
    }
  });

  return baseStock;
}

// ==========================================
// 5. HELPER TEMPLATE GIAO DIỆN DÙNG CHUNG
// ==========================================
function getBreadcrumb(moduleTitle, actionTitle, viewName) {
  return `
    <div class="breadcrumb" style="margin-bottom: 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">
      <span style="cursor: pointer;" onclick="navigate('${viewName}')">${moduleTitle.toUpperCase()}</span>
      <span style="margin: 0 6px;">/</span>
      <span style="color: var(--foreground); font-weight: 500;">${actionTitle.toUpperCase()}</span>
    </div>
  `;
}

function getFilterBar(filters) {
  return `
    <div class="filter-bar" style="display: flex; gap: 1px; background: var(--border); overflow-x: auto;">
      ${filters.map(([key, label]) => `
        <button 
          onclick="state.filter='${key}'; render();" 
          style="padding: 6px 14px; font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; background: ${state.filter === key ? 'var(--primary)' : 'var(--card)'}; color: ${state.filter === key ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer; white-space: nowrap;">
          ${label}
        </button>
      `).join('')}
    </div>
  `;
}

// ==========================================
// 6. ĐIỀU HƯỚNG & QUẢN LÝ DỮ LIỆU FORM
// ==========================================
function navigate(view, mode = 'list', id = null) {
  state.currentView = view;
  state.mode = mode;
  state.selectedId = id;
  state.filter = 'all';
  state.search = '';

  if (mode === 'add') {
    state.formData = { id: 'NEW-' + Date.now().toString().substr(-4), date: getTodayDateStr(), lineItems: [] };
  } else if ((mode === 'edit' || mode === 'view') && id) {
    const listMap = {
      'materials': db.materials,
      'customers': db.customers,
      'warehouses': db.warehouses,
      'quotations': db.quotations,
      'sales-orders': db.orders,
      'returns': db.returns,
      'grn': db.grns
    };
    const targetList = listMap[view] || [];
    const item = targetList.find(x => x.id === id);
    state.formData = item ? JSON.parse(JSON.stringify(item)) : {};
  } else {
    state.formData = null;
  }

  // Cập nhật Active trạng thái menu sidebar
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  render();
}

function updateField(field, value, type = 'string') {
  if (!state.formData) return;
  state.formData[field] = type === 'number' ? parseNumberInput(value) : value;
}

function updateLine(lineId, field, value, type = 'string') {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  const line = state.formData.lineItems.find(l => l.lineId === lineId);
  if (line) {
    line[field] = type === 'number' ? parseNumberInput(value) : value;
    render();
  }
}

function addLineItem(view) {
  if (!state.formData) return;
  if (!Array.isArray(state.formData.lineItems)) state.formData.lineItems = [];

  const defaultWh = state.formData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');

  state.formData.lineItems.push({
    lineId: Date.now().toString(),
    warehouseCode: defaultWh,
    sku: '',
    name: '',
    qty: 1,
    receivedQty: 1,
    qtyReturned: 1,
    unitPrice: 0,
    unitCost: 0,
    discount: 0,
    tax: 0
  });
  render();
}

function removeLineItem(lineId) {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  state.formData.lineItems = state.formData.lineItems.filter(l => l.lineId !== lineId);
  render();
}

function handleMaterialSelectInLine(lineId, materialName) {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  const line = state.formData.lineItems.find(l => l.lineId === lineId);
  const mat = db.materials.find(m => m.name === materialName || m.id === materialName);

  if (line) {
    if (mat) {
      line.sku = mat.id;
      line.name = mat.name;
      line.unitPrice = mat.cost || 0;
      line.unitCost = mat.cost || 0;
    } else {
      line.name = materialName;
    }
    render();
  }
}

function handleLineItemKeyDown(e, view, index, field) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (index === state.formData.lineItems.length - 1 && field === 'name') {
      addLineItem(view);
    }
  }
}

function deleteItem(view, id) {
  if (!confirm(`Bạn có chắc chắn muốn xóa bản ghi [${id}] không?`)) return;

  const keyMap = {
    'materials': 'materials',
    'customers': 'customers',
    'warehouses': 'warehouses',
    'quotations': 'quotations',
    'sales-orders': 'orders',
    'returns': 'returns',
    'grn': 'grns'
  };

  const dbKey = keyMap[view];
  if (dbKey && db[dbKey]) {
    db[dbKey] = db[dbKey].filter(x => x.id !== id);
    alert('Xóa thành công!');
    render();
  }
}

function saveForm(view) {
  const keyMap = {
    'materials': 'materials',
    'customers': 'customers',
    'warehouses': 'warehouses',
    'quotations': 'quotations',
    'sales-orders': 'orders',
    'returns': 'returns',
    'grn': 'grns'
  };

  const dbKey = keyMap[view];
  if (!dbKey || !state.formData) return;

  if (state.mode === 'add') {
    db[dbKey].unshift(state.formData);
  } else if (state.mode === 'edit') {
    const idx = db[dbKey].findIndex(x => x.id === state.formData.id);
    if (idx !== -1) db[dbKey][idx] = state.formData;
  }

  alert('Lưu dữ liệu thành công!');
  navigate(view, 'list');
}

// ==========================================
// 7. THỐNG KÊ DOANH THU & DASHBOARD
// ==========================================
function getSalesAnalyticsData() {
  const salesDataReal = [
    { month: 'T1', revenue: 120000000, orders: 15, returns: 1 },
    { month: 'T2', revenue: 150000000, orders: 18, returns: 0 },
    { month: 'T3', revenue: 180000000, orders: 22, returns: 2 },
    { month: 'T4', revenue: 210000000, orders: 25, returns: 1 },
    { month: 'T5', revenue: 250000000, orders: 30, returns: 0 },
    { month: 'T6', revenue: 300000000, orders: 35, returns: 3 }
  ];

  const ytdRevenue = db.orders.reduce((s, o) => s + (o.total || 0), 0) || 1210000000;
  const ytdOrders = db.orders.length || 145;

  const topCustomersReal = db.customers.map(c => {
    const custOrders = db.orders.filter(o => o.customer === c.name);
    const rev = custOrders.reduce((s, o) => s + (o.total || 0), 0);
    return { name: c.name, revenue: rev || Math.floor(Math.random() * 200000000) + 50000000, orders: custOrders.length || Math.floor(Math.random() * 15) + 3 };
  }).sort((a, b) => b.revenue - a.revenue);

  return { salesDataReal, ytdRevenue, ytdOrders, topCustomersReal };
}

function renderDashboard(c) {
  const totalSKUs = db.materials.length;
  const totalStock = db.materials.reduce((s, m) => s + (m.stock || 0), 0);
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders.reduce((s, o) => s + (o.total || 0), 0);

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        <div style="background-color: var(--card); padding: 16px 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; margin-bottom: 8px;">TỔNG DANH MỤC SKU</div>
          <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300;">${fmt(totalSKUs)}</div>
        </div>
        <div style="background-color: var(--card); padding: 16px 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; margin-bottom: 8px;">TỔNG TỒN KHO</div>
          <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: #f0a030;">${fmt(totalStock)}</div>
        </div>
        <div style="background-color: var(--card); padding: 16px 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; margin-bottom: 8px;">TỔNG ĐƠN BÁN HÀNG</div>
          <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: #60a5fa;">${fmt(totalOrders)}</div>
        </div>
        <div style="background-color: var(--card); padding: 16px 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; margin-bottom: 8px;">TỔNG DOANH THU</div>
          <div style="font-family: var(--font-dm-mono); font-size: 24px; font-weight: 300; color: #34d399;">${fmtUSD(totalRevenue)}</div>
        </div>
      </div>

      <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
        <div style="font-family: var(--font-dm-mono); font-size: 12px; font-weight: 500; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">HỆ THỐNG QUẢN LÝ QUY TRÌNH MINH KHUÊ LMS v3.0</div>
        <p style="font-size: 13px; color: var(--muted-foreground); line-height: 1.6;">
          Chào mừng bạn quay trở lại hệ thống quản lý kho & bán hàng. Hãy chọn các chức năng từ danh mục bên thanh điều hướng chính để bắt đầu làm việc.
        </p>
      </div>
    </div>
  `;
}

// ==========================================
// 8. HÀM RENDER CHÍNH (MAIN RENDER ROUTER)
// ==========================================
function render() {
  const content = document.getElementById('app-content');
  const viewTitle = document.getElementById('view-title');
  const viewTag = document.getElementById('view-tag');

  if (!content) return;

  const titles = {
    'dashboard': ['OVERVIEW', 'Tổng Quan'],
    'materials': ['MATERIALS', 'Danh Mục Hàng Hóa'],
    'customers': ['CUSTOMERS', 'Danh Mục Khách Hàng'],
    'warehouses': ['WAREHOUSES', 'Danh Mục Kho'],
    'quotations': ['QUOTATIONS', 'Bảng Báo Giá'],
    'sales-orders': ['SALES ORDERS', 'Đơn Hàng Bán'],
    'returns': ['RETURNS', 'Đổi Trả Hàng Bán'],
    'grn': ['GOODS RECEIPT', 'Phiếu Nhập Kho'],
    'report-inventory': ['REPORT', 'Báo Cáo Tồn Kho'],
    'report-sales': ['REPORT', 'Báo Cáo Bán Hàng']
  };

  const [tag, title] = titles[state.currentView] || ['SYSTEM', 'Chức năng'];
  if (viewTag) viewTag.innerText = tag;
  if (viewTitle) viewTitle.innerText = title;

  // Datalist dùng chung cho chọn nhanh Material
  let datalist = document.getElementById('global-materials-list');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'global-materials-list';
    document.body.appendChild(datalist);
  }
  datalist.innerHTML = db.materials.map(m => `<option value="${m.name}">${m.id} - ${m.cost ? fmtUSD(m.cost) : ''}</option>`).join('');

  // Điều hướng render theo mode & view
  if (state.currentView === 'dashboard') {
    renderDashboard(content);
  } else if (state.currentView === 'materials') {
    state.mode === 'list' ? renderMaterialsList(content) : renderMaterialForm(content);
  } else if (state.currentView === 'customers') {
    state.mode === 'list' ? renderCustomersList(content) : renderCustomerForm(content);
  } else if (state.currentView === 'warehouses') {
    state.mode === 'list' ? renderWarehousesList(content) : renderWarehouseForm(content);
  } else if (state.currentView === 'quotations') {
    state.mode === 'list' ? renderQuotationsList(content) : renderQuotationForm(content);
  } else if (state.currentView === 'sales-orders') {
    state.mode === 'list' ? renderOrdersList(content) : renderSalesOrderForm(content);
  } else if (state.currentView === 'returns') {
    state.mode === 'list' ? renderReturnsList(content) : renderReturnForm(content);
  } else if (state.currentView === 'grn') {
    state.mode === 'list' ? renderGRNList(content) : renderGRNForm(content);
  } else if (state.currentView === 'report-inventory') {
    renderReportInventory(content);
  } else if (state.currentView === 'report-sales') {
    renderReportSales(content);
  }
}

// ==========================================
// 9. KHỞI TẠO SỰ KIỆN KHI MỞ TRANG (INIT)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Cập nhật ngày tháng trên Header
  const dateElem = document.getElementById('header-date');
  if (dateElem) {
    const now = new Date();
    dateElem.innerText = now.toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Gán sự kiện click cho Sidebar Menu
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) navigate(view, 'list');
    });
  });

  // Render khởi tạo Dashboard
  render();
});