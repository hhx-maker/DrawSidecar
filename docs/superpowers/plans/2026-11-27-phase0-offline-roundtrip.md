# DrawSidecar Phase 0 Offline Roundtrip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a local-only React/Vite/PWA that imports PNG files, previews them without altering source bytes, exports unchanged PNGs byte-for-byte, and provides capability-detected clipboard actions with reliable offline readiness reporting.

**Architecture:** Keep the immutable source Blob and metadata outside the React render tree. Use small pure TypeScript services for PNG header validation, SHA-256 hashing, image decoding fallback, and export selection. Use Canvas only for preview and reserve a separate derived-layer encoder interface. Use `vite-plugin-pwa` with local Workbox precache and a runtime offline-readiness check that requires both active control and complete current-version caches.

**Tech Stack:** React, TypeScript strict, Vite, Canvas 2D, vite-plugin-pwa/Workbox, Vitest, Testing Library, Playwright Chromium/WebKit, npm.

---

## File map

- Create `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `index.html` for the Vite application and scripts.
- Create `src/types/image.ts` for immutable source and display metadata.
- Create `src/services/png.ts` for PNG signature/IHDR validation, limits, and derived encoder boundary.
- Create `src/services/imageDecode.ts` for ImageBitmap-first decoding and HTMLImageElement/Object URL fallback.
- Create `src/services/clipboard.ts` for user-gesture clipboard writes and capability reporting.
- Create `src/services/offline.ts` for network state and cache/control readiness.
- Create `src/services/hash.ts` for SHA-256.
- Create `src/components/CanvasPreview.tsx`, `Toolbar.tsx`, `StatusPanel.tsx`, and `ImportCard.tsx` for focused UI units.
- Create `src/App.tsx`, `src/main.tsx`, `src/styles.css` for the workbench and responsive layout.
- Create `src/pwa.ts` for service worker registration and update handling.
- Create `public/icons/*` and `public/fixtures/*` for local PWA assets and synthetic test inputs.
- Create `tests/unit/*.test.ts`, `tests/integration/*.test.ts`, and `tests/e2e/phase0.spec.ts` for validation.
- Create `playwright.config.ts` and `tests/fixtures/generate-fixtures.ts` for browser testing.
- Create `README.md`, `docs/architecture.md`, `docs/ipad_test.md`, and `docs/progress.md` with evidence and manual-test status.

## Task 1: Scaffold the local application

**Files:** package and Vite config files listed above.

- [ ] Create a Vite React TypeScript app in the existing repository without replacing `AGENTS.md` or `docs/`.
- [ ] Add scripts `dev`, `typecheck`, `lint`, `test`, `test:e2e`, `build`, and `preview`.
- [ ] Configure strict TypeScript, no remote assets, and a configurable `VITE_BASE_PATH` with `/` default and `/DrawSidecar/` deployment verification.
- [ ] Add `vite-plugin-pwa` with `registerType: 'prompt'`, local manifest metadata, generated icons, and Workbox precache of the application shell and all built chunks.
- [ ] Add a lint configuration that checks `src` and `tests` without disabling TypeScript checks.
- [ ] Run `npm install`, `npm run typecheck`, and `npm run build` to establish a green scaffold before feature work.
- [ ] Commit as `build: scaffold phase 0 app`.

## Task 2: Define image data and pure PNG validation

**Files:** `src/types/image.ts`, `src/services/png.ts`, `src/services/hash.ts`, `tests/unit/png.test.ts`, `tests/unit/hash.test.ts`.

- [ ] Define `SourceImage` with immutable `blob`, `fileName`, `width`, `height`, `hasAlpha`, `pngMetadata`, and `sha256` fields. Keep pixel arrays out of the type.
- [ ] Implement `readPngHeader(bytes)` to require the 8-byte PNG signature and parse IHDR width/height before decoding.
- [ ] Enforce `MAX_FILE_BYTES = 50 * 1024 * 1024`, `MAX_TOTAL_PIXELS = 4096 * 4096`, and `MAX_SIDE = 8192`. Reject zero dimensions, malformed IHDR, and integer overflow with typed user-facing errors.
- [ ] Implement `validatePngBlob(blob)` that reads only the bounded header first, checks limits, then returns header metadata. Do not trust the filename extension or MIME type alone.
- [ ] Implement `sha256Hex(blob)` with `crypto.subtle.digest` and a deterministic lowercase hexadecimal result.
- [ ] Add `encodeDerivedPng(canvas)` as a small interface that calls `canvas.toBlob` only for future derived output. Keep unchanged-file export out of this path.
- [ ] Test valid RGBA and RGB headers, invalid signature, truncated IHDR, zero/overflow dimensions, 50 MiB boundary, over-limit file size, over-limit pixels, and SHA-256 known data.
- [ ] Run `npm run test -- tests/unit/png.test.ts tests/unit/hash.test.ts` and commit as `feat: validate png sources and hashes`.

## Task 3: Add decoding and source-preserving export services

**Files:** `src/services/imageDecode.ts`, `src/services/export.ts`, `tests/unit/imageDecode.test.ts`, `tests/unit/export.test.ts`.

- [ ] Implement `decodeSourceImage(file, sequence)` that validates the PNG header before decoding, decodes with `createImageBitmap` when available, falls back to an Object URL plus `HTMLImageElement`, and rechecks decoded dimensions.
- [ ] Ensure every success/failure path revokes Object URLs and closes ImageBitmaps when they are no longer used. Use a monotonically increasing import sequence so a stale decode result cannot replace a newer selection.
- [ ] Store a `PreviewImage` handle separately from the immutable source Blob. Expose `disposePreviewImage` for React cleanup.
- [ ] Implement `exportUnchangedPng(source)` returning `source.blob` directly. Implement `exportDerivedPng(canvas)` separately and document that its bytes are not source-preserving.
- [ ] Test ImageBitmap path, fallback path, decode dimension mismatch, stale sequence rejection, resource cleanup, unchanged export identity/size, and derived encoder invocation.
- [ ] Run unit tests and commit as `feat: preserve source png export`.

## Task 4: Implement clipboard capability and offline readiness services

**Files:** `src/services/clipboard.ts`, `src/services/offline.ts`, `src/pwa.ts`, `tests/unit/clipboard.test.ts`, `tests/unit/offline.test.ts`.

- [ ] Implement `getClipboardCapabilities()` using feature detection for `navigator.clipboard.write`, `ClipboardItem`, PNG MIME support, and `navigator.share` file support. Do not call permission queries as a prerequisite.
- [ ] Implement `copyPngOnUserGesture(blob)` so the click handler has the Blob ready before calling the API. Prefer `ClipboardItem({ 'image/png': blob })`, preserving the promise-value fallback only when supported. Return typed failure reasons without throwing into the UI.
- [ ] Implement `getNetworkState()` separately from `getOfflineReadiness()`. Readiness is true only when `navigator.serviceWorker.controller` exists and every URL in the current Workbox precache manifest is present in Cache Storage.
- [ ] Treat missing caches, cache deletion, waiting updates, and uncontrolled pages as not-ready. Emit update-ready information without forcing a reload.
- [ ] Register the generated service worker through `vite-plugin-pwa` and expose a small testable adapter rather than putting service-worker logic in React components.
- [ ] Test missing APIs, permission rejection, successful ClipboardItem write, missing current cache entry, uncontrolled page, and online-but-not-ready state.
- [ ] Run unit tests and commit as `feat: add clipboard and offline readiness checks`.

## Task 5: Build the three-column responsive workbench

**Files:** `src/components/ImportCard.tsx`, `src/components/Toolbar.tsx`, `src/components/CanvasPreview.tsx`, `src/components/StatusPanel.tsx`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`.

- [ ] Build the no-image import card with file input and explicit paste button. Do not poll the clipboard.
- [ ] Build the desktop three-column layout with tools on the left, canvas preview in the center, and low-interaction status on the right. Keep destructive/frequent operations out of the status panel.
- [ ] Render the preview on a checkerboard background with `object-fit: contain` or equivalent Canvas sizing. Preserve source pixel width and height as the backing coordinate system.
- [ ] Add file import, paste, unchanged file download, copy, reset view, clear image, and error status. Do not add Undo/Redo or automatic saving.
- [ ] Keep source Blob, preview handle, and metadata in refs/state with minimal React updates. Dispose old preview resources when replacing or clearing an image.
- [ ] Handle fast consecutive imports by retaining the latest sequence only. A failed newer import must not erase a valid current image unless the user explicitly clears it.
- [ ] Add responsive CSS for 320/400/768/1024 px. At narrow widths collapse the status panel and move tools into a bottom touch bar. Use visible focus states and touch targets of at least 44 CSS px.
- [ ] Run typecheck, lint, unit tests, and a production build. Commit as `feat: add phase 0 workbench`.

## Task 6: Add synthetic fixtures and browser tests

**Files:** `tests/fixtures/generate-fixtures.ts`, `public/fixtures/*.png`, `tests/integration/import-export.test.ts`, `tests/e2e/phase0.spec.ts`, `playwright.config.ts`.

- [ ] Generate deterministic small fixtures with corner markers, an asymmetric center marker, transparent edges, semi-transparent pixels, and fully transparent pixels with nonzero RGB. Keep 2048², non-square, and off-center variants available without committing private images.
- [ ] Add integration coverage for source Blob SHA-256 roundtrip, Alpha, dimensions, hidden RGB, invalid/corrupt PNG, declared oversized IHDR, file-size rejection, and source immutability.
- [ ] Configure Playwright projects for Chromium and WebKit. Start the production preview server and test new navigation after service-worker activation, offline import/preview/export, cache-missing readiness, clipboard fallback, no unexpected requests, and responsive layouts at 320/400/768/1024 px.
- [ ] Add a GitHub Pages subpath build test with `VITE_BASE_PATH=/DrawSidecar/`, checking manifest `start_url`, `scope`, worker URL, and asset references.
- [ ] Run `npm run test`, `npm run test:e2e`, and `npm run build`. Record browser availability or failures explicitly.
- [ ] Commit as `test: cover offline phase 0 roundtrip`.

## Task 7: Write user documentation and evidence status

**Files:** `README.md`, `docs/architecture.md`, `docs/ipad_test.md`, `docs/progress.md`.

- [ ] Document Windows setup with Node/npm, `npm ci`, `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run build`, and `npm run preview`.
- [ ] Explain the source Blob versus preview/derived output boundary, no auto-save, no image upload, clipboard fallbacks, and offline readiness indicator.
- [ ] Document GitHub Pages subpath configuration without publishing it, and note that no remote is configured yet.
- [ ] Add an architecture diagram and a short data-flow explanation without claiming Phase 1/2 features exist.
- [ ] Add `docs/ipad_test.md` checklist for Safari HTTPS, Home Screen PWA, airplane-mode cold start, split view, file and clipboard paths, Procreate alignment, memory, and cache/version behavior. Mark every unexecuted physical-device test `MANUAL_PENDING`.
- [ ] Record actual command evidence and statuses in `docs/progress.md`, including failures and unavailable browser/device tests.
- [ ] Run a final `git diff --check`, status check, and full verification command set. Commit as `docs: document phase 0 verification`.

## Task 8: Final verification and stop at Phase 0

- [ ] Verify `git status`, branch name, and commit history. Confirm no remote, push, merge, release, or deployment was performed.
- [ ] Re-run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` from a clean working tree where possible.
- [ ] Confirm all Phase 0 success criteria are represented in tests or explicitly marked `MANUAL_PENDING`.
- [ ] Stop without starting Phase 1 work. Report completed files, commands/results, known gaps, and beginner-friendly Windows/iPad instructions.
