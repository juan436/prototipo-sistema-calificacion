import { joinMonths, periodOf } from './dates';
import type { FormDefinition, FormVersion, MockDb, Question, User } from '../mock/types';

export function latestVersion(form: FormDefinition): FormVersion {
  return form.versions[form.versions.length - 1];
}

export function getVersion(form: FormDefinition, version: number): FormVersion {
  const found = form.versions.find((v) => v.version === version);
  if (!found) throw new Error(`Form ${form.id} has no version ${version}`);
  return found;
}

/** Periods (YYYY-MM) in which each version of a form was used. */
export function versionUsage(db: MockDb, formId: string): Record<number, string[]> {
  const usage: Record<number, Set<string>> = {};
  const add = (version: number, period: string) => {
    (usage[version] ??= new Set()).add(period);
  };
  for (const e of db.performance) if (e.formId === formId) add(e.formVersion, e.period);
  for (const r of db.disciplinaryReports) if (r.formId === formId) add(r.formVersion, r.period);
  for (const a of db.acts) if (a.formId === formId) add(a.formVersion, periodOf(a.createdAt));
  for (const r of db.anonymousResponses) {
    if (r.formId !== formId) continue;
    const period = db.surveyPeriods.find((p) => p.id === r.periodId);
    if (period) add(r.formVersion, periodOf(period.opensAt));
  }
  if (formId === db.forms.find((f) => f.type === 'customer')?.id) {
    for (const f of db.customerFeedback) add(1, periodOf(f.createdAt));
  }
  return Object.fromEntries(Object.entries(usage).map(([v, set]) => [v, [...set].sort()]));
}

export function hasResponses(db: MockDb, formId: string, version: number): boolean {
  return (versionUsage(db, formId)[version]?.length ?? 0) > 0;
}

/** «Versión 1 · usada en julio y agosto» */
export function versionLabel(db: MockDb, formId: string, version: number): string {
  const periods = versionUsage(db, formId)[version] ?? [];
  return periods.length
    ? `Versión ${version} · usada en ${joinMonths(periods)}`
    : `Versión ${version} · sin respuestas todavía`;
}

export interface SaveResult {
  form: FormDefinition;
  createdNewVersion: boolean;
}

/**
 * Saves edited questions.
 * - If the latest version already has responses, it is left untouched and a new version is created.
 * - If it has no responses yet, it is updated in place.
 */
export function saveFormChanges(
  form: FormDefinition,
  questions: Question[],
  latestHasResponses: boolean,
  now: string,
  allowComments?: boolean,
): SaveResult {
  const latest = latestVersion(form);
  const nextQuestions = structuredClone(questions);
  const comments = allowComments ?? latest.allowComments;
  if (!latestHasResponses) {
    const updated: FormVersion = { ...latest, questions: nextQuestions, allowComments: comments };
    return { form: { ...form, versions: [...form.versions.slice(0, -1), updated] }, createdNewVersion: false };
  }
  const created: FormVersion = {
    version: latest.version + 1,
    createdAt: now,
    questions: nextQuestions,
    allowComments: comments,
  };
  return { form: { ...form, versions: [...form.versions, created] }, createdNewVersion: true };
}

export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item);
  return copy;
}

/** Performance questionnaire that applies to an employee, according to their role (position). */
export function performanceFormFor(db: MockDb, employee: User): FormDefinition | undefined {
  return db.forms.find((f) => f.type === 'performance' && f.position === employee.position);
}
