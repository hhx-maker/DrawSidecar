# DrawSidecar Phase 2 Visual Assistance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first deterministic visual-assistance loop from imported RGBA pixels through line-gap candidates, user-confirmed virtual closure, region analysis, smart fill, and base-mask output.

**Architecture:** Keep all image algorithms as DOM-free pure TypeScript modules under `src/engine`. Use explicit conventions from AGENTS.md. The UI obtains a working RGBA buffer from the current preview only when the user starts analysis, sends algorithm jobs through the existing Worker protocol where practical, and keeps source Blob immutable. Derived masks and color layers are separate full-size outputs.

**Tech Stack:** TypeScript strict, Canvas 2D, Uint8Array/Uint32Array, Web Worker RPC, React, Vitest, Playwright.

---

## Scope boundaries

Phase 2 implements deterministic geometry and mask assistance. It does not add AI, OpenCV, semantic labels, brush simulation, PSD export, or automatic acceptance of gap candidates. Scores remain heuristic scores, not calibrated probabilities.

## Task 1: Add preprocessing and skeletonization

**Files:** `src/engine/preprocessing.ts`, `src/engine/skeletonization.ts`, `tests/unit/preprocessing.test.ts`, `tests/unit/skeletonization.test.ts`.

- [ ] Implement `rgbaToObstacleMask` with transparent mode and white-background mode. Transparent hidden RGB must not create obstacles. White-background mode uses luminance threshold.
- [ ] Implement Zhang–Suen thinning with bounded iteration and no recursive traversal. Preserve source dimensions.
- [ ] Test transparent hidden RGB, anti-aliased strokes, white background, empty/full masks, one-pixel lines, border lines, and a simple closed rectangle.
- [ ] Commit `feat: add line preprocessing and skeletonization`.

## Task 2: Add gap candidates and virtual closure

**Files:** `src/engine/gapDetection.ts`, `src/engine/virtualClosure.ts`, `tests/unit/gapDetection.test.ts`, `tests/unit/virtualClosure.test.ts`.

- [ ] Detect skeleton endpoints and junctions using 8-neighborhood counts.
- [ ] Pair nearby endpoints through a spatial grid. Score distance, tangent direction, local stroke support, and obstacle crossing. Include reason text and stable candidate IDs.
- [ ] Implement straight-pixel bridge paths for user-confirmed candidates only. Keep original obstacle mask unchanged and return a new virtual-closure mask.
- [ ] Reject bridges that leave bounds or cross unrelated obstacles beyond their endpoint neighborhoods. Keep unconfirmed candidates untouched.
- [ ] Test complete loops, one-gap rectangles, multiple gaps, parallel lines, T junctions, border endpoints, candidate rejection, and virtual mask immutability.
- [ ] Commit `feat: detect gaps and apply virtual closures`.

## Task 3: Add connected regions and smart selection

**Files:** `src/engine/connectedComponents.ts`, `src/engine/smartSelection.ts`, `tests/unit/connectedComponents.test.ts`, `tests/unit/smartSelection.test.ts`.

- [ ] Implement iterative 4-connected flood labeling with obstacle label 0, positive region IDs, area, bounds, representative interior point, and background status from an optional one-pixel border.
- [ ] Implement single-select, multi-select, cancel, and scoped invert over valid regions. Keep background selection explicit.
- [ ] Test diagonal gaps, border-touching regions, internal holes, all-obstacle, all-open, empty, multi-region, representative-point interior, and invert scope.
- [ ] Commit `feat: add connected regions and smart selection`.

## Task 4: Add smart fill and base mask

**Files:** `src/engine/smartFill.ts`, `src/engine/baseMask.ts`, `src/engine/derivedLayer.ts`, `tests/unit/smartFill.test.ts`, `tests/unit/baseMask.test.ts`.

- [ ] Implement selected-region mask expansion constrained by region IDs and optional line coverage radius.
- [ ] Implement full-size RGBA color-layer encoding from a Uint8Array mask. Transparent pixels keep Alpha 0, selected pixels use requested RGBA values.
- [ ] Block background-connected or boundary-touching fills unless explicitly allowed by params and return a warning.
- [ ] Implement external-background flood fill for base mask generation. Preserve internal holes and return warnings for open/border-touching contours.
- [ ] Test color/alpha values, untouched source arrays, background warnings, internal holes, border contours, open contours, and output dimensions.
- [ ] Commit `feat: add smart fill and base masks`.

## Task 5: Connect Phase 2 analysis to the Worker and UI

**Files:** `src/engine/workerTasks.ts`, `src/workers/compute.worker.ts`, `src/components/Phase2Panel.tsx`, `src/App.tsx`, `src/components/Toolbar.tsx`, `src/components/StatusPanel.tsx`, `src/styles.css`.

- [ ] Add typed Worker tasks for preprocess, skeletonize, detect-gaps, connected-components, smart-fill, and base-mask. Every task carries `jobId` and current revision.
- [ ] Extract preview pixels to a working RGBA buffer only when the user starts Phase 2 analysis. Keep large arrays out of React state.
- [ ] Add a Phase 2 panel with explicit buttons for Analyze gaps, Accept selected closure, Recompute regions, Fill selected region, and Generate base mask. Require user confirmation before applying a closure or large fill.
- [ ] Show candidate list with heuristic score/reason, selected region IDs, warnings, and derived-layer status. Do not present semantic labels or probability language.
- [ ] Render derived mask/color overlays separately and keep source export unchanged. Add download buttons for transparent derived layers.
- [ ] Add clear cancellation/error handling and ignore stale revision results.
- [ ] Commit `feat: connect phase 2 visual assistance`.

## Task 6: Add Phase 2 integration and E2E coverage

**Files:** `tests/integration/phase2.test.ts`, `tests/e2e/phase2.spec.ts`, `docs/algorithms.md`, `docs/progress.md`, `docs/architecture.md`.

- [ ] Add integration tests for a closed rectangle, one-gap rectangle, multiple regions, virtual closure, selection, fill, and base mask using deterministic synthetic RGBA fixtures.
- [ ] Add E2E coverage for import, gap analysis, candidate review, explicit closure acceptance, region recomputation, color selection, derived PNG export, and source-preserving original export.
- [ ] Add algorithm documentation with mask conventions, 4/8-connectivity choices, heuristic score limitations, failure warnings, and complexity notes.
- [ ] Update progress with actual PASS/FAIL/MANUAL_PENDING evidence. Keep real iPad/Procreate checks pending.
- [ ] Commit `test: verify phase 2 visual assistance`.

## Task 7: Final verification and terminal-only GitHub upload

- [ ] Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e` sequentially where needed to avoid `test-results` directory races.
- [ ] Run `git diff --check` and confirm no source image or generated private project data is tracked.
- [ ] Verify `git remote -v` and push only `feat/phase2-visual-assistance` through the configured Git proxy with `git push -u origin feat/phase2-visual-assistance`.
- [ ] Do not push or merge `main`.
