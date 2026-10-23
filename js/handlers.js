// ==========================================
// 5. ĐIỀU HƯỚNG & ROUTING (NAVIGATION)
// ==========================================

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

async function navigate(view, mode = 'list', itemId = null) {
  if (hasUnsavedFormData() && (view !== state.view || mode === 'list')) {
    const confirmLeave = await showConfirm(
      'Bạn đang nhập dữ liệu dở dang. Nếu thoát ra, toàn bộ dữ liệu đang nhập sẽ bị mất!',
      'Cảnh báo mất dữ liệu'
    );
    if (!confirmLeave) {
      return; // Người dùng chọn "Hủy bỏ" -> Giữ nguyên ở màn hình nhập liệu
    }
  }

  // --- BỔ SUNG: Lưu vị trí cuộn và trạng thái danh sách trước khi rời đi ---
  if (state.mode === 'list') {
    const contentBox = document.getElementById('app-content');
    // Lấy vị trí cuộn lớn hơn giữa container và window
    const scrollPos = (contentBox && contentBox.scrollTop > 0)
      ? contentBox.scrollTop
      : window.scrollY;

    sessionStorage.setItem(`scroll_pos_${state.view}`, scrollPos);
    sessionStorage.setItem(`list_state_${state.view}`, JSON.stringify({
      page: state.page,
      filter: state.filter,
      search: state.search
    }));
  }

  if ((mode === 'add' || mode === 'edit') && !checkModulePermission(view)) {
    showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép thực hiện thao tác này!', 'Cảnh báo quyền');
    mode = 'list';
  }

  if (mode === 'list') {
    const savedStateRaw = sessionStorage.getItem(`list_state_${view}`);
    if (savedStateRaw) {
      const savedState = JSON.parse(savedStateRaw);
      state.page = savedState.page || 1;
      state.filter = savedState.filter || 'all';
      state.search = savedState.search || '';
    } else {
      state.filter = 'all';
      state.search = '';
      state.page = 1;
    }
  } else {
    state.filter = 'all';
    state.search = '';
    state.page = 1;
  }

  state.view = view;
  state.mode = mode;
  // state.filter = 'all';
  // state.search = '';
  // state.page = 1;

  const meta = viewMeta[view] || { tag: 'HỆ THỐNG', title: 'NEXSTOCK' };
  const tagEl = document.getElementById('view-tag');
  const titleEl = document.getElementById('view-title');

  if (tagEl) tagEl.innerText = meta.tag;
  if (titleEl) titleEl.innerText = mode === 'list' ? meta.title : (mode === 'add' ? `Thêm ${meta.title} Mới` : (mode === 'view' ? `Xem ${meta.title}` : `Chỉnh Sửa Mục`));

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === view);
  });

  if (mode !== 'list') initFormData(view, itemId);

  // Tạo URL dạng /minhkhue/view/mode/id
  let targetPath = `${BASE_PATH}/${view}`;
  if (mode === 'add') targetPath += '/add';
  if (mode === 'edit' && itemId) targetPath += `/edit/${itemId}`;
  if (mode === 'view' && itemId) targetPath += `/view/${itemId}`;

  if (document.body.classList.contains('mobile-menu-open')) {
    toggleMobileMenu();
  }

  if (window.location.pathname !== targetPath) {
    window.history.pushState({ view, mode, itemId }, '', targetPath);
  }

  render();

  // --- BỔ SUNG: Khôi phục vị trí cuộn sau khi render ---
  if (mode === 'list') {
    restoreScrollPosition(view);
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const contentBox = document.getElementById('app-content');
    if (contentBox) contentBox.scrollTop = 0;
  }
}

async function handleRouteChange() {
  if (hasUnsavedFormData()) {
    const confirmLeave = await showConfirm(
      'Bạn đang nhập dữ liệu dở dang. Nếu quay lại, toàn bộ dữ liệu đang nhập sẽ bị mất!',
      'Cảnh báo mất dữ liệu'
    );
    if (!confirmLeave) {
      // Đẩy lại URL hiện tại để giữ người dùng ở lại trang
      let currentPath = `${BASE_PATH}/${state.view}`;
      if (state.mode === 'add') currentPath += '/add';
      if (state.mode === 'edit' && state.formData?.id) currentPath += `/edit/${state.formData.id}`;
      window.history.pushState(null, '', currentPath);
      return;
    }
  }

  let pathname = window.location.pathname;
  if (pathname.startsWith(BASE_PATH)) {
    pathname = pathname.substring(BASE_PATH.length);
  }
  pathname = pathname.replace(/^\/+|\/+$/g, '');

  // Nếu URL là /minhkhue/login hoặc trống
  if (pathname === 'login') {
    localStorage.removeItem('app_session'); // Mặc định đăng xuất khi truy cập URL /login
    render();
    return;
  }

  if (!pathname) {
    navigate('dashboard', 'list');
    return;
  }

  const parts = pathname.split('/');
  const view = parts[0];
  let mode = parts[1] || 'list';
  const itemId = parts[2] || null;

  if (viewMeta[view]) {
    if ((mode === 'add' || mode === 'edit') && !checkModulePermission(view)) {
      showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép thực hiện thao tác này!', 'Cảnh báo quyền');
      mode = 'list';
    }

    state.view = view;
    state.mode = mode;
    state.filter = 'all';
    state.search = '';
    state.page = 1;

    // Phục hồi phân trang & từ khóa tìm kiếm nếu quay lại danh sách
    if (mode === 'list') {
      const savedStateRaw = sessionStorage.getItem(`list_state_${view}`);
      if (savedStateRaw) {
        const savedState = JSON.parse(savedStateRaw);
        state.page = savedState.page || 1;
        state.filter = savedState.filter || 'all';
        state.search = savedState.search || '';
      }
    }

    const meta = viewMeta[view];
    const tagEl = document.getElementById('view-tag');
    const titleEl = document.getElementById('view-title');

    if (tagEl) tagEl.innerText = meta.tag;
    if (titleEl) titleEl.innerText = mode === 'list' ? meta.title : (mode === 'add' ? `Thêm ${meta.title} Mới` : (mode === 'view' ? `Xem ${meta.title}` : `Chỉnh Sửa Mục`));

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    if (mode !== 'list') {
      initFormData(view, itemId);
    }

    render();

    if (mode === 'list') {
      restoreScrollPosition(view);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const contentBox = document.getElementById('app-content');
      if (contentBox) contentBox.scrollTop = 0;
    }
  }
}

function restoreScrollPosition(view) {
  const savedScroll = sessionStorage.getItem(`scroll_pos_${view}`);
  if (savedScroll === null) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const contentBox = document.getElementById('app-content');
    if (contentBox) contentBox.scrollTop = 0;
    return;
  }

  const targetY = parseInt(savedScroll, 10);
  const contentBox = document.getElementById('app-content');

  // Hàm thực hiện cuộn
  const doScroll = () => {
    if (contentBox) {
      contentBox.scrollTop = targetY;
    }
    window.scrollTo({ top: targetY, behavior: 'instant' });
  };

  // Thử cuộn qua nhiều chu kỳ render
  requestAnimationFrame(() => {
    doScroll();

    // Dùng MutationObserver để đảm bảo khi bảng vẽ xong toàn bộ các dòng (HTML chèn xong) thì cuộn lại chuẩn xác
    const targetNode = contentBox || document.body;
    const observer = new MutationObserver((mutations, obs) => {
      doScroll();
      // Sau khi cuộn xong thì dọn dẹp observer và xóa lưu trữ
      obs.disconnect();
      sessionStorage.removeItem(`scroll_pos_${view}`);
    });

    observer.observe(targetNode, { childList: true, subtree: true });

    // Fallback: Tự động ngắt observer sau 500ms nếu không có thay đổi DOM thêm
    setTimeout(() => {
      doScroll();
      observer.disconnect();
      sessionStorage.removeItem(`scroll_pos_${view}`);
    }, 500);
  });
}

window.addEventListener('popstate', handleRouteChange);

// ==========================================
// 6. XỬ LÝ DỮ LIỆU & FORM (DATA HANDLERS)
// ==========================================

function updateField(field, value, type = 'string') {
  if (!state.formData) state.formData = {};

  let parsedValue = value;
  if (type === 'number') {
    parsedValue = value === '' ? 0 : Number(value);
  }

  state.formData[field] = parsedValue;

  // Tự động tính toán lại trạng thái hàng hóa khi thay đổi tồn kho hoặc định mức
  if (state.view === 'materials' && (field === 'stock' || field === 'reorder')) {
    const stock = Number(state.formData.stock || 0);
    const reorder = Number(state.formData.reorder || 0);

    if (stock <= 0) {
      state.formData.status = 'out';
    } else if (stock <= reorder) {
      state.formData.status = 'low';
    } else {
      state.formData.status = 'ok';
    }
  }
}

function updateLine(lineId, field, value, type = 'text') {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  const line = state.formData.lineItems.find(l => l.lineId === lineId);
  if (!line) return;

  line[field] = (type === 'number') ? Number(value) : value;

  let subtotal = 0, discountTotal = 0, taxTotal = 0, total = 0;

  state.formData.lineItems.forEach(l => {
    let lineTotal = 0;

    if (state.view === 'quotations' || state.view === 'sales-orders') {
      const qty = Number(l.qty) || 0;
      const price = Number(l.unitPrice) || 0;
      const disc = Number(l.discount) || 0;
      const tax = Number(l.tax) || 0;
      const lineSub = qty * price * (1 - disc / 100);
      lineTotal = lineSub * (1 + tax / 100);

      subtotal += qty * price;
      discountTotal += qty * price * (disc / 100);
      taxTotal += lineSub * (tax / 100);
    } else if (state.view === 'returns') {
      const qty = Number(l.qtyReturned) || 0;
      const price = Number(l.unitPrice) || 0;
      lineTotal = qty * price;
      total += lineTotal;
    } else if (state.view === 'grn') {
      const qty = Number(l.receivedQty ?? l.qtyImport ?? 1) || 0;
      const price = Number(l.unitCost) || 0;
      lineTotal = qty * price;
      total += lineTotal;
    }

    // Cập nhật text "Thành Tiền" ở từng dòng đang nhập
    const skuInput = document.getElementById(`line-item-${l.lineId}-sku`);
    if (skuInput && skuInput.parentElement) {
      const divs = skuInput.parentElement.querySelectorAll('div');
      if (divs.length > 0) divs[0].innerText = fmtUSD(lineTotal);
    }
  });

  if (state.view === 'quotations' || state.view === 'sales-orders') {
    total = subtotal - discountTotal + taxTotal;
    state.formData.subtotal = subtotal; state.formData.discountTotal = discountTotal; state.formData.tax = taxTotal; state.formData.total = total;
  } else if (state.view === 'returns') {
    state.formData.total = total;
  } else if (state.view === 'grn') {
    state.formData.totalValue = total;
  }

  // CẬP NHẬT KHUNG TỔNG TIỀN (BẮT CHUẨN 100%)
  const summaryDivs = document.querySelectorAll('div[style*="justify-content: space-between"]');
  summaryDivs.forEach(div => {
    const spans = div.querySelectorAll('span');
    if (spans.length >= 2) {
      const lbl = spans[0].innerText.trim().toLowerCase(); // Đưa về chữ thường để so sánh
      const valSpan = spans[spans.length - 1]; // Lấy giá trị ở cuối

      if (lbl === 'tạm tính') valSpan.innerText = fmtUSD(subtotal);
      else if (lbl === 'chiết khấu') valSpan.innerText = '-' + fmtUSD(discountTotal);
      else if (lbl === 'tổng thuế') valSpan.innerText = fmtUSD(taxTotal);
      else if (lbl === 'tổng cộng' || lbl === 'tổng hoàn tiền' || lbl === 'tổng giá trị') {
        valSpan.innerText = fmtUSD(total);
      }
    }
  });
}

function handleLineItemKeyDown(e, module, lineIndex, fieldName) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();

    const targetInput = e.target;
    if (targetInput && state.formData && Array.isArray(state.formData.lineItems)) {
      const currentLine = state.formData.lineItems[lineIndex];
      if (currentLine && fieldName) {
        if (fieldName === 'unitPrice' || fieldName === 'unitCost') {
          currentLine[fieldName] = parseNumberInput(targetInput.value);
        } else if (['qty', 'qtyReturned', 'receivedQty', 'discount', 'tax'].includes(fieldName)) {
          currentLine[fieldName] = Number(targetInput.value) || 0;
        } else {
          currentLine[fieldName] = targetInput.value;
        }
      }
    }

    const lineItems = state.formData?.lineItems || [];
    const isLastRow = lineIndex === lineItems.length - 1;
    const isUnitPriceField = (fieldName === 'unitPrice' || fieldName === 'unitCost');

    if (isLastRow && isUnitPriceField) {
      addLineItem(module, true);
    } else if (!isLastRow) {
      const nextLineId = lineItems[lineIndex + 1].lineId;
      setTimeout(() => {
        const nextInput = document.getElementById(`line-item-${nextLineId}-${fieldName}`);
        if (nextInput) {
          nextInput.focus();
          if (typeof nextInput.select === 'function') nextInput.select();
        }
      }, 50);
    }
  }
}

function addLineItem(module, focusNewName = false) {
  if (!state.formData) return;
  if (!Array.isArray(state.formData.lineItems)) state.formData.lineItems = [];
  const newLineId = Date.now().toString();
  const base = { lineId: newLineId, sku: '', name: '' };

  if (module === 'quotations') {
    state.formData.lineItems.push({ ...base, qty: 1, unitPrice: 0, discount: 0, tax: 0 });
  }
  if (module === 'sales-orders') {
    const currentWh = state.formData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    state.formData.lineItems.push({
      ...base,
      warehouseCode: currentWh,
      qty: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0
    });
  }
  if (module === 'returns') state.formData.lineItems.push({ ...base, qtyReturned: 1, unitPrice: 0 });
  if (module === 'grn') state.formData.lineItems.push({ ...base, receivedQty: 1, unitCost: 0 });

  render();

  if (focusNewName) {
    setTimeout(() => {
      const nameInput = document.getElementById(`line-item-${newLineId}-name`);
      if (nameInput) {
        nameInput.focus();
        if (typeof nameInput.select === 'function') nameInput.select();
      }
    }, 50);
  }
}

function removeLineItem(lineId) {
  if (!state.formData || !Array.isArray(state.formData.lineItems)) return;
  state.formData.lineItems = state.formData.lineItems.filter(l => l.lineId !== lineId);
  render();
}

async function saveForm(module) {
  const session = getAuthSession();
  const currentUserId = session.currentUser ? session.currentUser.id : 'Hệ Thống';
  const currentUserFullname = session.currentUser ? (session.currentUser.fullname || session.currentUser.username) : 'Hệ Thống';

  if (!checkModulePermission(module)) {
    alert('Tài khoản của bạn chỉ có quyền xem, không thể thực hiện thao tác lưu!');
    return;
  }

  if (['quotations', 'sales-orders', 'returns', 'grn'].includes(module)) {
    const lineItems = state.formData?.lineItems || [];
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.name || !item.name.trim()) {
        alert('Tên Hàng không được để trống.');
        setTimeout(() => {
          const nameInput = document.getElementById(`line-item-${item.lineId}-name`);
          if (nameInput) {
            nameInput.focus();
            if (typeof nameInput.select === 'function') nameInput.select();
          }
        }, 50);
        return;
      }
    }
  }

  const tableMap = {
    'materials': 'materials',
    'customers': 'customers',
    'warehouses': 'warehouses',
    'quotations': 'quotations',
    'sales-orders': 'orders',
    'returns': 'returns',
    'grn': 'grns'
  };
  const tableName = tableMap[module];
  const targetKey = module === 'sales-orders' ? 'orders' : (module === 'grn' ? 'grns' : module);

  let rawData = JSON.parse(JSON.stringify(state.formData));

  const currentDate = getTodayDateStr();
  const currentTime = getCurrentTimeStr();

  if (state.mode === 'add') {
    rawData.user_id0 = currentUserId;
    rawData.date0 = currentDate;
    rawData.time0 = currentTime;

    rawData.user_id2 = currentUserId;
    rawData.date2 = currentDate;
    rawData.time2 = currentTime;
  } else if (state.mode === 'edit') {
    const existing = db[targetKey].find(item => String(item.id) === String(rawData.id));
    if (existing) {
      rawData.user_id0 = existing.user_id0 || currentUserId;
      rawData.date0 = existing.date0 || currentDate;
      rawData.time0 = existing.time0 || currentTime;
    } else {
      rawData.user_id0 = currentUserId;
      rawData.date0 = currentDate;
      rawData.time0 = currentTime;
    }

    rawData.user_id2 = currentUserId;
    rawData.date2 = currentDate;
    rawData.time2 = currentTime;
  }

  if (module === 'customers') {
    if (rawData.paymentTerms !== undefined) rawData.paymentterms = rawData.paymentTerms;
    if (rawData.creditLimit !== undefined) rawData.creditlimit = rawData.creditLimit;
  }

  if (module === 'quotations') {
    if (state.mode === 'add' && rawData.customer) {
      db.quotations.forEach(q => {
        if (q.customer === rawData.customer) q.status = 'expired';
      });
      await supabaseClient.from('quotations').update({ status: 'expired' }).eq('customer', rawData.customer).neq('status', 'expired');
    }
    rawData.validuntil = rawData.validUntil;
    rawData.validbegin = rawData.validbegin || rawData.validBegin || rawData.date;
    rawData.lineitems = rawData.lineItems;
    delete rawData.discountTotal;
    delete rawData.subtotal;
    delete rawData.validUntil;
    delete rawData.validBegin;
    delete rawData.lineItems;
  }

  let dbPayload = { ...rawData };
  let supabasePayload = { ...rawData };

  if (module === 'returns') {
    const warehouseCode = rawData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehouse_code = warehouseCode;
    dbPayload.orderId = rawData.orderId || null;
    dbPayload.order_id = rawData.orderId || null;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;

    supabasePayload.warehouse_code = warehouseCode;
    supabasePayload.order_id = rawData.orderId || null;
    supabasePayload.lineitems = lineItems;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.orderId;
    delete supabasePayload.lineItems;
  }

  if (module === 'grn') {
    const warehouseCode = rawData.warehouseCode || rawData.warehousecode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : (Array.isArray(rawData.lineitems) ? rawData.lineitems : []);
    const totalValue = rawData.totalValue ?? rawData.totalvalue ?? 0;

    if (!Array.isArray(db.grns)) db.grns = [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehousecode = warehouseCode;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;
    dbPayload.totalValue = totalValue;
    dbPayload.totalvalue = totalValue;

    supabasePayload.warehousecode = warehouseCode;
    supabasePayload.lineitems = lineItems;
    supabasePayload.totalvalue = totalValue;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.warehouse_code;
    delete supabasePayload.lineItems;
    delete supabasePayload.totalValue;
    delete supabasePayload.total_value;
  }

  if (module === 'sales-orders') {
    const warehouseCode = rawData.warehouseCode || (db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '');
    const lineItems = Array.isArray(rawData.lineItems) ? rawData.lineItems : [];

    dbPayload.warehouseCode = warehouseCode;
    dbPayload.warehouse_code = warehouseCode;
    dbPayload.lineItems = lineItems;
    dbPayload.lineitems = lineItems;
    dbPayload.quotationId = rawData.quotationId || null;
    dbPayload.quotation_id = rawData.quotationId || null;

    supabasePayload.warehouse_code = warehouseCode;
    supabasePayload.quotation_id = rawData.quotationId || null;
    supabasePayload.lineitems = lineItems;

    delete supabasePayload.warehouseCode;
    delete supabasePayload.quotationId;
    delete supabasePayload.quotationid;
    delete supabasePayload.discountTotal;
    delete supabasePayload.discounttotal;
    delete supabasePayload.subtotal;
    delete supabasePayload.lineItems;
  }

  try {
    // KIỂM TRA XUNG ĐỘT DỮ LIỆU ĐA NGƯỜI DÙNG KHI CHỈNH SỬA (MODE EDIT)
    if (state.mode === 'edit') {
      const { data: serverRecord } = await supabaseClient
        .from(tableName)
        .select('date2, time2, user_id2')
        .eq('id', dbPayload.id)
        .maybeSingle();

      if (serverRecord && serverRecord.date2 && serverRecord.time2) {
        const localLastUpdate = `${state.formData.date2 || ''} ${state.formData.time2 || ''}`.trim();
        const serverLastUpdate = `${serverRecord.date2} ${serverRecord.time2}`.trim();

        if (serverLastUpdate > localLastUpdate) {
          const editorName = getUserFullName(serverRecord.user_id2);
          const confirmOverwrite = await showConfirm(
            `CẢNH BÁO XUNG ĐỘT DỮ LIỆU:\nBản ghi này vừa được cập nhật bởi [${editorName}] lúc ${serverLastUpdate}.\n\nBạn có muốn ghi đè dữ liệu của họ không?`,
            'Xung đột dữ liệu đa người dùng'
          );

          if (!confirmOverwrite) {
            await fetchDataFromSupabase();
            render();
            return; // Hủy thao tác lưu
          }
        }
      }
    }

    if (state.mode === 'add') {
      const { error } = await supabaseClient.from(tableName).insert([supabasePayload]);
      if (error) throw error;
      db[targetKey].unshift(dbPayload);

      if (module === 'quotations') {
        addNotification(
          'quotation_add',
          'Báo Giá Mới Đã Tạo',
          `Đã tạo thành công báo giá ${dbPayload.id} cho KH: ${dbPayload.customer || 'Khách hàng'}`,
          'quotations',
          dbPayload.id,
          currentUserFullname
        );
      }

    } else {
      const { error } = await supabaseClient.from(tableName).update(supabasePayload).eq('id', dbPayload.id);
      if (error) throw error;
      const idx = db[targetKey].findIndex(item => item.id === dbPayload.id);
      if (idx !== -1) db[targetKey][idx] = dbPayload;

      if (module === 'quotations') {
        addNotification(
          'quotation_edit',
          'Cập Nhật Báo Giá',
          `Báo giá ${dbPayload.id} (${dbPayload.customer || 'Khách hàng'}) đã được cập nhật`,
          'quotations',
          dbPayload.id,
          currentUserFullname
        );
      }
    }

    if (['quotations', 'orders', 'returns', 'grns'].includes(targetKey)) {
      db[targetKey].sort(sortDescById);
    }

    // THÊM THÔNG BÁO TOAST THÀNH CÔNG TẠI ĐÂY
    showToast(state.mode === 'add' ? 'Thêm mới dữ liệu thành công!' : 'Cập nhật dữ liệu thành công!', 'success');

    invalidateStockCache();
    // Bắt buộc await để dữ liệu mới từ Database kịp nạp vào biến db
    await fetchDataFromSupabase();
    state.formData = null;
    state.mode = 'list';
    navigate(module, 'list');
  } catch (error) {
    console.error('Lỗi lưu Supabase:', error);
    showAlert('Lưu thất bại: ' + (error.message || error), 'Lỗi');
  }
}

async function deleteItem(module, id) {
  if (!checkModulePermission(module)) {
    await showAlert('Tài khoản của bạn chỉ có quyền xem, không được phép xóa!', 'Cảnh báo quyền');
    return;
  }

  const confirmDelete = await showConfirm(`Bạn có chắc chắn muốn xóa thông tin có ID: ${id}?`, 'Xác nhận xóa');

  if (confirmDelete) {
    const tableMap = {
      'materials': 'materials',
      'customers': 'customers',
      'warehouses': 'warehouses',
      'quotations': 'quotations',
      'sales-orders': 'orders',
      'returns': 'returns',
      'grn': 'grns'
    };
    const tableName = tableMap[module];
    const targetKey = module === 'sales-orders' ? 'orders' : (module === 'grn' ? 'grns' : module);

    if (Array.isArray(db[targetKey])) {
      db[targetKey] = db[targetKey].filter(item => String(item.id) !== String(id));
    }
    render();

    const { error } = await supabaseClient.from(tableName).delete().eq('id', id);
    if (error) {
      await showAlert('Xóa trên CSDL thất bại: ' + error.message, 'Lỗi kết nối');
      await fetchDataFromSupabase();
      render();
    }
    else {
      // THÊM THÔNG BÁO TOAST THÀNH CÔNG KHI XÓA TRÊN DATABASE THÀNH CÔNG
      showToast('Đã xóa bản ghi thành công!', 'success');
    }
  }
}

function initFormData(module, id) {
  const keyMap = { 'sales-orders': 'orders', 'grn': 'grns' };
  const targetKey = keyMap[module] || module;
  const collection = db[targetKey] || [];

  if (id) {
    state.formData = JSON.parse(JSON.stringify(collection.find(x => String(x.id) === String(id))));
  } else {
    const autoId = generateAutoId(module);
    if (module === 'materials') {
      state.formData = {
        id: autoId, name: '', unit: '', category: 'Hoa Quả', location: '', stock: 0, reorder: 0, cost: 0, status: 'ok'
      };
    }

    if (module === 'customers') {
      state.formData = {
        id: autoId, name: '', type: 'B2B', contact: '', email: '', phone: '', address: '', creditLimit: 0, paymentTerms: 'Net 30', status: 'active'
      };
    }

    if (module === 'warehouses') {
      state.formData = {
        id: autoId, code: autoId, name: '', location: '', capacity: 0, used: 0, manager: '', status: 'active'
      };
    }

    if (module === 'quotations') {
      const today = getTodayDateStr();
      const firstDay = getFirstDayOfMonthStr();
      const { lastDay } = getMonthRange();
      state.formData = {
        id: autoId, customer: '', date: today, validbegin: firstDay, validUntil: lastDay, status: 'accepted', notes: '',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0 }]
      };
    }

    if (module === 'sales-orders') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId,
        customer: '',
        warehouseCode: defaultWh,
        quotationId: null,
        date: getTodayDateStr(),
        status: 'completed',
        notes: '',
        tax: 0,
        total: 0,
        lineItems: [
          {
            lineId: Date.now().toString(),
            warehouseCode: defaultWh,
            sku: '',
            name: '',
            qty: 1,
            unitPrice: 0,
            discount: 0,
            tax: 0
          }
        ]
      };
    }

    if (module === 'returns') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId, warehouseCode: defaultWh, orderId: '', customer: '', date: getTodayDateStr(), reason: 'Hàng lỗi/hỏng', notes: '', status: 'processed',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', qtyReturned: 1, unitPrice: 0 }]
      };
    }

    if (module === 'grn') {
      const defaultWh = db.warehouses[0] ? (db.warehouses[0].code || db.warehouses[0].id) : '';
      state.formData = {
        id: autoId,
        supplier: '',
        warehouseCode: defaultWh,
        notes: '',
        date: getTodayDateStr(),
        status: 'Đã nhận',
        lineItems: [{ lineId: Date.now().toString(), sku: '', name: '', receivedQty: 1, unitCost: 0 }]
      };
    }
  }
}

// ==========================================
// 7. CÁC HÀM XỬ LÝ CHỌN LỌC TỰ ĐỘNG DỮ LIỆU
// ==========================================

function updateGlobalMaterialDatalist() {
  let dl = document.getElementById('global-materials-list');
  if (!dl) {
    dl = document.createElement('datalist');
    dl.id = 'global-materials-list';
    document.body.appendChild(dl);
  }
  dl.innerHTML = (db.materials || []).map(m => {
    const safeName = m.name || '';
    const safeId = m.id || '';
    const safeCost = m.cost || 0;
    return `<option value="${safeName}">${safeId} - ${safeName} (${fmtUSD(safeCost)})</option>`;
  }).join('');
}

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

function handleMaterialSelectInLine(lineId, selectedName) {
  if (!state.formData || state.mode === 'view') return;
  const line = (state.formData.lineItems || []).find(l => l.lineId === lineId);
  if (!line) return;

  const valStr = selectedName ? String(selectedName).trim() : '';
  if (!valStr) {
    line.name = '';
    line.sku = '';
    render();
    return;
  }

  let cleanName = valStr;
  if (valStr.includes(' - ')) {
    const parts = valStr.split(' - ');
    cleanName = parts.length > 1 ? parts.slice(1).join(' - ').split(' (')[0].trim() : valStr;
  }

  const mat = (db.materials || []).find(m =>
    (m.name && m.name.toLowerCase() === cleanName.toLowerCase()) ||
    (m.id && m.id.toLowerCase() === valStr.toLowerCase())
  );

  if (mat) {
    line.name = mat.name || '';
    line.sku = mat.id || '';
    line.unitPrice = mat.cost || 0;
    line.unitCost = mat.cost || 0;
  } else {
    line.name = cleanName;
  }

  render();
}

async function handleCustomerSelectInQuotation(customerName) {
  if (!state.formData || state.mode === 'view') return;
  const safeCustomer = String(customerName || '').trim();
  state.formData.customer = safeCustomer;

  // Nếu bỏ chọn khách hàng (về ô trống)
  if (!safeCustomer) {
    state.formData.lineItems = [{
      lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
    render();
    return;
  }

  // Tìm báo giá gần nhất của khách hàng này
  const latestQuotation = (db.quotations || [])
    .filter(q => q && q.customer === safeCustomer)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  // Nếu tìm thấy báo giá cũ có chi tiết mặt hàng
  if (latestQuotation && Array.isArray(latestQuotation.lineItems) && latestQuotation.lineItems.length > 0) {
    
    // Hiển thị hộp thoại cảnh báo / hỏi ý kiến người dùng
    const confirmInherit = await showConfirm(
      `Khách hàng "${safeCustomer}" đã có báo giá cũ (${latestQuotation.id}). Bạn có muốn kế thừa thông tin chi tiết từ báo giá này không?`,
      'Xác nhận kế thừa báo giá'
    );

    if (confirmInherit) {
      // Người dùng chọn ĐỒNG Ý -> Sao chép danh sách dòng sản phẩm từ báo giá cũ
      state.formData.lineItems = latestQuotation.lineItems.map(item => ({
        lineId: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        sku: item.sku || '',
        name: item.name || '',
        qty: item.qty ?? 1,
        unitPrice: item.unitPrice ?? 0,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0
      }));
    } else {
      // Người dùng chọn HỦY BỎ -> Tạo 1 dòng trống sạch sẽ để nhập mới từ đầu
      state.formData.lineItems = [{
        lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
      }];
    }
  } else {
    // Trường hợp Khách hàng chưa từng có báo giá nào trước đó
    state.formData.lineItems = [{
      lineId: Date.now().toString(), sku: '', name: '', qty: 1, unitPrice: 0, discount: 0, tax: 0
    }];
  }

  // Render lại giao diện (Đồng thời mở khóa vùng nhập chi tiết sản phẩm bên dưới)
  render();
}

async function handleCustomerSelectInOrder(customerName) {
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
    const confirmImport = await showConfirm(
      "Bạn có muốn nhập toàn bộ mã hàng, đơn giá theo Bảng báo giá không?",
      "Áp dụng báo giá"
    );

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

// ==========================================
// HÀM BỔ TRỢ CHUNG: TẠO VÀ CHIA SẺ FILE PDF QUA ZALO / TẢI VỀ PC
// ==========================================
async function generateAndSharePDF(htmlElement, fileName, shareTitle) {
  if (typeof html2pdf === 'undefined') {
    showAlert('Thư viện html2pdf chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const fullFileName = `${fileName}.pdf`;
  const opt = {
    margin: [10, 10, 10, 10],
    filename: fullFileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const worker = html2pdf().set(opt).from(htmlElement);
    const pdfBlob = await worker.output('blob');

    // Kiểm tra xem thiết bị có phải di động (Android / iOS) hay không
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 1. DÀNH CHO MOBILE: MỞ BẢNG CHIA SẺ QUA ZALO
    if (isMobile && navigator.canShare) {
      const file = new File([pdfBlob], fullFileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: `Gửi ${shareTitle} qua Zalo`
          });
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Lỗi khi chia sẻ trên Mobile:', shareErr);
          }
          return;
        }
      }
    }

    // 2. DÀNH CHO PC: TẢI TRỰC TIẾP FILE PDF VỀ THƯ MỤC MẶC ĐỊNH
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    showAlert('Có lỗi xảy ra trong quá trình tạo file PDF!', 'Lỗi');
  }
}

// ==========================================
// 1. XUẤT PDF BẢNG BÁO GIÁ
// ==========================================
async function exportQuotationToPDF() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const fromDateVN = formatDateVN(d.validbegin || d.validBegin || d.date);
  const toDateVN = formatDateVN(d.validUntil || d.validuntil);
  const items = (d.lineItems || d.lineitems || []);

  let totalQty = 0;
  let totalAmount = 0;

  const maxRows = Math.max(items.length, 12);
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
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${i + 1}</td>
          <td style="border: 1px solid #000; text-align: left; font-size: 11pt; padding: 3px 6px;">${l.name || ''}</td>
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${unitName}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${discount ? discount + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${tax ? tax + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
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

  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.boxSizing = 'border-box';
  container.style.padding = '10px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Times New Roman', serif";

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <tr>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
          Xã Sơn Đồng – TP Hà Nội<br>
          ĐT: 0936.35.31.37
        </td>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          Giấy phép ĐKKD số: 01U8005300<br>
          Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
          MST: 0110640531
        </td>
      </tr>
    </table>

    <div style="font-size: 16pt; font-weight: bold; text-align: center; margin: 15px 0 12px 0;">
      CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
    </div>

    <table style="width: 100%; font-size: 11pt; margin-bottom: 12px; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 3px 0;">Khách hàng: ${d.customer || ''}</td>
        <td style="width: 50%; padding: 3px 0;">Bảng báo giá: ${d.id || ''}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0;">Địa chỉ: ${custAddress}</td>
        <td style="padding: 3px 0;">Ngày hiệu lực: từ ngày ${fromDateVN} - đến ngày ${toDateVN}</td>
      </tr>
    </table>

    <div style="border: 1.5px solid #000000; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
        <thead>
          <tr style="background-color: #8db4e2; font-weight: bold; text-align: center; height: 26px;">
            <td style="border: 1px solid #000000; width: 4%;">STT</td>
            <td style="border: 1px solid #000000; width: 32%;">Tên Hàng</td>
            <td style="border: 1px solid #000000; width: 8%;">ĐVT</td>
            <td style="border: 1px solid #000000; width: 12%;">Đơn Giá</td>
            <td style="border: 1px solid #000000; width: 11%;">Số Lượng</td>
            <td style="border: 1px solid #000000; width: 8%;">CK%</td>
            <td style="border: 1px solid #000000; width: 8%;">Thuế%</td>
            <td style="border: 1px solid #000000; width: 17%;">Thành Tiền</td>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="height: 26px; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #000000; text-align: center;">Tổng Cộng</td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
      <div style="width: 250px; text-align: center; font-size: 11pt;">
        <div>Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
        <div style="font-weight: bold; margin-top: 4px; margin-bottom: 55px;">Đại diện nhà cung cấp</div>
        <div style="font-weight: bold;">BÙI CAO NHÂM</div>
      </div>
    </div>
  `;

  await generateAndSharePDF(container, `BaoGia_${d.id || 'Export'}`, `Bảng Báo Giá ${d.id || ''}`);
}

// ==========================================
// 2. XUẤT PDF ĐƠN BÁN HÀNG
// ==========================================
async function exportSalesOrderToPDF() {
  const d = state.formData;
  if (!d) return;

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const items = (d.lineItems || d.lineitems || []);

  let totalQty = 0;
  let totalAmount = 0;

  const maxRows = Math.max(items.length, 12);
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
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${i + 1}</td>
          <td style="border: 1px solid #000; text-align: left; font-size: 11pt; padding: 3px 6px;">${l.name || ''}</td>
          <td style="border: 1px solid #000; text-align: center; font-size: 11pt; padding: 3px;">${unitName}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${price ? Math.round(price).toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${qty ? qty.toLocaleString('vi-VN') : ''}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${discount ? discount + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${tax ? tax + '%' : '0%'}</td>
          <td style="border: 1px solid #000; text-align: right; font-size: 11pt; padding: 3px 6px;">${lineTotal ? Math.round(lineTotal).toLocaleString('vi-VN') : ''}</td>
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

  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.boxSizing = 'border-box';
  container.style.padding = '10px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Times New Roman', serif";

  container.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <tr>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1<br>
          Xã Sơn Đồng – TP Hà Nội<br>
          ĐT: 0936.35.31.37
        </td>
        <td style="width: 50%; font-size: 10pt; text-align: center; vertical-align: top; line-height: 1.4;">
          Giấy phép ĐKKD số: 01U8005300<br>
          Địa chỉ nhận hóa đơn: nhambc@gmail.com<br>
          MST: 0110640531
        </td>
      </tr>
    </table>

    <div style="font-size: 16pt; font-weight: bold; text-align: center; margin: 15px 0 12px 0;">
      CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ
    </div>

    <table style="width: 100%; font-size: 11pt; margin-bottom: 12px; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 3px 0;">Khách hàng: ${d.customer || ''}</td>
        <td style="width: 50%; padding: 3px 0;">Đơn hàng bán: ${d.id || ''}</td>
      </tr>
      <tr>
        <td style="padding: 3px 0;">Địa chỉ: ${custAddress}</td>
        <td style="padding: 3px 0;">Ghi chú: ${d.notes || ''}</td>
      </tr>
    </table>

    <div style="border: 1.5px solid #000000; box-sizing: border-box;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11pt;">
        <thead>
          <tr style="background-color: #8db4e2; font-weight: bold; text-align: center; height: 26px;">
            <td style="border: 1px solid #000000; width: 4%;">STT</td>
            <td style="border: 1px solid #000000; width: 32%;">Tên Hàng</td>
            <td style="border: 1px solid #000000; width: 8%;">ĐVT</td>
            <td style="border: 1px solid #000000; width: 12%;">Đơn Giá</td>
            <td style="border: 1px solid #000000; width: 11%;">Số Lượng</td>
            <td style="border: 1px solid #000000; width: 8%;">CK%</td>
            <td style="border: 1px solid #000000; width: 8%;">Thuế%</td>
            <td style="border: 1px solid #000000; width: 17%;">Thành Tiền</td>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="height: 26px; font-weight: bold;">
            <td colspan="4" style="border: 1px solid #000000; text-align: center;">Tổng Cộng</td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalQty ? totalQty.toLocaleString('vi-VN') : ''}</td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000;"></td>
            <td style="border: 1px solid #000000; text-align: right; padding-right: 6px;">${totalAmount ? Math.round(totalAmount).toLocaleString('vi-VN') : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
      <div style="width: 250px; text-align: center; font-size: 11pt;">
        <div>Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</div>
        <div style="font-weight: bold; margin-top: 4px; margin-bottom: 55px;">Đại diện nhà cung cấp</div>
        <div style="font-weight: bold;">BÙI CAO NHÂM</div>
      </div>
    </div>
  `;

  await generateAndSharePDF(container, `DonHang_${d.id || 'Export'}`, `Đơn Bán Hàng ${d.id || ''}`);
}

// ==========================================
// 1. Xuất Excel Báo Giá (ĐÃ NÂNG CẤP XUẤT .XLSX & CHIA SẺ ZALO)
// ==========================================
function exportQuotationToExcel() {
  const d = state.formData;
  if (!d) return;

  if (typeof XLSX === 'undefined') {
    showAlert('Thư viện XLSX chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);
  const fromDateVN = formatDateVN(d.validbegin || d.validBegin || d.date);
  const toDateVN = formatDateVN(d.validUntil || d.validuntil);

  // Tạo mảng dữ liệu 2 chiều cho SheetJS
  const sheetData = [
    ["ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1", "", "", "", "Giấy phép ĐKKD số: 01U8005300", "", "", ""],
    ["Xã Sơn Đồng – TP Hà Nội", "", "", "", "Địa chỉ nhận hóa đơn: nhambc@gmail.com", "", "", ""],
    ["ĐT: 0936.35.31.37", "", "", "", "MST: 0110640531", "", "", ""],
    ["CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ", "", "", "", "", "", "", ""],
    [`Khách hàng: ${d.customer || ''}`, "", "", "", `Bảng báo giá: ${d.id || ''}`, "", "", ""],
    [`Địa chỉ: ${custAddress}`, "", "", "", `Ngày hiệu lực: từ ngày ${fromDateVN} - đến ngày ${toDateVN}`, "", "", ""],
    [""], // Dòng trống
    ["STT", "Tên Hàng", "ĐVT", "Đơn Giá", "Số Lượng", "CK%", "Thuế%", "Thành Tiền"]
  ];

  let totalQty = 0;
  let totalAmount = 0;
  const items = (d.lineItems || d.lineitems || []);

  items.forEach((l, idx) => {
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

    sheetData.push([
      idx + 1,
      l.name || '',
      unitName,
      price,
      qty,
      `${discount}%`,
      `${tax}%`,
      Math.round(lineTotal)
    ]);
  });

  // Thêm dòng Tổng cộng và Chữ ký
  sheetData.push(
    ["Tổng Cộng", "", "", "", totalQty, "", "", Math.round(totalAmount)],
    [""],
    ["", "", "", "", "", `Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", ""],
    ["", "", "", "", "", "Đại diện nhà cung cấp", "", ""],
    [""],
    [""],
    ["", "", "", "", "", "BÙI CAO NHÂM", "", ""]
  );

  // Tạo Worksheet và thêm Merges ô
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Tiêu đề công ty
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    { s: { r: sheetData.length - 7, c: 0 }, e: { r: sheetData.length - 7, c: 3 } }, // Tổng cộng label
    { s: { r: sheetData.length - 5, c: 5 }, e: { r: sheetData.length - 5, c: 7 } }, // Ngày tháng
    { s: { r: sheetData.length - 4, c: 5 }, e: { r: sheetData.length - 4, c: 7 } }, // Chức danh
    { s: { r: sheetData.length - 1, c: 5 }, e: { r: sheetData.length - 1, c: 7 } }  // Tên người ký
  ];

  // Căn chỉnh độ rộng cột chuẩn
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 32 }, // Tên Hàng
    { wch: 10 }, // ĐVT
    { wch: 14 }, // Đơn Giá
    { wch: 10 }, // Số Lượng
    { wch: 8 },  // CK%
    { wch: 8 },  // Thuế%
    { wch: 16 }  // Thành Tiền
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BaoGia");

  // Tiến hành tải xuống hoặc mở bảng Share Zalo
  downloadOrShareXLSX(wb, `BaoGia_${d.id || 'Export'}`);
}

// ==========================================
// 2. Xuất Excel Đơn Bán Hàng (ĐÃ NÂNG CẤP XUẤT .XLSX & CHIA SẺ ZALO)
// ==========================================
function exportSalesOrderToExcel() {
  const d = state.formData;
  if (!d) return;

  if (typeof XLSX === 'undefined') {
    showAlert('Thư viện XLSX chưa được tải, vui lòng kiểm tra kết nối mạng!', 'Lỗi');
    return;
  }

  const custAddress = getCustomerAddress(d.customer);
  const { dayStr, monthStr, yearStr } = parseDateParts(d.date);

  const sheetData = [
    ["ĐC: Số 9 - Ngách 35A/2 - đường Tiền Thái 1", "", "", "", "Giấy phép ĐKKD số: 01U8005300", "", "", ""],
    ["Xã Sơn Đồng – TP Hà Nội", "", "", "", "Địa chỉ nhận hóa đơn: nhambc@gmail.com", "", "", ""],
    ["ĐT: 0936.35.31.37", "", "", "", "MST: 0110640531", "", "", ""],
    ["CÔNG TY TNHH THƯƠNG MẠI HOA QUẢ MINH KHUÊ", "", "", "", "", "", "", ""],
    [`Khách hàng: ${d.customer || ''}`, "", "", "", `Đơn hàng bán: ${d.id || ''}`, "", "", ""],
    [`Địa chỉ: ${custAddress}`, "", "", "", `Ghi chú: ${d.notes || ''}`, "", "", ""],
    [""], // Dòng trống
    ["STT", "Tên Hàng", "ĐVT", "Đơn Giá", "Số Lượng", "CK%", "Thuế%", "Thành Tiền"]
  ];

  let totalQty = 0;
  let totalAmount = 0;
  const items = (d.lineItems || d.lineitems || []);

  items.forEach((l, idx) => {
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

    sheetData.push([
      idx + 1,
      l.name || '',
      unitName,
      price,
      qty,
      `${discount}%`,
      `${tax}%`,
      Math.round(lineTotal)
    ]);
  });

  sheetData.push(
    ["Tổng Cộng", "", "", "", totalQty, "", "", Math.round(totalAmount)],
    [""],
    ["", "", "", "", "", `Hà Nội, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`, "", ""],
    ["", "", "", "", "", "Đại diện nhà cung cấp", "", ""],
    [""],
    [""],
    ["", "", "", "", "", "BÙI CAO NHÂM", "", ""]
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    { s: { r: sheetData.length - 7, c: 0 }, e: { r: sheetData.length - 7, c: 3 } },
    { s: { r: sheetData.length - 5, c: 5 }, e: { r: sheetData.length - 5, c: 7 } },
    { s: { r: sheetData.length - 4, c: 5 }, e: { r: sheetData.length - 4, c: 7 } },
    { s: { r: sheetData.length - 1, c: 5 }, e: { r: sheetData.length - 1, c: 7 } }
  ];

  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DonHang");

  downloadOrShareXLSX(wb, `DonHang_${d.id || 'Export'}`);
}

// ==========================================
// HÀM BỔ TRỢ: TẢI FILE EXCEL HOẶC CHIA SẺ QUA ZALO
// ==========================================
async function downloadOrShareXLSX(workbook, fileName) {
  if (typeof XLSX === 'undefined') {
    showAlert('Thư viện XLSX chưa được tải, vui lòng kiểm tra lại kết nối!', 'Lỗi');
    return;
  }

  const fullFileName = `${fileName}.xlsx`;

  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 1. DÀNH CHO MOBILE: MỞ BẢNG CHIA SẺ (ZALO / MESSENGER)
    if (isMobile && navigator.canShare) {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], fullFileName, { type: blob.type });

      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fullFileName,
            text: `Gửi file Excel ${fullFileName}`
          });
          return;
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Lỗi chia sẻ file Excel:', shareErr);
          }
          return;
        }
      }
    }

    // 2. DÀNH CHO PC: TẢI TRỰC TIẾP FILE EXCEL VỀ MÁY
    XLSX.writeFile(workbook, fullFileName);

  } catch (err) {
    console.error('Lỗi khi xuất file Excel:', err);
    showAlert('Có lỗi xảy ra trong quá trình tạo file Excel!', 'Lỗi');
  }
}

// Kiểm tra xem form giao dịch hiện tại có dữ liệu chưa lưu hay không
function hasUnsavedFormData() {
  // Nếu đang ở màn hình danh sách (list) hoặc xem (view) thì không cảnh báo
  if (!['add', 'edit'].includes(state.mode)) return false;
  if (!['quotations', 'sales-orders', 'returns', 'grn'].includes(state.view)) return false;

  const d = state.formData;
  if (!d) return false;

  // Nếu người dùng đã chọn Khách hàng hoặc Nhà cung cấp
  if (d.customer || d.supplier) return true;

  // Nếu đã thêm mặt hàng vào danh sách chi tiết (tên hàng không rỗng)
  const lineItems = Array.isArray(d.lineItems) ? d.lineItems : (d.lineitems || []);
  const hasItems = lineItems.some(item => item.name && item.name.trim() !== '');

  return hasItems;
}