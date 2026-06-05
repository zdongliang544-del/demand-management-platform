# 需求管理平台 - 开发者指南

> 团队成员通过 WorkBuddy 协作维护项目的完整指南

---

## 一、前置条件

1. **安装 WorkBuddy**：https://www.codebuddy.cn
2. **安装 Git**：已内置在 macOS 中
3. **GitHub 账号**：需要在仓库设置中受邀为 Collaborator

---

## 二、在 WorkBuddy 中克隆项目

### 步骤1：打开 WorkBuddy

启动 WorkBuddy，进入对话页面。

### 步骤2：克隆仓库

在对话框中输入：

```
帮我克隆需求管理平台项目
```

或在 WorkBuddy 终端中手动执行：

```bash
cd ~/WorkBuddy
git clone https://github.com/zdongliang544-del/demand-management-platform.git
cd demand-management-platform
```

> ⚠️ 首次克隆时需要 GitHub 认证。推荐在 GitHub 生成 Personal Access Token（Setting → Developer Settings → Personal Access Token → Generate New Token → 勾选 repo 权限）

### 步骤3：让 WorkBuddy 识别项目

在对话中说：

```
项目在 ~/WorkBuddy/demand-management-platform
帮我打开这个项目
```

---

## 三、日常开发流程

### 拉取最新代码

```
拉取这个项目的 GitHub 最新代码
```

### 修改代码

项目核心文件是纯静态 HTML：

| 文件 | 说明 |
|------|------|
| `deploy/index.html` | 主页面（需求列表、排期、统计） |
| `deploy/config.js` | Supabase 配置 |
| `deploy/tencent-config.js` | CloudBase 配置 |

可以直接在 WorkBuddy 中描述修改需求：

> "在需求列表页增加一列【预计排期时间】"

WorkBuddy 会自动帮你修改代码。

### 提交代码

修改完成后：

```
帮我提交代码并推送到 GitHub
```

---

## 四、部署流程

### 部署到 EdgeOne Pages

```
帮我部署需求管理平台到 EdgeOne Pages
```

WorkBuddy 会自动：
1. 检查代码是否最新
2. 使用 CLI 部署到 EdgeOne Pages
3. 返回最新的访问 URL

### 自动部署（可选）

如果需要推送代码后自动部署，可以配置 GitHub Actions：

在 `.github/workflows/deploy.yml` 中配置自动化脚本。

---

## 五、最佳实践

### 1. 在 WorkBuddy 中直接对话

最简单的协作方式是在对话中直接描述需求。WorkBuddy 可以：

- ✅ 读取项目文件
- ✅ 修改代码
- ✅ 运行命令
- ✅ 提交和推送 Git
- ✅ 部署到 EdgeOne Pages

### 2. 示例对话

```
用户："帮我在需求列表里增加导出为 PDF 的功能"
WorkBuddy：修改代码 → 部署 → 返回新链接
用户："页面太卡了，帮我优化下性能"
WorkBuddy：优化代码 → 部署 → 返回新链接
```

### 3. 团队成员分工

| 角色 | 主要操作 |
|------|----------|
| 产品PM | 修改需求字段、优化流程 |
| 前端开发 | 修改页面样式、交互逻辑 |
| 后端开发 | 配置 CloudBase、数据接口 |
| UI设计 | 调整界面样式 |

---

## 六、常见问题

### Q: 如何在 WorkBuddy 中执行 Git 操作？

直接在对话中说：
- `帮我提交代码` → 自动 add + commit + push
- `帮我拉取最新代码` → 自动 pull
- `帮我查看 Git 状态` → 自动 git status

### Q: 部署后如何获取最新链接？

```
帮我部署需求管理平台
```

系统会自动返回部署后的 URL。

### Q: 多人同时修改会不会冲突？

WorkBuddy 使用 Git 管理代码，多人修改时：
1. 各自修改 → 提交到自己的分支 → 创建 PR
2. 审批后合并到 main → 部署

### Q: 如何创建新分支？

```
帮我创建一个 feature/xxx 分支并切换过去
```

---

## 七、项目结构

```
demand-management-platform/
├── deploy/                    # 部署目录（核心文件）
│   ├── index.html            # 主页面（HTML+CSS+JS）
│   ├── config.js             # Supabase 配置文件
│   └── tencent-config.js     # CloudBase 配置文件
├── TEAM_GUIDE.md             # 团队操作手册
├── DEVELOPER_GUIDE.md        # 开发者指南（本文件）
├── README.md                 # 项目说明
└── .github/                  # GitHub Actions（自动部署等）
```

---

## 八、联系方式

技术支持：张栋良（zhangdongliang）
