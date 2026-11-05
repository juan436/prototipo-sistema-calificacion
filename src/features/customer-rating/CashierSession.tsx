import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, Search, UserRound } from 'lucide-react';
import { Button, inputClass, Modal, Note } from '../../components/ui';
import { currentSession, isCashier } from '../../lib/cashier';
import { formatDateTime, nowIso } from '../../lib/dates';
import type { Tablet } from '../../mock/types';
import { useDb, useDemoStore } from '../../store/useDemoStore';

/** Starts a new cashier session on a tablet. The previous one ends at that moment. */
export function startCashierSession(tabletId: string, employeeId: string) {
  useDemoStore.getState().update((d) => {
    d.cashierSessions.push({ id: `cs-${Date.now().toString(36)}`, tabletId, employeeId, startedAt: nowIso() });
  });
}

/** Searchable list of the cashiers of the tablet's branch. */
export function CashierPicker({
  tablet,
  onConfirm,
  confirmLabel = 'Confirmar',
}: {
  tablet: Tablet;
  onConfirm: (employeeId: string) => void;
  confirmLabel?: string;
}) {
  const db = useDb();
  const current = currentSession(db, tablet.id)?.employeeId;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const cashiers = db.users.filter((u) => isCashier(u) && u.active && u.branchId === tablet.branchId);
  const normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const shown = cashiers.filter((c) => normalize(c.name).includes(normalize(query)));

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Buscar cajero"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar cajero"
          autoFocus
        />
      </label>
      <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto" role="listbox" aria-label="Cajeros de la sucursal">
        {shown.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected === c.id}
              onClick={() => setSelected(c.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left ${
                selected === c.id ? 'border-accent-600 bg-accent-50 text-accent-800' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium">{c.name}</span>
              {current === c.id && <span className="text-xs text-slate-500">En sesión ahora</span>}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-1 py-3 text-sm text-slate-500">No hay cajeros con ese nombre en esta sucursal.</li>}
      </ul>
      <Button size="lg" className="mt-4 w-full" disabled={!selected} onClick={() => onConfirm(selected)}>
        {confirmLabel}
      </Button>
    </div>
  );
}

/**
 * Discreet corner menu: shows the cashier in session and lets staff change it with the tablet PIN.
 * The customer never needs it.
 */
export function CashierCorner({ tablet }: { tablet: Tablet }) {
  const db = useDb();
  const session = currentSession(db, tablet.id);
  const cashier = session && db.users.find((u) => u.id === session.employeeId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState<'pin' | 'pick' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const closeFlow = () => {
    setStep(null);
    setPin('');
    setError('');
  };

  const checkPin = (e: FormEvent) => {
    e.preventDefault();
    if (pin === tablet.pin) {
      setError('');
      setStep('pick');
    } else {
      setError('PIN incorrecto.');
      setPin('');
    }
  };

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        aria-expanded={menuOpen}
      >
        {tablet.register} · {cashier ? cashier.name : 'Sin cajero en sesión'}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500">Cajero en sesión · {tablet.register}</div>
              <div className="truncate font-medium text-slate-900">{cashier ? cashier.name : 'Nadie todavía'}</div>
              {session && <div className="text-xs text-slate-500">Desde {formatDateTime(session.startedAt)}</div>}
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => {
              setMenuOpen(false);
              setStep('pin');
            }}
          >
            Cambiar cajero
          </Button>
        </div>
      )}

      <Modal open={step !== null} onClose={closeFlow} size="sm" title={step === 'pick' ? 'Elige al cajero' : 'PIN de la tableta'}>
        {step === 'pin' && (
          <form onSubmit={checkPin}>
            <p className="text-sm text-slate-600">Escribe el PIN de 4 dígitos de esta tableta.</p>
            <input
              className={`${inputClass} mt-4 py-4 text-center font-mono text-3xl tracking-[0.6em]`}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              aria-label="PIN"
              autoFocus
            />
            {error && <p className="mt-2 text-center text-sm font-medium text-red-700">{error}</p>}
            <Button type="submit" size="lg" className="mt-4 w-full" disabled={pin.length !== 4}>
              Continuar
            </Button>
            <Note className="mt-4">
              <strong>Nota para la demo:</strong> el PIN de esta tableta es <span className="font-mono font-semibold">{tablet.pin}</span>. Es
              uno solo por tableta y lo define el administrador al agregarla.
            </Note>
          </form>
        )}
        {step === 'pick' && (
          <>
            <p className="mb-3 text-sm text-slate-600">
              Desde ahora, las calificaciones de {tablet.register} quedan a nombre del cajero que elijas.
            </p>
            <CashierPicker
              tablet={tablet}
              onConfirm={(id) => {
                startCashierSession(tablet.id, id);
                closeFlow();
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
