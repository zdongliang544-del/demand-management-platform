# 需求管理平台 - 腾讯云部署指南

## 方案选择

### 方案A: 腾讯云Webify（推荐 - 最简单）
- 类似Vercel，直接托管静态网站
- 免费额度：每月10GB流量
- 支持自定义域名

### 方案B: 腾讯云COS + CDN（更灵活）
- 对象存储COS存储HTML文件
- CDN加速访问
- 免费额度：50GB存储/月

### 方案C: 腾讯云CloudBase（全功能）
- Serverless框架
- 提供数据库和托管
- 免费额度：1GB数据库/月

---

## 方案A: Webify部署（推荐）

### 步骤1: 注册/登录腾讯云
1. 访问 https://console.cloud.tencent.com
2. 使用微信或QQ登录

### 步骤2: 开通Webify服务
1. 在控制台搜索 "Webify"
2. 点击 "立即使用"
3. 选择 "免费版"

### 步骤3: 创建项目
1. 点击 "新建项目"
2. 项目名称: `demand-management`
3. 部署方式: "上传文件"
4. 上传 `demand-management-platform` 文件夹

### 步骤4: 配置域名
1. 项目创建后，点击 "域名管理"
2. 使用默认域名: `demand-management-xxx.tcloudbaseapp.com`
3. 或绑定自定义域名

### 完成
访问生成的URL即可使用平台

---

## 方案B: COS + CDN部署

### 步骤1: 创建COS存储桶
1. 在控制台搜索 "对象存储COS"
2. 点击 "存储桶列表" → "创建存储桶"
3. 配置:
   - 名称: `demand-management-static`
   - 地域: `ap-guangzhou` (广州)
   - 访问权限: **公有读私有写**
4. 点击 "确定"

### 步骤2: 上传文件
1. 进入刚创建的存储桶
2. 点击 "上传文件"
3. 上传整个 `demand-management-platform` 文件夹
4. 确保 `index.html` 在根目录

### 步骤3: 配置静态网站
1. 在存储桶页面，点击 "基础配置" → "静态网站"
2. 开启静态网站功能
3. 默认首页: `index.html`
4. 保存后获得访问域名

### 步骤4: 配置CDN加速（可选）
1. 在控制台搜索 "CDN"
2. 点击 "域名管理" → "添加域名"
3. 填入COS的访问域名
4. 选择 "HTTPS" → 申请免费证书
5. 完成配置

### 完成
通过COS域名或CDN域名访问平台

---

## 方案C: CloudBase部署（全功能）

### 步骤1: 创建CloudBase环境
1. 在控制台搜索 "CloudBase"
2. 点击 "立即使用"
3. 创建环境:
   - 环境名称: `demand-management`
   - 选择 "免费版"
4. 记录环境ID

### 步骤2: 获取API密钥
1. 访问 https://console.cloud.tencent.com/cam/capi
2. 新建密钥
3. 记录 SecretId 和 SecretKey

### 步骤3: 配置数据库
1. 在CloudBase控制台，点击 "数据库"
2. 创建集合:
   - `demands`
   - `reviews`
   - `users`
3. 设置权限: "所有用户可读，仅创建者可写"

### 步骤4: 修改配置文件
编辑 `tencent-config.js`:

```javascript
const TENCENT_CLOUD_CONFIG = {
    cloudbase: {
        envId: 'your-env-id',  // 替换为你的环境ID
        secretId: 'your-secret-id',  // 替换为你的SecretId
        secretKey: 'your-secret-key',  // 替换为你的SecretKey
    },
    // ... 其他配置
};
```

### 步骤5: 修改HTML文件
在 `index.html` 的 `<script>` 标签内添加CloudBase初始化:

```javascript
// 初始化 CloudBase
const app = cloudbase.init({
    env: TENCENT_CLOUD_CONFIG.cloudbase.envId
});
const db = app.database();
```

### 步骤6: 部署
1. 将文件夹上传到CloudBase静态托管
2. 或使用CloudBase CLI部署

---

## 数据库初始化SQL（CloudBase）

在CloudBase数据库控制台执行以下操作:

### 创建 users 集合
```json
{
    "_id": "auto",
    "username": "zhuli",
    "name": "朱黎",
    "role": "组长",
    "password": "123456"
}
```

### 创建示例 demands 数据
```json
{
    "_id": "DM001",
    "type": "平台",
    "platform": "APP",
    "role": "分销体系",
    "module": "佣金",
    "applied_country": "巴基斯坦",
    "need_country": "全部",
    "title": "佣金结算模块优化",
    "content": "优化佣金结算流程，支持多币种结算",
    "status": "开发中",
    "priority": "P0",
    "pm_list": ["张栋良", "朱黎"],
    "need_review": "是",
    "created_at": "张栋良 | 2026-05-01"
}
```

---

## 测试账号

| 用户名 | 姓名 | 角色 | 密码 |
|--------|------|------|------|
| zhuli | 朱黎 | 组长 | 123456 |
| zhangdongliang | 张栋良 | 组员 | 123456 |
| pengchengshuo | 彭程硕 | 组员 | 123456 |
| lisikai | 李思开 | 组员 | 123456 |
| sunjiajun | 孙佳俊 | 组员 | 123456 |
| lvshaojun | 吕少俊 | 组长 | 123456 |

---

## 常见问题

### Q: 无法访问部署的网站
A: 检查:
1. 存储桶权限是否设置为"公有读"
2. 静态网站功能是否开启
3. 默认首页是否设置为 `index.html`

### Q: 数据无法保存
A: 检查:
1. CloudBase环境ID是否正确
2. API密钥是否有效
3. 数据库集合权限是否正确

### Q: 跨域问题
A: 在COS/CloudBase配置CORS规则:
```json
{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["*"]
}
```

---

## 费用说明

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| Webify | 10GB/月流量 | ¥0.5/GB |
| COS | 50GB存储/月 | ¥0.118/GB/月 |
| CDN | 10GB流量/月 | ¥0.21/GB |
| CloudBase | 1GB数据库/月 | ¥0.07/GB/月 |

对于团队内部使用，免费额度完全足够。