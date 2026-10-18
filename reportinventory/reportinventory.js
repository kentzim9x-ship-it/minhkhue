function renderReportInventory(c) {
  const materials = db.materials;
  const filtered = materials.filter(m => state.filter === 'all' || m.category === state.filter);

  const getActualStock = (m) => {
    const invList = (db.inventory || []).filter(i => i.sku === m.id || i.material_id === m.id);
    if (invList.length > 0) {
      return invList.reduce((sum, inv) => sum + Number(inv.ton_thuc_te ?? inv.stock ?? 0), 0);
    }
    return m.stock ?? 0;
  };

  const totalVal = filtered.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0);
  const reservedVal = filtered.reduce((s, m) => s + (m.reserved || 0) * (m.cost || 0), 0);
  const alertCount = filtered.filter(m => ['low', 'critical', 'out'].includes(m.status)).length;

  const categories = Array.from(new Set(materials.map(m => m.category)));
  const catBreakdown = categories.map(cat => {
    const items = materials.filter(m => m.category === cat);
    return { category: cat, count: items.length, value: items.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0) };
  }).sort((a, b) => b.value - a.value);
  const maxVal = catBreakdown[0]?.value || 1;

  const kpiHtml = [
    { label: 'Tổng số SKU', value: fmt(materials.length), sub: 'đang hoạt động' },
    { label: 'Giá trị tồn thực tế', value: fmtUSD(materials.reduce((s, m) => s + getActualStock(m) * (m.cost || 0), 0)), sub: 'theo giá vốn' },
    { label: 'Giá trị đã giữ', value: fmtUSD(materials.reduce((s, m) => s + (m.reserved || 0) * (m.cost || 0), 0)), sub: 'cam kết đơn hàng' },
    { label: 'Sản phẩm cảnh báo', value: fmt(materials.filter(m => ['low', 'critical', 'out'].includes(m.status)).length), sub: 'dưới mức định mức' },
  ].map(s => `
    <div style="background-color: var(--card); padding: 16px 20px;">
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">${s.label}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 22px; font-weight: 300; margin-bottom: 4px;">${s.value}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${s.sub}</div>
    </div>
  `).join('');

  const catBreakdownHtml = catBreakdown.map(cat => `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-family: var(--font-dm-mono); font-size: 11px; width: 100px; color: var(--muted-foreground);">${cat.category}</span>
      <div style="flex: 1; height: 8px; background: var(--muted);"><div style="width: ${(cat.value / maxVal) * 100}%; height: 100%; background: var(--primary);"></div></div>
      <span style="font-family: var(--font-dm-mono); font-size: 11px; width: 90px; text-align: right;">${fmtUSD(cat.value)}</span>
    </div>
  `).join('');

  const alertsHtml = materials.filter(m => ['low', 'critical', 'out'].includes(m.status)).map(m => `
    <div style="padding: 8px 12px; border: 1px solid var(--border); background: var(--secondary);">
      <div style="font-size: 12px; font-weight: 500;">${m.name}</div>
      <div style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${m.id} · ${getActualStock(m)} / ${m.reorder ?? 0} đơn vị</div>
    </div>
  `).join('');

  const headersHtml = ['Mã Hàng (SKU)', 'Tên Sản Phẩm', 'ĐVT', 'Danh Mục', 'Vị Trí', 'Tồn Đầu Kỳ', 'Tồn Thực Tế', 'Tạm Giữ', 'Có Thể Bán', 'Mức Cảnh Báo', 'Giá Vốn', 'Trạng Thái', 'Hành Động']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Hành Động' ? 'center' : 'left'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const rowsHtml = filtered.map(m => {
    const tonThucTe = getActualStock(m);
    const tonDauKy = m.stock ?? 0;
    const tamGiu = m.reserved ?? 0;
    const coTheBan = tonThucTe - tamGiu;

    return `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row" ondblclick="navigate('materials', 'edit', '${m.id}')" onclick="navigate('materials', 'edit', '${m.id}')">
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--primary);">${m.id}</td>
      <td style="padding: 11px 16px; font-size: 13px;">${m.name}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; color: var(--foreground);">${m.unit || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground);">${m.category || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${m.location || '—'}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tonDauKy}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; font-weight: 600; color: var(--primary);">${tonThucTe}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${tamGiu}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${coTheBan}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${m.reorder ?? 0}</td>
      <td style="padding: 11px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmtUSD(m.cost || 0)}</td>
      <td style="padding: 11px 16px;"><span class="badge ${getBadgeClass(m.status)}">${m.status === 'ok' ? 'Đủ hàng' : m.status}</span></td>
      <td style="padding: 8px 16px; text-align: center; white-space: nowrap;">
        <button class="btn-action" onclick="event.stopPropagation(); navigate('materials', 'edit', '${m.id}')">${Icons.edit} Sửa</button>
        <button class="btn-action btn-action-del" onclick="event.stopPropagation(); deleteItem('materials', '${m.id}')">${Icons.trash} Xóa</button>
      </td>
    </tr>
  `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        ${kpiHtml}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 320px; gap: 16px;" class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Giá Trị Tồn Kho Theo Danh Mục</div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${catBreakdownHtml}
          </div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 12px;">Cảnh Báo Hàng Tồn Kho</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${alertsHtml}
          </div>
        </div>
      </div>
      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <div style="padding: 13px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <span style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Báo Cáo Tồn Kho Chi Tiết & Định Giá</span>
          <div style="display: flex; gap: 1px; overflow-x: auto;">
            ${['all', ...categories].map(cat => `
              <button onclick="state.filter='${cat}'; render();" style="padding: 4px 12px; font-family: var(--font-dm-mono); font-size: 10px; text-transform: uppercase; background: ${state.filter === cat ? 'var(--primary)' : 'var(--muted)'}; color: ${state.filter === cat ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}; border: none; cursor: pointer;">${cat === 'all' ? 'Tất cả' : cat}</button>
            `).join('')}
          </div>
        </div>
        <div style="padding: 8px 20px 4px; display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border); background: var(--secondary);">
          <span style="font-family: var(--font-dm-mono); font-size: 10px; color: var(--muted-foreground);">${filtered.length} mặt hàng · Tổng giá trị: <strong style="color: var(--primary);">${fmtUSD(totalVal)}</strong> · Đã tạm giữ: ${fmtUSD(reservedVal)} · Cảnh báo: ${alertCount}</span>
        </div>
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
      </div>
    </div>
  `;
}