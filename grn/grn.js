function renderGRNList(c) {
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

  const headersHtml = ['Mã Nhập Kho', 'Nhà Cung Cấp', 'Ngày Nhập', 'Mã Kho', 'Số Dòng', 'Tổng Giá Trị', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : (h === 'Tổng Giá Trị' || h === 'Số Dòng' ? 'right' : 'left')}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(g => {
    const totalLines = (g.lineItems || []).length;
    const wCode = g.warehouseCode || g.warehouse_code || '—';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('grn', 'view', '${g.id}')" onclick="navigate('grn', 'view', '${g.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${g.id}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${g.supplier || '—'}</td>      
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${g.date}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${wCode}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(g.totalValue)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(g.status)}">${getStatusLabel(g.status)}</span></td>
        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('grn', 'view', '${g.id}')">${Icons.view} Xem</button>
          <button class="btn-action" onclick="event.stopPropagation(); navigate('grn', 'edit', '${g.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('grn', '${g.id}')">${Icons.trash} Xóa</button>
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
          <button class="btn-primary" onclick="navigate('grn', 'add')">${Icons.plus} Nhập Kho Mới</button>
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