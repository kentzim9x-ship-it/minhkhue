// CẤU HÌNH SUPABASE CLIENT (Thay thế bằng cấu hình dự án của bạn)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// BIẾN TOÀN CỤC LƯU BỘ NHỚ TẠM (CACHE)
let appState = {
  currentUser: null,
  dmvt: [],
  dmkho: [],
  dmkh: []
};

// ==========================================
// 1. KHỞI TẠO VÀ XÁC THỰC ĐĂNG NHẬP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  checkSavedLogin();
  setupEventListeners();
});

// Kiểm tra ghi nhớ đăng nhập
function checkSavedLogin() {
  const savedUser = localStorage.getItem('app_user');
  if (savedUser) {
    appState.currentUser = JSON.parse(savedUser);
    showAppScreen();
  }
}

// Xử lý Form đăng nhập từ bảng userinfo
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();
  const remember = document.getElementById('remember-me').checked;

  const { data, error } = await supabase
    .from('userinfo')
    .select('*')
    .eq('username', u)
    .eq('password', p)
    .single();

  if (error || !data) {
    alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    return;
  }

  appState.currentUser = data;
  if (remember) {
    localStorage.setItem('app_user', JSON.stringify(data));
  }

  showAppScreen();
});

// Đăng xuất
document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('app_user');
  appState.currentUser = null;
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
});

function showAppScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('user-display-name').innerText = `Xin chào, ${appState.currentUser.fullname}`;
  loadMasterData();
}

// ==========================================
// 2. CHUYỂN TAB VÀ KHỞI TẠO ĐIỀU HƯỚNG
// ==========================================
function setupEventListeners() {
  const navItems = document.querySelectorAll('.sidebar li');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

      item.classList.add('active');
      const tabId = item.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');

      if (tabId === 'dashboard') loadDashboard();
      if (tabId === 'reports') loadReports();
    });
  });

  // Tải báo giá tự động khi đổi Khách hàng ở Đơn hàng bán
  document.getElementById('dhb-makh').addEventListener('change', fetchLatestBbgForCustomer);
}

// Tải dữ liệu danh mục ban đầu
async function loadMasterData() {
  const [vtRes, khoRes, khRes] = await Promise.all([
    supabase.from('dmvt').select('*'),
    supabase.from('dmkho').select('*'),
    supabase.from('dmkh').select('*')
  ]);

  appState.dmvt = vtRes.data || [];
  appState.dmkho = khoRes.data || [];
  appState.dmkh = khRes.data || [];

  renderDmvtTable();
  renderDmkhoTable();
  renderDmkhTable();
  populateDropdowns();
}

// Đổ dữ liệu vào các thẻ <select>
function populateDropdowns() {
  const khOptions = appState.dmkh.map(k => `<option value="${k.ma_kh}">${k.ma_kh} - ${k.ten_kh}</option>`).join('');
  const khoOptions = appState.dmkho.map(k => `<option value="${k.ma_kho}">${k.ma_kho} - ${k.ten_kho}</option>`).join('');

  document.getElementById('bbg-makh').innerHTML = '<option value="">-- Chọn Khách Hàng --</option>' + khOptions;
  document.getElementById('dhb-makh').innerHTML = '<option value="">-- Chọn Khách Hàng --</option>' + khOptions;
  document.getElementById('dthb-makh').innerHTML = '<option value="">-- Chọn Khách Hàng --</option>' + khOptions;
  document.getElementById('dhb-makho').innerHTML = '<option value="">-- Chọn Kho Bán --</option>' + khoOptions;
  document.getElementById('pnk-makho').innerHTML = '<option value="">-- Chọn Kho Nhập --</option>' + khoOptions;
}

// ==========================================
// 3. QUẢN LÝ DANH MỤC (DMVT, DMKHO, DMKH)
// ==========================================

// Danh mục Vật tư
document.getElementById('form-dmvt').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newItem = {
    ma_vt: document.getElementById('vt-ma').value.trim(),
    ten_vt: document.getElementById('vt-ten').value.trim(),
    dvt: document.getElementById('vt-dvt').value.trim(),
    gia_chuan: Number(document.getElementById('vt-gia').value) || 0
  };
  await supabase.from('dmvt').upsert([newItem]);
  document.getElementById('form-dmvt').reset();
  loadMasterData();
});

function renderDmvtTable() {
  const tbody = document.querySelector('#table-dmvt tbody');
  tbody.innerHTML = appState.dmvt.map(i => `<tr><td>${i.ma_vt}</td><td>${i.ten_vt}</td><td>${i.dvt||''}</td><td>${i.gia_chuan.toLocaleString()}đ</td></tr>`).join('');
}

// Danh mục Kho
document.getElementById('form-dmkho').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newItem = {
    ma_kho: document.getElementById('kho-ma').value.trim(),
    ten_kho: document.getElementById('kho-ten').value.trim(),
    dia_chi: document.getElementById('kho-diachi').value.trim()
  };
  await supabase.from('dmkho').upsert([newItem]);
  document.getElementById('form-dmkho').reset();
  loadMasterData();
});

function renderDmkhoTable() {
  const tbody = document.querySelector('#table-dmkho tbody');
  tbody.innerHTML = appState.dmkho.map(i => `<tr><td>${i.ma_kho}</td><td>${i.ten_kho}</td><td>${i.dia_chi||''}</td></tr>`).join('');
}

// Danh mục Khách hàng
document.getElementById('form-dmkh').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newItem = {
    ma_kh: document.getElementById('kh-ma').value.trim(),
    ten_kh: document.getElementById('kh-ten').value.trim(),
    dien_thoai: document.getElementById('kh-phone').value.trim(),
    dia_chi: document.getElementById('kh-diachi').value.trim()
  };
  await supabase.from('dmkh').upsert([newItem]);
  document.getElementById('form-dmkh').reset();
  loadMasterData();
});

function renderDmkhTable() {
  const tbody = document.querySelector('#table-dmkh tbody');
  tbody.innerHTML = appState.dmkh.map(i => `<tr><td>${i.ma_kh}</td><td>${i.ten_kh}</td><td>${i.dien_thoai||''}</td><td>${i.dia_chi||''}</td></tr>`).join('');
}

// ==========================================
// 4. NGHIỆP VỤ BÁO GIÁ & ĐƠN HÀNG BÁN
// ==========================================

// Thêm dòng vật tư cho Bảng báo giá
document.getElementById('btn-add-bbg-item').addEventListener('click', () => {
  const container = document.getElementById('bbg-items-container');
  const vtOptions = appState.dmvt.map(v => `<option value="${v.ma_vt}">${v.ma_vt} - ${v.ten_vt}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <select class="bbg-item-vt" required><option value="">-- Chọn VT --</option>${vtOptions}</select>
    <input type="number" class="bbg-item-gia" placeholder="Đơn giá" required>
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Xóa</button>
  `;
  container.appendChild(div);
});

// Lưu Báo giá
document.getElementById('form-bbg').addEventListener('submit', async (e) => {
  e.preventDefault();
  const soPhieu = document.getElementById('bbg-sophieu').value.trim();
  const maKh = document.getElementById('bbg-makh').value;
  const ngayPhieu = document.getElementById('bbg-ngay').value;

  // 1. Lưu phiếu báo giá
  await supabase.from('ph_bbg').insert([{ so_phieu: soPhieu, ma_kh: maKh, ngay_phieu: ngayPhieu }]);

  // 2. Lưu chi tiết
  const rows = document.querySelectorAll('#bbg-items-container .item-row');
  const ctData = Array.from(rows).map(r => ({
    so_phieu: soPhieu,
    ma_vt: r.querySelector('.bbg-item-vt').value,
    don_gia: Number(r.querySelector('.bbg-item-gia').value) || 0
  }));

  await supabase.from('ct_bbg').insert(ctData);
  alert('Lưu Bảng Báo Giá Thành Công!');
  document.getElementById('form-bbg').reset();
  document.getElementById('bbg-items-container').innerHTML = '';
});

// Tự động lấy Báo Giá gần nhất khi chọn Khách Hàng ở Đơn Hàng Bán
async function fetchLatestBbgForCustomer() {
  const maKh = document.getElementById('dhb-makh').value;
  if (!maKh) return;

  const { data } = await supabase
    .from('ph_bbg')
    .select('so_phieu, ct_bbg(ma_vt, don_gia)')
    .eq('ma_kh', maKh)
    .order('ngay_phieu', { ascending: false })
    .limit(1)
    .single();

  const container = document.getElementById('dhb-items-container');
  container.innerHTML = '';

  if (data && data.ct_bbg) {
    data.ct_bbg.forEach(item => {
      addDhbRow(item.ma_vt, item.don_gia, 1);
    });
    alert(`Đã tự động tải Báo giá gần nhất (Số phiếu: ${data.so_phieu})`);
  }
}

// Thêm dòng sản phẩm cho Đơn hàng bán
document.getElementById('btn-add-dhb-item').addEventListener('click', () => addDhbRow());

function addDhbRow(maVt = '', donGia = 0, soLuong = 1) {
  const container = document.getElementById('dhb-items-container');
  const vtOptions = appState.dmvt.map(v => `<option value="${v.ma_vt}" ${v.ma_vt === maVt ? 'selected' : ''}>${v.ma_vt} - ${v.ten_vt}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <select class="dhb-item-vt" required><option value="">-- Chọn VT --</option>${vtOptions}</select>
    <input type="number" class="dhb-item-sl" placeholder="Số lượng" value="${soLuong}" required>
    <input type="number" class="dhb-item-gia" placeholder="Đơn giá" value="${donGia}" required>
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Xóa</button>
  `;
  container.appendChild(div);
}

// Lưu Đơn hàng bán (Có kiểm tra & cảnh báo tồn kho)
document.getElementById('form-dhb').addEventListener('submit', async (e) => {
  e.preventDefault();
  const soDh = document.getElementById('dhb-sodh').value.trim();
  const maKh = document.getElementById('dhb-makh').value;
  const maKho = document.getElementById('dhb-makho').value;
  const ngayDh = document.getElementById('dhb-ngay').value;

  const rows = document.querySelectorAll('#dhb-items-container .item-row');
  let totalAmount = 0;
  let outOfStockWarnings = [];

  // Lấy tồn kho hiện tại để đối chiếu
  const { data: stockData } = await supabase.from('ton_kho').select('*').eq('ma_kho', maKho);

  const items = Array.from(rows).map(r => {
    const maVt = r.querySelector('.dhb-item-vt').value;
    const sl = Number(r.querySelector('.dhb-item-sl').value) || 0;
    const gia = Number(r.querySelector('.dhb-item-gia').value) || 0;
    totalAmount += sl * gia;

    // Kiểm tra tồn kho
    const stockItem = (stockData || []).find(s => s.ma_vt === maVt);
    const tonHienTai = stockItem ? stockItem.so_luong_ton : 0;
    if (sl > tonHienTai) {
      outOfStockWarnings.push(`- Mã [${maVt}]: Yêu cầu ${sl}, tồn kho hiện tại chỉ còn ${tonHienTai}`);
    }

    return { so_dh: soDh, ma_vt: maVt, so_luong: sl, don_gia: gia };
  });

  // Cảnh báo nếu thiếu hàng trong kho
  if (outOfStockWarnings.length > 0) {
    const confirmSave = confirm(`CẢNH BÁO TỒN KHO KHÔNG ĐỦ:\n${outOfStockWarnings.join('\n')}\n\nBạn có muốn tiếp tục lưu đơn hàng không?`);
    if (!confirmSave) return;
  }

  // 1. Lưu Phiếu Đơn hàng bán
  await supabase.from('ph_dhb').insert([{ so_dh: soDh, ma_kh: maKh, ma_kho: maKho, ngay_dh: ngayDh, tong_tien: totalAmount }]);

  // 2. Lưu Chi tiết Đơn hàng bán
  await supabase.from('ct_dhb').insert(items);

  alert('Lưu Đơn Hàng Bán Thành Công!');
  document.getElementById('form-dhb').reset();
  document.getElementById('dhb-items-container').innerHTML = '';
});

// ==========================================
// 5. NGHIỆP VỤ ĐỔI TRẢ HÀNG BÁN & NHẬP KHO
// ==========================================

// Tải chi tiết đơn bán gốc để đổi trả
document.getElementById('btn-load-dhb-goc').addEventListener('click', async () => {
  const soDhGoc = document.getElementById('dthb-sodhgoc').value.trim();
  if (!soDhGoc) return alert('Vui lòng nhập Số đơn hàng bán gốc!');

  const { data } = await supabase
    .from('ct_dhb')
    .select('ma_vt, so_luong, don_gia')
    .eq('so_dh', soDhGoc);

  const container = document.getElementById('dthb-items-container');
  container.innerHTML = '';

  if (data && data.length > 0) {
    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = `
        <input type="text" class="dthb-item-vt" value="${item.ma_vt}" readonly>
        <input type="number" class="dthb-item-sl" placeholder="Số lượng trả" value="${item.so_luong}">
        <input type="number" class="dthb-item-gia" value="${item.don_gia}" readonly>
      `;
      container.appendChild(div);
    });
  } else {
    alert('Không tìm thấy chi tiết cho đơn hàng gốc này!');
  }
});

// Thêm dòng cho Phiếu nhập kho
document.getElementById('btn-add-pnk-item').addEventListener('click', () => {
  const container = document.getElementById('pnk-items-container');
  const vtOptions = appState.dmvt.map(v => `<option value="${v.ma_vt}">${v.ma_vt} - ${v.ten_vt}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <select class="pnk-item-vt" required><option value="">-- Chọn VT --</option>${vtOptions}</select>
    <input type="number" class="pnk-item-sl" placeholder="Số lượng nhập" required>
    <input type="number" class="pnk-item-gia" placeholder="Đơn giá nhập">
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Xóa</button>
  `;
  container.appendChild(div);
});

// Lưu Phiếu Nhập Kho
document.getElementById('form-pnk').addEventListener('submit', async (e) => {
  e.preventDefault();
  const soPnk = document.getElementById('pnk-sopnk').value.trim();
  const maKho = document.getElementById('pnk-makho').value;
  const ngayCt = document.getElementById('pnk-ngay').value;
  const dienGiai = document.getElementById('pnk-diengiai').value;

  const rows = document.querySelectorAll('#pnk-items-container .item-row');
  const items = Array.from(rows).map(r => ({
    so_pnk: soPnk,
    ma_vt: r.querySelector('.pnk-item-vt').value,
    so_luong: Number(r.querySelector('.pnk-item-sl').value) || 0,
    don_gia: Number(r.querySelector('.pnk-item-gia').value) || 0
  }));

  await supabase.from('ph_pnk').insert([{ so_pnk: soPnk, ma_kho: maKho, ngay_ct: ngayCt, diengiai: dienGiai }]);
  await supabase.from('ct_pnk').insert(items);

  alert('Tạo Phiếu Nhập Kho Thành Công!');
  document.getElementById('form-pnk').reset();
  document.getElementById('pnk-items-container').innerHTML = '';
});

// ==========================================
// 6. DASHBOARD THỐNG KÊ & BÁO CÁO
// ==========================================
async function loadDashboard() {
  // Lấy top 5 nhập
  const { data: pnkData } = await supabase.from('ct_pnk').select('ma_vt, so_luong');
  const topNhap = processTopData(pnkData, 'so_luong');
  renderStatList('list-top-nhap', topNhap);

  // Lấy top 5 xuất
  const { data: dhbData } = await supabase.from('ct_dhb').select('ma_vt, so_luong');
  const topXuat = processTopData(dhbData, 'so_luong');
  renderStatList('list-top-xuat', topXuat);
}

function processTopData(dataList, field) {
  const map = {};
  (dataList || []).forEach(item => {
    map[item.ma_vt] = (map[item.ma_vt] || 0) + item[field];
  });
  return Object.keys(map)
    .map(key => ({ ma_vt: key, total: map[key] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function renderStatList(elementId, list) {
  const el = document.getElementById(elementId);
  el.innerHTML = list.map(i => `<li><span>Mã VT: <strong>${i.ma_vt}</strong></span><span>Tổng: ${i.total.toLocaleString()}</span></li>`).join('');
}

// Báo cáo Tồn kho & Đơn bán
async function loadReports() {
  const { data: stock } = await supabase.from('ton_kho').select('*');
  const tbodyStock = document.querySelector('#table-report-inventory tbody');
  tbodyStock.innerHTML = (stock || []).map(s => {
    const vt = appState.dmvt.find(v => v.ma_vt === s.ma_vt);
    return `<tr><td>${s.ma_kho}</td><td>${s.ma_vt}</td><td>${vt ? vt.ten_vt : ''}</td><td>${s.so_luong_ton}</td></tr>`;
  }).join('');

  const { data: orders } = await supabase.from('ph_dhb').select('*');
  const tbodyOrders = document.querySelector('#table-report-orders tbody');
  tbodyOrders.innerHTML = (orders || []).map(o => `<tr><td>${o.so_dh}</td><td>${o.ngay_dh}</td><td>${o.ma_kh}</td><td>${o.ma_kho}</td><td>${o.tong_tien ? o.tong_tien.toLocaleString() + 'đ' : ''}</td></tr>`).join('');
}