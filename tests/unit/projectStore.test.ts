import { beforeEach, describe, expect, it } from 'vitest';
import { createProjectMeta, deleteProject, loadLatestProject, loadProject, saveProject } from '../../src/services/projectStore';
import type { StoredProject } from '../../src/types/project';

async function project(name: string, updatedAt: number): Promise<StoredProject> {
  const blob = new Blob([name], { type: 'image/png' });
  return {
    meta: { ...createProjectMeta('hash-' + name, name, 2, 2, updatedAt), updatedAt },
    sourceBytes: await blob.arrayBuffer(),
    sourceMimeType: 'image/png',
    fileName: name,
    metadata: { width: 2, height: 2, hasAlpha: true, coordinateSystem: 'origin-top-left-x-right-y-down', pngHeader: { width: 2, height: 2, bitDepth: 8, colorType: 6 } }
  };
}

describe('projectStore', () => {
  beforeEach(async () => {
    const current = await loadLatestProject();
    if (current) await deleteProject(current.meta.id);
  });

  it('saves and restores the immutable source Blob', async () => {
    const stored = await project('source.png', 1);
    await saveProject(stored);
    const restored = await loadProject(stored.meta.id);
    expect(restored?.fileName).toBe('source.png');
    expect(restored?.sourceBytes.byteLength).toBe(stored.sourceBytes.byteLength);
  });

  it('returns the most recently updated project', async () => {
    const older = await project('older.png', 1);
    const newer = await project('newer.png', 2);
    await saveProject(older);
    await saveProject(newer);
    expect((await loadLatestProject())?.fileName).toBe('newer.png');
  });
});
