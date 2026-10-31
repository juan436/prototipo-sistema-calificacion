import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import type { Role } from '../mock/types';
import { useCurrentUser } from '../store/useDemoStore';

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <NoPermission />;
  return <>{children}</>;
}

export function NoPermission({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 p-8 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="mt-3 text-lg font-semibold text-slate-900">No tienes permiso para ver esta pantalla</h1>
      <p className="mt-2 text-slate-600">{message ?? 'Tu tipo de usuario no tiene acceso a esta información.'}</p>
    </div>
  );
}
