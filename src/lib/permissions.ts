import type { User } from '../mock/types';

/** Admin sees everybody; a manager only the staff of their branch; an employee only themself. */
export function canSeeEmployee(viewer: User, employee: User): boolean {
  if (viewer.role === 'admin') return true;
  if (viewer.role === 'manager') return employee.role === 'employee' && employee.branchId === viewer.branchId;
  return viewer.id === employee.id;
}

/**
 * Who may modify an evaluation. The document says «un usuario autorizado»; in the prototype the
 * admin and the current manager of the employee can. The final rule is still to be defined.
 */
export function canModifyEvaluation(viewer: User, employee: User): boolean {
  return viewer.role === 'admin' || (viewer.role === 'manager' && employee.branchId === viewer.branchId);
}

export function canCapture(viewer: User): boolean {
  return viewer.role === 'admin' || viewer.role === 'manager';
}
