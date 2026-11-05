import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';
import { ANNEX_EMPLOYEE_ID, TRANSFERRED_EMPLOYEE_ID } from './users';

describe('demo data', () => {
  const db = createSeed();

  it('has the people the brief asks for', () => {
    const staff = db.users.filter((u) => u.role === 'employee');
    expect(staff.length).toBeGreaterThanOrEqual(12);
    expect(staff.length).toBeLessThanOrEqual(16);
    expect(db.users.filter((u) => u.role === 'manager')).toHaveLength(2);
    expect(db.users.filter((u) => u.role === 'admin')).toHaveLength(1);
  });

  it('has 40 to 60 customer ratings per branch, 4 to 6 complaints and 2 «Muy mal»', () => {
    for (const b of db.branches) {
      const n = db.customerFeedback.filter((f) => f.branchId === b.id).length;
      expect(n).toBeGreaterThanOrEqual(40);
      expect(n).toBeLessThanOrEqual(60);
    }
    const complaints = db.customerFeedback.filter((f) => f.complaint).length;
    expect(complaints).toBeGreaterThanOrEqual(4);
    expect(complaints).toBeLessThanOrEqual(6);
    expect(db.customerFeedback.filter((f) => f.rating === 'muy_mal')).toHaveLength(2);
  });

  it('keeps anonymous answers apart from participation', () => {
    for (const r of db.anonymousResponses) {
      expect(Object.keys(r)).not.toContain('employeeId');
    }
    const open = db.surveyPeriods.filter((p) => p.status === 'open');
    expect(open).toHaveLength(1);
    expect(db.surveyPeriods.filter((p) => p.status === 'closed')).toHaveLength(3);
    for (const p of db.surveyPeriods) {
      const participants = db.participation.filter((x) => x.periodId === p.id).length;
      const answers = db.anonymousResponses.filter((x) => x.periodId === p.id).length;
      expect(participants).toBe(answers);
    }
  });

  it('has 3 months of performance per employee and one modified evaluation', () => {
    for (const u of db.users.filter((x) => x.role === 'employee')) {
      expect(db.performance.filter((e) => e.employeeId === u.id)).toHaveLength(3);
    }
    expect(db.performance.filter((e) => e.changes.length > 0)).toHaveLength(1);
  });

  it('evaluates each employee with the questionnaire of their role', () => {
    for (const e of db.performance) {
      const employee = db.users.find((u) => u.id === e.employeeId)!;
      const form = db.forms.find((f) => f.id === e.formId)!;
      expect(form.position).toBe(employee.position);
    }
    const positions = new Set(db.users.filter((u) => u.role === 'employee').map((u) => u.position));
    expect([...positions].sort()).toEqual(['Administrativo', 'Caja', 'Ventas']);
  });

  it('has the employee with annexes and the transferred employee', () => {
    expect(db.customerFeedback.some((f) => f.praisedEmployeeIds.includes(ANNEX_EMPLOYEE_ID))).toBe(true);
    expect(db.customerFeedback.some((f) => f.complaint?.employeeId === ANNEX_EMPLOYEE_ID)).toBe(true);
    const report = db.disciplinaryReports.find((r) => r.employeeId === ANNEX_EMPLOYEE_ID)!;
    expect(db.acts.some((a) => a.reportId === report.id)).toBe(true);
    const moved = db.users.find((u) => u.id === TRANSFERRED_EMPLOYEE_ID)!;
    expect(new Set(db.performance.filter((e) => e.employeeId === moved.id).map((e) => e.branchId)).size).toBe(2);
  });

  it('has 2 authorized tablets and 1 revoked', () => {
    expect(db.tablets.filter((t) => t.status === 'authorized')).toHaveLength(2);
    expect(db.tablets.filter((t) => t.status === 'revoked')).toHaveLength(1);
  });
});
