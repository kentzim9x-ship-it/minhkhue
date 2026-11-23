class SupabaseSmartSync {
  constructor(supabaseClient, onModulesChangedCallback) {
    this.supabase = supabaseClient;
    this.onModulesChanged = onModulesChangedCallback; // Hàm callback báo cho UI cập nhật
    
    this.lastVersions = {};      // Lưu mốc sync_versions gần nhất của từng bảng
    this.lastRowSyncTime = {};   // Lưu mốc thời gian lấy delta rows gần nhất
    
    this.baseInterval = 10000;   // 10 giây khi đang hoạt động
    this.maxInterval = 45000;    // 45 giây khi nhàn rỗi
    this.currentInterval = this.baseInterval;
    this.idleCount = 0;
    this.timerId = null;
    this.isLeader = false;

    // Kênh giao tiếp giữa các tab trên cùng 1 trình duyệt
    this.channel = ('BroadcastChannel' in window) ? new BroadcastChannel('supabase_sync_bus') : null;
    this._initListeners();
  }

  _initListeners() {
    // 1. Lắng nghe thông báo từ tab khác (nếu tab này không phải tab chính)
    if (this.channel) {
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_UPDATE') {
          this.lastVersions = { ...this.lastVersions, ...event.data.versions };
          this.onModulesChanged(event.data.changedModules);
        }
      };
    }

    // 2. Khi user quay lại tab hoặc bật lại app trên điện thoại -> kiểm tra ngay
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.resetBackoff();
        this.checkNow();
      }
    });

    // 3. Khi thiết bị vừa có mạng trở lại -> đồng bộ bù ngay
    window.addEventListener('online', () => {
      this.resetBackoff();
      this.checkNow();
    });

    // 4. Khi user thao tác trên giao diện -> giữ tốc độ đồng bộ nhanh
    ['click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, () => this.resetBackoff(), { passive: true });
    });
  }

  resetBackoff() {
    this.idleCount = 0;
    if (this.currentInterval !== this.baseInterval) {
      this.currentInterval = this.baseInterval;
      this._scheduleNext();
    }
  }

  async start() {
    // Khởi tạo mốc thời gian ban đầu (chưa trigger reload)
    const { data } = await this.supabase.from('sync_versions').select('module_name, updated_at');
    if (Array.isArray(data)) {
      const nowIso = new Date().toISOString();
      data.forEach(row => {
        this.lastVersions[row.module_name] = row.updated_at;
        this.lastRowSyncTime[row.module_name] = nowIso;
      });
    }
    this._scheduleNext();
  }

  _scheduleNext() {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this.checkNow(), this.currentInterval);
  }

  async checkNow() {
    if (document.hidden || !navigator.onLine) {
      this._scheduleNext();
      return;
    }

    // Dùng Web Locks API để đảm bảo chỉ 1 tab duy nhất gọi API kiểm tra
    if ('locks' in navigator) {
      await navigator.locks.request('supabase_sync_leader', { ifAvailable: true }, async (lock) => {
        if (!lock) return; // Tab khác đang làm nhiệm vụ kiểm tra rồi, bỏ qua
        await this._performVersionCheck();
      });
    } else {
      await this._performVersionCheck();
    }

    this._scheduleNext();
  }

  async _performVersionCheck() {
    const { data, error } = await this.supabase
      .from('sync_versions')
      .select('module_name, updated_at');

    if (error || !Array.isArray(data)) return;

    const changedModules = [];
    data.forEach(row => {
      const prevTs = this.lastVersions[row.module_name];
      if (prevTs && row.updated_at !== prevTs) {
        changedModules.push(row.module_name);
      }
      this.lastVersions[row.module_name] = row.updated_at;
    });

    if (changedModules.length > 0) {
      this.resetBackoff();
      // Phát tín hiệu cho các tab khác đang mở cùng trình duyệt
      if (this.channel) {
        this.channel.postMessage({
          type: 'SYNC_UPDATE',
          versions: this.lastVersions,
          changedModules
        });
      }
      // Gọi callback cập nhật UI ở tab hiện tại
      await this.onModulesChanged(changedModules);
    } else {
      // Không có gì mới -> tăng thời gian chờ để tiết kiệm tài nguyên
      this.idleCount++;
      if (this.idleCount >= 3) {
        this.currentInterval = Math.min(this.currentInterval + 10000, this.maxInterval);
      }
    }
  }

  // Hàm hỗ trợ tải chỉ các dòng thay đổi (Delta Sync) cho một bảng cụ thể
  async fetchDeltaRows(tableName, selectQuery = '*') {
    const since = this.lastRowSyncTime[tableName] || new Date(0).toISOString();
    const fetchStart = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(tableName)
      .select(selectQuery)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (!error) {
      this.lastRowSyncTime[tableName] = fetchStart;
    }
    return { data: data || [], error };
  }
}