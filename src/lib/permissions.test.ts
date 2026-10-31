import { describe, expect, it } from 'vitest';
import { createUsers, MANAGER_FERREISLA_ID, MANAGER_LAGLORIA_ID, TRANSFERRED_EMPLOYEE_ID } from '../mock/users';
import { canSeeEmployee } from './permissions';

describe('canSeeEmployee', () => {
  const users = createUsers();
  const get = (id: string) => users.find((u) => u.id === id)!;

  it('lets a manager see only the staff of their branch', () => {
    expect(canSeeEmployee(get(MANAGER_FERREISLA_ID), get('e01'))).toBe(true);
    expect(canSeeEmployee(get(MANAGER_FERREISLA_ID), get('e09'))).toBe(false);
  });

  it('moves the transferred employee to the new manager', () => {
    expect(canSeeEmployee(get(MANAGER_LAGLORIA_ID), get(TRANSFERRED_EMPLOYEE_ID))).toBe(true);
    expect(canSeeEmployee(get(MANAGER_FERREISLA_ID), get(TRANSFERRED_EMPLOYEE_ID))).toBe(false);
  });

  it('lets an employee see only themself', () => {
    expect(canSeeEmployee(get('e01'), get('e01'))).toBe(true);
    expect(canSeeEmployee(get('e01'), get('e02'))).toBe(false);
  });
});
