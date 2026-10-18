function renderCustomersList(c) {
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
    'Mã KH', 'Tên Công Ty / KH', 'Người Liên Hệ', 'Email', 'SĐT', 'Địa Chỉ', 'Trạng Thái', 'Hành Động'
  ].map(h => `
    <th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">
      ${h}
    </th>
  `).join('');

  const rowsHtml = filtered.map(c => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('customers', 'view', '${c.id}')" onclick="navigate('customers', 'view', '${c.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary); text-align: left;">${c.id || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; font-weight: 500; text-align: left;">${c.name || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.contact || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); text-align: left;">${c.email || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; text-align: left;">${c.phone || '—'}</td>
      <td style="padding: 11px 16px; font-size: 13px; text-align: left;">${c.address || c.diachi || '—'}</td>
      <td style="padding: 11px 16px; text-align: left;"><span class="badge ${getBadgeClass(c.status)}">${c.status === 'active' ? 'hoạt động' : (c.status === 'suspended' ? 'tạm khóa' : (c.status || 'hoạt động'))}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'view', '${c.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="event.stopPropagation(); navigate('customers', 'edit', '${c.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('customers', '${c.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>
    
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['active', 'Đang Hoạt Động'], ['inactive', 'Ngừng Hoạt Động'], ['suspended', 'Tạm Khóa']])}
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên, liên hệ, địa chỉ..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('customers', 'add')">${Icons.plus} Thêm Mới Khách Hàng</button>
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