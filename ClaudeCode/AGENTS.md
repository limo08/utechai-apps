# AGENTS.md

## 项目概览

Claude Code 下载网站 — Anthropic 终端原生 AI 编程工具的中文下载与介绍页面。基于 Express + Vite + Vanilla TypeScript 构建，采用深色主题设计。

## 技术栈

- **核心**: Express + Vite 7, TypeScript
- **UI**: Tailwind CSS 3 + 自定义 CSS 动画 + 模板字符串渲染
- **设计**: 深色主题，赤陶橙 (#d4704e) 为品牌强调色

## 目录结构

```
├── server/                # 后端服务器
│   ├── server.ts          # Express 服务入口
│   ├── vite.ts            # Vite 中间件集成（开发/生产）
│   └── routes/index.ts    # API 路由（健康检查）
├── src/                   # 前端源码
│   ├── index.ts           # 客户端入口
│   ├── main.ts            # 主页面逻辑（模板渲染 + 交互）
│   ├── icons.ts           # SVG 图标函数
│   ├── index.css          # 全局样式 + 动画
│   └── types.d.ts         # 类型声明
├── index.html             # HTML 入口
├── vite.config.ts         # Vite 配置
├── tailwind.config.ts     # Tailwind CSS 配置
├── postcss.config.js      # PostCSS 配置
├── tsconfig.json          # TypeScript 配置
└── scripts/               # 构建/启动脚本
```

## 构建与验证命令

- `pnpm ts-check` — TypeScript 类型检查
- `pnpm lint --quiet` — ESLint 检查
- `pnpm build` — 生产构建（前端 Vite → dist/，后端 tsup → dist-server/）
- `pnpm dev` — 开发服务器 (端口 5000)

## 代码风格

- TypeScript strict 模式，禁止隐式 any
- HTML 由 `src/main.ts` 模板字符串生成，不用 React/Vue
- 颜色使用 CSS 变量（--accent, --terminal-green 等），不硬编码 hex
- 动效使用 CSS keyframes + IntersectionObserver，不依赖动画库
- SVG 图标由 `src/icons.ts` 导出为字符串函数

## 设计规范

详见 DESIGN.md。核心要点：
- 深色主题，赤陶橙 (#d4704e) 为品牌强调色
- 终端模拟器为核心视觉元素
- 禁止科技蓝/紫渐变

## 常见问题修复

| 问题 | 原因 | 修复 |
|------|------|------|
| Tailwind 类名不生效 | content 配置未包含文件 | 在 tailwind.config.ts 中添加文件路径 |
| 复制按钮无响应 | re-render 后按钮未重新绑定 | renderInstallSteps() 后调用 setupCopyButtons() |
| 终端动画不启动 | DOM 未准备好 | initApp() 在 renderApp() 后才 setupTerminalAnimation() |