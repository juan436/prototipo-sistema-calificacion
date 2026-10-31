import { useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { Badge, Button, Card, Field, inputClass, Modal, Note, PageHeader, Table, td, th, ToDefine } from '../../components/ui';
import { formatDateTime, nowIso } from '../../lib/dates';
import { branchName } from '../../lib/lookup';
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

export const tabletRouteUrl = () => `${window.location.origin}${window.location.pathname}#/tableta`;

export function TabletsPage() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const deviceTabletId = useDemoStore((s) => s.deviceTabletId);
  const [adding, setAdding] = useState(false);
  const [branchId, setBranchId] = useState<BranchId>('ferreisla');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const pending = db.activationCodes.filter((c) => !c.usedAt);

  const create = () => {
    const code = generateCode(branchId, db.activationCodes.map((c) => c.code));
    update((d) => {
      d.activationCodes.push({ code, branchId, createdAt: nowIso() });
    });
    setNewCode(code);
  };

  return (
    <>
      <PageHeader
        title="Tabletas"
        subtitle="Solo las tabletas autorizadas pueden mostrar el formulario de clientes."
        actions={
          <>
            <a href={tabletRouteUrl()} target="_blank" rel="noreferrer" className="inline-flex">
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" /> Abrir la ruta de tableta
              </Button>
            </a>
            <Button
              onClick={() => {
                setNewCode(null);
                setAdding(true);
              }}
            >
              <Plus className="h-4 w-4" /> Agregar tableta
            </Button>
          </>
        }
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <th className={th}>Tableta</th>
              <th className={th}>Sucursal</th>
              <th className={th}>Estado</th>
              <th className={th}>Alta</th>
              <th className={th}>Calificaciones</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {db.tablets.map((t) => (
              <tr key={t.id}>
                <td className={td}>
                  <div className="font-medium text-slate-800">{t.name}</div>
                  {t.id === deviceTabletId && <div className="text-xs text-accent-700">Es este navegador (en la demo)</div>}
                </td>
                <td className={td}>{branchName(db, t.branchId)}</td>
                <td className={td}>{t.status === 'authorized' ? <Badge tone="green">Autorizada</Badge> : <Badge tone="red">Revocada</Badge>}</td>
                <td className={td}>{formatDateTime(t.createdAt)}</td>
                <td className={`${td} tabular-nums`}>{db.customerFeedback.filter((f) => f.tabletId === t.id).length}</td>
                <td className={`${td} text-right`}>
                  {t.status === 'authorized' && (
                    <Button variant="danger" onClick={() => setRevoking(t.id)}>
                      Desautorizar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
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
                  {branchName(db, c.branchId)} · generado {formatDateTime(c.createdAt)}
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
            <p className="text-sm text-slate-500">Sucursal: {branchName(db, branchId)}. Al usarlo, el código queda consumido.</p>
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
              <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value as BranchId)}>
                {db.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Note className="mt-4">Se genera un código de un solo uso. El personal lo escribe una vez en la tableta; el cliente nunca lo ve.</Note>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
              <Button onClick={create}>Generar código</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!revoking} onClose={() => setRevoking(null)} title="Desautorizar tableta">
        <p className="text-slate-600">
          La tableta deja de funcionar y vuelve a mostrar «Esta tableta no está autorizada». Las calificaciones que ya se
          registraron se conservan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
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
        </div>
      </Modal>
    </>
  );
}
