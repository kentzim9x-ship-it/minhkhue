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

  const orderDate = state.formData.date || getTodayDateStr();

  const activeQuotation = (db.quotations || [])
    .filter(q => {
      if (!q || q.customer !== safeCustomer) return false;
      if ((q.status || '').toLowerCase() !== 'accepted') return false;

      const vBegin = q.validbegin || q.validBegin || q.date || '';
      const vUntil = q.validUntil || q.validuntil || '';

      if (vBegin && vUntil) {
        return orderDate >= vBegin && orderDate <= vUntil;
      }
      return false;
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  if (activeQuotation) {
    const confirmImport = confirm("Bạn có muốn nhập toàn bộ mã hàng, đơn giá theo Bảng báo giá không?");

    if (confirmImport) {
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
    } else {
      state.formData.quotationId = null;
    }
  } else {
    state.formData.quotationId = null;
  }

  render();
}

function exportSalesOrderToExcel() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);

  let totalQty = 0;
  let totalAmount = 0;

  const items = (d.lineItems || d.lineitems || []);
  const maxRows = 23;

  let rowsHtml = '';
  for (let i = 0; i < maxRows; i++) {
    if (i < items.length) {
      const l = items[i];
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

      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000; text-align: center; font-family: 'Times New Roman'; font-size: 11pt;">${i + 1}</td>
          <td style="border: 1px solid #000; text-align: left; font-family: 'Times New Roman'; font-size: 11pt; padding-left: 4px;">${l.name || ''}</td>
          <td style="border: 1px solid #000; text-align: center; font-family: 'Times New Roman'; font-size: 11pt;">${unitName}</td>
          <td style="border: 1px solid #000; text-align: right; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${discount ? discount + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${tax ? tax + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-family: 'Times New Roman'; font-size: 11pt; padding-right: 4px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
        </tr>
      `;
    } else {
      rowsHtml += `
        <tr style="height: 26px;">
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
        </tr>
      `;
    }
  }

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Times New Roman', serif; }
        td { vertical-align: middle; white-space: nowrap; }
        .wrap-text { white-space: normal; }
      </style>
    </head>
    <body>
      <table style="border-collapse: collapse; font-family: 'Times New Roman', serif; width: 800px;">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 250px;">
          <col style="width: 60px;">
          <col style="width: 90px;">
          <col style="width: 70px;">
          <col style="width: 60px;">
          <col style="width: 60px;">
          <col style="width: 120px;">
        </colgroup>

        <tr style="height: 60px;">
          <td colspan="4" class="wrap-text" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
            Xã Sơn Đồng – TP Hà Nội<br>
            ĐT: 0936.35.31.37
          </td>
          <td colspan="4" class="wrap-text" style="font-size: 10pt; text-align: center; vertical-align: middle;">
            Giấy phép ĐKKD số: 01U8005300<br>
            Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
            MST: 0110640531
          </td>
        </tr>

        <tr style="height: 30px;">
          <td colspan="8" style="font-size: 16pt; font-weight: bold; text-align: center; vertical-align: middle;">
            CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
          </td>
        </tr>

        <tr style="height: 22px;">
          <td colspan="4" style="font-size: 11pt; text-align: left;">
            Khách hàng: ${d.customer || ''}
          </td>
          <td colspan="4" style="font-size: 11pt; text-align: left;">
            Đơn hàng bán: ${d.id || ''}
          </td>
        </tr>

        <tr style="height: 22px;">
          <td colspan="4" style="font-size: 11pt; text-align: left;">
            Địa chỉ: ${custAddress}
          </td>
          <td colspan="4" style="font-size: 11pt; text-align: left;">
            Ghi chú: ${d.notes || ''}
          </td>
        </tr>

        <tr style="height: 10px;"><td colspan="8"></td></tr>

        <tr style="height: 24px; background-color: #8db4e2; font-weight: bold; font-size: 11pt; text-align: center;">
          <td style="border: 1px solid #000;">STT</td>
          <td style="border: 1px solid #000;">Tên Hàng</td>
          <td style="border: 1px solid #000;">ĐVT</td>
          <td style="border: 1px solid #000;">Đơn Giá</td>
          <td style="border: 1px solid #000;">Số Lượng</td>
          <td style="border: 1px solid #000;">CK%</td>
          <td style="border: 1px solid #000;">Thuế%</td>
          <td style="border: 1px solid #000;">Thành Tiền</td>
        </tr>

        ${rowsHtml}

        <tr style="height: 24px; font-weight: bold; font-size: 11pt;">
          <td colspan="4" style="border: 1px solid #000; text-align: center;">Tổng Cộng</td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000;"></td>
          <td style="border: 1px solid #000; text-align: right; padding-right: 4px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
        </tr>

        <tr style="height: 18px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="5"></td>
          <td colspan="3" style="font-size: 11pt; text-align: center;">
            Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}
          </td>
        </tr>

        <tr style="height: 22px;">
          <td colspan="5"></td>
          <td colspan="3" style="font-size: 11pt; font-weight: bold; text-align: center;">
            Đại diện nhà cung cấp
          </td>
        </tr>

        <tr style="height: 20px;"><td colspan="8"></td></tr>
        <tr style="height: 20px;"><td colspan="8"></td></tr>

        <tr style="height: 22px;">
          <td colspan="5"></td>
          <td colspan="3" style="font-size: 11pt; font-weight: bold; text-align: center;">
            BÙI CAO NHÂM
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DonHang_${d.id || 'Export'}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('sales-orders', 'view', '${o.id}')" onclick="navigate('sales-orders', 'view', '${o.id}')">
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${o.id}</td>
      <td style="padding: 12px 16px; font-size: 13px; font-weight: 500;">${o.customer}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--muted-foreground);">${o.date}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${o.warehouseCode || o.warehouse_code || '—'}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${(o.lineItems || o.lineitems || []).length || o.items || 0}</td>
      <td style="padding: 12px 16px; font-family: var(--font-dm-mono); font-size: 13px; font-weight: 500; text-align: right;">${fmtUSD(o.total)}</td>
      <td style="padding: 12px 16px;"><span class="badge ${getBadgeClass(o.status)}">${getStatusLabel(o.status)}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('sales-orders', 'view', '${o.id}')">${Icons.view} Xem</button>
        <button class="btn-action" onclick="event.stopPropagation(); navigate('sales-orders', 'edit', '${o.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('sales-orders', '${o.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>

      <div class="filter-search-container" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        ${getFilterBar([['all', 'Tất cả'], ['completed', 'Hoàn thành'], ['processing', 'Đang xử lý'], ['pending', 'Chờ xử lý'], ['cancelled', 'Đã hủy']])}
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 450px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; flex: 1; min-width: 200px;">
            <span style="color: var(--muted-foreground);">${Icons.search}</span>
            <input type="text" id="global-search" placeholder="Tìm theo mã, tên khách hàng..." value="${state.search || ''}" oninput="state.search=this.value; render();" style="background: transparent; border: none; outline: none; color: var(--foreground); font-family: var(--font-jost); font-size: 13px; width: 100%; padding: 8px 0;">
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

  const gridLayout = isView
    ? "90px minmax(180px, 1.5fr) 60px 80px 65px 65px 90px 70px 60px 120px"
    : "90px minmax(180px, 1.5fr) 60px 80px 65px 65px 90px 70px 60px 120px 32px";

  const linesHtml = d.lineItems.map((l, idx) => {
    const lineSub = (l.qty || 0) * (l.unitPrice || 0) * (1 - (l.discount || 0) / 100);
    const lineTotal = lineSub * (1 + (l.tax || 0) / 100);

    const mat = (db.materials || []).find(m => m.id === l.sku || m.name === l.name);
    const unitName = mat ? (mat.unit || '—') : '—';
    const stockQty = calculateRealtimeStock(l.sku, d.warehouseCode, d.id);

    return `
    <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 10px 16px; border-bottom: 1px solid var(--border); align-items: center;">
      <input type="text" id="line-item-${l.lineId}-sku" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: var(--primary);" value="${l.sku || ''}" readonly title="Mã hàng tự động">
      
      <input type="text" id="line-item-${l.lineId}-name" autocomplete="off" ${isView ? '' : 'list="global-materials-list"'} class="form-input" style="padding: 6px 8px; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.name || ''}" ${isView ? 'readonly' : 'onkeydown="handleLineItemKeyDown(event, \'sales-orders\', ' + idx + ', \'name\')" onchange="handleMaterialSelectInLine(\'' + l.lineId + '\', this.value)"'} placeholder="Chọn/nhập tên hàng..." required>
      
      <input type="text" id="line-item-${l.lineId}-unit" class="form-input" style="padding: 6px 6px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${unitName}" readonly title="Đơn vị tính từ danh mục hàng">
      
      <input type="text" id="line-item-${l.lineId}-warehouseCode" class="form-input" style="padding: 6px 8px; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; text-align: center;" value="${d.warehouseCode || '—'}" readonly title="Mã kho từ mục 01">
      
      <input type="number" id="line-item-${l.lineId}-qty" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.qty ?? 1}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'qty')" onchange="updateLine('${l.lineId}', 'qty', this.value, 'number')"`}>
      
      <input type="text" id="line-item-${l.lineId}-stock" class="form-input" style="padding: 6px 6px; text-align: right; font-family: var(--font-dm-mono); background: var(--muted); cursor: not-allowed; color: ${stockQty < 0 ? '#f87171' : 'var(--foreground)'};" value="${stockQty}" readonly title="Tồn thực tế">
      
      <input 
        type="text" 
        id="line-item-${l.lineId}-unitPrice"
        inputmode="numeric"
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
      
      <input type="number" id="line-item-${l.lineId}-discount" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.discount ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'discount')" onchange="updateLine('${l.lineId}', 'discount', this.value, 'number')"`}>
      
      <input type="number" id="line-item-${l.lineId}-tax" step="any" inputmode="decimal" class="form-input" style="padding: 6px 6px; text-align: right; ${isView ? 'background: var(--muted); cursor: not-allowed;' : ''}" value="${l.tax ?? 0}" ${isView ? 'readonly' : `onkeydown="handleLineItemKeyDown(event, 'sales-orders', ${idx}, 'tax')" onchange="updateLine('${l.lineId}', 'tax', this.value, 'number')"`}>
      
      <div style="font-family: var(--font-dm-mono); text-align: right; font-weight: 500; font-size: 12px;">${fmtUSD(lineTotal)}</div>
      ${!isView ? `<button type="button" style="background: none; border: none; cursor: pointer; color: var(--muted-foreground); display: flex; align-items: center; justify-content: center;" onclick="removeLineItem('${l.lineId}')">${Icons.trash}</button>` : ''}
    </div>
  `;
  }).join('');

  c.innerHTML = `
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
          
          <div style="overflow-x: auto;">
            <div style="display: grid; grid-template-columns: ${gridLayout}; gap: 6px; padding: 8px 16px; background: var(--secondary); border-bottom: 1px solid var(--border); align-items: center; min-width: 1000px;">
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

            <div style="min-width: 900px;">
              ${linesHtml}
            </div>
          </div>

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