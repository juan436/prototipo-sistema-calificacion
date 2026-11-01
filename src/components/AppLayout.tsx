import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  FileWarning,
  FolderOpen,
  LogOut,
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
import { Button, Modal, useScrollLock } from './ui';

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
  useScrollLock(menuOpen);

  // Close the mobile menu if the screen grows to desktop size.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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
          onClick={() => {
            setMenuOpen(false);
            setConfirmReset(true);
          }}
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
      <div className="sticky top-0 z-40 no-print">
        <DemoBanner />
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
            <button
              type="button"
              className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
            <LogoPlaceholder />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">Sistema de Evaluación y Seguimiento</div>
              <div className="truncate text-xs text-slate-500">Grupo Inolite</div>
            </div>
            <div className="hidden min-w-0 text-right md:block">
              <div className="flex items-center justify-end gap-1.5 truncate text-sm font-medium text-slate-800">
                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                {user.name}
              </div>
              <div className="truncate text-xs text-slate-500">
                {roleLabel(user)}
                {user.branchId ? ` · ${branchName(db, user.branchId)}` : ' · Ambas sucursales'}
              </div>
            </div>
            <Button
              variant="secondary"
              className="shrink-0 px-3 sm:px-4"
              aria-label="Cambiar de usuario"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cambiar de usuario</span>
            </Button>
          </div>
        </header>
      </div>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
        <aside className="hidden w-60 shrink-0 lg:block no-print">
          <div className="sticky top-[124px]">{nav}</div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-xl">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
              <LogoPlaceholder />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{user.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {roleLabel(user)}
                  {user.branchId ? ` · ${branchName(db, user.branchId)}` : ' · Ambas sucursales'}
                </div>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">{nav}</div>
          </div>
        </div>
      )}

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Restablecer datos de la demo"
        size="sm"
        footer={
          <>
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
          </>
        }
      >
        <p className="text-slate-600">
          Se borra todo lo que se capturó en este navegador y se vuelven a cargar los datos de ejemplo. La autorización de la
          tableta en este navegador también se borra.
        </p>
      </Modal>
    </div>
  );
}
