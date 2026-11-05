import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { GradeLines, GroupedBars, HorizontalBars, RatingBars, RatingEvolution, RatingPie, RatingStackBars } from '../../components/charts';
import { BranchSelect, DateInput } from '../../components/filters';
import { RatingBadge } from '../../components/RatingBadge';
import { cashierSummary, satisfiedPct } from '../../lib/cashier';
import { Card, ExampleTag, GradeBadge, Note, PageHeader, StatCard, Table, td, th, Button, Select, ToDefine } from '../../components/ui';
import { formatDateTime, formatMonthTitle, lastDayOfMonth, monthRange } from '../../lib/dates';
import { BRANCH_COLORS, branchName, userName } from '../../lib/lookup';
import { average, averageAreas, computeScore } from '../../lib/scoring';
import { getVersion } from '../../lib/forms';
import {
  annexesFor,
  complaintsOf,
  downloadCsv,
  filterFeedback,
  monthlyEvolution,
  praisesByEmployee,
  ratingDistribution,
  surveyResult,
  type BranchFilter,
  type DateRange,
} from '../../lib/stats';
import type { MockDb } from '../../mock/types';
import { useDb } from '../../store/useDemoStore';

type PeriodMode = 'month' | 'year' | 'custom';
type EvalType = 'all' | 'customers' | 'survey' | 'performance';

const DATA_MONTHS = monthRange('2026-07', '2026-10');

function rangeMonths(range: Required<DateRange>): string[] {
  return monthRange(range.from.slice(0, 7), range.to.slice(0, 7));
}

export function DashboardPage() {
  const db = useDb();
  const [branch, setBranch] = useState<BranchFilter>('all');
  const [mode, setMode] = useState<PeriodMode>('custom');
  const [month, setMonth] = useState('2026-10');
  const [year, setYear] = useState('2026');
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState('2026-10-31');
  const [type, setType] = useState<EvalType>('all');
  const [employeeId, setEmployeeId] = useState('');

  const range: Required<DateRange> = useMemo(() => {
    if (mode === 'month') return { from: `${month}-01`, to: lastDayOfMonth(month) };
    if (mode === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` };
    return { from: from || '2000-01-01', to: to || '2100-12-31' };
  }, [mode, month, year, from, to]);

  const employees = db.users.filter((u) => u.role === 'employee' && (branch === 'all' || u.branchId === branch));
  const show = (t: EvalType) => type === 'all' || type === t;

  return (
    <>
      <PageHeader
        title="Panel y estadísticas"
        subtitle="Consulta por sucursal, periodo, tipo de evaluación y empleado."
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv(db, branch, range, employeeId)}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar a Excel
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <FileDown className="h-4 w-4" /> Exportar a PDF
            </Button>
          </>
        }
      />

      <Card className="mb-6 no-print">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BranchSelect value={branch} onChange={(v) => { setBranch(v); setEmployeeId(''); }} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Periodo</span>
            <Select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)}>
              <option value="month">Mes</option>
              <option value="year">Año</option>
              <option value="custom">Fechas personalizadas</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Tipo de evaluación</span>
            <Select value={type} onChange={(e) => setType(e.target.value as EvalType)}>
              <option value="all">Todas</option>
              <option value="customers">Satisfacción de clientes</option>
              <option value="survey">Empleados a empresa</option>
              <option value="performance">Desempeño de empleados</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Empleado</span>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={type === 'survey'}>
              <option value="">Todos</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </label>
          {mode === 'month' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Mes</span>
              <Select value={month} onChange={(e) => setMonth(e.target.value)}>
                {DATA_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthTitle(m)}
                  </option>
                ))}
              </Select>
            </label>
          )}
          {mode === 'year' && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Año</span>
              <Select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="2026">2026</option>
              </Select>
            </label>
          )}
          {mode === 'custom' && (
            <>
              <DateInput label="Desde" value={from} onChange={setFrom} />
              <DateInput label="Hasta" value={to} onChange={setTo} />
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Exportar: en el prototipo, «Excel» descarga un archivo CSV de ejemplo y «PDF» abre la impresión del navegador. En la versión real
          se generan con formato.
        </p>
      </Card>

      <div className="print-only mb-4 text-sm text-slate-600">
        {branchName(db, branch === 'all' ? null : branch)} · {range.from} a {range.to}
      </div>

      <div className="space-y-10">
        {show('customers') && <CustomersSection branch={branch} range={range} employeeId={employeeId} />}
        {show('survey') && <SurveySection branch={branch} range={range} />}
        {show('performance') && <PerformanceSection branch={branch} range={range} employeeId={employeeId} />}
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900">{children}</h2>;
}

function CustomersSection({ branch, range, employeeId }: { branch: BranchFilter; range: Required<DateRange>; employeeId: string }) {
  const db = useDb();
  const list = filterFeedback(db, { branch, range, employeeId: employeeId || undefined });
  const dist = ratingDistribution(list);
  const praises = praisesByEmployee(db, list).filter((p) => !employeeId || p.employeeId === employeeId);
  const complaints = complaintsOf(list).filter((f) => !employeeId || f.complaint?.employeeId === employeeId);
  const months = rangeMonths(range).filter((m) => db.customerFeedback.some((f) => f.createdAt.startsWith(m)));
  const byBranch = db.branches
    .filter((b) => branch === 'all' || b.id === branch)
    .map((b) => ({ b, list: filterFeedback(db, { branch: b.id, range, employeeId: employeeId || undefined }) }));
  const cashiers = cashierSummary(db, list).filter((c) => !employeeId || c.cashierId === employeeId);

  return (
    <section>
      <SectionTitle>Satisfacción de clientes</SectionTitle>
      {employeeId && (
        <Note className="mb-4">
          Se muestran las evaluaciones donde {userName(db, employeeId)} era el cajero en sesión, o donde el cliente lo felicitó o lo
          señaló.
        </Note>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de evaluaciones" value={list.length} />
        <StatCard label="Satisfechos (Excelente + Bien)" value={`${satisfiedPct(list)}%`} hint={`${dist[0].count + dist[1].count} de ${list.length}`} />
        <StatCard label="Felicitaciones" value={praises.reduce((s, p) => s + p.count, 0)} />
        <StatCard label="Quejas recibidas" value={complaints.length} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Porcentaje por calificación">
          <RatingPie data={dist} />
          <table className="mt-2 w-full text-sm">
            <tbody>
              {dist.map((d) => (
                <tr key={d.rating} className="border-b border-slate-100">
                  <td className="py-1.5">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.label}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{d.count}</td>
                  <td className="w-16 py-1.5 text-right tabular-nums">{d.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Evolución mensual">
          <RatingEvolution data={monthlyEvolution(list, months)} />
        </Card>
        <Card title="Felicitaciones por empleado">
          {praises.length ? (
            <HorizontalBars data={praises.map((p) => ({ name: p.name, value: p.count }))} valueLabel="Felicitaciones" />
          ) : (
            <p className="text-sm text-slate-500">Sin felicitaciones en el periodo.</p>
          )}
        </Card>
      </div>

      <Card title="Cuántos clientes se van satisfechos, por sucursal" className="mt-4">
        <div className={`grid gap-6 ${byBranch.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {byBranch.map(({ b, list: bl }) => (
            <div key={b.id} className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-slate-800">{b.name}</h3>
                <span className="text-sm text-slate-500">
                  {bl.length} calificaciones · <strong className="text-slate-800">{satisfiedPct(bl)}%</strong> Excelente + Bien
                </span>
              </div>
              <RatingBars data={ratingDistribution(bl)} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Por cajero en sesión" className="mt-4">
        <p className="mb-3 text-sm text-slate-500">
          Cada calificación cuenta para el cajero que estaba en sesión en esa caja. Sirve para comparar turnos y para los bonos.
        </p>
        {cashiers.length === 0 ? (
          <p className="text-sm text-slate-500">Sin calificaciones con cajero en sesión en el periodo.</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <RatingStackBars data={cashiers.map((c) => ({ name: c.name, ...c.counts }))} />
            <Table>
              <thead>
                <tr>
                  <th className={th}>Cajero</th>
                  <th className={`${th} text-right`}>Calificaciones</th>
                  <th className={`${th} text-right`}>Excelente</th>
                  <th className={`${th} text-right`}>Bien</th>
                  <th className={`${th} text-right`}>Excelente + Bien</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c) => (
                  <tr key={c.cashierId}>
                    <td className={td}>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-slate-500">{branchName(db, db.users.find((u) => u.id === c.cashierId)?.branchId)}</div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{c.total}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.counts.excelente}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.counts.bien}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{c.satisfiedPct}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <ToDefine>qué calificaciones cuentan como «satisfecho» (aquí: Excelente + Bien)</ToDefine>
          <ToDefine>si el cliente señala a otro empleado, ¿cuenta para el cajero en sesión o solo para el señalado?</ToDefine>
        </div>
      </Card>
      <Card title="Quejas recibidas" className="mt-4">
        {complaints.length === 0 ? (
          <p className="text-sm text-slate-500">Sin quejas en el periodo.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Sucursal</th>
                <th className={th}>Calificación</th>
                <th className={th}>Empleado</th>
                <th className={th}>¿Qué sucedió?</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((f) => (
                <tr key={f.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(f.createdAt)}</td>
                  <td className={td}>{branchName(db, f.branchId)}</td>
                  <td className={td}><RatingBadge rating={f.rating} /></td>
                  <td className={td}>{f.complaint?.employeeId ? userName(db, f.complaint.employeeId) : '—'}</td>
                  <td className={td}>{f.complaint?.whatHappened ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </section>
  );
}

function SurveySection({ branch, range }: { branch: BranchFilter; range: Required<DateRange> }) {
  const db = useDb();
  const periods = db.surveyPeriods.filter((p) => p.opensAt >= range.from && p.opensAt <= range.to);
  const results = periods.map((p) => ({ p, all: surveyResult(db, p.id, branch), byBranch: db.branches.map((b) => surveyResult(db, p.id, b.id)) }));
  const last = results[results.length - 1];
  const branches = db.branches.filter((b) => branch === 'all' || b.id === branch);

  const responses = db.anonymousResponses.filter((r) => periods.some((p) => p.id === r.periodId));
  const areaFor = (b: string) =>
    averageAreas(
      responses
        .filter((r) => r.branchId === b)
        .map((r) => computeScore(getVersion(db.forms.find((f) => f.id === r.formId)!, r.formVersion), r.answers)),
    );
  const areas = branches.map((b) => ({ b, areas: areaFor(b.id) }));
  const areaNames = [...new Set(areas.flatMap((a) => a.areas.map((x) => x.area)))];

  return (
    <section>
      <SectionTitle>Empleados a empresa (encuesta anónima)</SectionTitle>
      {periods.length === 0 ? (
        <p className="text-sm text-slate-500">No hay periodos de encuesta en las fechas elegidas.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={`Participación · ${last.p.name}`} value={`${last.all.participationPct}%`} hint={`${last.all.participants} de ${last.all.eligible}`} />
            <StatCard
              label="Calificación general del periodo elegido"
              value={<GradeBadge grade={average(results.map((r) => r.all.average).filter((x): x is number => x !== null))} />}
            />
            <StatCard label="Periodos" value={periods.length} hint={periods.map((p) => p.name.replace(' 2026', '')).join(', ')} />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card title="Resultados por área y comparación entre sucursales">
              <GroupedBars
                data={areaNames.map((name) => ({ area: name, ...Object.fromEntries(areas.map(({ b, areas: a }) => [b.id, a.find((x) => x.area === name)?.grade ?? null])) }))}
                xKey="area"
                domain={[0, 10]}
                series={branches.map((b) => ({ key: b.id, label: b.name, color: BRANCH_COLORS[b.id] }))}
              />
            </Card>
            <Card title="Evolución histórica y participación mensual">
              <GradeLines
                data={results.map((r) => ({ period: r.p.name.replace(' 2026', ''), ...Object.fromEntries(db.branches.map((b, i) => [b.id, r.byBranch[i].average])) }))}
                series={branches.map((b) => ({ key: b.id, label: b.name, color: BRANCH_COLORS[b.id] }))}
              />
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <td className="py-1">Participación</td>
                    {branches.map((b) => (
                      <td key={b.id} className="py-1 text-right">
                        {b.name}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.p.id} className="border-t border-slate-100">
                      <td className="py-1">{r.p.name}</td>
                      {branches.map((b) => (
                        <td key={b.id} className="py-1 text-right tabular-nums">
                          {r.byBranch[db.branches.indexOf(b)].participationPct}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <p className="mt-2 text-xs text-slate-500">El filtro por empleado no aplica: la encuesta es anónima.</p>
        </>
      )}
    </section>
  );
}

function PerformanceSection({ branch, range, employeeId }: { branch: BranchFilter; range: Required<DateRange>; employeeId: string }) {
  const db = useDb();
  const months = rangeMonths(range);
  const evaluations = db.performance.filter(
    (e) => months.includes(e.period) && (branch === 'all' || e.branchId === branch) && (!employeeId || e.employeeId === employeeId),
  );
  const people = [...new Set(evaluations.map((e) => e.employeeId))];
  const branches = db.branches.filter((b) => branch === 'all' || b.id === branch);
  const evolutionMonths = months.filter((m) => evaluations.some((e) => e.period === m));
  const praisesTotal = people.reduce((s, id) => s + months.reduce((x, m) => x + annexesFor(db, id, m).praises.length, 0), 0);
  const reportsTotal = people.reduce((s, id) => s + months.reduce((x, m) => x + annexesFor(db, id, m).reports.length, 0), 0);

  return (
    <section>
      <SectionTitle>Desempeño de empleados</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Promedio de calificaciones" value={<GradeBadge grade={average(evaluations.map((e) => e.grade))} />} />
        <StatCard label="Evaluaciones" value={evaluations.length} />
        <StatCard label="Felicitaciones recibidas" value={praisesTotal} hint="Anexo informativo" />
        <StatCard label="Reportes disciplinarios" value={reportsTotal} hint="Anexo informativo" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title={employeeId ? `Evolución de ${userName(db, employeeId)}` : 'Calificación mensual promedio'}>
          <GradeLines
            data={evolutionMonths.map((m) => ({
              period: m,
              ...(employeeId
                ? { grade: evaluations.find((e) => e.period === m)?.grade ?? null }
                : Object.fromEntries(branches.map((b) => [b.id, average(evaluations.filter((e) => e.period === m && e.branchId === b.id).map((e) => e.grade))]))),
            }))}
            series={employeeId ? [{ key: 'grade', label: 'Calificación', color: '#2f7f82' }] : branches.map((b) => ({ key: b.id, label: b.name, color: BRANCH_COLORS[b.id] }))}
          />
        </Card>
        <Card title="Promedios individuales">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 font-medium">Empleado</th>
                  <th className="py-1 text-right font-medium">Promedio</th>
                  <th className="py-1 text-right font-medium">Felic.</th>
                  <th className="py-1 text-right font-medium">Rep.</th>
                </tr>
              </thead>
              <tbody>
                {people
                  .map((id) => ({ id, avg: average(evaluations.filter((e) => e.employeeId === id).map((e) => e.grade)) }))
                  .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
                  .map(({ id, avg }) => (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="py-1.5">{userName(db, id)}</td>
                      <td className="py-1.5 text-right">
                        <GradeBadge grade={avg} />
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{months.reduce((x, m) => x + annexesFor(db, id, m).praises.length, 0)}</td>
                      <td className="py-1.5 text-right tabular-nums">{months.reduce((x, m) => x + annexesFor(db, id, m).reports.length, 0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="mt-3">
        <ExampleTag>Puntos y ponderaciones de ejemplo</ExampleTag>
      </div>
    </section>
  );
}

function exportCsv(db: MockDb, branch: BranchFilter, range: Required<DateRange>, employeeId: string) {
  const list = filterFeedback(db, { branch, range, employeeId: employeeId || undefined });
  const months = rangeMonths(range);
  const rows: (string | number)[][] = [
    ['Archivo de ejemplo generado por el prototipo (datos falsos)'],
    ['Sucursal', branchName(db, branch === 'all' ? null : branch), 'Desde', range.from, 'Hasta', range.to],
    [],
    ['Satisfacción de clientes'],
    ['Calificación', 'Cantidad', 'Porcentaje'],
    ...ratingDistribution(list).map((d) => [d.label, d.count, `${d.pct}%`]),
    [],
    ['Clientes por cajero en sesión'],
    ['Cajero', 'Calificaciones', 'Excelente', 'Bien', 'Excelente + Bien'],
    ...cashierSummary(db, list).map((c) => [c.name, c.total, c.counts.excelente, c.counts.bien, `${c.satisfiedPct}%`]),
    [],
    ['Desempeño de empleados'],
    ['Empleado', 'Periodo', 'Sucursal', 'Calificación'],
    ...db.performance
      .filter((e) => months.includes(e.period) && (branch === 'all' || e.branchId === branch) && (!employeeId || e.employeeId === employeeId))
      .map((e) => [userName(db, e.employeeId), e.period, branchName(db, e.branchId), e.grade]),
  ];
  downloadCsv('estadisticas-ejemplo.csv', rows);
}
