import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { History, Lock, Mail, Pencil } from 'lucide-react';
import { FormRenderer, type Answers } from '../../components/FormRenderer';
import { NoPermission } from '../../components/RequireRole';
import { Badge, Button, ButtonLink, Card, ExampleTag, Field, GradeBadge, inputClass, Note, PageHeader, ToDefine } from '../../components/ui';
import { formatDateTime, formatMonth, formatMonthTitle, nowIso } from '../../lib/dates';
import { getVersion, versionLabel } from '../../lib/forms';
import { branchName, userName } from '../../lib/lookup';
import { canModifyEvaluation, canSeeEmployee } from '../../lib/permissions';
import { computeScore } from '../../lib/scoring';
import { annexesFor } from '../../lib/stats';
import { useCurrentUser, useDb, useDemoStore } from '../../store/useDemoStore';
import { AnnexesPanel } from './AnnexesPanel';

export function EvaluationPage() {
  const { evaluationId } = useParams();
  const db = useDb();
  const user = useCurrentUser()!;
  const update = useDemoStore((s) => s.update);
  const queueEmail = useDemoStore((s) => s.queueEmail);
  const openEmail = useDemoStore((s) => s.openEmail);
  const evaluation = db.performance.find((e) => e.id === evaluationId);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [observations, setObservations] = useState('');
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');

  const employee = evaluation && db.users.find((u) => u.id === evaluation.employeeId);
  const form = evaluation && db.forms.find((f) => f.id === evaluation.formId);
  const version = form && evaluation ? getVersion(form, evaluation.formVersion) : null;
  const draftScore = useMemo(() => (version ? computeScore(version, answers) : null), [version, answers]);

  if (!evaluation || !employee || !form || !version) return <p>No se encontró la evaluación.</p>;
  if (!canSeeEmployee(user, employee)) return <NoPermission message="Solo puedes consultar evaluaciones de tus empleados." />;

  const canModify = canModifyEvaluation(user, employee);
  const current = computeScore(version, evaluation.answers);
  const emails = db.outbox.filter((e) => (e.kind === 'performance' || e.kind === 'performance_updated') && e.refId === evaluation.id);

  const startEdit = () => {
    setAnswers({ ...evaluation.answers });
    setObservations(evaluation.observations);
    setComments(evaluation.comments);
    setReason('');
    setEditing(true);
  };

  const saveChange = () => {
    if (!reason.trim() || !draftScore) return;
    update((d) => {
      const e = d.performance.find((x) => x.id === evaluation.id)!;
      e.changes.push({
        at: nowIso(),
        userId: user.id,
        reason: reason.trim(),
        originalGrade: e.grade,
        newGrade: draftScore.grade ?? 0,
      });
      e.answers = answers;
      e.observations = observations.trim();
      e.comments = comments.trim();
      e.grade = draftScore.grade ?? 0;
    });
    setEditing(false);
    queueEmail('performance_updated', evaluation.id, true);
  };

  return (
    <>
      <PageHeader
        title={`Evaluación de ${formatMonth(evaluation.period)}`}
        subtitle={`${employee.name} · ${branchName(db, evaluation.branchId)} · evaluó ${userName(db, evaluation.managerId)}`}
        actions={
          <>
            <ButtonLink to={user.role === 'employee' ? '/app/mi-expediente' : `/app/empleados/${employee.id}`} variant="secondary">
              Volver al expediente
            </ButtonLink>
            {canModify && !editing && (
              <Button onClick={startEdit}>
                <Pencil className="h-4 w-4" /> Modificar evaluación
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="accent">{versionLabel(db, form.id, version.version)}</Badge>
        {!editing && (
          <Badge>
            <Lock className="h-3 w-3" /> Solo lectura
          </Badge>
        )}
        <ExampleTag />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {editing && (
            <Note tone="warning">
              Estás modificando una evaluación confirmada. El cambio queda registrado de forma permanente con la calificación
              original, la nueva, la fecha y hora, tu usuario y el motivo. <ToDefine>quién está autorizado a modificar</ToDefine>
            </Note>
          )}
          <Card title={editing ? 'Apartados (modificando)' : 'Apartados'}>
            <FormRenderer version={version} answers={editing ? answers : evaluation.answers} onChange={setAnswers} readOnly={!editing} showPoints />
          </Card>
          <Card>
            {editing ? (
              <div className="space-y-4">
                <Field label="Observaciones">
                  <textarea className={inputClass} rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
                </Field>
                <Field label="Comentarios para el empleado">
                  <textarea className={inputClass} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
                </Field>
                <Field label="Motivo del cambio" hint="Obligatorio. Queda en el historial y no se puede borrar.">
                  <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ejemplo: aclaración con el empleado sobre…" />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveChange} disabled={!reason.trim()}>
                    Guardar modificación
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Observaciones</dt>
                  <dd className="mt-0.5 text-slate-800">{evaluation.observations || 'Sin observaciones'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Comentarios del gerente</dt>
                  <dd className="mt-0.5 text-slate-800">{evaluation.comments || 'Sin comentarios'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Registrada</dt>
                  <dd className="mt-0.5 text-slate-800">{formatDateTime(evaluation.createdAt)}</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card
            title={
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" /> Historial de cambios
              </span>
            }
          >
            {evaluation.changes.length === 0 ? (
              <p className="text-sm text-slate-500">Esta evaluación no se ha modificado.</p>
            ) : (
              <ol className="space-y-3">
                {evaluation.changes.map((c, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500">Original</span> <GradeBadge grade={c.originalGrade} />
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-500">Modificada</span> <GradeBadge grade={c.newGrade} />
                    </div>
                    <div className="mt-2 text-slate-700">
                      <strong>Motivo:</strong> {c.reason}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDateTime(c.at)} · {userName(db, c.userId)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-slate-500">El historial de cambios es permanente: no se puede borrar.</p>
          </Card>

          <Card title={`Anexos de ${formatMonthTitle(evaluation.period).toLowerCase()}`}>
            <AnnexesPanel annexes={annexesFor(db, employee.id, evaluation.period)} />
          </Card>
        </div>

        <aside>
          <div className="sticky top-[120px] space-y-4">
            <Card title={editing ? 'Calificación nueva' : 'Calificación oficial'}>
              <div className="text-center">
                <div className="text-5xl font-semibold tabular-nums text-slate-900">
                  {(editing ? draftScore?.grade : evaluation.grade)?.toFixed(1) ?? '—'}
                </div>
                <div className="text-sm text-slate-500">de 10</div>
                {editing && <div className="mt-1 text-xs text-slate-500">Antes: {evaluation.grade.toFixed(1)}</div>}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {(editing ? draftScore?.areas ?? [] : current.areas).map((a) => (
                  <li key={a.area} className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">{a.area}</span>
                    <GradeBadge grade={a.grade} />
                  </li>
                ))}
              </ul>
            </Card>
            {emails.length > 0 && (
              <Card title="Correos enviados al empleado">
                <ul className="space-y-1">
                  {emails.map((e) => (
                    <li key={e.id}>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => openEmail(e.id)}>
                        <Mail className="h-4 w-4" />
                        {e.kind === 'performance' ? 'Evaluación' : 'Versión actualizada'} · {formatDateTime(e.createdAt)}
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
