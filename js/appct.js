// ==========================================
// APPCT.JS - KHỞI TẠO TRANG CHI TIẾT (MPA)
// ==========================================

const DETAIL_TITLE_MAP = {
  materials: { tag: 'VẬT TƯ', title: 'Danh Mục Hàng Hóa' },
  customers: { tag: 'KHÁCH HÀNG', title: 'Danh Sách Khách Hàng' },
  warehouses: { tag: 'KHO HÀNG', title: 'Danh Sách Kho Hàng' },
  quotations: { tag: 'BÁO GIÁ', title: 'Bảng Báo Giá' },
  'sales-orders': { tag: 'ĐƠN HÀNG', title: 'Đơn Bán Hàng' },
  returns: { tag: 'ĐỔI TRẢ', title: 'Đổi Trả Hàng Bán' },
  grn: { tag: 'NHẬP KHO', title: 'Phiếu Nhập Kho' }
};

// Chuẩn hóa tên view từ URL
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

/**
 * Quay trở về trang danh sách chính
 */
function backToList(moduleView) {
  const targetView = moduleView || state.view || 'dashboard';
  window.location.href = `/minhkhue/index.html?view=${targetView}`;
}

/**
 * Cập nhật Header trang chi tiết
 */
function updateDetailHeader(module, mode) {
  const config = DETAIL_TITLE_MAP[module] || { tag: 'CHI TIẾT', title: 'Biểu Mẫu Chi Tiết' };
  
  const tagEl = document.getElementById('view-tag');
  const titleEl = document.getElementById('view-title');

  if (tagEl) tagEl.textContent = config.tag;
  if (titleEl) {
    const actionText = mode === 'add' ? 'Thêm Mới' : (mode === 'edit' ? 'Chỉnh Sửa' : 'Xem Chi Tiết');
    titleEl.textContent = `${config.title} (${actionText})`;
  }
}

/**
 * Render nội dung form dựa vào state.view và state.mode
 */
function renderDetailContent() {
  const container = document.getElementById('app-content');
  if (!container) return;

  switch (state.view) {
    case 'materials':
      renderMaterialForm(container);
      break;
    case 'customers':
      renderCustomerForm(container);
      break;
    case 'warehouses':
      renderWarehouseForm(container);
      break;
    case 'quotations':
      renderQuotationForm(container);
      break;
    case 'sales-orders':
      renderSalesOrderForm(container);
      break;
    case 'returns':
      renderReturnForm(container);
      break;
    case 'grn':
      renderGRNForm(container);
      break;
    default:
      container.innerHTML = `
        <div class="card" style="padding: 24px; text-align: center; background: var(--card); border: 1px solid var(--border);">
          <h3>Không tìm thấy loại biểu mẫu yêu cầu!</h3>
          <p style="margin-top: 8px; color: var(--muted-foreground);">Loại biểu mẫu "${state.view}" không hợp lệ.</p>
          <button class="btn-primary" onclick="backToList()" style="margin-top: 16px;">Quay lại Trang chủ</button>
        </div>
      `;
  }
}

// ==========================================
// KHỞI TẠO TRANG DETAIL (EVENT LISTENERS)
// ==========================================

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    backToList();
  }

  if (e.key === 'Enter') {
    if (e.target.tagName === 'TEXTAREA') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      e.preventDefault();
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Tải dữ liệu từ Supabase
  if (typeof fetchDataFromSupabase === 'function') {
    await fetchDataFromSupabase();
  }

  // 2. Đọc thông số từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const rawType = urlParams.get('type') || 'materials';
  const itemId = urlParams.get('id');
  const mode = urlParams.get('mode') || (itemId ? 'edit' : 'add');

  const module = normalizeModuleType(rawType);

  // 3. Khởi tạo State cho trang Chi tiết
  state.view = module;
  state.mode = mode;

  // 4. Khởi tạo formData (dùng hàm có sẵn trong handlers.js)
  if (typeof initFormData === 'function') {
    initFormData(module, itemId);
  }

  // 5. Render Giao diện Form
  updateDetailHeader(module, mode);
  renderDetailContent();

  // 6. Cập nhật các tiện ích UI
  if (typeof updateHeaderDate === 'function') updateHeaderDate();
  if (typeof initTheme === 'function') initTheme();
  if (typeof updateUserInfoUI === 'function') updateUserInfoUI();
});