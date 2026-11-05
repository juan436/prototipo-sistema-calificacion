import type { BranchId, FormDefinition, MockDb, Rating, User } from '../mock/types';

/**
 * Color per rating, requested by the client: dark green, light green, yellow, orange, red.
 * `color` is the solid color (tablet buttons, charts); `text` is the readable text color on top of it;
 * `soft` and `ink` are the tinted background and text used in badges.
 */
export const RATINGS: { id: Rating; label: string; color: string; text: string; soft: string; ink: string }[] = [
  { id: 'excelente', label: 'Excelente', color: '#15803d', text: '#ffffff', soft: '#dcfce7', ink: '#14532d' },
  { id: 'bien', label: 'Bien', color: '#86d97b', text: '#14361a', soft: '#ecfccb', ink: '#3f6212' },
  { id: 'regular', label: 'Regular', color: '#facc15', text: '#422006', soft: '#fef9c3', ink: '#713f12' },
  { id: 'mal', label: 'Mal', color: '#f97316', text: '#ffffff', soft: '#ffedd5', ink: '#9a3412' },
  { id: 'muy_mal', label: 'Muy mal', color: '#dc2626', text: '#ffffff', soft: '#fee2e2', ink: '#991b1b' },
];

export function ratingInfo(rating: Rating) {
  return RATINGS.find((r) => r.id === rating)!;
}

export const BRANCH_COLORS: Record<BranchId, string> = {
  ferreisla: '#2f7f82',
  lagloria: '#c08a3e',
};

export function ratingLabel(rating: Rating): string {
  return RATINGS.find((r) => r.id === rating)!.label;
}

export function branchName(db: MockDb, id: BranchId | null | undefined): string {
  if (!id) return 'Ambas sucursales';
  return db.branches.find((b) => b.id === id)?.name ?? id;
}

export function userName(db: MockDb, id: string | undefined): string {
  if (!id) return 'Sin especificar';
  return db.users.find((u) => u.id === id)?.name ?? 'Usuario desconocido';
}

export function getUser(db: MockDb, id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function getForm(db: MockDb, id: string): FormDefinition {
  return db.forms.find((f) => f.id === id)!;
}

export function roleLabel(user: User): string {
  if (user.role === 'admin') return 'Administrador general';
  if (user.role === 'manager') return 'Gerente';
  return 'Empleado';
}
