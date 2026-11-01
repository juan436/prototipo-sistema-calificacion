import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import { formatDate, formatDateTime, formatMonth, formatTime, lastDayOfMonth } from '../lib/dates';
import { getForm, branchName, ratingLabel, userName } from '../lib/lookup';
import { versionLabel } from '../lib/forms';
import {
  annexesFor,
  complaintsOf,
  evaluationAreas,
  filterFeedback,
  praisesByEmployee,
  ratingDistribution,
  surveyResult,
} from '../lib/stats';
import type { EmailMessage, MockDb } from '../mock/types';
import { useDb, useDemoStore } from '../store/useDemoStore';
import { GroupedBars, RatingBars } from './charts';
import { GradeBadge, Modal, Note, ToDefine } from './ui';

export const EMAIL_KIND_LABEL: Record<EmailMessage['kind'], string> = {
  customer_alert: 'Alerta inmediata',
  monthly_summary: 'Resumen mensual de satisfacción',
  survey_results: 'Resultados de empleados a empresa',
  performance: 'Evaluación de desempeño',
  performance_updated: 'Modificación de evaluación',
};

interface EmailContent {
  to: string;
  toRole: string;
  subject: string;
  body: ReactNode;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="border-b border-slate-200 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-1">
      <div className="w-40 shrink-0 text-slate-500">{label}</div>
      <div className="min-w-0 flex-1 font-medium text-slate-800">{children}</div>
    </div>
  );
}

export function emailContent(db: MockDb, email: Pick<EmailMessage, 'kind' | 'refId'>): EmailContent | null {
  const admin = db.settings.adminEmail;

  if (email.kind === 'customer_alert') {
    const f = db.customerFeedback.find((x) => x.id === email.refId);
    if (!f) return null;
    const reason = f.rating === 'muy_mal' ? 'Calificación «Muy mal»' : 'Queja de cliente';
    return {
      to: admin,
      toRole: 'Administrador designado',
      subject: `Alerta: ${reason.toLowerCase()} en ${branchName(db, f.branchId)}`,
      body: (
        <>
          <p>Se registró una evaluación de cliente que requiere atención.</p>
          <Section title="Detalle">
            <Row label="Motivo">{f.rating === 'muy_mal' && f.complaint ? 'Calificación «Muy mal» con queja' : reason}</Row>
            <Row label="Sucursal">{branchName(db, f.branchId)}</Row>
            <Row label="Fecha">{formatDate(f.createdAt)}</Row>
            <Row label="Hora">{formatTime(f.createdAt)}</Row>
            <Row label="Calificación">{ratingLabel(f.rating)}</Row>
            <Row label="Empleado señalado">{f.complaint?.employeeId ? userName(db, f.complaint.employeeId) : 'No lo indicó'}</Row>
            <Row label="Comentario">{f.complaint?.whatHappened || f.comment || 'Sin comentario'}</Row>
            {f.complaint?.phone && <Row label="Teléfono de contacto">{f.complaint.phone}</Row>}
          </Section>
        </>
      ),
    };
  }

  if (email.kind === 'monthly_summary') {
    const month = email.refId;
    const range = { from: `${month}-01`, to: lastDayOfMonth(month) };
    const all = filterFeedback(db, { range });
    const dist = ratingDistribution(all);
    const praises = praisesByEmployee(db, all);
    const complaints = complaintsOf(all);
    const comments = all.filter((f) => f.comment);
    const byBranch = db.branches.map((b) => ({ branch: b, dist: ratingDistribution(filterFeedback(db, { range, branch: b.id })) }));
    const compare = dist.map((d) => ({
      label: d.label,
      ...Object.fromEntries(byBranch.map(({ branch, dist: bd }) => [branch.id, bd.find((x) => x.rating === d.rating)!.pct])),
    }));
    return {
      to: admin,
      toRole: 'Administración',
      subject: `Resumen de satisfacción de clientes · ${formatMonth(month)}`,
      body: (
        <>
          <p>
            Resumen de las evaluaciones de clientes de <strong>{formatMonth(month)}</strong>.
          </p>
          <Section title="Total de evaluaciones">
            <div className="text-2xl font-semibold text-slate-900">{all.length}</div>
          </Section>
          <Section title="Cantidad y porcentaje por calificación">
            <table className="w-full text-sm">
              <tbody>
                {dist.map((d) => (
                  <tr key={d.rating} className="border-b border-slate-100">
                    <td className="py-1.5">{d.label}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.count}</td>
                    <td className="w-20 py-1.5 text-right tabular-nums">{d.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <RatingBars data={dist} />
          </Section>
          <Section title="Comparación entre sucursales (% por calificación)">
            <GroupedBars
              data={compare}
              xKey="label"
              series={db.branches.map((b, i) => ({ key: b.id, label: b.name, color: i === 0 ? '#2f7f82' : '#c08a3e' }))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {byBranch.map(({ branch, dist: bd }) => (
                <div key={branch.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <strong>{branch.name}:</strong> {bd.reduce((s, x) => s + x.count, 0)} evaluaciones
                </div>
              ))}
            </div>
          </Section>
          <Section title="Felicitaciones por empleado">
            {praises.length ? (
              <ul className="space-y-1">
                {praises.map((p) => (
                  <li key={p.employeeId} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="tabular-nums">{p.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              'Sin felicitaciones en el mes.'
            )}
          </Section>
          <Section title="Quejas y comentarios">
            {complaints.length === 0 && comments.length === 0 && 'Sin quejas ni comentarios en el mes.'}
            <ul className="space-y-2">
              {complaints.map((f) => (
                <li key={f.id} className="rounded-lg bg-red-50 px-3 py-2 text-red-900">
                  <strong>Queja</strong> · {branchName(db, f.branchId)} · {formatDateTime(f.createdAt)} · {ratingLabel(f.rating)}
                  {f.complaint?.employeeId && <> · {userName(db, f.complaint.employeeId)}</>}
                  <div>{f.complaint?.whatHappened || 'Sin descripción'}</div>
                </li>
              ))}
              {comments.map((f) => (
                <li key={f.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <strong>Comentario</strong> · {branchName(db, f.branchId)} · {formatDateTime(f.createdAt)}
                  <div>{f.comment}</div>
                </li>
              ))}
            </ul>
          </Section>
        </>
      ),
    };
  }

  if (email.kind === 'survey_results') {
    const period = db.surveyPeriods.find((p) => p.id === email.refId);
    if (!period) return null;
    const total = surveyResult(db, period.id);
    const previous = db.surveyPeriods.filter((p) => p.opensAt <= period.opensAt && p.status === 'closed').slice(-4);
    return {
      to: admin,
      toRole: 'Administración',
      subject: `Resultados de la encuesta a empleados · ${period.name}`,
      body: (
        <>
          <p>
            Se cerró el periodo <strong>{period.name}</strong> ({formatDate(period.opensAt)} al {formatDate(period.closesAt)}).
          </p>
          <Note className="mt-3">Se sabe quién participó, pero no qué contestó cada persona.</Note>
          <Section title="Participación">
            <Row label="Participantes">
              {total.participants} de {total.eligible}
            </Row>
            <Row label="Porcentaje">{total.participationPct}%</Row>
            <Row label="Promedio general">
              <GradeBadge grade={total.average} />
            </Row>
          </Section>
          <Section title="Calificación por área">
            {total.areas.map((a) => (
              <Row key={a.area} label={a.area}>
                <GradeBadge grade={a.grade} />
              </Row>
            ))}
          </Section>
          <Section title="Resultados por sucursal">
            {db.branches.map((b) => {
              const r = surveyResult(db, period.id, b.id);
              return (
                <Row key={b.id} label={b.name}>
                  <GradeBadge grade={r.average} /> <span className="ml-2 font-normal text-slate-500">participación {r.participationPct}%</span>
                </Row>
              );
            })}
          </Section>
          <Section title="Comparación con meses anteriores">
            <GroupedBars
              data={previous.map((p) => ({ name: p.name, average: surveyResult(db, p.id).average }))}
              xKey="name"
              domain={[0, 10]}
              height={200}
              series={[{ key: 'average', label: 'Promedio general', color: '#2f7f82' }]}
            />
          </Section>
          <Section title="Comentarios anónimos">
            {total.comments.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {total.comments.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              'Sin comentarios.'
            )}
          </Section>
        </>
      ),
    };
  }

  // performance / performance_updated
  const evaluation = db.performance.find((e) => e.id === email.refId);
  if (!evaluation) return null;
  const employee = db.users.find((u) => u.id === evaluation.employeeId)!;
  const areas = evaluationAreas(db, evaluation);
  const annexes = annexesFor(db, employee.id, evaluation.period);
  const lastChange = evaluation.changes[evaluation.changes.length - 1];
  const updated = email.kind === 'performance_updated';

  return {
    to: employee.email,
    toRole: 'Empleado evaluado',
    subject: `${updated ? 'Versión actualizada: ' : ''}Tu evaluación de desempeño · ${formatMonth(evaluation.period)}`,
    body: (
      <>
        <p>Hola, {employee.name.split(' ')[0]}:</p>
        <p className="mt-2">
          {updated
            ? 'Tu evaluación de desempeño fue modificada. Esta es la versión actualizada.'
            : 'Tu gerente confirmó tu evaluación de desempeño.'}
        </p>
        {updated && lastChange && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Calificación original <strong>{lastChange.originalGrade.toFixed(1)}</strong> → calificación modificada{' '}
            <strong>{lastChange.newGrade.toFixed(1)}</strong>. Motivo: {lastChange.reason} ({formatDateTime(lastChange.at)},{' '}
            {userName(db, lastChange.userId)})
          </div>
        )}
        <Section title="Evaluación oficial">
          <Row label="Periodo evaluado">{formatMonth(evaluation.period)}</Row>
          <Row label="Sucursal">{branchName(db, evaluation.branchId)}</Row>
          <Row label="Evaluó">{userName(db, evaluation.managerId)}</Row>
          <Row label="Calificación final">
            <GradeBadge grade={evaluation.grade} /> <span className="font-normal text-slate-500">de 10</span>
          </Row>
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
            <div className="mb-1 text-slate-500">Calificación por área</div>
            {areas.map((a) => (
              <Row key={a.area} label={a.area}>
                <GradeBadge grade={a.grade} />
              </Row>
            ))}
          </div>
          <Row label="Observaciones">{evaluation.observations || 'Sin observaciones'}</Row>
          <Row label="Comentarios del gerente">{evaluation.comments || 'Sin comentarios'}</Row>
          <Row label="Resultado general">
            {evaluation.grade.toFixed(1)} de 10 <ToDefine>cómo se expresa el resultado general</ToDefine>
          </Row>
          <div className="mt-1 text-xs text-slate-500">{versionLabel(db, evaluation.formId, evaluation.formVersion)}</div>
        </Section>
        <Section title="Anexo de atención al cliente">
          {annexes.praises.length + annexes.complaints.length === 0 ? (
            'Sin felicitaciones, quejas ni comentarios de clientes en el periodo.'
          ) : (
            <ul className="space-y-2">
              {annexes.praises.map((f) => (
                <li key={f.id} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                  <strong>Felicitación</strong> · {formatDateTime(f.createdAt)}
                  {f.comment && <div>«{f.comment}»</div>}
                </li>
              ))}
              {annexes.complaints.map((f) => (
                <li key={f.id} className="rounded-lg bg-red-50 px-3 py-2 text-red-900">
                  <strong>Queja</strong> · {formatDateTime(f.createdAt)} · {ratingLabel(f.rating)}
                  <div>«{f.complaint?.whatHappened || 'Sin descripción'}»</div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Anexo disciplinario">
          {annexes.reports.length === 0 ? (
            'Sin reportes ni actas en el periodo.'
          ) : (
            <ul className="space-y-2">
              {annexes.reports.map((r) => (
                <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <strong>Reporte disciplinario</strong> · {formatDateTime(r.answers['d-datetime'] || r.createdAt)} ·{' '}
                  {r.answers['d-type']}
                  <div>{r.answers['d-facts']}</div>
                  {annexes.acts
                    .filter((a) => a.reportId === r.id)
                    .map((a) => (
                      <div key={a.id} className="mt-1 text-slate-600">
                        Acta administrativa del {formatDate(a.createdAt)}
                      </div>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <p className="mt-5 text-xs text-slate-500">
          Los anexos son informativos: no suman ni restan a tu calificación oficial, que se calcula solo con la evaluación de tu
          gerente ({getForm(db, evaluation.formId).name.toLowerCase()}).
        </p>
      </>
    ),
  };
}

export function EmailPreviewCard({ email }: { email: Pick<EmailMessage, 'kind' | 'refId'> & { createdAt?: string } }) {
  const db = useDb();
  const content = emailContent(db, email);
  if (!content) return <Note tone="warning">El registro de este correo ya no existe (se restablecieron los datos).</Note>;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="space-y-1 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <div className="flex gap-2">
          <span className="w-16 text-slate-500">De</span>
          <span>sistema-evaluacion@ejemplo.com</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-slate-500">Para</span>
          <span className="font-medium">{content.to}</span>
          <span className="text-slate-500">({content.toRole})</span>
        </div>
        <div className="flex gap-2">
          <span className="w-16 text-slate-500">Asunto</span>
          <span className="font-medium">{content.subject}</span>
        </div>
        {email.createdAt && (
          <div className="flex gap-2">
            <span className="w-16 text-slate-500">Fecha</span>
            <span>{formatDateTime(email.createdAt)}</span>
          </div>
        )}
      </div>
      <div className="px-4 py-4 text-sm text-slate-700">{content.body}</div>
    </div>
  );
}

export function EmailPreviewModal() {
  const db = useDb();
  const openEmailId = useDemoStore((s) => s.openEmailId);
  const openEmail = useDemoStore((s) => s.openEmail);
  const email = db.outbox.find((e) => e.id === openEmailId);

  return (
    <Modal
      open={!!email}
      onClose={() => openEmail(null)}
      wide
      title={
        <span className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent-600" /> Vista previa del correo
        </span>
      }
    >
      {email && (
        <>
          <Note className="mb-4">
            En el prototipo no se envía ningún correo; así se vería. Quién lo recibe exactamente y cuántas personas está{' '}
            <strong>por definir</strong>.
          </Note>
          <EmailPreviewCard email={email} />
        </>
      )}
    </Modal>
  );
}
