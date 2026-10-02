// Thêm CSS ẩn nút tăng giảm (spinner) của các ô input number
const spinnerStyle = document.createElement('style');
spinnerStyle.innerHTML = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;
document.head.appendChild(spinnerStyle);

// Danh sách tài khoản cấp riêng
const USERS = [
  { id: 'USR-001', username: 'admin', password: '123', name: 'Quản Trị Viên', role: 'ADMIN' },
  { id: 'USR-002', username: 'nhambc', password: '123', name: 'Bùi Cao Nhâm', role: 'MANAGER' },
  { id: 'USR-003', username: 'minhkhue', password: '123', name: 'Minh Khuê', role: 'USER' }
];

function getAuthSession() {
  const saved = localStorage.getItem('app_session');
  return saved ? JSON.parse(saved) : { isLoggedIn: false, currentUser: null, remember: false };
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

// Supabase Client Initialization
const SUPABASE_URL = 'https://gzmczqeczlrujhzleaoa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oBZ4Z1bekEMIjq_wmPFsyg_V68Y3dWE';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Biến toàn cục lưu trữ dữ liệu
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

function sortDescById(a, b) {
  return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
}

async function fetchDataFromSupabase() {
  try {
    const [custRes, matRes, whRes, invRes, quoRes, ordRes, retRes, grnRes] = await Promise.all([
      supabaseClient.from('customers').select('*'),
      supabaseClient.from('materials').select('*'),
      supabaseClient.from('warehouses').select('*'),
      supabaseClient.from('inventory').select('*'),
      supabaseClient.from('quotations').select('*'),
      supabaseClient.from('orders').select('*'),
      supabaseClient.from('returns').select('*'),
      supabaseClient.from('grns').select('*')
    ]);

    db.customers = custRes.data || [];
    db.materials = matRes.data || [];
    db.warehouses = whRes.data || [];
    db.inventory = invRes.data || [];

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
        id: g.id,
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

// Hàm hỗ trợ đồng bộ ngầm ton_thuc_te vào Supabase không gây trễ UI
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

  // Tự động đồng bộ số lượng vừa tính được vào cột ton_thuc_te trong bảng inventory (ngầm)
  if (warehouseCode) {
    syncRealtimeStockToSupabase(sku, warehouseCode, realtimeStock);
  }

  return realtimeStock;
}

function getStockQty(sku, warehouseCode) {
  return calculateRealtimeStock(sku, warehouseCode);
}

const Icons = {
  view: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="3"/><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z"/></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" /></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8" /></svg>`,
  plus: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="2"><line x1="6.5" y1="1" x2="6.5" y2="12" /><line x1="1" y1="6.5" x2="12" y2="6.5" /></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2L4 7l5 5" /></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5" /><line x1="10" y1="10" x2="14" y2="14" /></svg>`
};

function fmt(n) { return new Intl.NumberFormat('en-US').format(n); }
function fmtUSD(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
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
    <div style="display: flex; gap: 1px; background: var(--muted); width: fit-content;">
      ${buttonsHtml}
    </div>
  `;
}

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
  materials: { tag: 'DỮ LIỆU DANH MỤC', title: 'Sản Phẩm & Vật Tư' },
  customers: { tag: 'DỮ LIỆU DANH MỤC', title: 'Danh Sách Khách Hàng' },
  warehouses: { tag: 'DỮ LIỆU DANH MỤC', title: 'Danh Sách Kho Hàng' },
  quotations: { tag: 'GIAO DỊCH', title: 'Báo Giá Ban Đầu' },
  'sales-orders': { tag: 'GIAO DỊCH', title: 'Đơn Bán Hàng' },
  returns: { tag: 'GIAO DỊCH', title: 'Đổi Trả Hàng Bán' },
  grn: { tag: 'GIAO DỊCH', title: 'Phiếu Nhập Kho' },
  'report-inventory': { tag: 'BÁO CÁO', title: 'Báo Cáo Tồn Kho' },
  'report-sales': { tag: 'BÁO CÁO', title: 'Báo Cáo Doanh Số' },
};

function navigate(view, mode = 'list', itemId = null) {
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

  let targetHash = `#${view}`;
  if (mode === 'add') targetHash += '/add';
  if (mode === 'edit' && itemId) targetHash += `/edit/${itemId}`;
  if (mode === 'view' && itemId) targetHash += `/view/${itemId}`;

  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }

  render();
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) {
    navigate('dashboard', 'list');
    return;
  }

  const parts = hash.split('/');
  const view = parts[0];
  const mode = parts[1] || 'list';
  const itemId = parts[2] || null;

  if (viewMeta[view]) {
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
  } else {
    navigate('dashboard', 'list');
  }
}

window.addEventListener('hashchange', handleHashChange);

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
  if (line) {
    line[field] = (type === 'number') ? Number(value) : value;
    render();
  }
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
    } else {
      render();
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

  const session = getAuthSession();
  const currentUserId = session.currentUser ? session.currentUser.id : 'USR-001';
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
    delete rawData.discountTotal; delete rawData.discounttotal; delete rawData.subtotal; delete rawData.validUntil; delete rawData.validBegin; delete rawData.lineItems;
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
    } else {
      const { error } = await supabaseClient.from(tableName).update(supabasePayload).eq('id', dbPayload.id);
      if (error) throw error;
      const idx = db[targetKey].findIndex(item => item.id === dbPayload.id);
      if (idx !== -1) db[targetKey][idx] = dbPayload;
    }

    if (['quotations', 'orders', 'returns', 'grns'].includes(targetKey)) {
      db[targetKey].sort(sortDescById);
    }

    // Tải lại dữ liệu ở chế độ ngầm để tránh đơ UI
    fetchDataFromSupabase();
    navigate(module, 'list');
  } catch (error) {
    console.error('Lỗi lưu Supabase:', error);
    alert('Lưu thất bại: ' + (error.message || error));
  }
}

async function deleteItem(module, id) {
  if (confirm(`Bạn có chắc chắn muốn xóa phiếu ${id}?`)) {
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
      alert('Xóa trên CSDL thất bại: ' + error.message);
      await fetchDataFromSupabase();
      render();
    }
  }
}

// ─── GIAO DIỆN ĐĂNG NHẬP SANG TRỌNG & THANH LỊCH (DARK ELEGANT CONCEPT) ─────────
function renderLoginForm(container) {
  const savedCreds = JSON.parse(localStorage.getItem('remembered_user') || '{}');

  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 30%, #1a1e26 0%, #0c0e12 100%); padding: 20px; font-family: var(--font-jost);">
      <div style="width: 100%; max-width: 420px; padding: 40px 36px; background: rgba(20, 24, 33, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 1px rgba(240, 160, 48, 0.25);">
        
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(240, 160, 48, 0.12); border: 1px solid rgba(240, 160, 48, 0.3); border-radius: 10px; margin-bottom: 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f0a030" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h2 style="font-family: var(--font-jost); font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: 0.06em; margin: 0 0 6px 0;">
            MINH KHUÊ LMS
          </h2>
          <p style="font-size: 12px; color: #8a94a6; font-family: var(--font-dm-mono); letter-spacing: 0.05em; text-transform: uppercase;">Hệ Thống Quản Lý Kho & Bán Hàng</p>
        </div>

        <form onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <label style="display: block; font-size: 11px; font-family: var(--font-dm-mono); color: #8a94a6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
              Tên tài khoản
            </label>
            <input 
              type="text" 
              id="login-username" 
              required 
              value="${savedCreds.username || ''}"
              placeholder="Nhập tên tài khoản..." 
              style="width: 100%; padding: 12px 14px; background: rgba(13, 16, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; color: #ffffff; outline: none; font-size: 13px; transition: all 0.2s;"
              onfocus="this.style.borderColor='#f0a030'; this.style.boxShadow='0 0 0 3px rgba(240,160,48,0.15)';"
              onblur="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.boxShadow='none';"
            >
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-family: var(--font-dm-mono); color: #8a94a6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
              Mật khẩu
            </label>
            <input 
              type="password" 
              id="login-password" 
              required 
              value="${savedCreds.password || ''}"
              placeholder="Nhập mật khẩu..." 
              style="width: 100%; padding: 12px 14px; background: rgba(13, 16, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; color: #ffffff; outline: none; font-size: 13px; transition: all 0.2s;"
              onfocus="this.style.borderColor='#f0a030'; this.style.boxShadow='0 0 0 3px rgba(240,160,48,0.15)';"
              onblur="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.boxShadow='none';"
            >
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #a0aec0; cursor: pointer; user-select: none;">
              <input type="checkbox" id="login-remember" ${savedCreds.remember ? 'checked' : ''} style="cursor: pointer; accent-color: #f0a030; width: 15px; height: 15px;">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <div id="login-error" style="color: #f87171; font-size: 12px; display: none; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); padding: 8px 12px; border-radius: 6px; text-align: center;">
            Tài khoản hoặc mật khẩu không chính xác!
          </div>

          <button type="submit" style="width: 100%; padding: 12px; margin-top: 6px; background: linear-gradient(135deg, #f0a030 0%, #d98818 100%); border: none; border-radius: 6px; color: #000000; font-family: var(--font-jost); font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(240, 160, 48, 0.25);"
            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(240, 160, 48, 0.4)';"
            onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(240, 160, 48, 0.25)';"
          >
            Đăng Nhập
          </button>
        </form>

      </div>
    </div>
  `;
}

function handleLogin(e) {
  e.preventDefault();
  const un = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  const found = USERS.find(u => u.username === un && u.password === pw);

  if (found) {
    const session = { isLoggedIn: true, currentUser: found, remember };
    localStorage.setItem('app_session', JSON.stringify(session));

    if (remember) {
      localStorage.setItem('remembered_user', JSON.stringify({ username: un, password: pw, remember: true }));
    } else {
      localStorage.removeItem('remembered_user');
    }

    document.querySelector('.app-container').style.display = 'flex';
    updateUserInfoUI();
    render();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function handleLogout() {
  localStorage.removeItem('app_session');
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

    if (userAvatarEl) userAvatarEl.innerText = user.username.substring(0, 2).toUpperCase();
    if (userNameEl) userNameEl.innerText = user.name;
    if (userRoleEl) userRoleEl.innerText = user.role;

    if (sidebarUserEl && !document.getElementById('logout-btn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.innerText = 'Đăng xuất';
      logoutBtn.onclick = handleLogout;
      logoutBtn.style.cssText = "margin-left: auto; background: transparent; border: 1px solid var(--border); color: var(--muted-foreground); font-size: 10px; padding: 3px 6px; cursor: pointer;";
      sidebarUserEl.appendChild(logoutBtn);
    }
  }
}

function render() {
  const appContainer = document.querySelector('.app-container');
  const c = document.getElementById('app-content');
  const session = getAuthSession();

  if (!session.isLoggedIn) {
    if (appContainer) appContainer.style.display = 'none';
    let loginBox = document.getElementById('login-container');
    if (!loginBox) {
      loginBox = document.createElement('div');
      loginBox.id = 'login-container';
      document.body.appendChild(loginBox);
    }
    renderLoginForm(loginBox);
    return;
  } else {
    const loginBox = document.getElementById('login-container');
    if (loginBox) loginBox.remove();
    if (appContainer) appContainer.style.display = 'flex';
    updateUserInfoUI();
  }

  const activeId = document.activeElement ? document.activeElement.id : null;

  c.innerHTML = '';

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
      if (typeof el.selectionStart !== 'undefined') {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }
}

// ─── HÀM HỖ TRỢ TÍNH TOÁN DOANH SỐ THỰC TẾ TỪ DATABASE ────────────────────────
function getSalesAnalyticsData() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // 1. Lấy dữ liệu 9 tháng gần nhất (hoặc 9 tháng của năm hiện tại)
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

  // 2. Tổng hợp Đơn hàng bán (chỉ lấy đơn hoàn thành hoặc đang xử lý)
  let currentMonthRevenue = 0;
  let currentMonthOrders = 0;

  (db.orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    if (['completed', 'processing', 'hoàn thành', 'đang xử lý'].includes(status)) {
      const dateStr = o.date || '';
      const key = dateStr.substring(0, 7); // YYYY-MM
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

  // 3. Tổng hợp Đổi trả hàng bán
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

  // 4. Doanh số lũy kế YTD (Từ đầu năm đến nay)
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

  // 5. Thống kê theo Khách hàng
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

  // 6. Hoạt động gần đây (Recent Activity) từ CSDL
  const recentActivityReal = [];
  (db.grns || []).slice(0, 2).forEach(g => {
    recentActivityReal.push({
      time: g.time0 ? g.time0.substring(0, 5) : 'Hôm nay',
      event: 'Nhập kho',
      detail: `${g.id} — ${g.supplier || 'Nhà cung cấp'}`,
      type: 'in'
    });
  });

  (db.orders || []).slice(0, 2).forEach(o => {
    recentActivityReal.push({
      time: o.time0 ? o.time0.substring(0, 5) : 'Hôm nay',
      event: 'Đơn bán hàng',
      detail: `${o.id} → ${o.customer || 'Khách hàng'}`,
      type: 'out'
    });
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

  // Báo giá chưa khóa (nháp hoặc đã chấp nhận)
  const openQuotationsCount = (db.quotations || []).filter(q => ['draft', 'accepted', 'bản nháp', 'đã chấp nhận'].includes((q.status || '').toLowerCase())).length;

  // Tính tỷ lệ đơn hoàn thành
  const totalOrdersCount = (db.orders || []).length;
  const completedOrdersCount = (db.orders || []).filter(o => ['completed', 'hoàn thành'].includes((o.status || '').toLowerCase())).length;
  const completionRate = totalOrdersCount > 0 ? ((completedOrdersCount / totalOrdersCount) * 100).toFixed(1) : '100.0';

  const activityHtml = recentActivityReal.map(a => `
    <div style="padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; gap: 12px; align-items: flex-start;">
      <div style="font-size: 13px; font-weight: 500; flex: 1;"><div>${a.event}</div><div style="font-size: 12px; color: var(--muted-foreground);">${a.detail}</div></div>
      <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${a.time}</span>
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
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
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
  const filtered = db.materials.filter(m => {
    if (state.filter !== 'all' && m.status !== state.filter) return false;
    if (state.search && !m.name.toLowerCase().includes(state.search.toLowerCase()) && !m.id.toLowerCase().includes(state.search.toLowerCase())) return false;
    return true;
  });

  const kpiHtml = [
    { label: 'Tổng số SKU', value: fmt(db.materials.length) },
    { label: 'Tổng tồn kho', value: fmt(db.materials.reduce((a, i) => a + i.stock, 0)) },
    { label: 'Đang tạm giữ', value: fmt(db.materials.reduce((a, i) => a + i.reserved, 0)) },
    { label: 'Thấp/Cảnh báo', value: fmt(db.materials.filter(i => ['low', 'critical', 'out'].includes(i.status)).length) }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em;">${s.label}</span>
      <span style="font-family: var(--font-dm-mono); font-size: 18px; font-weight: 300;">${s.value}</span>
    </div>
  `).join('');

  const headersHtml = [
    'Mã Hàng', 'Tên Hàng', 'Đơn Vị', 'Danh Mục', 'Vị Trí Lưu Kho', 'Tồn Kho Ban Đầu', 'Đơn Giá', 'Trạng Thái', 'Hành Động'
  ].map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tồn Kho Ban Đầu' || h === 'Đơn Giá' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`).join('');

  const rowsHtml = filtered.map(m => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', 'view', '${m.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
      <td style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${m.stock ?? 0}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
      <td style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'CÒN HÀNG' : m.status.toUpperCase()}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="navigate('materials', 'view', '${m.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
        ${getFilterBar([['all', 'Tất cả'], ['ok', 'Đủ hàng'], ['low', 'Sắp hết'], ['critical', 'Nguy cấp'], ['out', 'Hết hàng']])}
        <div style="display: flex; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; width: 280px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã hàng hoặc tên hàng..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('materials', 'add')">${Icons.plus} Thêm Mới Hàng Hóa</button>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
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
  const filtered = db.customers.filter(c =>
    !state.search ||
    (c.name && c.name.toLowerCase().includes(state.search.toLowerCase())) ||
    (c.id && c.id.toLowerCase().includes(state.search.toLowerCase())) ||
    (c.contact && c.contact.toLowerCase().includes(state.search.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(state.search.toLowerCase()))
  );

  const totalCount = db.customers.length;
  const activeCount = db.customers.filter(c => c.status === 'active').length;
  const suspendedCount = db.customers.filter(c => c.status === 'suspended' || c.status === 'inactive').length;

  const kpiHtml = [
    { label: 'TỔNG KHÁCH HÀNG', value: fmt(totalCount) },
    { label: 'ĐANG HOẠT ĐỘNG', value: fmt(activeCount) },
    { label: 'TẠM KHÓA / NGỪNG', value: fmt(suspendedCount) }
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em;">${s.label}</span>
      <span style="font-family: var(--font-dm-mono); font-size: 18px; font-weight: 300;">${s.value}</span>
    </div>
  `).join('');

  const headersHtml = [
    'Mã KH', 'Tên Công Ty / KH', 'Người Liên Hệ', 'Email', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Hành Động'
  ].map(h => `
    <th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">
      ${h}
    </th>
  `).join('');

  const rowsHtml = filtered.map(c => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('customers', 'view', '${c.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary); text-align: left;">${c.id || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; font-weight: 500; text-align: left;">${c.name || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.contact || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); text-align: left;">${c.email || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; text-align: left;">${c.phone || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.address || c.diachi || '—'}</td>
      <td style="padding: 11px 16px; text-align: left;"><span class="badge ${getBadgeClass(c.status)}">${c.status === 'active' ? 'hoạt động' : (c.status === 'suspended' ? 'tạm khóa' : (c.status || 'hoạt động'))}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="navigate('customers', 'view', '${c.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="navigate('customers', 'edit', '${c.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="deleteItem('customers', '${c.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: flex-end; align-items: center;">
        <div style="display: flex; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; width: 280px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo tên, ID, liên hệ, địa chỉ..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('customers', 'add')">${Icons.plus} Thêm Mới Khách Hàng</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
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
  const cardsHtml = db.warehouses.map(w => {
    const pct = Math.round((w.used / w.capacity) * 100);
    const barColor = pct > 90 ? '#f87171' : pct > 75 ? '#fbbf24' : 'var(--primary)';
    return `
      <div style="border: 1px solid var(--border); background: var(--card); position: relative; cursor: pointer;" ondblclick="navigate('warehouses', 'view', '${w.id}')">
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
          <button class="btn-action" onclick="navigate('warehouses', 'view', '${w.id}')">${Icons.view} Xem</button>
          <button class="btn-action" onclick="navigate('warehouses', 'edit', '${w.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="deleteItem('warehouses', '${w.id}')">${Icons.trash} Xóa</button>
        </div>
      </div>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn-primary" onclick="navigate('warehouses', 'add')">${Icons.plus} Thêm Mới Kho</button>
      </div>
      <div class="grid-2">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function renderQuotationsList(c) {
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

  const headersHtml = ['Mã Báo Giá', 'Khách Hàng', 'Ngày Lập', 'Phát Hành', 'Hiệu Lực Đến', 'Số Dòng', 'Tổng Tiền', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(q => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('quotations', 'view', '${q.id}')">
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${q.id}</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${q.customer}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.date || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validbegin || q.validBegin || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${q.validUntil}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(q.lineItems || []).length}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(q.total)}</td>
      <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(q.status)}">${getStatusLabel(q.status)}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="navigate('quotations', 'view', '${q.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="navigate('quotations', 'edit', '${q.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="deleteItem('quotations', '${q.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${getFilterBar([['all', 'Tất cả'], ['accepted', 'Đã chấp nhận'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối'], ['expired', 'Hết hạn']])}
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; width: 280px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo tên, mã KH..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('quotations', 'add')">${Icons.plus} Tạo Báo Giá Mới</button>
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

  const headersHtml = ['Mã Đơn Hàng', 'Khách Hàng', 'Ngày Tạo', 'Mã Kho', 'Số Dòng', 'Tổng Tiền', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(o => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('sales-orders', 'view', '${o.id}')">
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${o.id}</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${o.customer}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${o.date}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${o.warehouseCode || o.warehouse_code || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(o.lineItems || o.lineitems || []).length || o.items || 0}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(o.total)}</td>
      <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(o.status)}">${getStatusLabel(o.status)}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="navigate('sales-orders', 'view', '${o.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="navigate('sales-orders', 'edit', '${o.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="deleteItem('sales-orders', '${o.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${getFilterBar([['all', 'Tất cả'], ['completed', 'Hoàn thành'], ['processing', 'Đang xử lý'], ['pending', 'Chờ xử lý'], ['cancelled', 'Đã hủy']])}
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; width: 280px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo tên, mã KH..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('sales-orders', 'add')">${Icons.plus} Tạo Đơn Hàng Mới</button>
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
  const filtered = db.returns.filter(r => state.filter === 'all' || r.status === state.filter);

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

  const headersHtml = ['Mã Đổi Trả', 'Tham Chiếu Đơn', 'Khách Hàng', 'Ngày Tạo', 'Lý Do', 'Số Dòng', 'Tổng Hoàn Tiền', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Hoàn Tiền' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(r => {
    const totalLines = (r.lineItems || r.lineitems || []).length;
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('returns', 'view', '${r.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${r.id}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.orderId || '—'}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${r.customer}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.date}</td>
        <td style="padding: 12px 16px; font-size: 13px;">${r.reason}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; color: #f87171; text-align: right;">${fmtUSD(r.total)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(r.status)}">${getStatusLabel(r.status)}</span></td>
        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="navigate('returns', 'view', '${r.id}')">${Icons.view} Xem</button>
          <button class="btn-action" onclick="navigate('returns', 'edit', '${r.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="deleteItem('returns', '${r.id}')">${Icons.trash} Xóa</button>
        </td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${getFilterBar([['all', 'Tất cả'], ['processed', 'Đã xử lý'], ['approved', 'Đã duyệt'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối']])}
        <button class="btn-primary" onclick="navigate('returns', 'add')">${Icons.plus} Tạo Phiếu Đổi Trả</button>
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
  const filtered = db.grns.filter(g => state.filter === 'all' || g.status === state.filter);

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

  const headersHtml = ['Mã Nhập Kho', 'Nhà Cung Cấp', 'Ngày Nhập', 'Mã Kho', 'Số Dòng', 'Tổng Giá Trị', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Giá Trị' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(g => {
    const totalLines = (g.lineItems || []).length;
    const wCode = g.warehouseCode || g.warehouse_code || '—';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('grn', 'view', '${g.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${g.id}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${g.supplier || '—'}</td>      
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${g.date}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${wCode}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(g.totalValue)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(g.status)}">${getStatusLabel(g.status)}</span></td>
        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="navigate('grn', 'view', '${g.id}')">${Icons.view} Xem</button>
          <button class="btn-action" onclick="navigate('grn', 'edit', '${g.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="deleteItem('grn', '${g.id}')">${Icons.trash} Xóa</button>
        </td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        ${getFilterBar([['all', 'Tất cả'], ['Bản nháp', 'Bản nháp'], ['Đã nhận', 'Đã nhận'], ['Đã xác minh', 'Đã xác minh']])}
        <button class="btn-primary" onclick="navigate('grn', 'add')">${Icons.plus} Nhập Kho Mới</button>
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

function exportQuotationToExcel() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);

  const fromDateVN = formatDateVN(d.validbegin || d.validBegin || d.date);
  const toDateVN = formatDateVN(d.validUntil || d.validuntil);

  let totalQty = 0;
  let totalAmount = 0;

  const rowsHtml = (d.lineItems || d.lineitems || []).map((l, idx) => {
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

    return `
      <tr style="height: 22px;">
        <td style="text-align: center; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt;">${idx + 1}</td>
        <td style="text-align: left; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-left: 4px;">${l.name || ''}</td>
        <td style="text-align: center; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt;">${unitName}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${discount ? discount + '%' : '0%'}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${tax ? tax + '%' : '0%'}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
      </tr>
    `;
  }).join('');

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; }
        td { vertical-align: middle; }
      </style>
    </head>
    <body>
      <table style="border-collapse: collapse; font-family: 'Times New Roman', serif; width: 755px;">
        <colgroup>
          <col style="width: 50px;">
          <col style="width: 220px;">
          <col style="width: 65px;">
          <col style="width: 95px;">
          <col style="width: 75px;">
          <col style="width: 70px;">
          <col style="width: 65px;">
          <col style="width: 115px;">
        </colgroup>

        <tr style="height: 45px;">
          <td colspan="3" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
            Xã Sơn Đồng – TP Hà Nội<br>
            ĐT: 0936.35.31.37
          </td>
          <td></td>
          <td colspan="4" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            Giấy phép ĐKKD số: 01U8005300<br>
            Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
            MST: 0110640531
          </td>
        </tr>

        <tr style="height: 32px;">
          <td colspan="8" style="font-size: 18pt; font-weight: bold; text-align: center; vertical-align: middle;">
            CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
          </td>
        </tr>

        <tr style="height: 10px;"><td colspan="8"></td></tr>

        <tr style="height: 24px;">
          <td colspan="4" style="font-size: 12pt; text-align: left;">
            <strong>Bảng báo giá:</strong> ${d.id || ''}
          </td>
          <td colspan="4" style="font-size: 12pt; text-align: left;">
            <strong>Ngày hiệu lực:</strong> từ ngày ${fromDateVN} - đến ngày ${toDateVN}
          </td>
        </tr>

        <tr style="height: 24px;">
          <td colspan="8" style="font-size: 12pt; text-align: left;">
            <strong>Khách hàng:</strong> ${d.customer || ''}
          </td>
        </tr>

        <tr style="height: 24px;">
          <td colspan="8" style="font-size: 12pt; text-align: left;">
            <strong>Địa chỉ:</strong> ${custAddress}
          </td>
        </tr>

        <tr style="height: 12px;"><td colspan="8"></td></tr>

        <tr style="height: 26px; font-weight: bold; font-size: 11pt; text-align: center; background-color: #f2f2f2;">
          <td style="border: 1px solid #000;">STT</td>
          <td style="border: 1px solid #000;">Tên Hàng</td>
          <td style="border: 1px solid #000;">ĐVT</td>
          <td style="border: 1px solid #000;">Đơn Giá</td>
          <td style="border: 1px solid #000;">Số Lượng</td>
          <td style="border: 1px solid #000;">CK %</td>
          <td style="border: 1px solid #000;">Thuế %</td>
          <td style="border: 1px solid #000;">Thành Tiền</td>
        </tr>

        ${rowsHtml}

        <tr style="height: 26px; font-weight: bold; font-size: 12pt;">
          <td colspan="4" style="border: 1px solid #000; text-align: center;">Tổng Cộng</td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
        </tr>

        <tr style="height: 18px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; text-align: center;">
            Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}
          </td>
        </tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; font-weight: bold; text-align: center;">
            Đại diện nhà cung cấp
          </td>
        </tr>

        <tr style="height: 20px;"><td colspan="8"></td></tr>
        <tr style="height: 20px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; font-weight: bold; text-align: center;">
            BÙI CAO NHÂM
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoGia_${d.id || 'Export'}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportSalesOrderToExcel() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);

  let totalQty = 0;
  let totalAmount = 0;

  const rowsHtml = (d.lineItems || d.lineitems || []).map((l, idx) => {
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

    return `
      <tr style="height: 22px;">
        <td style="text-align: center; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt;">${idx + 1}</td>
        <td style="text-align: left; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-left: 4px;">${l.name || ''}</td>
        <td style="text-align: center; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt;">${unitName}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${discount ? discount + '%' : '0%'}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${tax ? tax + '%' : '0%'}</td>
        <td style="text-align: right; border: 1px solid #000; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
      </tr>
    `;
  }).join('');

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; }
        td { vertical-align: middle; }
      </style>
    </head>
    <body>
      <table style="border-collapse: collapse; font-family: 'Times New Roman', serif; width: 755px;">
        <colgroup>
          <col style="width: 50px;">
          <col style="width: 220px;">
          <col style="width: 65px;">
          <col style="width: 95px;">
          <col style="width: 75px;">
          <col style="width: 70px;">
          <col style="width: 65px;">
          <col style="width: 115px;">
        </colgroup>

        <tr style="height: 45px;">
          <td colspan="3" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
            Xã Sơn Đồng – TP Hà Nội<br>
            ĐT: 0936.35.31.37
          </td>
          <td></td>
          <td colspan="4" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            Giấy phép ĐKKD số: 01U8005300<br>
            Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
            MST: 0110640531
          </td>
        </tr>

        <tr style="height: 32px;">
          <td colspan="8" style="font-size: 18pt; font-weight: bold; text-align: center; vertical-align: middle;">
            CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
          </td>
        </tr>

        <tr style="height: 10px;"><td colspan="8"></td></tr>

        <tr style="height: 24px;">
          <td colspan="4" style="font-size: 12pt; text-align: left;">
            <strong>Khách hàng:</strong> ${d.customer || ''}
          </td>
          <td colspan="4" style="font-size: 12pt; text-align: left;">
            <strong>Số đơn hàng:</strong> ${d.id || ''}
          </td>
        </tr>

        <tr style="height: 24px;">
          <td colspan="8" style="font-size: 12pt; text-align: left;">
            <strong>Địa chỉ:</strong> ${custAddress}
          </td>
        </tr>

        <tr style="height: 24px;">
          <td colspan="8" style="font-size: 12pt; text-align: left;">
            <strong>Ghi chú:</strong> ${d.notes || ''}
          </td>
        </tr>

        <tr style="height: 12px;"><td colspan="8"></td></tr>

        <tr style="height: 26px; font-weight: bold; font-size: 11pt; text-align: center; background-color: #f2f2f2;">
          <td style="border: 1px solid #000;">STT</td>
          <td style="border: 1px solid #000;">Tên Hàng</td>
          <td style="border: 1px solid #000;">ĐVT</td>
          <td style="border: 1px solid #000;">Đơn Giá</td>
          <td style="border: 1px solid #000;">Số Lượng</td>
          <td style="border: 1px solid #000;">CK %</td>
          <td style="border: 1px solid #000;">Thuế %</td>
          <td style="border: 1px solid #000;">Thành Tiền</td>
        </tr>

        ${rowsHtml}

        <tr style="height: 26px; font-weight: bold; font-size: 12pt;">
          <td colspan="4" style="border: 1px solid #000; text-align: center;">Tổng Cộng</td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
        </tr>

        <tr style="height: 18px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; text-align: center;">
            Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}
          </td>
        </tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; font-weight: bold; text-align: center;">
            Đại diện nhà cung cấp
          </td>
        </tr>

        <tr style="height: 20px;"><td colspan="8"></td></tr>
        <tr style="height: 20px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="4"></td>
          <td colspan="4" style="font-size: 11pt; font-weight: bold; text-align: center;">
            BÙI CAO NHÂM
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DonHang_${d.id || 'Export'}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── FORMS ────────────────────────────────────────────────────────────────────
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
              <input type="text" class="form-input" value="${d.name || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'name\', this.value)"'} placeholder="Nhập tên sản phẩm..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Đơn vị tính *</label>
              <input type="text" class="form-input" value="${d.unit || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'unit\', this.value)"'} placeholder="Cái, Hộp, Bộ, Kg..." required>
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
              <input type="number" step="any" class="form-input" value="${d.stock ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'stock\', this.value, \'number\'); d.status = this.value==0?\'out\':(this.value<=(d.reorder||0)?\'low\':\'ok\');"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Mức định mức</label>
              <input type="number" step="any" class="form-input" value="${d.reorder ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'reorder\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Đơn giá (VNĐ)</label>
              <input type="number" step="any" class="form-input" value="${d.cost ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'cost\', this.value, \'number\')"'} >
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
              <input type="text" class="form-input" value="${d.name || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'name\', this.value)"'} placeholder="Nhập tên công ty hoặc tên khách hàng..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Loại khách hàng</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'type\', this.value)"'}>
                ${['B2B', 'B2C', 'Government'].map(t => `<option value="${t}" ${d.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Người liên hệ</label>
              <input type="text" class="form-input" value="${d.contact || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'contact\', this.value)"'} placeholder="Tên người đại diện...">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" value="${d.email || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'email\', this.value)"'} placeholder="example@domain.com">
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="text" class="form-input" value="${d.phone || ''}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'phone\', this.value)"'} placeholder="090x xxx xxx">
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
              <input type="number" step="any" class="form-input" value="${d.creditLimit ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'creditLimit\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Điều khoản thanh toán</label>
              <select class="form-select" ${isView ? 'disabled style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'paymentTerms\', this.value)"'}>
                ${['Prepaid', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(t => `<option value="${t}" ${d.paymentTerms === t ? 'selected' : ''}>${t}</option>`).join('')}
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
              <input type="number" step="any" class="form-input" value="${d.capacity ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'capacity\', this.value, \'number\')"'} >
            </div>
            <div class="form-group">
              <label class="form-label">Đã sử dụng</label>
              <input type="number" step="any" class="form-input" value="${d.used ?? 0}" ${isView ? 'readonly style="background: var(--muted); cursor: not-allowed;"' : 'onchange="updateField(\'used\', this.value, \'number\')"'} >
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

function handleCustomerSelectInOrder(customerName) {
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

  const confirmImport = confirm("Bạn có muốn nhập toàn bộ mã hàng theo đơn giá hay không?");

  if (confirmImport) {
    const activeQuotation = (db.quotations || [])
      .filter(q => q && q.customer === safeCustomer)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

    if (activeQuotation) {
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
    }
  } else {
    state.formData.quotationId = null;
    state.formData.lineItems = [{
      lineId: Date.now().toString(),
      warehouseCode: state.formData.warehouseCode || '',
      sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
  }

  render();
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

  const materialOptions = (db.materials || []).map(m =>
    `<option value="${m.name}">${m.id} - ${m.name} (${fmtUSD(m.cost)})</option>`
  ).join('');

  const gridLayout = isView
    ? "110px 1fr 60px 70px 110px 70px 70px 120px"
    : "110px 1fr 60px 70px 110px 70px 70px 120px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    const lineTotal = lineSub * (1 + (l.tax || 0) / 100);
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';

    return `
    <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 8px; padding: 10px 24px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động">
      
      <input type="text" id="line-item-${l.lineId}-name" ${isView ? '' : 'list="materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'name')" onchange="handleMaterialSelectInLine('${l.lineId}', this.value)"`} placeholder="Chọn/nhập tên hàng..." required>
      
      <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính từ danh mục hàng">
      
      <input type="number" id="line-item-${l.lineId}-qty" step="any" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qty ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'qty')" onchange="updateLine('${l.lineId}', 'qty', this.value, 'number')"`}>
      
      <input 
        type="text" 
        id="line-item-${l.lineId}-unitPrice"
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
      
      <input type="number" id="line-item-${l.lineId}-discount" step="any" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.discount ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'discount')" onchange="updateLine('${l.lineId}', 'discount', this.value, 'number')"`}>
      
      <input type="number" id="line-item-${l.lineId}-tax" step="any" class="form-input" style="padding: 6px 8px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.tax ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'quotations', ${idx}, 'tax')" onchange="updateLine('${l.lineId}', 'tax', this.value, 'number')"`}>
      
      <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500;">${fmtUSD(lineTotal)}</div>
      ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
    </div>
  `;
  }).join('');

  c.innerHTML = `
    <datalist id="materials-list">
      ${materialOptions}
    </datalist>

    <div style="max-width: 1000px;">
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
          
          <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 8px; padding: 8px 24px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center;">
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

          ${linesHtml}

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
            ${isView ? `<button type="button" class="btn-primary" onclick="exportQuotationToExcel()" style="color: #ffffff; border: 1px solid var(--border); padding: 8px 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">Xuất Excel</button>` : ''}
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

  const materialOptions = (db.materials || []).map(m => {
    const safeName = m.name || '';
    const safeId = m.id || '';
    const safeCost = m.cost || 0;
    return `<option value="${safeName}">${safeId} - ${safeName} (${fmtUSD(safeCost)})</option>`;
  }).join('');

  const gridLayout = isView
    ? "90px 1fr 60px 80px 65px 65px 90px 70px 60px 110px"
    : "90px 1fr 60px 80px 65px 65px 90px 70px 60px 110px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    const lineTotal = lineSub * (1 + (l.tax || 0) / 100);

    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
    <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động">
      
      <input type="text" id="line-item-${l.lineId}-name" ${isView ? '' : 'list="materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'name')" onchange="handleMaterialSelectInLine('${l.lineId}', this.value)"`} placeholder="Chọn/nhập tên hàng..." required>
      
      <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 6px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính từ danh mục hàng">
      
      <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho từ mục 01">
      
      <input type="number" id="line-item-${l.lineId}-qty" step="any" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qty ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'qty')" onchange="updateLine('${l.lineId}', 'qty', this.value, 'number')"`}>
      
      <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
      
      <input 
        type="text" 
        id="line-item-${l.lineId}-unitPrice"
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
      
      <input type="number" id="line-item-${l.lineId}-discount" step="any" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.discount ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'discount')" onchange="updateLine('${l.lineId}', 'discount', this.value, 'number')"`}>
      
      <input type="number" id="line-item-${l.lineId}-tax" step="any" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.tax ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'tax')" onchange="updateLine('${l.lineId}', 'tax', this.value, 'number')"`}>
      
      <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500; font-size: 12px;">${fmtUSD(lineTotal)}</div>
      ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
    </div>
  `;
  }).join('');

  c.innerHTML = `
    <datalist id="materials-list">
      ${materialOptions}
    </datalist>

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
          
          <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center;">
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

          ${linesHtml}

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
            ${isView ? `<button type="button" class="btn-primary" onclick="exportSalesOrderToExcel()" style="color: #ffffff; border: 1px solid var(--border); padding: 8px 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">Xuất Excel</button>` : ''}
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

  const materialOptions = (db.materials || []).map(m => {
    const safeName = m.name || '';
    const safeId = m.id || '';
    const safeCost = m.cost || 0;
    return `<option value="${safeName}">${safeId} - ${safeName} (${fmtUSD(safeCost)})</option>`;
  }).join('');

  const gridLayout = isView ? "90px 1fr 65px 75px 65px 65px 100px 110px" : "90px 1fr 65px 75px 65px 65px 100px 110px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
      <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
        <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng không cho sửa">
        
        <input type="text" id="line-item-${l.lineId}-name" ${isView ? '' : 'list="materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'returns', ${idx}, 'name')" onchange="handleMaterialSelectInLine('${l.lineId}', this.value)"`} placeholder="Chọn/nhập tên hàng..." required>
        
        <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính lấy từ Material">
        
        <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho lấy từ mục 01 xuống">
        
        <input type="number" id="line-item-${l.lineId}-qtyReturned" step="any" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qtyReturned ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'returns', ${idx}, 'qtyReturned')" onchange="updateLine('${l.lineId}', 'qtyReturned', this.value, 'number')"`}>
        
        <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
        
        <input 
          type="text" 
          id="line-item-${l.lineId}-unitPrice"
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
    <datalist id="materials-list">
      ${materialOptions}
    </datalist>

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
          <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center;">
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

          ${linesHtml}

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

  const materialOptions = (db.materials || []).map(m => {
    const safeName = m.name || '';
    const safeId = m.id || '';
    const safeCost = m.cost || 0;
    return `<option value="${safeName}">${safeId} - ${safeName} (${fmtUSD(safeCost)})</option>`;
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
        
        <input type="text" id="line-item-${l.lineId}-name" ${isView ? '' : 'list="materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'grn', ${idx}, 'name')" onchange="handleMaterialSelectInLine('${l.lineId}', this.value)"`} placeholder="Chọn/nhập tên hàng..." required>
        
        <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính lấy từ danh mục">
        
        <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho từ mục 01 xuống">
        
        <input type="number" id="line-item-${l.lineId}-receivedQty" step="any" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${qtyVal}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'grn', ${idx}, 'receivedQty')" onchange="updateLine('${l.lineId}', 'receivedQty', this.value, 'number'); updateLine('${l.lineId}', 'qtyImport', this.value, 'number');"`}>
        
        <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế tính tự động">
        
        <input 
          type="text" 
          id="line-item-${l.lineId}-unitCost"
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
    <datalist id="materials-list">
      ${materialOptions}
    </datalist>

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
          <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center;">
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

          ${linesHtml}

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
  const filtered = materials.filter(m => state.filter === 'all' || m.category === state.filter);

  // Helper hỗ trợ lấy số tồn từ cột ton_thuc_te trong bản inventory
  const getActualStock = (m) => {
    const invList = (db.inventory || []).filter(i => i.sku === m.id || i.material_id === m.id);
    if (invList.length > 0) {
      return invList.reduce((sum, inv) => sum + Number(inv.ton_thuc_te ?? inv.stock ?? 0), 0);
    }
    return m.stock ?? 0;
  };

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

  const rowsHtml = filtered.map(m => {
    const tonThucTe = getActualStock(m);
    const tonDauKy = m.stock ?? 0;
    const tamGiu = m.reserved ?? 0;
    const coTheBan = tonThucTe - tamGiu;

    return `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', 'edit', '${m.id}')">
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
        <button class="btn-action" onclick="navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        ${kpiHtml}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px;">
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
      <div style="border: 1px solid var(--border); background: var(--card);">
        <div style="padding: 13px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Báo Cáo Tồn Kho Chi Tiết & Định Giá</span>
          <div style="display: flex; gap: 1px;">
            ${['all', ...categories].map(cat => `
              <button onclick="state.filter='${cat}'; render();" style="padding: 4px 12px; font-family: var(--font-dm-mono); font-size: 10px; text-transform: uppercase; background: ${state.filter === cat ? 'var(--primary)' : 'var(--muted)'}; color: ${state.filter === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer;">${cat === 'all' ? 'Tất cả' : cat}</button>
            `).join('')}
          </div>
        </div>
        <div style="padding: 8px 20px 4px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); background: var(--secondary);">
          <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${filtered.length} mặt hàng · Tổng giá trị: <strong style="color: var(--primary);">${fmtUSD(totalVal)}</strong> · Đã tạm giữ: ${fmtUSD(reservedVal)} · Cảnh báo: ${alertCount}</span>
        </div>
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
      </div>
    </div>
  `;
}

// ─── BÁO CÁO DOANH SỐ (ĐÃ BỔ SUNG KPI GIÁ TRỊ ĐƠN TRUNG BÌNH LẤP Ô TRỐNG) ─────────
function renderReportSales(c) {
  const {
    salesDataReal,
    ytdRevenue,
    ytdOrders,
    topCustomersReal
  } = getSalesAnalyticsData();

  // Tính tổng đổi trả thực tế
  const totalReturnsCount = (db.returns || []).filter(r => ['processed', 'approved', 'đã xử lý', 'đã duyệt'].includes((r.status || '').toLowerCase())).length;
  const returnRatePercent = ytdOrders > 0 ? ((totalReturnsCount / ytdOrders) * 100).toFixed(1) : '0.0';

  // Tính Giá trị đơn trung bình (AOV - Average Order Value)
  const avgOrderValue = ytdOrders > 0 ? (ytdRevenue / ytdOrders) : 0;

  const customersHtml = topCustomersReal.slice(0, 6).map((cus, i) => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); width: 28px;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding: 10px 20px; font-size: 13px;">${cus.name}</td>
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(cus.revenue)}</td>
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 11px; text-align: right; color: var(--muted-foreground);">${cus.orders} đơn hàng</td>
    </tr>
  `).join('');

  const breakdownHeaders = ['Tháng', 'Doanh Thu', 'Đơn Hàng', 'Đổi Trả', 'Tỷ Lệ Trả', 'Giá Trị Đơn Trung Bình']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Tháng' ? 'left' : 'right'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const breakdownRows = [...salesDataReal].reverse().map(d => {
    const avgVal = d.orders > 0 ? (d.revenue / d.orders) : 0;
    const retPct = d.orders > 0 ? ((d.returns / d.orders) * 100).toFixed(1) : '0.0';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${d.month}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; font-weight: 500; text-align: right;">${fmtUSD(d.revenue)}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmt(d.orders)}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: #f87171;">${d.returns}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${retPct}%</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(avgVal)}</td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);">
        <div class="kpi-card"><span class="kpi-label">Doanh Thu Lũy Kế Trong Năm</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(ytdRevenue)}</span></div><span class="kpi-sub">Năm ${new Date().getFullYear()}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tổng Đơn Bán</span><div class="kpi-value-row"><span class="kpi-value">${fmt(ytdOrders)}</span></div><span class="kpi-sub">Năm ${new Date().getFullYear()}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tỷ Lệ Trả Hàng</span><div class="kpi-value-row"><span class="kpi-value">${returnRatePercent}%</span></div><span class="kpi-sub">theo số lượt đổi trả</span></div>
        <div class="kpi-card"><span class="kpi-label">Giá Trị Đơn Trung Bình</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(avgOrderValue)}</span></div><span class="kpi-sub">AOV trong năm ${new Date().getFullYear()}</span></div>
      </div>
      <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
        <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Biểu Đồ Doanh Thu & Sản Lượng Đơn Bán</div>
        <div style="height: 220px;"><canvas id="chart-sales"></canvas></div>
      </div>
      <div class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Đơn Bán Hàng & Đổi Trả</div>
          <div style="height: 180px;"><canvas id="chart-returns"></canvas></div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card);">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Top Khách Hàng Khai Thác</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${customersHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--muted-foreground); font-size: 12px;">Chưa có dữ liệu khách hàng</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div style="border: 1px solid var(--border); background: var(--card);">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Thống Kê Chi Tiết Hàng Tháng</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${breakdownHeaders}
            </tr>
          </thead>
          <tbody>
            ${breakdownRows}
          </tbody>
        </table>
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

  new Chart(document.getElementById('chart-returns').getContext('2d'), {
    type: 'bar',
    data: {
      labels: salesDataReal.map(d => d.month),
      datasets: [
        { label: 'Đơn bán', data: salesDataReal.map(d => d.orders), backgroundColor: '#f0a030' },
        { label: 'Đổi trả', data: salesDataReal.map(d => d.returns), backgroundColor: '#f87171' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#252a33' } },
        x: { grid: { color: '#252a33' } }
      }
    }
  });
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

  const prefixMap = { 'quotations': 'QUO', 'sales-orders': 'ORD', 'returns': 'RET', 'grn': 'GRN' };
  const prefix = prefixMap[module] || 'DOC';
  const maxNum = collection.reduce((m, x) => {
    const match = (x.id || '').match(new RegExp(`${prefix}-(\\d+)`, 'i'));
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
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

function updateHeaderDate() {
  const dateElement = document.getElementById('header-date');
  if (!dateElement) return;

  const now = new Date();
  const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('vi-VN', options);

  dateElement.innerText = formattedDate;
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.getAttribute('data-view')));
  });

  await fetchDataFromSupabase();
  render();
  handleHashChange();
  updateHeaderDate();
});