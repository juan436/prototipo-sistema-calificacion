import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { LogoPlaceholder } from './LogoPlaceholder';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <DemoBanner />
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <LogoPlaceholder />
          <Link to="/" className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">Sistema de Evaluación y Seguimiento</div>
            <div className="truncate text-sm text-slate-500">Grupo Inolite · Ferreisla y Ferretería La Gloria</div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
