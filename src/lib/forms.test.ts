import { describe, expect, it } from 'vitest';
import { createSeed } from '../mock/seed';
import { FORM_IDS } from '../mock/forms';
import { hasResponses, latestVersion, moveItem, saveFormChanges, versionLabel } from './forms';

describe('form versioning', () => {
  const db = createSeed();
  const performance = db.forms.find((f) => f.id === FORM_IDS.performance)!;

  it('creates a new version when the latest one already has responses', () => {
    const questions = latestVersion(performance).questions.slice(1);
    const { form, createdNewVersion } = saveFormChanges(performance, questions, true, '2026-10-31T10:00:00');
    expect(createdNewVersion).toBe(true);
    expect(form.versions).toHaveLength(3);
    // Older versions stay intact.
    expect(form.versions[1]).toEqual(performance.versions[1]);
    expect(form.versions[2].questions).toHaveLength(questions.length);
  });

  it('updates in place when the latest version has no responses', () => {
    const questions = latestVersion(performance).questions.slice(1);
    const { form, createdNewVersion } = saveFormChanges(performance, questions, false, '2026-10-31T10:00:00');
    expect(createdNewVersion).toBe(false);
    expect(form.versions).toHaveLength(2);
  });

  it('labels each version with the months it was used', () => {
    expect(versionLabel(db, FORM_IDS.performance, 1)).toBe('Versión 1 · usada en julio y agosto');
    expect(versionLabel(db, FORM_IDS.performance, 2)).toBe('Versión 2 · usada en septiembre');
    expect(hasResponses(db, FORM_IDS.performance, 2)).toBe(true);
  });

  it('reorders questions', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });
});
