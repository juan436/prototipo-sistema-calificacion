import { describe, expect, it } from 'vitest';
import { createUsers, TRANSFERRED_EMPLOYEE_ID, TRANSFER_DATE } from '../mock/users';
import { branchAt, staffAt } from './employees';

describe('branchAt', () => {
  const users = createUsers();
  const moved = users.find((u) => u.id === TRANSFERRED_EMPLOYEE_ID)!;

  it('keeps the old branch before the transfer and the new one after', () => {
    expect(branchAt(moved, '2026-08-01')).toBe('ferreisla');
    expect(branchAt(moved, TRANSFER_DATE)).toBe('lagloria');
    expect(branchAt(moved, '2026-10-01T10:00:00')).toBe('lagloria');
  });

  it('counts the transferred employee in the right branch per date', () => {
    expect(staffAt(users, 'ferreisla', '2026-07-10').some((u) => u.id === moved.id)).toBe(true);
    expect(staffAt(users, 'ferreisla', '2026-09-10').some((u) => u.id === moved.id)).toBe(false);
  });
});
