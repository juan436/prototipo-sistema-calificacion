import { describe, expect, it } from 'vitest';
import { createForms, FORM_IDS } from '../mock/forms';
import { computeScore, questionScore } from './scoring';

const forms = createForms();
const performance = forms.find((f) => f.id === FORM_IDS.performance)!;
const anonymous = forms.find((f) => f.id === FORM_IDS.anonymous)!;

describe('computeScore', () => {
  it('gives 10 when every answer is the best option', () => {
    const v1 = performance.versions[0];
    const answers = Object.fromEntries(v1.questions.map((q) => [q.id, 0]));
    expect(computeScore(v1, answers).grade).toBe(10);
  });

  it('gives 0 when every answer is the worst option', () => {
    const v1 = performance.versions[0];
    const answers = Object.fromEntries(v1.questions.map((q) => [q.id, 4]));
    expect(computeScore(v1, answers).grade).toBe(0);
  });

  it('applies the weights of the version', () => {
    const v1 = performance.versions[0];
    // Weight 2 question best, everything else worst: 2 / 7 * 10
    const answers = Object.fromEntries(v1.questions.map((q) => [q.id, 4]));
    answers['p-cust-1'] = 0;
    expect(computeScore(v1, answers).grade).toBe(2.9);
  });

  it('groups the scores by area', () => {
    const v2 = performance.versions[1];
    const answers = Object.fromEntries(v2.questions.map((q) => [q.id, 0]));
    answers['p-order-1'] = 2;
    const result = computeScore(v2, answers);
    expect(result.areas.find((a) => a.area === 'Orden y limpieza')?.grade).toBe(5);
    expect(result.areas.find((a) => a.area === 'Atención al cliente')?.grade).toBe(10);
  });

  it('handles answers that subtract points', () => {
    const q = anonymous.versions[0].questions[0];
    expect(questionScore(q, 4)).toBe(0); // -2 points
    expect(questionScore(q, 2)).toBe(0.5); // 0 points
    const answers = Object.fromEntries(anonymous.versions[0].questions.map((qq) => [qq.id, 4]));
    expect(computeScore(anonymous.versions[0], answers).rawPoints).toBe(-12);
  });

  it('ignores unanswered and text questions', () => {
    expect(computeScore(performance.versions[0], {}).grade).toBeNull();
  });
});

describe('annexes do not change the official grade', async () => {
  const { createSeed } = await import('../mock/seed');
  const { annexesFor, hasAnnexes } = await import('./stats');
  const { getVersion } = await import('./forms');
  const { ANNEX_EMPLOYEE_ID } = await import('../mock/users');
  const db = createSeed();

  it('computes the grade only from the manager form', () => {
    const evaluation = db.performance.find((e) => e.employeeId === ANNEX_EMPLOYEE_ID && e.period === '2026-09')!;
    const annexes = annexesFor(db, ANNEX_EMPLOYEE_ID, '2026-09');
    expect(hasAnnexes(annexes)).toBe(true);
    expect(annexes.praises).toHaveLength(1);
    expect(annexes.complaints).toHaveLength(1);
    expect(annexes.reports).toHaveLength(1);
    expect(annexes.acts).toHaveLength(1);
    const form = db.forms.find((f) => f.id === evaluation.formId)!;
    expect(computeScore(getVersion(form, evaluation.formVersion), evaluation.answers).grade).toBe(evaluation.grade);
  });
});
