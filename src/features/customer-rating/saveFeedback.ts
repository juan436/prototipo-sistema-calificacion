import { currentSession } from '../../lib/cashier';
import { nowIso } from '../../lib/dates';
import type { Complaint, CustomerFeedback, Rating, Tablet } from '../../mock/types';
import { useDemoStore } from '../../store/useDemoStore';

export interface FeedbackInput {
  rating: Rating;
  praisedEmployeeIds?: string[];
  comment?: string;
  complaint?: Complaint;
}

function clean(complaint?: Complaint): Complaint | undefined {
  if (!complaint) return undefined;
  const c: Complaint = {};
  if (complaint.employeeId) c.employeeId = complaint.employeeId;
  if (complaint.whatHappened?.trim()) c.whatHappened = complaint.whatHappened.trim();
  if (complaint.phone?.trim()) c.phone = complaint.phone.trim();
  return Object.keys(c).length ? c : undefined;
}

/** Saves one customer submission. Returns the alert email id if an alert was generated. */
export function saveFeedback(tablet: Tablet, input: FeedbackInput): string | null {
  const store = useDemoStore.getState();
  const record: CustomerFeedback = {
    id: `cf-${Date.now().toString(36)}`,
    branchId: tablet.branchId,
    tabletId: tablet.id,
    // Linked to the cashier in session on this tablet right now.
    cashierId: currentSession(store.db, tablet.id)?.employeeId,
    createdAt: nowIso(),
    rating: input.rating,
    praisedEmployeeIds: input.rating === 'excelente' ? input.praisedEmployeeIds ?? [] : [],
  };
  if (input.rating === 'excelente' && input.comment?.trim()) record.comment = input.comment.trim();
  const complaint = input.rating === 'mal' || input.rating === 'muy_mal' ? clean(input.complaint) : undefined;
  if (complaint) record.complaint = complaint;

  store.update((db) => {
    db.customerFeedback.push(record);
  });

  if (record.rating === 'muy_mal' || record.complaint) {
    return store.queueEmail('customer_alert', record.id);
  }
  return null;
}
