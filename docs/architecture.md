# Phase 0 架构

## 边界

```text
用户主动选择 PNG / 点击粘贴
              |
        PNG 校验与 SHA-256
              |
    不可变 SourceImage { Blob + 元数据 }
          /                    \
   预览句柄                  文件导出
 ImageBitmap 或 Image      直接复用 Blob
          |                    |
       Canvas 预览       下载原始 PNG
```

原始 Blob、预览对象和派生编码输出分开。Canvas 不承担未修改 PNG 的重新编码职责。后续 Mask 或透明图层可以从独立的派生 PNG 编码接口输出，本阶段不实现这些图像处理。

## 离线状态

Vite 构建产物由 `vite-plugin-pwa` 生成 Workbox 预缓存。界面分别读取 `navigator.onLine` 和离线就绪检查。离线就绪同时要求 Service Worker 已控制页面，并且当前 HTML、脚本、样式等必要资源可以从 Cache Storage 命中。注册成功但未接管页面、缓存缺失、缓存被清理或更新等待时都不能显示离线就绪。

## 内存与竞态

导入先读取 PNG signature 和 IHDR 尺寸，再检查 50 MiB、4096² 像素和 8192 px 单边限制，解码后再次核对实际尺寸。预览资源被替换或清空时释放 ImageBitmap 和 Object URL。导入序列号保证快速连续选择时旧结果不会覆盖新结果。大数组不进入频繁更新的 React 状态。

## 当前范围

Phase 0 没有后端、IndexedDB、OpenCV、Worker 图像算法、AI 模型、自动保存或 Undo/Redo。Phase 1 再建立项目元数据、Worker RPC 和区域分析基础设施。
