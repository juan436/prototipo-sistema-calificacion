import type { CashierSession, CustomerFeedback, MockDb, Rating, User } from '../mock/types';
import { RATINGS } from './lookup';

/** Ratings that count as «satisfied» in the summaries. What counts is still to be defined with the client. */
export const SATISFIED: Rating[] = ['excelente', 'bien'];

export function isCashier(user: User): boolean {
  return user.role === 'employee' && user.position === 'Caja';
}

function sessionsOf(sessions: CashierSession[], tabletId: string): CashierSession[] {
  return sessions.filter((s) => s.tabletId === tabletId).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Session open on a tablet at a given moment (the last one that started before it). */
export function sessionAt(sessions: CashierSession[], tabletId: string, at: string): CashierSession | undefined {
  let found: CashierSession | undefined;
  for (const s of sessionsOf(sessions, tabletId)) {
    if (s.startedAt <= at) found = s;
    else break;
  }
  return found;
}

export function currentSession(db: MockDb, tabletId: string): CashierSession | undefined {
  const list = sessionsOf(db.cashierSessions, tabletId);
  return list[list.length - 1];
}

export interface Turn {
  session: CashierSession;
  /** When the next cashier took over; undefined while the turn is still open. */
  endedAt?: string;
  feedback: CustomerFeedback[];
}

/** Turns of a tablet: from one change of cashier to the next. Newest first. */
export function turnsOf(db: MockDb, tabletId: string): Turn[] {
  const list = sessionsOf(db.cashierSessions, tabletId);
  return list
    .map((session, i) => {
      const endedAt = list[i + 1]?.startedAt;
      return {
        session,
        endedAt,
        feedback: db.customerFeedback.filter(
          (f) => f.tabletId === tabletId && f.createdAt >= session.startedAt && (!endedAt || f.createdAt < endedAt),
        ),
      };
    })
    .reverse();
}

export interface CashierSummary {
  cashierId: string;
  name: string;
  total: number;
  counts: Record<Rating, number>;
  satisfied: number;
  satisfiedPct: number;
}

/** Ratings grouped by the cashier in session. Sorted by % satisfied, best first. */
export function cashierSummary(db: MockDb, list: CustomerFeedback[]): CashierSummary[] {
  const map = new Map<string, CustomerFeedback[]>();
  for (const f of list) {
    if (!f.cashierId) continue;
    map.set(f.cashierId, [...(map.get(f.cashierId) ?? []), f]);
  }
  return [...map.entries()]
    .map(([cashierId, items]) => {
      const counts = Object.fromEntries(RATINGS.map((r) => [r.id, items.filter((f) => f.rating === r.id).length])) as Record<Rating, number>;
      const satisfied = items.filter((f) => SATISFIED.includes(f.rating)).length;
      return {
        cashierId,
        name: db.users.find((u) => u.id === cashierId)?.name ?? cashierId,
        total: items.length,
        counts,
        satisfied,
        satisfiedPct: Math.round((satisfied / items.length) * 100),
      };
    })
    .sort((a, b) => b.satisfiedPct - a.satisfiedPct || b.total - a.total);
}

export function satisfiedPct(list: CustomerFeedback[]): number {
  if (!list.length) return 0;
  return Math.round((list.filter((f) => SATISFIED.includes(f.rating)).length / list.length) * 100);
}
