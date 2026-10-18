function renderWarehousesList(c) {
  const cardsHtml = db.warehouses.map(w => {
    const pct = Math.round((w.used / w.capacity) * 100);
    const barColor = pct > 90 ? '#f87171' : pct > 75 ? '#fbbf24' : 'var(--primary)';
    return `
      <div style="border: 1px solid var(--border); background: var(--card); position: relative; cursor: pointer;" ondblclick="navigate('warehouses', 'view', '${w.id}')" onclick="navigate('warehouses', 'view', '${w.id}')">
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
          <button class="btn-action" onclick="event.stopPropagation(); navigate('warehouses', 'edit', '${w.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('warehouses', '${w.id}')">${Icons.trash} Xóa</button>
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