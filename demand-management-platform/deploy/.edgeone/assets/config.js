// Supabase 配置
// 请在 Supabase 控制台获取以下信息
// https://supabase.com → 选择项目 → Settings → API

const SUPABASE_CONFIG = {
    // 项目 URL (例如: https://xxxxx.supabase.co)
    url: '',
    // Service Role Key (用于完全访问)
    serviceKey: '',
    // Anon Key (用于客户端受限访问)
    anonKey: '',
    // 表名配置
    tables: {
        demands: 'demands',
        reviews: 'reviews',
        users: 'users'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}