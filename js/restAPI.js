// restApi.js - Tầng giao tiếp trực tiếp với Supabase REST API (PostgREST)

const RestAPI = {
    // Tự động lấy URL và Key từ biến cấu hình hiện có trong dự án của bạn
    _getConfig() {
        const url = (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : window.SUPABASE_URL) || '';
        const key = (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY) || '';
        return {
            baseUrl: `${url.replace(/\/$/, '')}/rest/v1`,
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        };
    },

    /**
     * 1. Lấy danh sách có phân trang, lọc trên server và chỉ chọn các cột cần thiết
     * @param {string} table - Tên bảng hoặc View (vd: 'orders', 'v_inventory_realtime')
     * @param {object} options - { select, filters, order, page, pageSize }
     */
    async fetchPaginated(table, {
        select = '*',
        filters = [],
        order = 'id.desc',
        page = 1,
        pageSize = 25
    } = {}) {
        const { baseUrl, headers } = this._getConfig();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const params = new URLSearchParams();
        params.set('select', select);
        if (order) params.set('order', order);

        // Gắn từng điều kiện lọc PostgREST (vd: "status=eq.Hoàn thành", "or=(id.ilike.*abc*,customer.ilike.*abc*)")
        filters.forEach(f => {
            const idx = f.indexOf('=');
            if (idx > -1) {
                const col = f.slice(0, idx);
                const val = f.slice(idx + 1);
                params.append(col, val);
            }
        });

        const res = await fetch(`${baseUrl}/${table}?${params.toString()}`, {
            method: 'GET',
            headers: {
                ...headers,
                'Range': `${from}-${to}`,
                'Prefer': 'count=exact' // Yêu cầu server trả tổng số bản ghi qua header Content-Range
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`REST GET ${table} thất bại (${res.status}): ${errText}`);
        }

        const contentRange = res.headers.get('Content-Range'); // Định dạng: "0-24/302"
        const totalCount = contentRange && contentRange.includes('/')
            ? parseInt(contentRange.split('/')[1], 10) || 0
            : 0;

        const data = await res.json();
        return { data, totalCount, page, pageSize };
    },

    /**
     * 2. Lấy toàn bộ chi tiết của 1 chứng từ (bao gồm cả lineitems) khi bấm Xem/Sửa
     */
    async fetchById(table, id) {
        const { baseUrl, headers } = this._getConfig();
        const res = await fetch(`${baseUrl}/${table}?id=eq.${encodeURIComponent(id)}&select=*`, {
            method: 'GET',
            headers
        });

        if (!res.ok) {
            throw new Error(`REST fetchById ${table}/${id} thất bại (${res.status})`);
        }
        const rows = await res.json();
        return rows[0] || null;
    },

    /**
     * 3. Thêm mới hoặc Cập nhật (Upsert) qua REST
     */
    async upsert(table, payload, onConflict = 'id') {
        const { baseUrl, headers } = this._getConfig();
        const res = await fetch(`${baseUrl}/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`REST Upsert ${table} thất bại: ${errText}`);
        }
        return await res.json();
    },

    /**
     * 4. Xóa bản ghi theo ID qua REST
     */
    async deleteById(table, id) {
        const { baseUrl, headers } = this._getConfig();
        const res = await fetch(`${baseUrl}/${table}?id=eq.${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            throw new Error(`REST Delete ${table}/${id} thất bại`);
        }
        return true;
    },

    /**
     * 5. Gọi PostgreSQL RPC Function (dùng cho get_sales_report)
     */
    async rpc(fnName, payload = {}) {
        const { baseUrl, headers } = this._getConfig();
        const res = await fetch(`${baseUrl}/rpc/${fnName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`REST RPC ${fnName} thất bại: ${errText}`);
        }
        return await res.json();
    }
};

window.RestAPI = RestAPI;