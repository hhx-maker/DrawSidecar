# iPad 与 Procreate 真机检查表

状态约定：`PASS` 仅表示实际执行成功，`FAIL` 记录复现步骤，未执行项目使用 `MANUAL_PENDING`。

## 设备记录

- 设备型号：`MANUAL_PENDING`
- iPadOS 版本：`MANUAL_PENDING`
- DrawSidecar 版本/提交：`MANUAL_PENDING`
- 画布尺寸：`MANUAL_PENDING`
- 测试日期：`MANUAL_PENDING`

## Phase 0 检查

- [ ] `MANUAL_PENDING` Safari HTTPS 首次访问，确认本地资源加载完整。
- [ ] `MANUAL_PENDING` 添加到主屏幕并从主屏幕启动。
- [ ] `MANUAL_PENDING` 飞行模式下彻底关闭后重新启动，确认离线就绪再导入和导出 PNG。
- [ ] `MANUAL_PENDING` Windows 电脑关机后仍能使用文件导入、预览和文件导出。
- [ ] `MANUAL_PENDING` Safari 与 Procreate 分屏运行，记录 PWA 多窗口行为和回退方式。
- [ ] `MANUAL_PENDING` 文件导入和文件导出分别验证取消、失败和透明 Alpha。
- [ ] `MANUAL_PENDING` 用户主动点击复制和粘贴，分别记录 Clipboard API 成功、权限拒绝和文件回退。
- [ ] `MANUAL_PENDING` 2048²、非正方形和四边留空的测试图校验尺寸、Alpha、四角标记和偏心标记。
- [ ] `MANUAL_PENDING` 在 Procreate 中插入测试 PNG，记录是否发生居中、缩放、透明裁切或位移。不能把浏览器导出正确等同为 Procreate 对齐成功。
- [ ] `MANUAL_PENDING` 4096² 图像、多次连续导入和清空操作，记录卡顿、内存终止和资源释放情况。
- [ ] `MANUAL_PENDING` 缓存清理、版本更新和 Service Worker 未接管页面的提示行为。
- [ ] `MANUAL_PENDING` 导入后关闭并重新打开页面，确认最近项目从 IndexedDB 恢复。
- [ ] `MANUAL_PENDING` 清除站点数据后确认界面提示重新导入，不出现伪恢复成功。
- [ ] `MANUAL_PENDING` 使用触控点击撤销/重做，确认源图尺寸、Alpha 和像素坐标保持一致。
- [ ] `MANUAL_PENDING` 在存在 Mask 叠加时检查显示坐标与源图一致，确认原始线稿没有被覆盖。

## 执行步骤

1. 在 Windows 上运行 `npm run build`，使用已授权的 HTTPS 静态托管或本地 HTTPS 服务器访问。
2. 首次打开后等待状态显示“离线就绪”，再关闭网络并彻底关闭 Safari/PWA。
3. 重新启动，导入 `public/fixtures/roundtrip-2048x1024.png` 对应的测试副本，检查右侧状态和 Canvas。
4. 分别使用“导出 PNG”和主动复制，记录文件与剪贴板结果。
5. 在 Procreate 原画布中插入导出的文件，使用四角和偏心标记检查位置与透明边缘。
6. 将结果和复现步骤写回本文件，不用推测补全未执行项目。
