# 项目上下文

## 项目简介

OpenClaw 中文版下载页面 —— 一个深色沉浸式产品下载站，支持一键下载安装，自动检测用户平台，提供 Windows / macOS / Linux 三平台安装包。

## 技术栈

- **核心**: Vite 7, TypeScript, Express
- **UI**: Tailwind CSS + 自定义 CSS 动画
- **设计**: 深色主题，红色强调色 (#F04D5A)，参考 theopenclaw.cn 官网风格

## 关键实现

- **平台检测**: `main.ts` 中 `detectPlatform()` 通过 UA + WebGL 自动识别 Windows / macOS ARM / macOS Intel
- **终端演示**: 模拟用户与 OpenClaw 交互的终端对话，支持自动轮播和手动切换
- **模型滚轮**: 横向无限滚动展示支持的大模型名称
- **SVG 图标**: `icons.ts` 导出所有内联 SVG 图标函数，避免外部依赖
- **动画体系**: CSS keyframes（脉冲缩放、渐变位移、果冻弹性、光点扩散）+ IntersectionObserver 滚动触发
- **交互反馈**: Toast 提示替代 alert，导航栏/英雄区/底部/浮动按钮四处下载入口

## 目录结构

```
├── scripts/            # 构建与启动脚本
│   ├── build.sh        # 构建脚本
│   ├── dev.sh          # 开发环境启动脚本
│   ├── prepare.sh      # 预处理脚本
│   └── start.sh        # 生产环境启动脚本
├── server/             # 服务端逻辑
│   ├── routes/         # API 路由
│   ├── server.ts       # Express 服务入口
│   └── vite.ts         # Vite 中间件集成
├── src/                # 前端源码
│   ├── icons.ts        # SVG 图标组件
│   ├── index.css       # 全局样式 + 自定义动画
│   ├── index.ts        # 客户端入口
│   └── main.ts         # 主页面逻辑（渲染 + 交互）
├── DESIGN.md           # 设计规范（配色/字体/动效/页面结构）
├── index.html          # 入口 HTML
├── package.json        # 项目依赖管理
├── tsconfig.json       # TypeScript 配置
└── vite.config.ts      # Vite 配置
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- 使用 Tailwind CSS 进行样式开发

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、Express `req`/`res`、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。
