import { currentSession } from '../../lib/cashier';
import { nowIso } from '../../lib/dates';
import type { Complaint, CustomerFeedback, Rating, Tablet } from '../../mock/types';
import { useDemoStore } from '../../store/useDemoStore';

export interface FeedbackInput {
  rating: Rating;
  /** «¿Quieres felicitar a quien te atendió?» answered Sí: the praise goes to the cashier in session. */
  praiseCashier?: boolean;
  comment?: string;
  complaint?: Complaint;
}

function clean(complaint?: Complaint): Complaint | undefined {
  if (!complaint) return undefined;
  const c: Complaint = {};
  if (complaint.whatHappened?.trim()) c.whatHappened = complaint.whatHappened.trim();
  if (complaint.phone?.trim()) c.phone = complaint.phone.trim();
  return Object.keys(c).length ? c : undefined;
}

/** How often a pending rating is sent again. Example value: the real interval is still to be defined. */
export const RETRY_SECONDS = 10;

export function isOnline(): boolean {
  return navigator.onLine && !useDemoStore.getState().simulateOffline;
}

/** Stores the rating and sends the alert when needed. */
function commit(record: CustomerFeedback): string | null {
  const store = useDemoStore.getState();
  store.update((db) => {
    db.customerFeedback.push(record);
  });
  if (record.rating === 'muy_mal' || record.complaint) return store.queueEmail('customer_alert', record.id);
  return null;
}

export interface SaveResult {
  /** Alert email generated right away (only when online). */
  alertId: string | null;
  /** True when there was no connection and the rating is waiting to be sent. */
  pending: boolean;
}

/** Saves one customer submission. Without connection it waits and is retried later. */
export function saveFeedback(tablet: Tablet, input: FeedbackInput): SaveResult {
  const store = useDemoStore.getState();
  // Linked to the cashier in session on this tablet right now.
  const cashierId = currentSession(store.db, tablet.id)?.employeeId;
  const record: CustomerFeedback = {
    id: `cf-${Date.now().toString(36)}`,
    branchId: tablet.branchId,
    tabletId: tablet.id,
    cashierId,
    createdAt: nowIso(),
    rating: input.rating,
    praisedEmployeeIds: input.rating === 'excelente' && input.praiseCashier && cashierId ? [cashierId] : [],
  };
  if (input.rating === 'excelente' && input.comment?.trim()) record.comment = input.comment.trim();
  const complaint = input.rating === 'mal' || input.rating === 'muy_mal' ? clean(input.complaint) : undefined;
  if (complaint) record.complaint = complaint;

  if (!isOnline()) {
    useDemoStore.setState((s) => ({ pendingFeedback: [...s.pendingFeedback, record] }));
    return { alertId: null, pending: true };
  }
  return { alertId: commit(record), pending: false };
}

/** Sends every pending rating if there is connection. Keeps the original date and time. */
export function flushPending(): number {
  const pending = useDemoStore.getState().pendingFeedback;
  if (!pending.length || !isOnline()) return 0;
  useDemoStore.setState({ pendingFeedback: [] });
  for (const record of pending) commit(record);
  return pending.length;
}
