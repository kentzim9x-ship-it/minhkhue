// ==========================================
// APPCT.JS - KHỞI TẠO TRANG CHI TIẾT (MPA)
// ==========================================

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

// Hàm phân tích URL và tự động làm sạch thanh địa chỉ browser
function parseAndCleanUrlPath() {
  const urlParams = new URLSearchParams(window.location.search);
  let path = urlParams.get('p');

  if (!path) {
    let rawPath = window.location.pathname;
    if (rawPath.startsWith(BASE_PATH)) {
      rawPath = rawPath.substring(BASE_PATH.length);
    }
    path = rawPath;
  }

  // Bỏ chữ detail.html nếu có
  path = path.replace(/^detail\.html\/?/i, '').replace(/^\/+|\/+$/g, '');

  const parts = path.split('/');
  const rawType = parts[0] || 'materials';
  const mode = parts[1] || 'view';
  const itemId = parts[2] ? decodeURIComponent(parts[2]) : null;

  const module = normalizeModuleType(rawType);

  // Đổi URL trên thanh địa chỉ hiển thị đẹp: /minhkhue/materials/view/SKU-0075
  let prettyUrl = `${BASE_PATH}/${module}/${mode}`;
  if (itemId) prettyUrl += `/${itemId}`;

  if (window.location.href !== window.location.origin + prettyUrl) {
    window.history.replaceState(null, '', prettyUrl);
  }

  return { module, mode, itemId };
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
  setupSidebarNavigation();

  if (typeof fetchDataFromSupabase === 'function') {
    await fetchDataFromSupabase();
  }

  // Đọc và tự chuẩn hóa URL thanh địa chỉ
  const { module, mode, itemId } = parseAndCleanUrlPath();

  state.view = module;
  state.mode = mode;
  state.selectedId = itemId;

  if (typeof initFormData === 'function') {
    try {
      initFormData(module, itemId);
    } catch (err) {
      console.warn('Lỗi initFormData:', err);
    }
  }

  updateDetailHeader(module);
  renderDetailContent();

  if (typeof updateHeaderDate === 'function') updateHeaderDate();
  if (typeof initTheme === 'function') initTheme();
  if (typeof updateUserInfoUI === 'function') updateUserInfoUI();
});