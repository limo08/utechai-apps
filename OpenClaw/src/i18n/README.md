# i18n 多语言系统

## 目录结构

```
src/i18n/
├── index.ts           # i18n 系统主文件
├── locales/           # 语言文件目录
│   ├── zh.json       # 中文
│   ├── en.json       # 英文
│   ├── ja.json       # 日文
│   └── ru.json       # 俄文
└── README.md         # 本文件
```

## 支持的语言

当前支持的语言：
- 🇨🇳 中文 (zh)
- 🇺🇸 English (en)
- 🇯🇵 日本語 (ja)
- 🇷🇺 Русский (ru)

## 添加新语言

### 1. 创建语言文件

在 `src/i18n/locales/` 目录下创建新的 JSON 文件，文件名为语言代码（如 `fr.json`）：

```json
{
  "nav": {
    "home": "Accueil",
    "channel": "Canaux",
    "features": "Fonctionnalités",
    "download": "Télécharger"
  },
  "hero": {
    "tag": "Nouvelle version · Intégration avec Claude Code et Hermes Agent",
    "title": "OpenClaw",
    "subtitle": "Un assistant IA qui travaille vraiment de manière autonome...",
    "download": "Télécharger la version {platform}",
    "support": "Prend en charge Mac M-series, Intel-series, Windows 10/11 (64-bit)"
  },
  // ... 其他翻译
}
```

### 2. 更新语言配置

在 `src/i18n/index.ts` 中的 `SUPPORTED_LANGUAGES` 对象中添加新语言：

```typescript
export const SUPPORTED_LANGUAGES = {
  zh: { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  fr: { name: 'Français', flag: '🇫🇷' }, // 新增
} as const;
```

### 3. 更新 TypeScript 类型

由于 `SUPPORTED_LANGUAGES` 使用了 `as const`，TypeScript 会自动推断新的语言代码类型。

### 4. 复制语言文件到 public 目录

确保将新的语言文件复制到 `public/i18n/locales/` 目录，或者在构建脚本中添加复制命令。

## 使用方法

### 在组件中使用

```typescript
import { tSync, getCurrentLocale, setLocale } from './i18n';

// 同步翻译（确保语言已预加载）
const title = tSync('hero.title');

// 异步翻译
const title = await t('hero.title');

// 带参数的翻译
const downloadText = tSync('hero.download', { platform: 'Windows' });

// 获取当前语言
const currentLocale = getCurrentLocale();

// 设置语言
await setLocale('en');
```

### 预加载所有语言

为了更好的性能，建议在应用启动时预加载所有语言：

```typescript
import { preloadAllLocales } from './i18n';

// 在应用初始化时
await preloadAllLocales();
```

## 翻译文件结构

语言文件遵循以下结构：

```json
{
  "nav": {
    "home": "首页",
    "channel": "消息渠道", 
    "features": "核心功能",
    "download": "立即下载"
  },
  "hero": {
    "tag": "标签文本",
    "title": "主标题",
    "subtitle": "副标题",
    "download": "下载文本 {platform}",
    "support": "支持说明"
  },
  "terminal": {
    "title": "终端标题",
    "tab": "场景 {number}",
    "userLabel": "用户标签",
    "aiLabel": "AI标签",
    "timeLabel": "时间标签 {time}"
  },
  "demos": [
    {
      "user": "用户输入",
      "think": "AI思考过程",
      "result": "AI结果"
    }
  ],
  "models": {
    "title": "模型标题 {count}"
  },
  "channels": {
    "title": "渠道标题"
  },
  "features": {
    "title": "功能标题",
    "subtitle": "功能副标题",
    "items": [
      {
        "title": "功能标题",
        "desc": "功能描述"
      }
    ]
  },
  "cta": {
    "title": "CTA标题",
    "subtitle": "CTA副标题", 
    "download": "下载文本",
    "free": "免费说明"
  },
  "footer": {
    "copyright": "版权信息"
  },
  "toast": {
    "preparing": "准备中 {platform}",
    "started": "开始 {platform}"
  }
}
```

## 参数化翻译

支持在翻译字符串中使用 `{参数名}` 占位符：

```json
{
  "download": "Download {platform} version",
  "greeting": "Hello, {name}!"
}
```

使用时传入参数：

```typescript
tSync('download', { platform: 'Windows' })
tSync('greeting', { name: 'World' })
```

## 注意事项

1. **语言文件位置**：开发时语言文件需要同时存在于 `src/i18n/locales/` 和 `public/i18n/locales/` 目录
2. **JSON 格式**：确保 JSON 文件格式正确，避免语法错误
3. **参数一致性**：所有语言版本的参数占位符必须保持一致
4. **HTML 内容**：如需在翻译中包含 HTML 标签，请确保所有语言版本都有相应的标签结构
5. **特殊字符**：注意 JSON 中的特殊字符转义，如引号、换行等

## 故障排除

### 语言文件加载失败

如果语言文件加载失败，系统会自动回退到中文。检查浏览器控制台查看具体错误信息。

### 翻译未生效

1. 确保语言文件已正确复制到 `public/i18n/locales/` 目录
2. 检查浏览器缓存，尝试硬刷新 (Ctrl+Shift+R)
3. 确认语言代码与 `SUPPORTED_LANGUAGES` 中定义的一致

### 类型错误

如果遇到 TypeScript 类型错误：
1. 确保新语言已添加到 `SUPPORTED_LANGUAGES` 中
2. 检查语言文件 JSON 结构是否正确
3. 重启 TypeScript 服务器（在 VSCode 中：Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"）