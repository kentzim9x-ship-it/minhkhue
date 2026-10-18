function renderReportSales(c) {
  const {
    salesDataReal,
    ytdRevenue,
    ytdOrders,
    topCustomersReal
  } = getSalesAnalyticsData();

  const totalReturnsCount = (db.returns || []).filter(r => ['processed', 'approved', 'đã xử lý', 'đã duyệt'].includes((r.status || '').toLowerCase())).length;
  const returnRatePercent = ytdOrders > 0 ? ((totalReturnsCount / ytdOrders) * 100).toFixed(1) : '0.0';

  const avgOrderValue = ytdOrders > 0 ? (ytdRevenue / ytdOrders) : 0;

  const customersHtml = topCustomersReal.slice(0, 6).map((cus, i) => `
    <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 11px; color: var(--muted-foreground); width: 28px;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding: 10px 20px; font-size: 13px;">${cus.name}</td>
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(cus.revenue)}</td>
      <td style="padding: 10px 20px; font-family: var(--font-dm-mono); font-size: 11px; text-align: right; color: var(--muted-foreground);">${cus.orders} đơn hàng</td>
    </tr>
  `).join('');

  const breakdownHeaders = ['Tháng', 'Doanh Thu', 'Đơn Hàng', 'Đổi Trả', 'Tỷ Lệ Trả', 'Giá Trị Đơn Trung Bình']
    .map(h => `<th style="padding: 9px 16px; text-align: ${h === 'Tháng' ? 'left' : 'right'}; font-family: var(--font-dm-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted-foreground); font-weight: 400; white-space: nowrap;">${h}</th>`)
    .join('');

  const breakdownRows = [...salesDataReal].reverse().map(d => {
    const avgVal = d.orders > 0 ? (d.revenue / d.orders) : 0;
    const retPct = d.orders > 0 ? ((d.returns / d.orders) * 100).toFixed(1) : '0.0';
    return `
      <tr style="border-bottom: 1px solid var(--border);" class="hover-row">
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px;">${d.month}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; font-weight: 500; text-align: right;">${fmtUSD(d.revenue)}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right;">${fmt(d.orders)}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: #f87171;">${d.returns}</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--muted-foreground);">${retPct}%</td>
        <td style="padding: 10px 16px; font-family: var(--font-dm-mono); font-size: 12px; text-align: right; color: var(--primary);">${fmtUSD(avgVal)}</td>
      </tr>
    `;
  }).join('');

  c.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background-color: var(--border);" class="kpi-grid">
        <div class="kpi-card"><span class="kpi-label">Doanh Thu Lũy Kế Trong Năm</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(ytdRevenue)}</span></div><span class="kpi-sub">Năm ${new Date().getFullYear()}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tổng Đơn Bán</span><div class="kpi-value-row"><span class="kpi-value">${fmt(ytdOrders)}</span></div><span class="kpi-sub">Năm ${new Date().getFullYear()}</span></div>
        <div class="kpi-card"><span class="kpi-label">Tỷ Lệ Trả Hàng</span><div class="kpi-value-row"><span class="kpi-value">${returnRatePercent}%</span></div><span class="kpi-sub">theo số lượt đổi trả</span></div>
        <div class="kpi-card"><span class="kpi-label">Giá Trị Đơn Trung Bình</span><div class="kpi-value-row"><span class="kpi-value">${fmtUSD(avgOrderValue)}</span></div><span class="kpi-sub">AOV trong năm ${new Date().getFullYear()}</span></div>
      </div>
      <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
        <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Biểu Đồ Doanh Thu & Sản Lượng Đơn Bán</div>
        <div style="height: 220px;"><canvas id="chart-sales"></canvas></div>
      </div>
      <div class="grid-2">
        <div style="border: 1px solid var(--border); background: var(--card); padding: 20px;">
          <div style="font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground); margin-bottom: 16px;">Đơn Bán Hàng & Đổi Trả</div>
          <div style="height: 180px;"><canvas id="chart-returns"></canvas></div>
        </div>
        <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Top Khách Hàng Khai Thác</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${customersHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--muted-foreground); font-size: 12px;">Chưa có dữ liệu khách hàng</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div style="border: 1px solid var(--border); background: var(--card); overflow-x: auto;">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); font-family: var(--font-dm-mono); font-size: 11px; text-transform: uppercase; color: var(--muted-foreground);">Thống Kê Chi Tiết Hàng Tháng</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--secondary);">
              ${breakdownHeaders}
            </tr>
          </thead>
          <tbody>
            ${breakdownRows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  new Chart(document.getElementById('chart-sales').getContext('2d'), {
    type: 'line',
    data: {
      labels: salesDataReal.map(d => d.month),
      datasets: [
        { yAxisID: 'yRev', label: 'Doanh thu', data: salesDataReal.map(d => d.revenue), borderColor: '#f0a030', tension: 0.3 },
        { yAxisID: 'yOrd', label: 'Đơn hàng', data: salesDataReal.map(d => d.orders), borderColor: '#60a5fa', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        yRev: { position: 'left', grid: { color: '#252a33' } },
        yOrd: { position: 'right', grid: { drawOnChartArea: false } },
        x: { grid: { color: '#252a33' } }
      }
    }
  });

  new Chart(document.getElementById('chart-returns').getContext('2d'), {
    type: 'bar',
    data: {
      labels: salesDataReal.map(d => d.month),
      datasets: [
        { label: 'Đơn bán', data: salesDataReal.map(d => d.orders), backgroundColor: '#f0a030' },
        { label: 'Đổi trả', data: salesDataReal.map(d => d.returns), backgroundColor: '#f87171' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#252a33' } },
        x: { grid: { color: '#252a33' } }
      }
    }
  });
}