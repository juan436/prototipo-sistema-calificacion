import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  FileWarning,
  FolderOpen,
  Lock,
  Mail,
  Menu,
  MessageSquareHeart,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Tablet,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../mock/types';
import { branchName, roleLabel } from '../lib/lookup';
import { useCurrentUser, useDb, useDemoStore } from '../store/useDemoStore';
import { DemoBanner } from './DemoBanner';
import { LogoPlaceholder } from './LogoPlaceholder';
import { Button, Modal } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: '/app/panel', label: 'Panel y estadísticas', icon: BarChart3 },
    { to: '/app/clientes', label: 'Calificaciones de clientes', icon: MessageSquareHeart },
    { to: '/app/encuesta', label: 'Encuesta anónima', icon: Lock },
    { to: '/app/desempeno', label: 'Desempeño de empleados', icon: ClipboardCheck },
    { to: '/app/disciplinario', label: 'Reportes disciplinarios', icon: FileWarning },
    { to: '/app/formularios', label: 'Formularios', icon: Settings2 },
    { to: '/app/usuarios', label: 'Usuarios', icon: Users },
    { to: '/app/tabletas', label: 'Tabletas', icon: Tablet },
    { to: '/app/correos', label: 'Correos', icon: Mail },
    { to: '/app/seguridad', label: 'Seguridad y conservación', icon: ShieldCheck },
  ],
  manager: [
    { to: '/app/desempeno', label: 'Mis empleados', icon: Users },
    { to: '/app/desempeno/nueva', label: 'Evaluar desempeño', icon: ClipboardCheck },
    { to: '/app/disciplinario', label: 'Reportes disciplinarios', icon: FileWarning },
  ],
  employee: [
    { to: '/app/mi-expediente', label: 'Mi expediente', icon: FolderOpen },
    { to: '/app/encuesta-mensual', label: 'Evaluación del mes', icon: Lock },
  ],
};

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/app/panel',
  manager: '/app/desempeno',
  employee: '/app/mi-expediente',
};

export function AppLayout() {
  const user = useCurrentUser();
  const db = useDb();
  const logout = useDemoStore((s) => s.logout);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!user) return <Navigate to="/" replace />;
  const items = NAV[user.role];

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/app/desempeno'}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              isActive ? 'bg-accent-50 text-accent-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden />
          {item.label}
        </NavLink>
      ))}
      {user.role === 'admin' && (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-5 w-5 shrink-0" aria-hidden />
          Restablecer datos de la demo
        </button>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white">
      <DemoBanner />
      <header className="sticky top-[33px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <LogoPlaceholder />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">Sistema de Evaluación y Seguimiento</div>
            <div className="truncate text-xs text-slate-500">Grupo Inolite</div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-slate-800">
              <UserRound className="h-4 w-4 text-slate-400" />
              {user.name}
            </div>
            <div className="text-xs text-slate-500">
              {roleLabel(user)}
              {user.branchId ? ` · ${branchName(db, user.branchId)}` : ' · Ambas sucursales'}
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Cambiar de usuario
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block no-print">
          <div className="sticky top-[110px]">{nav}</div>
        </aside>
        {menuOpen && (
          <div className="fixed inset-0 top-[98px] z-30 overflow-y-auto bg-white px-4 py-4 lg:hidden no-print">
            <div className="mb-4 text-sm text-slate-600 sm:hidden">
              {user.name} · {roleLabel(user)}
            </div>
            {nav}
          </div>
        )}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Restablecer datos de la demo">
        <p className="text-slate-600">
          Se borra todo lo que se capturó en este navegador y se vuelven a cargar los datos de ejemplo. La autorización de la
          tableta en este navegador también se borra.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              resetDemo();
              setConfirmReset(false);
              navigate(HOME_BY_ROLE.admin);
            }}
          >
            Restablecer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
