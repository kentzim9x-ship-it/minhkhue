// ==========================================
// APPCT.JS - KHỞI TẠO TRANG CHI TIẾT (MPA)
// ==========================================

const session = getAuthSession();
if (!session || !session.isLoggedIn) {
  window.location.href = '/minhkhue/index.html';
  return;
}

const DETAIL_TITLE_MAP = {
  materials: { tag: 'DANH MỤC', title: 'Danh Mục Hàng Hóa' },
  customers: { tag: 'DANH MỤC', title: 'Danh Mục Khách Hàng' },
  warehouses: { tag: 'DANH MỤC', title: 'Danh Mục Kho' },
  quotations: { tag: 'CHỨC NĂNG', title: 'Bảng Báo Giá' },
  'sales-orders': { tag: 'CHỨC NĂNG', title: 'Đơn Hàng Bán' },
  returns: { tag: 'CHỨC NĂNG', title: 'Đổi Trả Hàng Bán' },
  grn: { tag: 'CHỨC NĂNG', title: 'Phiếu Nhập Kho' }
};

function normalizeModuleType(type) {
  if (!type) return 'materials';
  const t = type.toLowerCase();
  if (t === 'material' || t === 'materials') return 'materials';
  if (t === 'customer' || t === 'customers') return 'customers';
  if (t === 'warehouse' || t === 'warehouses') return 'warehouses';
  if (t === 'quotation' || t === 'quotations') return 'quotations';
  if (t === 'salesorder' || t === 'sales-order' || t === 'orders') return 'sales-orders';
  if (t === 'return' || t === 'returns') return 'returns';
  if (t === 'grn') return 'grn';
  return t;
}

function backToList(moduleView) {
  const targetView = moduleView || state.view || 'dashboard';

  // Nếu đang ở trang detail.html -> Chuyển về index.html theo dạng MPA
  if (window.location.pathname.includes('detail.html')) {
    window.location.href = `/minhkhue/${targetView}`;
    return;
  }

  // Nếu đang ở trang index.html -> Điều hướng bằng hàm navigate chuẩn
  if (typeof navigate === 'function') {
    navigate(targetView, 'list');
  } else {
    window.location.href = `/minhkhue/${targetView}`;
  }
}

// Đọc URL dạng: /minhkhue/materials/view/SKU-0064
function parseUrlPath() {
  const basePath = '/minhkhue/';
  let path = window.location.pathname;

  if (path.startsWith(basePath)) {
    path = path.substring(basePath.length);
  }

  // Tách chuỗi theo dấu '/'
  const parts = path.replace(/^\/+|\/+$/g, '').split('/');

  const rawType = parts[0] || 'materials';
  const mode = parts[1] || 'add';
  const itemId = parts[2] ? decodeURIComponent(parts[2]) : null;

  return {
    module: normalizeModuleType(rawType),
    mode: mode,
    itemId: itemId
  };
}

function updateDetailHeader(module) {
  const config = DETAIL_TITLE_MAP[module] || { tag: 'CHI TIẾT', title: 'Chi Tiết Biểu Mẫu' };
  
  const tagEl = document.getElementById('view-tag');
  const titleEl = document.getElementById('view-title');

  if (tagEl) tagEl.textContent = config.tag;
  if (titleEl) titleEl.textContent = config.title;

  document.querySelectorAll('.sidebar .nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === module);
  });
}

function renderDetailContent() {
  const container = document.getElementById('app-content');
  if (!container) return;

  switch (state.view) {
    case 'materials': renderMaterialForm(container); break;
    case 'customers': renderCustomerForm(container); break;
    case 'warehouses': renderWarehouseForm(container); break;
    case 'quotations': renderQuotationForm(container); break;
    case 'sales-orders': renderSalesOrderForm(container); break;
    case 'returns': renderReturnForm(container); break;
    case 'grn': renderGRNForm(container); break;
    default:
      container.innerHTML = `<div style="padding: 24px; text-align: center;">Không tìm thấy biểu mẫu!</div>`;
  }
}

function setupSidebarNavigation() {
  document.querySelectorAll('.sidebar .nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      backToList(btn.getAttribute('data-view'));
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Kiểm tra Auth
  const session = getAuthSession();
  if (!session || !session.isLoggedIn) {
    window.location.href = '/minhkhue/login';
    return;
  }

  setupSidebarNavigation();

  if (typeof fetchDataFromSupabase === 'function') {
    await fetchDataFromSupabase();
  }

  // 2. Lấy tham số URL
  const { module, mode, itemId } = parseUrlPath();

  // 3. Cập nhật state
  state.view = module;
  state.mode = mode;
  state.selectedId = itemId;

  // 4. Khởi tạo dữ liệu form
  if (typeof initFormData === 'function') {
    initFormData(module, itemId);
  }

  // 5. Render form chi tiết (KHÔNG gọi render() của index.html ở đây)
  updateDetailHeader(module);
  renderDetailContent();

  if (typeof updateHeaderDate === 'function') updateHeaderDate();
  if (typeof initTheme === 'function') initTheme();
  if (typeof updateUserInfoUI === 'function') updateUserInfoUI();
});