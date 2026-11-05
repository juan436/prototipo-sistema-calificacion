import { useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { EmailPreviewCard } from '../../components/EmailPreview';
import { RatingBadge } from '../../components/RatingBadge';
import { BranchSelect, DateInput } from '../../components/filters';
import { Badge, Button, ButtonLink, Card, Modal, PageHeader, Table, td, th, ToDefine, Select } from '../../components/ui';
import { formatDateTime, formatMonthTitle, monthRange } from '../../lib/dates';
import { branchName, userName } from '../../lib/lookup';
import { filterFeedback, type BranchFilter } from '../../lib/stats';
import { useDb, useDemoStore } from '../../store/useDemoStore';


export function CustomerFeedbackPage() {
  const db = useDb();
  const openEmail = useDemoStore((s) => s.openEmail);
  const [branch, setBranch] = useState<BranchFilter>('all');
  const [from, setFrom] = useState('2026-08-01');
  const [to, setTo] = useState('2026-10-31');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const months = monthRange('2026-08', '2026-10');
  const [summaryMonth, setSummaryMonth] = useState<string | null>(null);
  const [pickMonth, setPickMonth] = useState(months[months.length - 1]);

  const list = useMemo(
    () =>
      filterFeedback(db, { branch, range: { from, to } })
        .filter((f) => !onlyAlerts || f.rating === 'muy_mal' || f.complaint)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db, branch, from, to, onlyAlerts],
  );

  return (
    <>
      <PageHeader
        title="Calificaciones de clientes"
        subtitle="Cada envío queda registrado con fecha y hora exactas, la caja donde se hizo y el cajero en sesión. Las dos sucursales se guardan por separado."
        actions={<ButtonLink to="/app/panel" variant="secondary">Ver estadísticas</ButtonLink>}
      />

      <Card title="Resumen mensual por correo" className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Mes</span>
            <Select value={pickMonth} onChange={(e) => setPickMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonthTitle(m)}
                </option>
              ))}
            </Select>
          </label>
          <Button onClick={() => setSummaryMonth(pickMonth)}>
            <Mail className="h-4 w-4" /> Vista previa del resumen
          </Button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Se envía automáticamente a la administración cada mes. <ToDefine>día y hora del envío</ToDefine>
        </p>
      </Card>

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <BranchSelect value={branch} onChange={setBranch} />
          <DateInput label="Desde" value={from} onChange={setFrom} />
          <DateInput label="Hasta" value={to} onChange={setTo} />
          <label className="flex items-end gap-2 pb-3 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-accent-600" checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)} />
            Solo quejas y «Muy mal»
          </label>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {list.length} registros ·
          <ToDefine>si el cliente señala a otro empleado, ¿la calificación cuenta para el bono del cajero en sesión o solo para el señalado?</ToDefine>
        </div>
        <Table>
          <thead>
            <tr>
              <th className={th}>Fecha y hora</th>
              <th className={th}>Sucursal</th>
              <th className={th}>Caja y cajero en sesión</th>
              <th className={th}>Calificación</th>
              <th className={th}>Empleados mencionados</th>
              <th className={th}>Comentario o queja</th>
              <th className={th}>Teléfono</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => {
              const alert = db.outbox.find((e) => e.kind === 'customer_alert' && e.refId === f.id);
              return (
                <tr key={f.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(f.createdAt)}</td>
                  <td className={td}>{branchName(db, f.branchId)}</td>
                  <td className={td}>
                    <div>{db.tablets.find((t) => t.id === f.tabletId)?.register ?? '—'}</div>
                    <div className="text-xs text-slate-500">{f.cashierId ? userName(db, f.cashierId) : 'Sin cajero en sesión'}</div>
                  </td>
                  <td className={td}>
                    <RatingBadge rating={f.rating} />
                  </td>
                  <td className={td}>
                    {f.praisedEmployeeIds.length > 0 && (
                      <div className="text-emerald-700">Felicitó a {f.praisedEmployeeIds.map((id) => userName(db, id)).join(', ')}</div>
                    )}
                    {f.complaint?.employeeId && <div className="text-red-700">Señaló a {userName(db, f.complaint.employeeId)}</div>}
                  </td>
                  <td className={`${td} max-w-xs`}>
                    {f.complaint ? (
                      <>
                        <Badge tone="red">Queja</Badge> {f.complaint.whatHappened ?? <span className="text-slate-400">Sin descripción</span>}
                      </>
                    ) : (
                      f.comment
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{f.complaint?.phone ?? ''}</td>
                  <td className={td}>
                    {alert && (
                      <Button variant="ghost" onClick={() => openEmail(alert.id)}>
                        <Mail className="h-4 w-4" /> Alerta
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal open={!!summaryMonth} onClose={() => setSummaryMonth(null)} title="Vista previa del resumen mensual" size="xl">
        {summaryMonth && <EmailPreviewCard email={{ kind: 'monthly_summary', refId: summaryMonth }} />}
      </Modal>
    </>
  );
}
