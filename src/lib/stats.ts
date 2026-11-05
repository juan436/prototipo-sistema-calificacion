import type {
  AdministrativeAct,
  BranchId,
  CustomerFeedback,
  DisciplinaryReport,
  MockDb,
  PerformanceEvaluation,
  Rating,
} from '../mock/types';
import { branchAt } from './employees';
import { getVersion } from './forms';
import { RATINGS } from './lookup';
import { average, averageAreas, computeScore, type AreaScore } from './scoring';

export type BranchFilter = BranchId | 'all';

export interface DateRange {
  /** YYYY-MM-DD inclusive */
  from?: string;
  /** YYYY-MM-DD inclusive */
  to?: string;
}

function inRange(date: string, range: DateRange): boolean {
  const day = date.slice(0, 10);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function filterFeedback(
  db: MockDb,
  opts: { branch?: BranchFilter; range?: DateRange; employeeId?: string } = {},
): CustomerFeedback[] {
  return db.customerFeedback.filter((f) => {
    if (opts.branch && opts.branch !== 'all' && f.branchId !== opts.branch) return false;
    if (opts.range && !inRange(f.createdAt, opts.range)) return false;
    if (
      opts.employeeId &&
      f.cashierId !== opts.employeeId &&
      !f.praisedEmployeeIds.includes(opts.employeeId)
    ) {
      return false;
    }
    return true;
  });
}

export interface RatingCount {
  rating: Rating;
  label: string;
  color: string;
  count: number;
  pct: number;
}

export function ratingDistribution(list: CustomerFeedback[]): RatingCount[] {
  return RATINGS.map((r) => {
    const count = list.filter((f) => f.rating === r.id).length;
    return { rating: r.id, label: r.label, color: r.color, count, pct: list.length ? Math.round((count / list.length) * 1000) / 10 : 0 };
  });
}

export function praisesByEmployee(db: MockDb, list: CustomerFeedback[]): { employeeId: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const f of list) for (const id of f.praisedEmployeeIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([employeeId, count]) => ({ employeeId, name: db.users.find((u) => u.id === employeeId)?.name ?? employeeId, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function complaintsOf(list: CustomerFeedback[]): CustomerFeedback[] {
  return list.filter((f) => f.complaint).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Monthly count per rating, for stacked charts. */
export function monthlyEvolution(list: CustomerFeedback[], months: string[]) {
  return months.map((month) => {
    const row: Record<string, number | string> = { month };
    for (const r of RATINGS) row[r.id] = list.filter((f) => f.createdAt.startsWith(month) && f.rating === r.id).length;
    row.total = list.filter((f) => f.createdAt.startsWith(month)).length;
    return row;
  });
}

// ---------- Anonymous survey ----------

export interface SurveyResult {
  periodId: string;
  participants: number;
  eligible: number;
  participationPct: number;
  average: number | null;
  areas: AreaScore[];
  comments: string[];
}

export function eligibleStaff(db: MockDb, periodId: string, branch: BranchFilter = 'all') {
  const period = db.surveyPeriods.find((p) => p.id === periodId)!;
  return db.users.filter(
    (u) =>
      u.role === 'employee' &&
      (u.active || db.participation.some((p) => p.periodId === periodId && p.employeeId === u.id)) &&
      (branch === 'all' || branchAt(u, period.opensAt) === branch),
  );
}

export function surveyResult(db: MockDb, periodId: string, branch: BranchFilter = 'all'): SurveyResult {
  const eligible = eligibleStaff(db, periodId, branch);
  const eligibleIds = new Set(eligible.map((u) => u.id));
  const participants = db.participation.filter((p) => p.periodId === periodId && eligibleIds.has(p.employeeId)).length;
  const responses = db.anonymousResponses.filter((r) => r.periodId === periodId && (branch === 'all' || r.branchId === branch));
  const scores = responses.map((r) => {
    const form = db.forms.find((f) => f.id === r.formId)!;
    return computeScore(getVersion(form, r.formVersion), r.answers);
  });
  return {
    periodId,
    participants,
    eligible: eligible.length,
    participationPct: eligible.length ? Math.round((participants / eligible.length) * 100) : 0,
    average: average(scores.map((s) => s.grade).filter((g): g is number => g !== null)),
    areas: averageAreas(scores),
    comments: responses.map((r) => r.comment).filter((c): c is string => !!c),
  };
}

// ---------- Performance ----------

export function evaluationsOf(db: MockDb, employeeId: string): PerformanceEvaluation[] {
  return db.performance.filter((e) => e.employeeId === employeeId).sort((a, b) => a.period.localeCompare(b.period));
}

export function historicalAverage(db: MockDb, employeeId: string): number | null {
  return average(evaluationsOf(db, employeeId).map((e) => e.grade));
}

export function evaluationAreas(db: MockDb, evaluation: PerformanceEvaluation): AreaScore[] {
  const form = db.forms.find((f) => f.id === evaluation.formId)!;
  return computeScore(getVersion(form, evaluation.formVersion), evaluation.answers).areas;
}

export interface Annexes {
  praises: CustomerFeedback[];
  complaints: CustomerFeedback[];
  reports: DisciplinaryReport[];
  acts: AdministrativeAct[];
}

/** Informative annexes of an employee for a period (YYYY-MM). They never change the official grade. */
export function annexesFor(db: MockDb, employeeId: string, period?: string): Annexes {
  const match = (date: string) => !period || date.startsWith(period);
  const reports = db.disciplinaryReports.filter((r) => r.employeeId === employeeId && (!period || r.period === period));
  return {
    praises: db.customerFeedback.filter((f) => f.praisedEmployeeIds.includes(employeeId) && match(f.createdAt)),
    // A complaint belongs to the cashier in session when the customer rated.
    complaints: db.customerFeedback.filter((f) => !!f.complaint && f.cashierId === employeeId && match(f.createdAt)),
    reports,
    acts: db.acts.filter((a) => reports.some((r) => r.id === a.reportId)),
  };
}

export function hasAnnexes(a: Annexes): boolean {
  return a.praises.length + a.complaints.length + a.reports.length + a.acts.length > 0;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  // BOM so Excel opens the accents correctly.
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
