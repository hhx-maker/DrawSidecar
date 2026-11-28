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

## Phase 1 本地项目与计算基础

IndexedDB 保存项目元数据、源 PNG 字节缓冲、文件名、尺寸、Alpha 信息和 SHA-256。保存时不写入 ImageBitmap、Canvas 或 React 状态对象。恢复时从字节缓冲重建 Blob，再走同一套 PNG 校验和解码流程。源 Blob 仍保持不可变，未修改导出继续直接复用它。

`WorkerClient` 使用 `jobId`、`revision` 和 `toolId` 区分任务，当前只注册 `ping` 基础任务。旧结果、取消任务和未知工具不会污染当前状态。后续视觉算法接入前仍需为每项工具增加参数校验、取消和结果测试。

Canvas 坐标映射使用 contain-fit 变换，记录缩放、留白偏移和原图坐标转换。Mask 显示使用独立透明 Canvas 叠加层，Mask 值为 `Uint8Array`，0 表示透明，255 表示完全选中，源图像不会被修改。

## 当前范围

Phase 0 没有 IndexedDB、Worker RPC 或 Undo/Redo。Phase 1 已建立项目元数据、本地保存、基础 Worker RPC、工具注册、坐标映射、Mask 显示和源状态撤销/重做。Phase 2 才进入缺口检测、骨架化、区域分析和填色。

Phase 2 已将预处理、骨架化、缺口候选、虚拟闭合、区域标记、智能填色和整体底色任务接入独立 Worker。用户确认动作才会生成虚拟边界或派生层，原始源 Blob 始终不变。
