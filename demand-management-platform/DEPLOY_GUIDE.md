# 需求管理平台 - 部署指南

## 步骤 1: 注册 Supabase 账号 (云数据库)

1. 访问 https://supabase.com
2. 点击 "Start your project" → "Sign up"
3. 使用 GitHub 或邮箱注册
4. 创建新项目:
   - 项目名称: `demand-management`
   - 数据库密码: 设置一个强密码
   - 区域: 选择 `Southeast Asia (Singapore)` 或 `US East (Virginia)`
5. 项目创建后，进入 Settings → API
6. 复制以下信息:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...`
   - **service_role key**: `eyJhbG...` (点击 reveal)

## 步骤 2: 在 Supabase 创建数据库表

1. 在 Supabase 控制台，点击左侧 "SQL Editor"
2. 复制并执行以下 SQL:

```sql
-- 需求表
CREATE TABLE demands (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  platform TEXT NOT NULL,
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  applied_country TEXT NOT NULL,
  need_country TEXT NOT NULL,
  applied_region TEXT,
  need_region TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  proposer_country TEXT,
  proposer_name TEXT,
  registration_info TEXT,
  expect_date TEXT,
  launch_date TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  doc_url TEXT,
  remark TEXT,
  pm_list TEXT[],
  capability TEXT,
  need_review TEXT DEFAULT '否',
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT
);

-- 审查建议表
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  demand_id TEXT NOT NULL,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  date TEXT NOT NULL,
  capability TEXT,
  module TEXT,
  need_country TEXT,
  pm_list TEXT[],
  content TEXT NOT NULL,
  FOREIGN KEY (demand_id) REFERENCES demands(id)
);

-- 用户表 (用于登录)
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT NOW()::TEXT
);

-- 插入初始用户
INSERT INTO users (username, name, role, password) VALUES
('zhuli', '朱黎', '组长', '123456'),
('zhangdongliang', '张栋良', '组员', '123456'),
('pengchengshuo', '彭程硕', '组员', '123456'),
('lisikai', '李思开', '组员', '123456'),
('sunjiajun', '孙佳俊', '组员', '123456'),
('lvshaojun', '吕少俊', '组长', '123456');

-- 插入示例需求
INSERT INTO demands (id, type, platform, role, module, applied_country, need_country, applied_region, need_region, title, content, proposer_country, proposer_name, registration_info, expect_date, launch_date, status, priority, doc_url, remark, pm_list, capability, need_review, created_at, updated_at, created_by) VALUES
('DM001', '平台', 'APP', '分销体系', '佣金', '巴基斯坦', '全部', '南亚', '全部', '佣金结算模块优化', '优化佣金结算流程，支持多币种结算', '巴基斯坦', 'Ali Khan', '张栋良 | 2026-05-01', '2026-06-15', '2026-06-01', '开发中', 'P0', '', '紧急需求', ARRAY['张栋良','朱黎'], '标准能力迭代', '是', '张栋良 | 2026-05-01', '张栋良 | 2026-05-20', '张栋良'),
('DM002', '业务', 'Web', '全部', '风控', '孟加拉', '孟加拉', '南亚', '南亚', '风控规则引擎升级', '升级风控规则引擎，支持更灵活的规则配置', '孟加拉', 'Rahim', '彭程硕 | 2026-05-05', '2026-07-01', '2026-06-20', '待评审', 'P1', '', '', ARRAY['彭程硕','李思开'], '差异能力新增', '是', '彭程硕 | 2026-05-05', '彭程硕 | 2026-05-18', '彭程硕'),
('DM003', '平台', 'KILI', '职能体系', '数据看板', '全部', '全部', '全部', '全部', '分销数据看板V2', '新增分销团队KPI数据看板，支持多维度分析', '', '', '朱黎 | 2026-05-10', '2026-06-30', '', '待确认', 'P0', '', 'Q2重点', ARRAY['朱黎'], '标准能力新增', '否', '朱黎 | 2026-05-10', '朱黎 | 2026-05-10', '朱黎');

-- 插入示例审查建议
INSERT INTO reviews (id, demand_id, author, author_role, date, capability, module, need_country, pm_list, content) VALUES
('RV001', 'DM001', '朱黎', '组长', '2026-05-02 10:00:00', '标准能力迭代', '佣金', '全部', ARRAY['张栋良'], '确认为标准能力迭代，优先级建议维持P0'),
('RV002', 'DM002', '张栋良', '组员', '2026-05-06 14:30:00', '差异能力新增', '风控', '孟加拉', ARRAY['彭程硕','李思开'], '建议增加AB test能力，先在孟加拉市场验证');
```

3. 点击 "Run" 执行

## 步骤 3: 注册 Vercel 账号 (部署)

1. 访问 https://vercel.com
2. 点击 "Sign Up" → 使用 GitHub 注册
3. 完成注册后，继续下一步

## 步骤 4: 配置环境变量

1. 编辑 `config.js` 文件，填入 Supabase 信息:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co',  // 替换为你的 Project URL
    serviceKey: 'eyJhbG...',           // 替换为你的 service_role key
    anonKey: 'eyJhbG...',              // 替换为你的 anon key
    // ... 其他配置保持不变
};
```

## 步骤 5: 部署到 Vercel

### 方法 A: 通过 Vercel CLI (推荐)

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入项目目录
cd /Users/zhangdongliang/WorkBuddy/2026-05-25-18-09-19/demand-management-platform

# 4. 部署
vercel --prod

# 5. 按提示操作:
# - Set up and deploy? → Y
# - Which scope? → 选择你的账号
# - Link to existing project? → N
# - Project name? → demand-management
# - Directory is ./? → Y
# - Want to override settings? → N
```

### 方法 B: 通过 Vercel 网页界面

1. 登录 https://vercel.com
2. 点击 "New Project"
3. 选择 "Import Git Repository" 或 "Upload"
4. 如果选择 Upload:
   - 上传 `demand-management-platform` 文件夹
5. 点击 "Deploy"
6. 等待部署完成，获得公网 URL

## 步骤 6: 验证部署

1. 访问部署后的 URL
2. 使用测试账号登录:
   - 用户名: `zhangdongliang`
   - 密码: `123456`
3. 测试功能:
   - 登录/退出
   - 新建需求
   - 编辑需求
   - 添加审查建议
   - 查看统计
   - 导出 Excel

## 常见问题

### Q: 部署后无法连接 Supabase
A: 检查 `config.js` 中的 URL 和密钥是否正确，确保没有多余的空格

### Q: 登录失败
A: 确保用户表已创建，且密码正确

### Q: 数据不同步
A: 检查浏览器控制台是否有错误，确保 Supabase 连接正常

## 下一步优化

1. 添加 Supabase Row Level Security (RLS) 保护数据
2. 使用 Supabase Auth 替代简单密码验证
3. 添加数据备份功能
4. 优化移动端体验