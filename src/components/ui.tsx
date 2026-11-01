import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Clock3, FlaskConical, Info, X } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'xl';

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700 disabled:bg-slate-300',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-accent-700 hover:bg-accent-50',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
};

const sizeClass: Record<Size, string> = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-5 text-xl',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${extra}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ children, className = '', title, actions }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'accent' | 'green' | 'red' | 'amber' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    accent: 'bg-accent-50 text-accent-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-800',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** Visible mark for anything the client's document does not define. */
export function ToDefine({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
      <Clock3 className="h-3.5 w-3.5" aria-hidden />
      Por definir{children ? <>: <span className="font-normal">{children}</span></> : null}
    </span>
  );
}

export function ExampleTag({ children = 'Preguntas de ejemplo; las reales las entrega el cliente' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

export function Note({ children, tone = 'info', className = '' }: { children: ReactNode; tone?: 'info' | 'warning'; className?: string }) {
  const tones = {
    info: 'border-accent-100 bg-accent-50 text-accent-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return (
    <div className={`flex gap-2 rounded-xl border px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children, optional }: { label: string; hint?: ReactNode; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {optional && <span className="font-normal text-slate-400">(opcional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100 disabled:bg-slate-50 disabled:text-slate-500';

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-6 no-print" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`my-4 w-full rounded-2xl bg-white shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">{children}</div>;
}

export function GradeBadge({ grade }: { grade: number | null | undefined }) {
  if (grade === null || grade === undefined) return <span className="text-slate-400">—</span>;
  const tone = grade >= 8 ? 'bg-emerald-50 text-emerald-700' : grade >= 6 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700';
  return <span className={`inline-flex min-w-[3rem] justify-center rounded-lg px-2 py-0.5 font-semibold tabular-nums ${tone}`}>{grade.toFixed(1)}</span>;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[560px] text-left text-sm">{children}</table>
    </div>
  );
}

export const th = 'border-b border-slate-200 px-3 py-2 font-medium text-slate-500';
export const td = 'border-b border-slate-100 px-3 py-2.5 align-top';
