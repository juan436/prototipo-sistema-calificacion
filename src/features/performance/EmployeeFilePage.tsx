import { useParams } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, FileWarning } from 'lucide-react';
import { GradeLines } from '../../components/charts';
import { NoPermission } from '../../components/RequireRole';
import { Badge, ButtonLink, Card, GradeBadge, Note, PageHeader, StatCard, Table, td, th } from '../../components/ui';
import { formatDate, formatMonth } from '../../lib/dates';
import { versionLabel } from '../../lib/forms';
import { branchName, userName } from '../../lib/lookup';
import { canCapture, canSeeEmployee } from '../../lib/permissions';
import { annexesFor, evaluationAreas, evaluationsOf, historicalAverage } from '../../lib/stats';
import { useCurrentUser, useDb } from '../../store/useDemoStore';
import { AnnexesPanel } from './AnnexesPanel';

export function MyFilePage() {
  const user = useCurrentUser()!;
  return <EmployeeFile employeeId={user.id} />;
}

export function EmployeeFilePage() {
  const { employeeId } = useParams();
  return <EmployeeFile employeeId={employeeId!} />;
}

function EmployeeFile({ employeeId }: { employeeId: string }) {
  const db = useDb();
  const user = useCurrentUser()!;
  const employee = db.users.find((u) => u.id === employeeId && u.role === 'employee');
  if (!employee) return <p>No se encontró al empleado.</p>;
  if (!canSeeEmployee(user, employee)) return <NoPermission message="Solo puedes consultar el expediente de tus empleados." />;

  const own = user.id === employee.id;
  const evaluations = evaluationsOf(db, employee.id);
  const last = evaluations[evaluations.length - 1];
  const avg = historicalAverage(db, employee.id);
  const annexes = annexesFor(db, employee.id);
  const chartData = evaluations.map((e, i) => ({
    period: e.period,
    grade: e.grade,
    average: historicalAverage({ ...db, performance: evaluations.slice(0, i + 1) }, employee.id),
  }));

  return (
    <>
      <PageHeader
        title={own ? 'Mi expediente' : `Expediente de ${employee.name}`}
        subtitle={`${employee.position} · ${branchName(db, employee.branchId)} · Identificador único ${employee.id.toUpperCase()}${employee.active ? '' : ' · Usuario desactivado'}`}
        actions={
          canCapture(user) && (
            <>
              <ButtonLink to={`/app/desempeno/nueva?empleado=${employee.id}`}>
                <ClipboardCheck className="h-4 w-4" /> Evaluar desempeño
              </ButtonLink>
              <ButtonLink to={`/app/disciplinario/nuevo?empleado=${employee.id}`} variant="secondary">
                <FileWarning className="h-4 w-4" /> Reporte disciplinario
              </ButtonLink>
            </>
          )
        }
      />

      {employee.branchHistory.length > 1 && (
        <Note className="mb-6">
          <strong>Trasladado de sucursal.</strong> Su identificador único une todo su historial aunque cambie de sucursal o de
          gerente:{' '}
          {employee.branchHistory.map((h, i) => (
            <span key={h.from}>
              {i > 0 && ' → '}
              {branchName(db, h.branchId)} desde el {formatDate(h.from)}
            </span>
          ))}
          .
        </Note>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Calificación mensual más reciente" value={<GradeBadge grade={last?.grade} />} hint={last ? formatMonth(last.period) : 'Sin evaluaciones'} />
        <StatCard label="Promedio histórico" value={<GradeBadge grade={avg} />} hint="Se actualiza solo con cada evaluación nueva" />
        <StatCard label="Evaluaciones" value={evaluations.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Evolución">
          <GradeLines
            data={chartData}
            series={[
              { key: 'grade', label: 'Calificación mensual', color: '#2f7f82' },
              { key: 'average', label: 'Promedio histórico', color: '#94a3b8' },
            ]}
          />
        </Card>
        <Card title="Comentarios de gerentes">
          <ul className="space-y-3 text-sm">
            {[...evaluations].reverse().map((e) => (
              <li key={e.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-xs text-slate-500">
                  {formatMonth(e.period)} · {userName(db, e.managerId)}
                </div>
                <div className="text-slate-800">{e.observations}</div>
                {e.comments && <div className="text-slate-600">{e.comments}</div>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Calificaciones mensuales" className="mt-6">
        <Table>
          <thead>
            <tr>
              <th className={th}>Periodo</th>
              <th className={th}>Calificación</th>
              <th className={th}>Por área</th>
              <th className={th}>Sucursal y gerente</th>
              <th className={th}>Formulario</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {[...evaluations].reverse().map((e) => (
              <tr key={e.id}>
                <td className={`${td} font-medium`}>{formatMonth(e.period)}</td>
                <td className={td}>
                  <GradeBadge grade={e.grade} />
                  {e.changes.length > 0 && (
                    <div className="mt-1">
                      <Badge tone="amber">Modificada</Badge>
                    </div>
                  )}
                </td>
                <td className={`${td} text-xs text-slate-600`}>
                  {evaluationAreas(db, e).map((a) => (
                    <div key={a.area}>
                      {a.area}: <span className="font-medium tabular-nums">{a.grade.toFixed(1)}</span>
                    </div>
                  ))}
                </td>
                <td className={`${td} text-xs`}>
                  {branchName(db, e.branchId)}
                  <div className="text-slate-500">{userName(db, e.managerId)}</div>
                </td>
                <td className={`${td} text-xs text-slate-500`}>{versionLabel(db, e.formId, e.formVersion)}</td>
                <td className={`${td} text-right`}>
                  <ButtonLink to={`/app/evaluaciones/${e.id}`} variant="ghost">
                    Ver <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-xs text-slate-500">Las evaluaciones anteriores se abren en modo solo lectura.</p>
      </Card>

      <Card title="Anexos: felicitaciones, quejas y reportes disciplinarios" className="mt-6">
        <AnnexesPanel annexes={annexes} />
      </Card>
    </>
  );
}
