# 需求管理平台

分销团队需求管理平台，支持需求登记、排期跟踪、统计分析的协作工具。

## 快速开始

### 团队成员（使用平台）
- 访问：`https://demand.sevenway.top`（备案完成后生效）
- 账号密码见 [团队操作手册](TEAM_GUIDE.md)

### 开发者（维护代码）
- 查看 [开发者指南](DEVELOPER_GUIDE.md)
- 核心文件：`deploy/index.html`（纯静态）
- 部署平台：EdgeOne Pages
- 数据库：腾讯云 CloudBase

## 项目结构

```
deploy/
├── index.html          # 主页面
├── config.js           # 配置文件
└── tencent-config.js   # CloudBase 配置
```

## 文档

- [团队操作手册](TEAM_GUIDE.md) — 使用说明、协作规范
- [开发者指南](DEVELOPER_GUIDE.md) — 如何在 WorkBuddy 中维护此项目
- [部署指南](DEPLOY_GUIDE.md) — 部署流程

## 技术栈

- 前端：HTML + CSS + JavaScript（纯静态）
- 部署：EdgeOne Pages + 腾讯云 DNS
- 数据库：CloudBase
- 版本管理：GitHub
