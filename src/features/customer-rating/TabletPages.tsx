import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, TabletSmartphone } from 'lucide-react';
import { DemoBanner } from '../../components/DemoBanner';
import { RatingFace } from '../../components/RatingFace';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { Button, inputClass, Note } from '../../components/ui';
import { nowIso } from '../../lib/dates';
import { branchName, RATINGS } from '../../lib/lookup';
import type { Rating, Tablet } from '../../mock/types';
import { useDb, useDemoStore } from '../../store/useDemoStore';
import { currentSession } from '../../lib/cashier';
import { CashierCorner, CashierPicker, startCashierSession } from './CashierSession';
import { ConnectionStatus, OfflineToggle } from './Offline';
import { saveFeedback } from './saveFeedback';

const RESET_SECONDS = 8;

function TabletShell({ children, branch, corner }: { children: ReactNode; branch?: string; corner?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DemoBanner />
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <LogoPlaceholder size="lg" />
        {branch && <div className="text-xl font-semibold text-slate-700">{branch}</div>}
        {corner}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-6 sm:pb-10">{children}</main>
      <footer className="px-6 pb-4 text-center text-xs text-slate-400">
        <Link to="/aviso-de-privacidad" className="hover:underline">
          Aviso de privacidad
        </Link>
        <span className="mx-2">·</span>
        <Link to="/" className="hover:underline">
          Salir de la vista de tableta (solo en la demo)
        </Link>
        {corner && (
          <>
            <span className="mx-2">·</span>
            <OfflineToggle />
          </>
        )}
      </footer>
      {corner && <ConnectionStatus />}
    </div>
  );
}

export function useDeviceTablet(): Tablet | null {
  const db = useDb();
  const deviceTabletId = useDemoStore((s) => s.deviceTabletId);
  const tablet = db.tablets.find((t) => t.id === deviceTabletId);
  return tablet && tablet.status === 'authorized' ? tablet : null;
}

/** Entry of the tablet route: activation the first time, form afterwards. */
export function TabletEntry() {
  const deviceTabletId = useDemoStore((s) => s.deviceTabletId);
  const tablet = useDeviceTablet();
  if (tablet) return <Navigate to="/tableta/calificar" replace />;
  if (deviceTabletId) return <NotAuthorized />;
  return <Navigate to="/tableta/activar" replace />;
}

export function NotAuthorized() {
  const navigate = useNavigate();
  return (
    <TabletShell>
      <TabletSmartphone className="h-16 w-16 text-slate-300" />
      <h1 className="mt-4 text-center text-3xl font-semibold text-slate-800">Esta tableta no está autorizada</h1>
      <p className="mt-3 max-w-md text-center text-lg text-slate-500">
        Pide al personal de la tienda que la active con un código del administrador.
      </p>
      <Button size="lg" variant="secondary" className="mt-8" onClick={() => navigate('/tableta/activar')}>
        <KeyRound className="h-5 w-5" /> Activar con un código (personal)
      </Button>
    </TabletShell>
  );
}

export function ActivationPage() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const setDeviceTablet = useDemoStore((s) => s.setDeviceTablet);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [activatedId, setActivatedId] = useState<string | null>(null);
  const available = db.activationCodes.filter((c) => !c.usedAt);
  const activated = db.tablets.find((t) => t.id === activatedId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    const found = db.activationCodes.find((c) => c.code === normalized);
    if (!found) return setError('Ese código no existe. Revísalo o pide uno nuevo al administrador.');
    if (found.usedAt) return setError('Ese código ya se usó. Cada código sirve una sola vez.');
    const tabletId = `t-${Date.now().toString(36)}`;
    update((d) => {
      d.tablets.push({
        id: tabletId,
        name: `${found.register} · ${branchName(d, found.branchId).replace('Ferretería ', '')}`,
        register: found.register,
        pin: found.pin,
        branchId: found.branchId,
        status: 'authorized',
        createdAt: nowIso(),
      });
      const c = d.activationCodes.find((x) => x.code === found.code)!;
      c.usedAt = nowIso();
      c.tabletId = tabletId;
    });
    setDeviceTablet(tabletId);
    setActivatedId(tabletId);
  };

  if (activated) {
    return (
      <TabletShell branch={branchName(db, activated.branchId)}>
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">¿Quién está en {activated.register}?</h1>
          <p className="mb-6 mt-2 text-center text-slate-500">
            Las calificaciones de esta caja quedan a nombre del cajero en sesión hasta que alguien lo cambie.
          </p>
          <CashierPicker
            tablet={activated}
            confirmLabel="Empezar"
            onConfirm={(id) => {
              startCashierSession(activated.id, id);
              navigate('/tableta/calificar', { replace: true });
            }}
          />
          <div className="mt-3 text-center">
            <button type="button" className="text-sm text-slate-500 hover:underline" onClick={() => navigate('/tableta/calificar', { replace: true })}>
              Elegir después
            </button>
          </div>
        </div>
      </TabletShell>
    );
  }

  return (
    <TabletShell>
      <form onSubmit={submit} className="w-full max-w-md">
        <KeyRound className="mx-auto h-12 w-12 text-accent-600" />
        <h1 className="mt-4 text-center text-2xl font-semibold text-slate-900 sm:text-3xl">Escribe el código de activación</h1>
        <p className="mt-2 text-center text-slate-500">Lo genera el administrador. Solo se hace una vez por tableta.</p>
        <input
          className={`${inputClass} mt-6 py-4 text-center font-mono text-2xl uppercase tracking-widest`}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError('');
          }}
          placeholder="XX-XXXXX"
          autoFocus
          aria-label="Código de activación"
        />
        {error && <p className="mt-2 text-center text-sm font-medium text-red-700">{error}</p>}
        <Button type="submit" size="xl" className="mt-4 w-full" disabled={!code.trim()}>
          Activar tableta
        </Button>
        <Note className="mt-6">
          <strong>Nota para la demo:</strong> el cliente nunca ve ni usa un código; solo el personal, una vez por tableta.{' '}
          {available.length ? (
            <>
              Código de ejemplo disponible:{' '}
              {available.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCode(c.code)}
                  className="mr-1 rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-accent-800 underline-offset-2 hover:underline"
                >
                  {c.code}
                </button>
              ))}
              ({available.map((c) => `${c.register} de ${branchName(db, c.branchId)}`).join(', ')}). También funciona cualquier código que generes
              en el panel, en Tabletas.
            </>
          ) : (
            'No hay códigos disponibles: genera uno en el panel del administrador, en Tabletas.'
          )}
        </Note>
      </form>
    </TabletShell>
  );
}

type Step = 'rating' | 'excellent' | 'complaint' | 'thanks';

export function CustomerFormPage() {
  const db = useDb();
  const tablet = useDeviceTablet();
  const openEmail = useDemoStore((s) => s.openEmail);
  const openEmailId = useDemoStore((s) => s.openEmailId);
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [phone, setPhone] = useState('');
  const [alertId, setAlertId] = useState<string | null>(null);
  const [pendingSend, setPendingSend] = useState(false);
  const [seconds, setSeconds] = useState(RESET_SECONDS);

  const restart = () => {
    setStep('rating');
    setRating(null);
    setComment('');
    setWhatHappened('');
    setPhone('');
    setAlertId(null);
    setPendingSend(false);
    setSeconds(RESET_SECONDS);
  };

  useEffect(() => {
    if (step !== 'thanks' || openEmailId) return;
    if (seconds <= 0) {
      restart();
      return;
    }
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [step, seconds, openEmailId]);

  if (!tablet) return <NotAuthorized />;
  const branch = db.branches.find((b) => b.id === tablet.branchId)!;
  const corner = <CashierCorner tablet={tablet} />;
  const cashier = db.users.find((u) => u.id === currentSession(db, tablet.id)?.employeeId);

  const finish = (r: Rating, extra: Parameters<typeof saveFeedback>[1] = { rating: r }) => {
    const result = saveFeedback(tablet, { ...extra, rating: r });
    setAlertId(result.alertId);
    setPendingSend(result.pending);
    setSeconds(RESET_SECONDS);
    setStep('thanks');
  };

  const choose = (r: Rating) => {
    setRating(r);
    if (r === 'excelente') setStep('excellent');
    else if (r === 'mal' || r === 'muy_mal') setStep('complaint');
    else finish(r);
  };

  if (step === 'rating') {
    return (
      <TabletShell branch={branch.name} corner={corner}>
        <h1 className="text-center text-2xl font-semibold text-slate-900 sm:text-4xl">¿Cómo fue tu experiencia en {branch.questionName}?</h1>
        <div className="mt-8 grid w-full max-w-4xl grid-cols-5 gap-2 sm:mt-12 sm:gap-4">
          {RATINGS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => choose(r.id)}
              className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-3 transition hover:bg-slate-50 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-200 sm:gap-3 sm:py-5"
            >
              <RatingFace rating={r.id} className="aspect-square w-full max-w-[128px] transition group-hover:scale-105" />
              <span className="whitespace-nowrap text-xs font-semibold text-slate-700 min-[400px]:text-sm sm:text-xl">{r.label}</span>
            </button>
          ))}
        </div>
      </TabletShell>
    );
  }

  if (step === 'excellent') {
    const send = (praiseCashier: boolean) => finish('excelente', { rating: 'excelente', praiseCashier, comment });
    return (
      <TabletShell branch={branch.name} corner={corner}>
        <div className="w-full max-w-2xl">
          <h1 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
            {cashier ? '¡Qué gusto! ¿Quieres felicitar a quien te atendió?' : '¡Qué gusto!'}
          </h1>
          <label className="mt-8 block">
            <span className="text-lg font-medium text-slate-700">¿Quieres dejarnos un comentario? (opcional)</span>
            <textarea className={`${inputClass} mt-2 text-lg`} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          {cashier ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button size="xl" variant="secondary" onClick={() => send(false)}>
                No, gracias
              </Button>
              <Button size="xl" onClick={() => send(true)}>
                Sí
              </Button>
            </div>
          ) : (
            <Button size="xl" className="mt-6 w-full" onClick={() => send(false)}>
              Enviar
            </Button>
          )}
          <BackLink onClick={restart} />
        </div>
      </TabletShell>
    );
  }

  if (step === 'complaint') {
    return (
      <TabletShell branch={branch.name} corner={corner}>
        <div className="w-full max-w-3xl">
          <h1 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">Lamentamos que tu experiencia no fuera buena</h1>
          <p className="mt-2 text-center text-lg text-slate-500">
            Si quieres, cuéntanos qué pasó. <strong>Ningún dato es obligatorio</strong> y puedes enviar sin dar datos personales.
          </p>
          <label className="mt-6 block">
            <span className="text-lg font-medium text-slate-700">¿Qué sucedió?</span>
            <textarea className={`${inputClass} mt-2 text-lg`} rows={3} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} />
          </label>
          <label className="mt-5 block">
            <span className="text-lg font-medium text-slate-700">Teléfono de contacto</span>
            <input type="tel" inputMode="tel" className={`${inputClass} mt-2 text-lg`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="mt-1 block text-sm text-slate-500">
              Solo si quieres que te contactemos. Consulta el{' '}
              <Link to="/aviso-de-privacidad" className="text-accent-700 underline">
                aviso de privacidad
              </Link>
              .
            </span>
          </label>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button size="xl" variant="secondary" onClick={() => finish(rating!)}>
              Terminar sin enviar datos
            </Button>
            <Button size="xl" onClick={() => finish(rating!, { rating: rating!, complaint: { whatHappened, phone } })}>
              Enviar
            </Button>
          </div>
          <BackLink onClick={restart} />
        </div>
      </TabletShell>
    );
  }

  return (
    <TabletShell branch={branch.name} corner={corner}>
      <CheckCircle2 className="h-20 w-20 text-accent-600" />
      <h1 className="mt-4 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">¡Gracias por tu opinión!</h1>
      <p className="mt-3 text-center text-xl text-slate-500">Nos ayuda a atenderte mejor.</p>
      <p className="mt-8 text-slate-400">La pantalla vuelve al inicio en {seconds} s</p>
      <Button variant="ghost" className="mt-2" onClick={restart}>
        Volver al inicio ahora
      </Button>
      {pendingSend && (
        <Note tone="warning" className="mt-8 max-w-lg">
          <strong>Solo para la demo:</strong> no hay conexión. La calificación quedó en espera con su fecha y hora, y se envía sola en
          cuanto vuelva el internet. El cliente no tiene que hacer nada.
        </Note>
      )}
      {alertId && (
        <Note tone="warning" className="mt-8 max-w-lg">
          <strong>Solo para la demo:</strong> esta respuesta generó una alerta inmediata por correo al administrador.{' '}
          <button type="button" className="font-semibold underline" onClick={() => openEmail(alertId)}>
            Ver la vista previa del correo
          </button>
        </Note>
      )}
    </TabletShell>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-4 text-center">
      <button type="button" onClick={onClick} className="text-slate-500 underline-offset-2 hover:underline">
        Cambiar mi respuesta
      </button>
    </div>
  );
}
