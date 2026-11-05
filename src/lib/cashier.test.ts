import { describe, expect, it } from 'vitest';
import { createSeed } from '../mock/seed';
import { cashierSummary, currentSession, sessionAt, turnsOf } from './cashier';

describe('cashier sessions', () => {
  const db = createSeed();

  it('links each rating to the cashier in session on that tablet', () => {
    // Caja 1 of Ferreisla: morning cashier until 2 p.m., afternoon cashier after.
    expect(sessionAt(db.cashierSessions, 't1', '2026-09-10T09:30:00')?.employeeId).toBe('e02');
    expect(sessionAt(db.cashierSessions, 't1', '2026-09-10T15:00:00')?.employeeId).toBe('e03');
    // Caja 2 keeps the same cashier: the session never closes by itself.
    expect(sessionAt(db.cashierSessions, 't4', '2026-10-30T18:00:00')?.employeeId).toBe('e06');
  });

  it('has a cashier in every example rating', () => {
    expect(db.customerFeedback.every((f) => !!f.cashierId)).toBe(true);
    for (const f of db.customerFeedback) {
      expect(sessionAt(db.cashierSessions, f.tabletId, f.createdAt)?.employeeId).toBe(f.cashierId);
    }
  });

  it('has at least 2 registers per branch, each with its tablet, and one with two cashiers', () => {
    for (const b of db.branches) {
      expect(db.tablets.filter((t) => t.branchId === b.id && t.status === 'authorized').length).toBeGreaterThanOrEqual(2);
    }
    const cashiers = new Set(db.cashierSessions.filter((s) => s.tabletId === 't1').map((s) => s.employeeId));
    expect(cashiers.size).toBe(2);
  });

  it('builds turns from one change of cashier to the next', () => {
    const turns = turnsOf(db, 't1');
    expect(turns[0].endedAt).toBeUndefined();
    expect(turns[0].session).toEqual(currentSession(db, 't1'));
    expect(turns[1].endedAt).toBe(turns[0].session.startedAt);
    const counted = turns.reduce((n, t) => n + t.feedback.length, 0);
    expect(counted).toBe(db.customerFeedback.filter((f) => f.tabletId === 't1').length);
  });

  it('summarizes ratings per cashier', () => {
    const summary = cashierSummary(db, db.customerFeedback);
    const total = summary.reduce((n, s) => n + s.total, 0);
    expect(total).toBe(db.customerFeedback.length);
    for (const s of summary) {
      expect(s.satisfied).toBe(s.counts.excelente + s.counts.bien);
    }
  });
});
