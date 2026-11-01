import type { BranchId, User } from '../mock/types';

/** Branch where the person worked on a given date (YYYY-MM-DD or ISO date-time). */
export function branchAt(user: User, date: string): BranchId | null {
  const day = date.slice(0, 10);
  let current: BranchId | null = user.branchHistory[0]?.branchId ?? user.branchId;
  for (const a of [...user.branchHistory].sort((x, y) => x.from.localeCompare(y.from))) {
    if (a.from <= day) current = a.branchId;
  }
  return current;
}

export function isStaff(user: User): boolean {
  return user.role === 'employee';
}

/** Employees a manager may see: the active and inactive staff currently in the manager's branch. */
export function employeesOfManager(users: User[], manager: User): User[] {
  return users.filter((u) => u.role === 'employee' && u.branchId === manager.branchId);
}

/** Staff that worked at a branch on a given date. */
export function staffAt(users: User[], branchId: BranchId, date: string): User[] {
  return users.filter((u) => u.role === 'employee' && branchAt(u, date) === branchId);
}
