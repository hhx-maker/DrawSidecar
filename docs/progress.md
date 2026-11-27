# DrawSidecar 进度

## Phase 0 — 可行性闭环

### PASS

- [x] 本地 React/Vite/TypeScript 应用脚手架。
- [x] 三栏宽屏工作台和窄屏底部工具栏。
- [x] PNG signature/IHDR、文件大小、像素数和单边限制检查。
- [x] ImageBitmap 解码与 HTMLImageElement/Object URL 回退边界。
- [x] 原始 Blob 保留，未修改文件直接导出。
- [x] SHA-256 服务与单元/集成测试。
- [x] Clipboard API、ClipboardItem、PNG MIME 和 Web Share 能力检测入口。
- [x] Workbox 预缓存配置和离线就绪状态检查实现。
- [x] 合成 PNG fixtures、Vitest 单元/集成测试。

### PASS

- [x] 生产构建 Chromium/WebKit E2E 验证，4 个测试通过。

### MANUAL_PENDING

- [ ] iPad Safari HTTPS、主屏幕 PWA、飞行模式冷启动。
- [ ] Procreate 分屏、透明 PNG 对齐、剪贴板往返和 Web Share。
- [ ] 2048²/4096² 真机内存与连续导入。
- [ ] GitHub Pages 实际发布后的子路径和版本更新。

### TODO

- [ ] Phase 1 项目元数据、Worker RPC、区域分析和本地持久化。Phase 0 完成前不实现。

## 证据记录

2026-11-27 本地证据：

- `npm run typecheck` — `PASS`。
- `npm run lint` — `PASS`。
- `npm run test` — `PASS`，6 个测试文件、10 个测试通过。
- `npm run build` — `PASS`，Workbox 预缓存 9 项资源。
- `npm run test:e2e` — `PASS`，Chromium 2 项、WebKit 2 项通过。
- `VITE_BASE_PATH=/DrawSidecar/ npm run build` — `PASS`，manifest 的 `start_url`/`scope` 和构建资源前缀已检查。
- `git diff --check` — `PASS`，工作区干净。

`npm install` 报告了 npm audit 的 4 个 moderate severity advisories，未使用 `npm audit fix --force`，避免未经授权升级依赖树。当前仓库只在本地 `feat/phase0-offline-roundtrip` 分支工作，没有远程、推送、合并或发布操作。
