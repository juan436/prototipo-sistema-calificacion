import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { allScoredAnswered, FormRenderer, type Answers } from '../../components/FormRenderer';
import { Badge, Button, Card, ExampleTag, Field, GradeBadge, inputClass, Note, PageHeader, Select, ToDefine } from '../../components/ui';
import { formatMonthTitle, monthRange, nowIso } from '../../lib/dates';
import { latestVersion, performanceFormFor, versionLabel } from '../../lib/forms';
import { branchName } from '../../lib/lookup';
import { canSeeEmployee } from '../../lib/permissions';
import { computeScore } from '../../lib/scoring';
import { annexesFor, hasAnnexes } from '../../lib/stats';
import { useCurrentUser, useDb, useDemoStore } from '../../store/useDemoStore';
import { AnnexesPanel } from './AnnexesPanel';

const PERIODS = monthRange('2026-07', '2026-10');

export function CapturePage() {
  const db = useDb();
  const user = useCurrentUser()!;
  const update = useDemoStore((s) => s.update);
  const queueEmail = useDemoStore((s) => s.queueEmail);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const employees = db.users.filter((u) => u.role === 'employee' && u.active && canSeeEmployee(user, u));
  const [employeeId, setEmployeeId] = useState(params.get('empleado') ?? employees[0]?.id ?? '');
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1]);
  const [answers, setAnswers] = useState<Answers>({});
  const [observations, setObservations] = useState('');
  const [comments, setComments] = useState('');

  const employee = employees.find((e) => e.id === employeeId);
  // Each role (vendedor, cajero, administrativo) has its own questionnaire.
  const form = (employee && performanceFormFor(db, employee)) || db.forms.find((f) => f.type === 'performance')!;
  const version = latestVersion(form);
  const score = useMemo(() => computeScore(version, answers), [version, answers]);
  const existing = db.performance.find((e) => e.employeeId === employeeId && e.period === period);
  const complete = allScoredAnswered(version, answers);
  const annexes = employee ? annexesFor(db, employee.id, period) : null;

  const confirm = () => {
    if (!employee || existing || !complete) return;
    const id = `pe-${employee.id}-${period}-${Date.now().toString(36)}`;
    update((d) => {
      d.performance.push({
        id,
        employeeId: employee.id,
        managerId: user.id,
        branchId: employee.branchId!,
        period,
        formId: form.id,
        formVersion: version.version,
        answers,
        observations: observations.trim(),
        comments: comments.trim(),
        grade: score.grade ?? 0,
        createdAt: nowIso(),
        changes: [],
      });
    });
    queueEmail('performance', id, true);
    navigate(`/app/evaluaciones/${id}`);
  };

  return (
    <>
      <PageHeader title="Evaluar desempeño" subtitle="La calificación se calcula sola al contestar cada apartado." />
      <div className="mb-4 flex flex-wrap gap-2">
        <ExampleTag />
        <ExampleTag>Puntos y ponderaciones de ejemplo</ExampleTag>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Empleado" hint={user.role === 'manager' ? 'Solo aparecen tus empleados.' : undefined}>
                <Select
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setAnswers({});
                  }}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.position} · {branchName(db, e.branchId)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Periodo evaluado">
                <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {formatMonthTitle(p)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Cuestionario:</span>
              <Badge tone="accent">{form.name}</Badge>
              <span className="text-xs text-slate-500">{versionLabel(db, form.id, version.version)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Cada rol tiene su propio cuestionario: vendedores (meta de venta), cajeros (satisfacción del cliente) y administrativos
              (sin ventas ni clientes).
            </p>
            {employee?.position === 'Ventas' && (
              <div className="mt-2">
                <ToDefine>de dónde sale la meta de venta de cada vendedor</ToDefine>
              </div>
            )}
          </Card>

          {existing ? (
            <Note tone="warning">
              {employee?.name} ya tiene una evaluación de {formatMonthTitle(period).toLowerCase()}.{' '}
              <Link to={`/app/evaluaciones/${existing.id}`} className="font-semibold underline">
                Ábrela para consultarla o modificarla
              </Link>
              .
            </Note>
          ) : (
            <>
              <Card title="Apartados">
                <FormRenderer version={version} answers={answers} onChange={setAnswers} showPoints />
              </Card>
              <Card>
                <div className="space-y-4">
                  <Field label="Observaciones" optional>
                    <textarea className={inputClass} rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
                  </Field>
                  <Field label="Comentarios para el empleado" optional>
                    <textarea className={inputClass} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
                  </Field>
                </div>
              </Card>
              {annexes && hasAnnexes(annexes) && (
                <Card title="Anexos del periodo (informativos)">
                  <AnnexesPanel annexes={annexes} />
                </Card>
              )}
            </>
          )}
        </div>

        {!existing && (
          <aside>
            <div className="space-y-4 xl:sticky xl:top-[124px]">
              <Card title="Calificación calculada">
                <div className="text-center">
                  <div className="text-5xl font-semibold tabular-nums text-slate-900">{score.grade === null ? '—' : score.grade.toFixed(1)}</div>
                  <div className="text-sm text-slate-500">de 10</div>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {score.areas.map((a) => (
                    <li key={a.area} className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">{a.area}</span>
                      <GradeBadge grade={a.grade} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-500">Los anexos (felicitaciones, quejas y reportes) no suman ni restan.</p>
              </Card>
              <Button size="lg" className="w-full" disabled={!complete || !employee} onClick={confirm}>
                Confirmar y guardar en el expediente
              </Button>
              {!complete && <p className="text-center text-xs text-slate-500">Contesta todos los apartados para confirmar.</p>}
              <p className="text-center text-xs text-slate-500">Al confirmar verás la vista previa del correo al empleado.</p>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
