function renderMaterialsList(c) {
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
    'Mã Hàng', 'Tên Hàng', 'Đơn Vị', 'Danh Mục', 'Vị Trí Lưu Kho', 'Tồn Kho Ban Đầu', 'Đơn Giá', 'Trạng Thái', 'Hành Động'
  ].map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tồn Kho Ban Đầu' || h === 'Đơn Giá' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`).join('');

  const rowsHtml = filtered.map(m => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', 'view', '${m.id}')" onclick="navigate('materials', 'view', '${m.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
      <td style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${m.stock ?? 0}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
      <td style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'CÒN HÀNG' : m.status.toUpperCase()}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'view', '${m.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['ok', 'Đủ hàng'], ['low', 'Sắp hết'], ['critical', 'Nguy cấp'], ['out', 'Hết hàng']])}
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên hàng..." value="${state.search}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('materials', 'add')">${Icons.plus} Thêm Mới Hàng Hóa</button>
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