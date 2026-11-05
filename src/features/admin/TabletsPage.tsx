import { useState } from 'react';
import { ExternalLink, History, Plus } from 'lucide-react';
import { RatingBadge } from '../../components/RatingBadge';
import { Badge, Button, Card, Field, inputClass, Modal, Note, PageHeader, Table, td, th, ToDefine, Select } from '../../components/ui';
import { currentSession, satisfiedPct, turnsOf } from '../../lib/cashier';
import { formatDateTime, nowIso } from '../../lib/dates';
import { branchName, userName } from '../../lib/lookup';
import type { BranchId } from '../../mock/types';
import { useDb, useDemoStore } from '../../store/useDemoStore';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(branchId: BranchId, existing: string[]): string {
  for (;;) {
    let body = '';
    for (let i = 0; i < 5; i++) body += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    const code = `${branchId === 'ferreisla' ? 'FI' : 'LG'}-${body}`;
    if (!existing.includes(code)) return code;
  }
}

const randomPin = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0');

export const tabletRouteUrl = () => `${window.location.origin}${window.location.pathname}#/tableta`;

export function TabletsPage() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const deviceTabletId = useDemoStore((s) => s.deviceTabletId);
  const [adding, setAdding] = useState(false);
  const [branchId, setBranchId] = useState<BranchId>('ferreisla');
  const [register, setRegister] = useState('');
  const [pin, setPin] = useState('');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [turnsOfTablet, setTurnsOfTablet] = useState<string | null>(null);

  const pending = db.activationCodes.filter((c) => !c.usedAt);
  const turnsTablet = db.tablets.find((t) => t.id === turnsOfTablet);

  const suggestRegister = (b: BranchId) => {
    const used = db.tablets.filter((t) => t.branchId === b && t.status === 'authorized').length + pending.filter((c) => c.branchId === b).length;
    return `Caja ${used + 1}`;
  };

  const openAdd = () => {
    setNewCode(null);
    setRegister(suggestRegister(branchId));
    setPin(randomPin());
    setAdding(true);
  };

  const create = () => {
    const code = generateCode(branchId, db.activationCodes.map((c) => c.code));
    update((d) => {
      d.activationCodes.push({ code, branchId, register: register.trim(), pin, createdAt: nowIso() });
    });
    setNewCode(code);
  };

  return (
    <>
      <PageHeader
        title="Tabletas"
        subtitle="Cada caja tiene su propia tableta. Solo las autorizadas muestran el formulario de clientes."
        actions={
          <>
            <a href={tabletRouteUrl()} target="_blank" rel="noreferrer" className="inline-flex">
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" /> Abrir la ruta de tableta
              </Button>
            </a>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Agregar tableta
            </Button>
          </>
        }
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <th className={th}>Caja</th>
              <th className={th}>Sucursal</th>
              <th className={th}>Cajero en sesión</th>
              <th className={th}>PIN</th>
              <th className={th}>Estado</th>
              <th className={th}>Calificaciones</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {db.tablets.map((t) => {
              const session = currentSession(db, t.id);
              return (
                <tr key={t.id}>
                  <td className={td}>
                    <div className="font-medium text-slate-800">{t.register}</div>
                    <div className="text-xs text-slate-500">Alta {formatDateTime(t.createdAt)}</div>
                    {t.id === deviceTabletId && <div className="text-xs text-accent-700">Es este navegador (en la demo)</div>}
                  </td>
                  <td className={td}>{branchName(db, t.branchId)}</td>
                  <td className={td}>
                    {session ? (
                      <>
                        <div>{userName(db, session.employeeId)}</div>
                        <div className="text-xs text-slate-500">desde {formatDateTime(session.startedAt)}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">Nadie</span>
                    )}
                  </td>
                  <td className={`${td} font-mono`}>{t.pin}</td>
                  <td className={td}>{t.status === 'authorized' ? <Badge tone="green">Autorizada</Badge> : <Badge tone="red">Revocada</Badge>}</td>
                  <td className={`${td} tabular-nums`}>{db.customerFeedback.filter((f) => f.tabletId === t.id).length}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Button variant="ghost" onClick={() => setTurnsOfTablet(t.id)}>
                      <History className="h-4 w-4" /> Turnos
                    </Button>
                    {t.status === 'authorized' && (
                      <Button variant="danger" onClick={() => setRevoking(t.id)}>
                        Desautorizar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <p className="mt-3 text-sm text-slate-500">
          El cajero en sesión se cambia desde la propia tableta, con el PIN de esa tableta. La sesión no se cierra sola: el turno
          es el tiempo entre un cambio de cajero y el siguiente.
        </p>
      </Card>

      <Card className="mt-6" title="Códigos generados sin usar">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No hay códigos pendientes.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {pending.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-mono text-base font-semibold tracking-wider">{c.code}</span>
                <span className="text-slate-500">
                  {c.register} · {branchName(db, c.branchId)} · PIN <span className="font-mono">{c.pin}</span> · generado {formatDateTime(c.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
          Cada código es de un solo uso. <ToDefine>vigencia del código</ToDefine>
          <ToDefine>qué pasa si la tableta pierde internet</ToDefine>
        </div>
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Agregar tableta">
        {newCode ? (
          <div className="text-center">
            <p className="text-slate-600">Escribe este código en la tableta, en la ruta de tableta:</p>
            <div className="my-5 rounded-2xl bg-slate-50 py-5 font-mono text-4xl font-semibold tracking-widest text-slate-900">{newCode}</div>
            <p className="text-sm text-slate-500">
              {register} de {branchName(db, branchId)} · PIN de la tableta <span className="font-mono font-semibold">{pin}</span>. Al usarlo,
              el código queda consumido.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a href={tabletRouteUrl()} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4" /> Abrir la ruta de tableta
                </Button>
              </a>
              <Button onClick={() => setAdding(false)}>Listo</Button>
            </div>
          </div>
        ) : (
          <>
            <Field label="Sucursal de la tableta">
              <Select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value as BranchId);
                  setRegister(suggestRegister(e.target.value as BranchId));
                }}
              >
                {db.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Caja">
                <input className={inputClass} value={register} onChange={(e) => setRegister(e.target.value)} />
              </Field>
              <Field label="PIN de la tableta" hint="4 dígitos. Sirve para cambiar el cajero en sesión.">
                <input
                  className={`${inputClass} font-mono tracking-widest`}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </Field>
            </div>
            <Note className="mt-4">Se genera un código de un solo uso. El personal lo escribe una vez en la tableta; el cliente nunca lo ve.</Note>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
              <Button onClick={create} disabled={!register.trim() || pin.length !== 4}>
                Generar código
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!turnsTablet} onClose={() => setTurnsOfTablet(null)} size="lg" title={turnsTablet ? `Turnos · ${turnsTablet.name}` : 'Turnos'}>
        {turnsTablet && <TurnsList tabletId={turnsTablet.id} />}
      </Modal>

      <Modal open={!!revoking} onClose={() => setRevoking(null)} title="Desautorizar tableta"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevoking(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                update((d) => {
                  const t = d.tablets.find((x) => x.id === revoking);
                  if (t) t.status = 'revoked';
                });
                setRevoking(null);
              }}
            >
              Desautorizar
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          La tableta deja de funcionar y vuelve a mostrar «Esta tableta no está autorizada». Las calificaciones que ya se
          registraron se conservan.
        </p>
      </Modal>
    </>
  );
}

function TurnsList({ tabletId }: { tabletId: string }) {
  const db = useDb();
  const [limit, setLimit] = useState(20);
  const turns = turnsOf(db, tabletId);
  if (turns.length === 0) return <p className="text-sm text-slate-500">Esta tableta todavía no ha tenido cajero en sesión.</p>;
  return (
    <>
      <p className="mb-3 text-sm text-slate-500">
        Un turno empieza cuando un cajero entra en sesión y termina cuando el siguiente lo cambia. Más recientes primero.
      </p>
      <Table>
        <thead>
          <tr>
            <th className={th}>Cajero</th>
            <th className={th}>Inicio</th>
            <th className={th}>Fin</th>
            <th className={th}>Calificaciones</th>
            <th className={th}>Excelente + Bien</th>
          </tr>
        </thead>
        <tbody>
          {turns.slice(0, limit).map((turn) => (
            <tr key={turn.session.id}>
              <td className={`${td} font-medium`}>{userName(db, turn.session.employeeId)}</td>
              <td className={`${td} whitespace-nowrap`}>{formatDateTime(turn.session.startedAt)}</td>
              <td className={`${td} whitespace-nowrap`}>{turn.endedAt ? formatDateTime(turn.endedAt) : <Badge tone="green">En curso</Badge>}</td>
              <td className={td}>
                <div className="flex flex-wrap gap-1">
                  {turn.feedback.length === 0 && <span className="text-slate-400">—</span>}
                  {turn.feedback.map((f) => (
                    <RatingBadge key={f.id} rating={f.rating} />
                  ))}
                </div>
              </td>
              <td className={`${td} tabular-nums`}>{turn.feedback.length ? `${satisfiedPct(turn.feedback)}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {turns.length > limit && (
        <Button variant="ghost" className="mt-3" onClick={() => setLimit((l) => l + 40)}>
          Ver más turnos ({turns.length - limit} más)
        </Button>
      )}
    </>
  );
}
