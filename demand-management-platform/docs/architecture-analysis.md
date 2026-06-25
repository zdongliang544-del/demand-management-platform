# 需求管理平台 - 架构分析报告

> 分析人：高见远（架构师）| 日期：2026-06-25

---

## 一、当前架构概览

| 维度 | 现状 |
|------|------|
| 文件结构 | 单文件 `index.html`（2042行，191KB） |
| 前端框架 | 无框架，纯 HTML/CSS/JS |
| 后端服务 | 腾讯云 CloudBase（无服务器数据库） |
| 认证方式 | 硬编码用户 + localStorage Session |
| 部署方式 | EdgeOne Pages（CDN 静态部署） |
| 代码组织 | CSS + HTML + JS 全部内联在单个文件中 |

### 代码量统计

| 区域 | 行数 | 占比 |
|------|------|------|
| CSS 样式 | ~238行 | 12% |
| HTML 结构 | ~424行 | 21% |
| JavaScript 逻辑 | ~1377行 | 67% |
| **合计** | **2042行** | **100%** |

---

## 二、当前架构问题清单

### P0 - 严重问题（必须修复）

#### 1. 安全漏洞：明文密码硬编码在前端
**位置**: `index.html:666-673`

```javascript
const USERS = {
    'zhuli': { name: '朱黎', role: '组长', password: '123456' },
    'zhangdongliang': { name: '张栋良', role: '组员', password: '123456' },
    // ...
};
```

**问题**: 
- 用户名和密码以明文形式硬编码在客户端代码中
- 任何人查看页面源码即可获取所有账号信息
- 密码为统一的 `123456`，无强度要求
- 无服务端认证校验，纯客户端验证

**风险等级**: 🔴 极高 - 等同于无认证

#### 2. 安全漏洞：匿名登录 + 无权限控制
**位置**: `index.html:802-804`

```javascript
await auth.anonymousSignIn();
```

**问题**:
- CloudBase 使用匿名登录，任何访问者都能读写数据库
- 无基于角色的权限控制（RBAC）
- 所有用户看到完全相同的数据和操作权限

#### 3. 数据存储不一致
**位置**: 散布在多个函数中

| 数据类型 | CloudBase | localStorage |
|----------|-----------|--------------|
| 需求(demands) | ✅ | ✅ fallback |
| 审查(reviews) | ✅ | ✅ fallback |
| 排期(schedules) | ❌ | ✅ 仅本地 |
| 用户session | ❌ | ✅ 仅本地 |

**问题**: 
- 排期数据仅存储在 localStorage，换浏览器/清缓存即丢失
- demands 和 reviews 的 CloudBase 写入采用"全删全写"模式，存在数据丢失风险
- 无数据同步机制

### P1 - 重要问题（影响可维护性）

#### 4. 单文件架构，零模块化
- 2042 行代码集中在一个文件中
- CSS、HTML、JS 混合，无关注点分离
- 无组件化，HTML 通过 innerHTML 拼接生成
- 无法进行代码复用

#### 5. 全局变量污染
**位置**: `index.html:678-679`

```javascript
let currentUser = null;
let editingDemandId = null;
let cloudbaseApp = null;
let cloudbaseDb = null;
let scheduleView = 'week';
```

所有状态和函数都在全局作用域，极易产生命名冲突。

#### 6. 大量重复代码

**重复的筛选逻辑**（至少出现 4 次）:
- `applyListFilter()` (line 1133)
- `applyScheduleFilter()` (line 1407)
- `exportToExcel()` (line 1486)
- `updateStats()` (line 1157)

**重复的 HTML 生成**:
- 国家下拉选项在 6 个不同位置重复定义
- PM 人员列表在 4 个位置重复
- 状态选项在 3 个位置重复

#### 7. 数据操作效率低下
**位置**: `index.html:825-843`

```javascript
async function saveDemands(demands) {
    // 先删除所有记录
    const existing = await collection.get();
    for (const item of existing.data || []) {
        await collection.doc(item._id).remove();
    }
    // 再逐条插入
    for (const demand of demands) {
        await collection.add({ data: { ...demand } });
    }
}
```

**问题**:
- 每次保存都执行 N+1 次数据库操作（1次查询 + N次删除 + N次插入）
- 无批量操作支持
- 无事务保护，中途失败会导致数据不一致

#### 8. 大量硬编码数据内嵌
**位置**: `index.html:1530`

`MIGRATION_DATA` 包含 71 条需求数据直接硬编码在 JS 中，增加了文件体积且难以维护。

### P2 - 一般问题（影响开发体验）

#### 9. 无构建工具和开发环境
- 无 package.json、无依赖管理
- 无代码压缩、混淆
- 无热重载开发服务器
- 无 ESLint/Prettier 代码规范

#### 10. 无错误处理和日志
- try-catch 仅在少数地方使用
- 错误仅 `console.error`，无用户反馈
- 无错误上报机制

#### 11. 表单管理混乱
- 多选组件每次打开弹窗都重新初始化
- 表单验证分散在各处
- 编辑和新建共用同一个表单，状态管理复杂

#### 12. XSS 风险
虽然使用了 `escapeHtml()` 函数，但在多处使用 `innerHTML` 直接拼接用户输入：
- 详情弹窗（line 1033）
- 排期表格（line 1377）
- 人员看板（line 1604）

#### 13. 数据模型不一致
- 中文字段名（`登记信息`）与英文字段名混用
- 同一概念有多种存储格式（如 platform 字段同时存储 `platformList` 数组和 `platform` 字符串）
- 无统一的数据模型定义

---

## 三、重构方案设计

### 3.1 总体策略

**核心原则**: 渐进式重构，保持业务连续性

```
Phase 1: 基础设施搭建（不改变业务逻辑）
Phase 2: 代码模块拆分（逻辑等价迁移）
Phase 3: 功能增强（新能力引入）
Phase 4: 安全加固（认证和权限）
```

### 3.2 技术选型建议

**结论：保持纯 JS + 引入轻量工具链**

| 维度 | 方案 | 理由 |
|------|------|------|
| 框架 | **不引入 React/Vue** | 团队规模小、功能简单、学习成本高 |
| 模块化 | **ES Modules (原生)** | 浏览器原生支持，无需打包工具 |
| 样式 | **CSS 变量 + 独立文件** | 保持现有设计系统，仅拆分文件 |
| 构建工具 | **Vite (开发模式)** | 零配置、HMR、ESM 原生支持 |
| 代码规范 | **ESLint + Prettier** | 基础代码质量保障 |
| 类型检查 | **JSDoc + TypeScript 检查** | 渐进式类型增强，不强制 TS |

### 3.3 目标文件结构

```
demand-management-platform/
├── index.html                    # 入口文件（仅 HTML 结构）
├── config.js                     # 配置文件（保持不变）
├── tencent-config.js             # 腾讯云配置（保持不变）
├── package.json                  # 依赖管理
├── vite.config.js                # Vite 构建配置
├── .eslintrc.json                # ESLint 配置
├── .prettierrc                   # Prettier 配置
│
├── src/
│   ├── main.js                   # 应用入口
│   │
│   ├── core/                     # 核心模块
│   │   ├── auth.js               # 认证管理
│   │   ├── db.js                 # 数据库操作封装
│   │   ├── router.js             # 页面路由
│   │   └── state.js              # 全局状态管理
│   │
│   ├── models/                   # 数据模型
│   │   ├── demand.js             # 需求模型
│   │   ├── schedule.js           # 排期模型
│   │   └── review.js             # 审查模型
│   │
│   ├── services/                 # 业务服务层
│   │   ├── demand-service.js     # 需求 CRUD
│   │   ├── schedule-service.js   # 排期 CRUD
│   │   ├── review-service.js     # 审查 CRUD
│   │   ├── stats-service.js      # 统计计算
│   │   └── export-service.js     # 导出功能
│   │
│   ├── components/               # UI 组件
│   │   ├── modal.js              # 弹窗组件
│   │   ├── multi-select.js       # 多选组件
│   │   ├── table.js              # 表格组件
│   │   ├── filter-bar.js         # 筛选栏组件
│   │   ├── toast.js              # 提示组件
│   │   └── gantt-chart.js        # 甘特图组件
│   │
│   ├── pages/                    # 页面模块
│   │   ├── list-page.js          # 需求列表页
│   │   ├── schedule-page.js      # 需求排期页
│   │   ├── stats-page.js         # 需求统计页
│   │   ├── person-page.js        # 人员看板页
│   │   ├── my-tasks-page.js      # 我的任务页
│   │   └── reports-page.js       # 报告生成页
│   │
│   ├── utils/                    # 工具函数
│   │   ├── date.js               # 日期处理
│   │   ├── html.js               # HTML 安全处理
│   │   ├── validation.js         # 表单验证
│   │   └── constants.js          # 常量定义
│   │
│   └── styles/                   # 样式文件
│       ├── variables.css         # CSS 变量
│       ├── base.css              # 基础样式
│       ├── layout.css            # 布局样式
│       ├── components.css        # 组件样式
│       └── pages.css             # 页面样式
│
├── data/                         # 静态数据
│   └── migration-data.json       # 迁移数据（从代码中提取）
│
└── docs/                         # 文档
    └── architecture-analysis.md  # 本文档
```

### 3.4 模块依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                          │
│                    (HTML 结构 + CSS)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       main.js                            │
│                    (应用初始化入口)                        │
└───┬──────┬──────┬──────┬──────┬──────┬──────────────────┘
    │      │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│ list ││sched ││stats ││person││mytask││report│  ← pages/
│page  ││page  ││page  ││page  ││page  ││page  │
└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬───┘
   │       │       │       │       │       │
   ▼       ▼       ▼       ▼       ▼       ▼
┌─────────────────────────────────────────────────────────┐
│                   services/ (业务服务层)                   │
│  demand-service │ schedule-service │ review-service      │
│  stats-service  │ export-service                         │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    models/ (数据模型)                      │
│       demand.js     │    schedule.js    │   review.js    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                     core/ (核心模块)                      │
│     auth.js    │     db.js     │    router.js            │
│                │    state.js   │                          │
└─────────────────────────────────────────────────────────┘
```

### 3.5 模块详细设计

#### 3.5.1 core/auth.js - 认证模块

```javascript
// 职责：用户认证、Session 管理
export const AuthManager = {
    currentUser: null,
    
    async login(username, password) { /* 服务端验证 */ },
    async logout() { /* 清理 session */ },
    checkSession() { /* 检查本地 session */ },
    saveSession(user) { /* 保存 session */ },
    getCurrentUser() { /* 获取当前用户 */ },
    isAdmin() { /* 检查管理员权限 */ }
};
```

#### 3.5.2 core/db.js - 数据库封装

```javascript
// 职责：统一封装 CloudBase 和 localStorage 操作
export const Database = {
    cloudbaseDb: null,
    
    async init() { /* 初始化 CloudBase */ },
    
    // 通用 CRUD
    async findAll(collection, orderBy) { },
    async findById(collection, id) { },
    async create(collection, data) { },
    async update(collection, id, data) { },
    async remove(collection, id) { },
    
    // 批量操作
    async bulkCreate(collection, items) { },
    async bulkRemove(collection, ids) { }
};
```

#### 3.5.3 models/demand.js - 需求数据模型

```javascript
// 职责：定义需求数据结构和验证规则
export const DemandModel = {
    // 字段定义
    fields: {
        id: { type: 'string', required: true },
        title: { type: 'string', required: true, maxLength: 30 },
        content: { type: 'string', required: true },
        type: { type: 'enum', values: ['平台', '业务'], required: true },
        platformList: { type: 'array', items: 'string', required: true },
        // ... 其他字段
    },
    
    // 验证方法
    validate(demand) { /* 返回 {valid, errors} */ },
    
    // 默认值
    defaults() { /* 返回新需求的默认值 */ },
    
    // 序列化
    serialize(demand) { /* 转换为存储格式 */ },
    deserialize(raw) { /* 从存储格式转换 */ }
};
```

#### 3.5.4 services/demand-service.js - 需求业务服务

```javascript
// 职责：需求相关的业务逻辑
export const DemandService = {
    async getDemands(filters) { /* 获取需求列表，支持筛选 */ },
    async getDemandById(id) { /* 获取单条需求 */ },
    async createDemand(data) { /* 创建需求 */ },
    async updateDemand(id, data) { /* 更新需求 */ },
    async deleteDemand(id) { /* 删除需求（含权限检查）*/ },
    
    // 筛选
    filterDemands(demands, filters) { /* 统一筛选逻辑 */ },
    
    // 统计
    getStatistics(demands) { /* 计算统计数据 */ }
};
```

#### 3.5.5 components/multi-select.js - 多选组件

```javascript
// 职责：可复用的多选组件
export class MultiSelect {
    constructor(containerId, options, selected = []) { }
    
    render() { /* 渲染组件 */ }
    getValues() { /* 获取选中值 */ }
    setValues(values) { /* 设置选中值 */ }
    reset() { /* 重置 */ }
    destroy() { /* 销毁，清理事件 */ }
}
```

---

## 四、迁移路径

### Phase 1：基础设施搭建（预计 2-3 小时）

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1.1 | 初始化 package.json | 依赖管理文件 |
| 1.2 | 配置 Vite 开发服务器 | vite.config.js |
| 1.3 | 配置 ESLint + Prettier | 代码规范配置 |
| 1.4 | 创建 src/ 目录结构 | 空目录和模块文件 |
| 1.5 | 搭建开发环境验证 | 确保 HMR 正常工作 |

### Phase 2：核心模块拆分（预计 4-6 小时）

| 步骤 | 任务 | 说明 |
|------|------|------|
| 2.1 | 提取 CSS 到独立文件 | variables.css → base.css → components.css → pages.css |
| 2.2 | 提取常量和配置 | constants.js, config 统一 |
| 2.3 | 提取工具函数 | date.js, html.js, validation.js |
| 2.4 | 实现 core/db.js | 统一数据库操作封装 |
| 2.5 | 实现 core/auth.js | 认证模块 |
| 2.6 | 实现 core/router.js | 页面路由 |

### Phase 3：业务模块拆分（预计 6-8 小时）

| 步骤 | 任务 | 说明 |
|------|------|------|
| 3.1 | 实现 models/ | 需求、排期、审查数据模型 |
| 3.2 | 实现 services/ | 业务服务层 |
| 3.3 | 实现 components/ | UI 组件抽取 |
| 3.4 | 实现 pages/ | 页面模块化 |
| 3.5 | 实现 main.js | 应用入口，组装所有模块 |

### Phase 4：功能增强（预计 4-6 小时）

| 步骤 | 任务 | 说明 |
|------|------|------|
| 4.1 | 排期数据迁移到 CloudBase | 统一数据存储 |
| 4.2 | 改进 saveDemands 为增量操作 | 避免全删全写 |
| 4.3 | 添加错误边界和用户反馈 | 错误处理增强 |
| 4.4 | 表单验证统一化 | validation.js |
| 4.5 | 数据模型字段统一 | 中英文字段名规范化 |

### Phase 5：安全加固（预计 3-4 小时）

| 步骤 | 任务 | 说明 |
|------|------|------|
| 5.1 | 实现服务端认证 | CloudBase 自定义登录 |
| 5.2 | 实现 RBAC 权限控制 | 基于角色的操作权限 |
| 5.3 | 数据库安全规则 | CloudBase 安全规则配置 |
| 5.4 | 输入验证和 XSS 防护 | 加固所有用户输入处理 |

---

## 五、依赖包列表

### 开发依赖（devDependencies）

| 包名 | 版本 | 用途 |
|------|------|------|
| vite | ^5.x | 开发服务器和构建工具 |
| eslint | ^8.x | 代码规范检查 |
| prettier | ^3.x | 代码格式化 |
| eslint-config-prettier | ^9.x | ESLint + Prettier 集成 |

### 运行时依赖（dependencies）

| 包名 | 版本 | 用途 |
|------|------|------|
| @cloudbase/js-sdk | ^2.x | 腾讯云 CloudBase SDK（当前已通过 CDN 引入） |

> **注意**: 当前方案不需要引入额外的运行时依赖，保持轻量。CloudBase SDK 建议从 CDN 迁移到 npm 管理。

---

## 六、任务分解和实现顺序

### 建议执行顺序（按优先级）

```
Week 1: 基础设施 + 核心模块
├── Day 1-2: Phase 1（基础设施搭建）
├── Day 3-4: Phase 2（核心模块拆分）
└── Day 5: 测试验证

Week 2: 业务模块 + 功能增强
├── Day 1-3: Phase 3（业务模块拆分）
├── Day 4-5: Phase 4（功能增强）

Week 3: 安全加固 + 上线
├── Day 1-2: Phase 5（安全加固）
├── Day 3-4: 集成测试
└── Day 5: 部署上线
```

### 风险点

1. **数据迁移风险**: localStorage 中的排期数据需要迁移到 CloudBase
2. **向后兼容**: 重构过程中需要保持 API 接口不变
3. **测试覆盖**: 当前无自动化测试，重构前建议先补充关键路径测试

---

## 七、关键指标

### 重构前后对比（预期）

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 文件数量 | 1 | 20+ |
| 最大文件行数 | 2042 | <200 |
| 模块化程度 | 0% | 100% |
| 代码复用率 | ~10% | ~60% |
| 安全性评分 | 🔴 高危 | 🟢 安全 |
| 可维护性评分 | 🔴 差 | 🟢 良好 |
| 首屏加载 | ~200KB | ~50KB（懒加载） |

---

## 八、总结

当前架构的核心问题集中在三个方面：

1. **安全性极差** - 明文密码、匿名登录、无权限控制
2. **可维护性极差** - 单文件、无模块化、大量重复代码
3. **数据可靠性不足** - 存储不一致、全删全写、无事务保护

建议采用**渐进式重构**策略，分 5 个 Phase 逐步改善，总工期约 3 周。技术选型上保持纯 JS + Vite 工具链，避免引入重型框架，确保团队能快速上手。
