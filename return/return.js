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

function renderReturnsList(c) {
  const filtered = db.returns.filter(r => {
    const matchStatus = (state.filter === 'all' || r.status === state.filter);
    const searchKey = (state.search || '').trim().toLowerCase();

    const rId = (r.id || '').toLowerCase();
    const orderId = (r.orderId || '').toLowerCase();
    const customer = (r.customer || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();

    const matchSearch = !searchKey ||
      rId.includes(searchKey) ||
      orderId.includes(searchKey) ||
      customer.includes(searchKey) ||
      reason.includes(searchKey);

    return matchStatus && matchSearch;
  });

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
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('returns', 'view', '${r.id}')" onclick="navigate('returns', 'view', '${r.id}')">
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${r.id}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.orderId || '—'}</td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${r.customer}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${r.date}</td>
        <td style="padding: 12px 16px; font-size: 13px;">${r.reason}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${totalLines}</td>
        <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; color: #f87171; text-align: right;">${fmtUSD(r.total)}</td>
        <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(r.status)}">${getStatusLabel(r.status)}</span></td>
        <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
          <button class="btn-action" onclick="event.stopPropagation(); navigate('returns', 'view', '${r.id}')">${Icons.view} Xem</button>
          <button class="btn-action" onclick="event.stopPropagation(); navigate('returns', 'edit', '${r.id}')">${Icons.edit} Sửa</button>
          <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('returns', '${r.id}')">${Icons.trash} Xóa</button>
        </td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['processed', 'Đã xử lý'], ['approved', 'Đã duyệt'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, khách hàng, lý do..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
          </div>
          <button class="btn-primary" onclick="navigate('returns', 'add')">${Icons.plus} Tạo Phiếu Đổi Trả</button>
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

  const gridLayout = isView ? "90px 1fr 65px 75px 65px 65px 100px 110px" : "90px 1fr 65px 75px 65px 65px 100px 110px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
      <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
        <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng không cho sửa">
        
        <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'returns\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
        
        <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính lấy từ Material">
        
        <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho lấy từ mục 01 xuống">
        
        <input type="number" id="line-item-${l.lineId}-qtyReturned" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qtyReturned ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'returns', ${idx}, 'qtyReturned')" onchange="updateLine('${l.lineId}', 'qtyReturned', this.value, 'number')"`}>
        
        <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
        
        <input 
          type="text" 
          id="line-item-${l.lineId}-unitPrice"
          inputmode="numeric"
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
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 850px;">
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

            <div style="min-width: 850px;">
              ${linesHtml}
            </div>
          </div>

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