import type { BranchId, FormDefinition, MockDb, Rating, User } from '../mock/types';

export const RATINGS: { id: Rating; label: string; emoji: string; color: string }[] = [
  { id: 'excelente', label: 'Excelente', emoji: '😄', color: '#2f7f82' },
  { id: 'bien', label: 'Bien', emoji: '🙂', color: '#6fa8a9' },
  { id: 'regular', label: 'Regular', emoji: '😐', color: '#c9b37e' },
  { id: 'mal', label: 'Mal', emoji: '🙁', color: '#d98a6a' },
  { id: 'muy_mal', label: 'Muy mal', emoji: '😞', color: '#b94a48' },
];

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
