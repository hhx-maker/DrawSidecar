# DrawSidecar Phase 1 Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Phase 1 local project foundation without entering Phase 2 visual algorithms.

**Architecture:** Keep immutable source PNG data and project metadata in IndexedDB, while React state stores only small UI state and handles. Add a generic Worker RPC protocol and a no-op compute worker for future algorithms. Add pure coordinate, tool registry, mask overlay, and history modules with tests, then connect project restore, persistence, basic mask display, and undo/redo to the existing workbench.

**Tech Stack:** React, TypeScript strict, Canvas 2D, IndexedDB, Web Worker, Vitest, Playwright, npm.

---

## Scope boundaries

Phase 1 implements project metadata, source protection, local persistence, generic Worker RPC, tool registration, Canvas coordinate mapping, basic mask display, export continuity, and basic undo/redo for source/clear actions. It does not implement line-gap detection, skeletonization, connected-component analysis, smart selection, smart fill, OpenCV, AI, or backend services.

## File map

- Create `src/types/project.ts` for project metadata, source records, and mask types.
- Create `src/services/projectStore.ts` for IndexedDB save/load/delete operations.
- Create `src/services/history.ts` for bounded undo/redo state transitions.
- Create `src/services/workerRpc.ts` and `src/workers/compute.worker.ts` for typed Worker messages and a ping task.
- Create `src/tools/registry.ts` for typed tool registration and parameter validation.
- Create `src/utils/coordinateMapper.ts` for contain-fit transforms and pointer-to-image mapping.
- Create `src/components/MaskOverlay.tsx` for optional Uint8Array mask rendering.
- Modify `src/App.tsx`, `src/components/Toolbar.tsx`, `src/components/CanvasPreview.tsx`, and `src/styles.css` to restore projects, persist source data, add undo/redo, and render mask overlays.
- Create unit tests under `tests/unit/` and browser persistence checks under `tests/e2e/phase1.spec.ts`.
- Modify `package.json`, `package-lock.json`, and `vitest.config.ts` for `fake-indexeddb` and Phase 1 tests.
- Modify `docs/architecture.md`, `docs/progress.md`, `README.md`, and `docs/ipad_test.md` with actual Phase 1 behavior.

## Task 1: Add project data types and IndexedDB storage

**Files:** `src/types/project.ts`, `src/services/projectStore.ts`, `tests/unit/projectStore.test.ts`, `package.json`, `package-lock.json`.

- [ ] Add `ProjectMeta`, `StoredProject`, `MaskLayer`, and `ProjectSnapshot` types. Keep source Blob and metadata separate from UI state and never store pixel arrays in React state.
- [ ] Add `fake-indexeddb` as a dev dependency and configure Vitest setup to install its globals.
- [ ] Implement an IndexedDB database named `drawsidecar-projects` with one `projects` object store keyed by `id` and an index for `updatedAt`.
- [ ] Implement `saveProject`, `loadLatestProject`, `loadProject`, and `deleteProject` with explicit database upgrade handling and clear errors.
- [ ] Save the source Blob, filename, dimensions, Alpha metadata, SHA-256, revision, timestamps, and optional mask metadata. Do not store ImageBitmap or Canvas objects.
- [ ] Test first save, update same project, latest-project ordering, delete, empty database, and Blob roundtrip using fake IndexedDB.
- [ ] Run `npm run test -- tests/unit/projectStore.test.ts`, then commit `feat: add local project storage`.

## Task 2: Add history and typed Worker RPC foundations

**Files:** `src/services/history.ts`, `src/services/workerRpc.ts`, `src/workers/compute.worker.ts`, `tests/unit/history.test.ts`, `tests/unit/workerRpc.test.ts`.

- [ ] Implement a generic `History<T>` with `present`, `past`, `future`, `push`, `undo`, `redo`, `canUndo`, and `canRedo`. Cap history at 20 snapshots and clear the future after a new push.
- [ ] Define `WorkerRequest<P>` and `WorkerResponse<T>` with `jobId`, `revision`, `toolId`, success/error status, and transferable payload slots.
- [ ] Implement `WorkerClient.run` and `WorkerClient.dispose`, rejecting duplicate job IDs and ignoring responses for cancelled or stale jobs.
- [ ] Implement the worker `ping` tool only. It returns `{ ok: true }` and does not process image pixels.
- [ ] Test history transitions, future invalidation, job ID matching, cancellation, stale response rejection, and worker error normalization. Use a fake Worker in unit tests.
- [ ] Run unit tests and commit `feat: add history and worker rpc foundation`.

## Task 3: Add tool registry and Canvas coordinate mapping

**Files:** `src/tools/registry.ts`, `src/utils/coordinateMapper.ts`, `tests/unit/toolRegistry.test.ts`, `tests/unit/coordinateMapper.test.ts`.

- [ ] Define `ToolDefinition<P>` with `id`, `label`, `validate`, and `run` fields. Implement `ToolRegistry.register`, `get`, and `list`, rejecting duplicate IDs.
- [ ] Register only a `ping` foundation tool in Phase 1. Do not register unfinished visual tools as available UI features.
- [ ] Implement `createContainTransform(imageWidth, imageHeight, viewportWidth, viewportHeight)` returning scale, displayed rectangle, and image/CSS coordinate conversion functions.
- [ ] Clamp pointer coordinates outside the displayed rectangle to the image bounds and preserve integer pixel coordinates after rounding.
- [ ] Test square and non-square contain fits, letterboxing, DPR-independent coordinate conversion, edge clamping, and duplicate tool registration.
- [ ] Run unit tests and commit `feat: add tool registry and coordinate mapping`.

## Task 4: Add basic mask display without mask algorithms

**Files:** `src/components/MaskOverlay.tsx`, `src/components/CanvasPreview.tsx`, `src/styles.css`, `tests/unit/maskOverlay.test.ts`.

- [ ] Define mask semantics as `Uint8Array`, one byte per source pixel, `0` transparent and `255` fully selected.
- [ ] Implement `MaskOverlay` as an optional Canvas layer that draws a visible color overlay from the mask at the same source width and height. It must not mutate the source image or create a new mask.
- [ ] Keep the overlay transform aligned with the preview Canvas backing dimensions and contain-fit layout.
- [ ] Add unit tests for empty mask, full mask, half-alpha mask, source-size mismatch rejection, and unchanged source bytes.
- [ ] Run typecheck, lint, and unit tests. Commit `feat: add non-destructive mask display`.

## Task 5: Connect restore, persistence, undo/redo, and clear actions

**Files:** `src/App.tsx`, `src/components/Toolbar.tsx`, `src/components/StatusPanel.tsx`, `src/components/ImportCard.tsx`, `src/styles.css`, `tests/e2e/phase1.spec.ts`.

- [ ] On startup, load the latest stored project and decode its stored source Blob through the existing ImageBitmap/fallback path. Show a restore notice only after a successful restore.
- [ ] After a successful import, create/update the project record and persist the immutable source Blob and metadata. Do not persist ImageBitmap, Canvas, or large pixel arrays.
- [ ] Add undo and redo buttons to the left toolbar. Track source/clear snapshots only, keep the existing reset-view action separate, and do not claim pixel editing history.
- [ ] On clear, persist deletion or an explicit empty state and dispose preview resources. On undo/redo, restore the selected source snapshot and persist the resulting project state.
- [ ] Add a visible project status indicating local persistence and the possibility of re-import after browser data clearing.
- [ ] Add Playwright coverage for import, reload restore from IndexedDB, clear, undo/redo, and source-preserving export. Keep tests local-only and assert no external requests.
- [ ] Run `npm run test:e2e -- tests/e2e/phase1.spec.ts` and commit `feat: connect local project session`.

## Task 6: Update documentation and Phase 1 evidence

**Files:** `README.md`, `docs/architecture.md`, `docs/progress.md`, `docs/ipad_test.md`.

- [ ] Document local project persistence, browser-data clearing behavior, undo/redo scope, Worker foundation, coordinate mapping, and mask display semantics.
- [ ] Keep Phase 2 visual tools clearly marked as not implemented.
- [ ] Add Phase 1 command evidence with PASS/FAIL/MANUAL_PENDING labels and actual test counts.
- [ ] Add iPad checks for local restore, browser storage clearing, mask overlay alignment, and undo/redo touch targets. Keep physical-device results `MANUAL_PENDING` until executed.
- [ ] Run `git diff --check`, typecheck, lint, unit tests, E2E tests, and build. Commit `docs: record phase 1 foundation`.

## Task 7: Terminal-only GitHub synchronization

- [ ] Confirm `git remote -v` points to `https://github.com/hhx-maker/DrawSidecar.git`.
- [ ] Confirm the Phase 1 branch is not `main`.
- [ ] Run `git status`, `git diff --check`, and the full verification commands before pushing.
- [ ] Push only `feat/phase1-project-foundation` with `git push -u origin feat/phase1-project-foundation`. Do not push `main`, force-push, merge, or publish GitHub Pages.
- [ ] If the network connection fails, leave the local branch and commits intact and report the exact failure.
