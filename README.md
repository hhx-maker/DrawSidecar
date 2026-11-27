# DrawSidecar

DrawSidecar 是面向 iPad 数字画师的离线优先绘画辅助侧车。Phase 0 只提供 PNG 文件交换、预览、原始文件保真导出和剪贴板增强入口，暂不提供线稿分析或图像编辑。

## Windows 本地运行

需要 Node.js 18 或更高版本。当前开发环境使用 Node 24 和 npm 11。

```powershell
npm ci
npm run dev
```

开发服务器启动后，在浏览器打开终端显示的本地地址。生产检查使用以下命令。

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

E2E 测试使用 Chromium 和 WebKit。首次运行可以安装浏览器二进制。

```powershell
npx playwright install chromium webkit
npm run test:e2e
```

## 使用方式

选择 PNG 或在支持的浏览器中主动点击粘贴。原始 PNG Blob 保持不变，Canvas 只负责预览。未修改的“导出 PNG”直接下载源 Blob，文件字节保真由 SHA-256 测试验证。复制图像使用能力检测，剪贴板失败时仍可使用文件下载。

Phase 1 开始使用浏览器 IndexedDB 保存最近项目的源 PNG 字节、元数据和 SHA-256。关闭页面后重新打开会尝试恢复最近项目。清除浏览器站点数据后需要重新导入。用户图像不会上传、写入 URL 或发送遥测。

Phase 1 的撤销/重做只覆盖导入、清空和项目源状态切换，不代表像素级编辑历史。Mask 目前只有非破坏性显示基础，没有生成算法。

“离线就绪”表示 Service Worker 已控制当前页面且当前版本必需资源已在 Cache Storage 中。网络在线不等于离线就绪。首次安装和版本更新需要网络，缓存完成后才适合断网使用。

## GitHub Pages 子路径检查

仓库尚未配置远程，也没有发布站点。构建子路径产物时使用：

```powershell
$env:VITE_BASE_PATH='/DrawSidecar/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

检查 `dist/manifest.webmanifest` 中的 `start_url` 和 `scope`，并确认 `dist/sw.js`、脚本和图标都使用 `/DrawSidecar/` 前缀。实际发布需在获得授权后单独进行。

## 已知限制

- 没有完整项目管理界面、备份恢复或图像编辑。
- 线稿缺口检测、区域分析、智能选区和填色仍未实现。
- Clipboard API 和 Web Share 的支持取决于浏览器、HTTPS 和用户权限。
- 没有 iPad 真机或 Procreate 私有接口验证。相关项目见 `docs/ipad_test.md`，目前均按实际证据标记。
