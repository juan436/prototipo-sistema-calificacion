import type { BranchId, Position, User } from './types';

// Fictitious, generic names. No real people.

function employee(id: string, name: string, position: Position, branchId: BranchId, from = '2025-01-15'): User {
  const email = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.');
  return {
    id,
    name,
    email: `${email}@ejemplo.com`,
    role: 'employee',
    position,
    branchId,
    active: true,
    branchHistory: [{ branchId, from }],
  };
}

export const ADMIN_ID = 'u-admin';
export const MANAGER_FERREISLA_ID = 'u-mgr-fi';
export const MANAGER_LAGLORIA_ID = 'u-mgr-lg';
/** Employee moved from Ferreisla to La Gloria; keeps the whole history. */
export const TRANSFERRED_EMPLOYEE_ID = 'e05';
export const TRANSFER_DATE = '2026-08-16';
/** Employee whose file has annexes (praise, complaint, disciplinary report and act). */
export const ANNEX_EMPLOYEE_ID = 'e09';
/** Employee with a modified evaluation. */
export const MODIFIED_EMPLOYEE_ID = 'e02';

export function createUsers(): User[] {
  const transferred = employee(TRANSFERRED_EMPLOYEE_ID, 'Daniel Ortega', 'Ventas', 'lagloria');
  transferred.branchHistory = [
    { branchId: 'ferreisla', from: '2024-03-01' },
    { branchId: 'lagloria', from: TRANSFER_DATE },
  ];

  return [
    {
      id: ADMIN_ID,
      name: 'Laura Castillo',
      email: 'laura.castillo@ejemplo.com',
      role: 'admin',
      position: 'Administración',
      branchId: null,
      active: true,
      branchHistory: [],
    },
    { ...employee(MANAGER_FERREISLA_ID, 'Patricia Méndez', 'Gerencia', 'ferreisla'), role: 'manager' },
    { ...employee(MANAGER_LAGLORIA_ID, 'Jorge Salinas', 'Gerencia', 'lagloria'), role: 'manager' },
    employee('e01', 'Ana Torres', 'Ventas', 'ferreisla'),
    employee('e02', 'Mariana López', 'Caja', 'ferreisla'),
    employee('e03', 'Luis Ramírez', 'Caja', 'ferreisla'),
    employee('e04', 'Sofía Herrera', 'Ventas', 'ferreisla'),
    transferred,
    employee('e06', 'Ricardo Navarro', 'Caja', 'ferreisla'),
    employee('e07', 'Valeria Cruz', 'Ventas', 'ferreisla'),
    employee('e08', 'Fernanda Ruiz', 'Ventas', 'lagloria'),
    employee('e09', 'Carlos Vega', 'Ventas', 'lagloria'),
    employee('e10', 'Miguel Ángel Rosas', 'Caja', 'lagloria'),
    employee('e11', 'Gabriela Ponce', 'Ventas', 'lagloria'),
    employee('e12', 'Héctor Aguilar', 'Caja', 'lagloria'),
    employee('e13', 'Paola Medina', 'Caja', 'lagloria'),
    employee('e14', 'Andrés Salazar', 'Ventas', 'lagloria'),
    employee('e15', 'Rocío Fuentes', 'Administrativo', 'ferreisla'),
    employee('e16', 'Tomás Ibarra', 'Administrativo', 'lagloria'),
  ];
}
