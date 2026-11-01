import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FilePlus2, Printer, ScrollText } from 'lucide-react';
import { FormRenderer, type Answers } from '../../components/FormRenderer';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { NoPermission } from '../../components/RequireRole';
import { Badge, Button, ButtonLink, Card, EmptyState, ExampleTag, Field, inputClass, Note, PageHeader, Table, td, th, Select } from '../../components/ui';
import { formatDate, formatDateTime, nowIso, periodOf } from '../../lib/dates';
import { getVersion, latestVersion, versionLabel } from '../../lib/forms';
import { branchName, userName } from '../../lib/lookup';
import { canCapture, canSeeEmployee } from '../../lib/permissions';
import { FORM_IDS } from '../../mock/forms';
import type { DisciplinaryReport, MockDb } from '../../mock/types';
import { useCurrentUser, useDb, useDemoStore } from '../../store/useDemoStore';

const FIELDS_TAG = 'Campos de ejemplo; los definitivos salen del formato de la empresa';

export function DisciplinaryListPage() {
  const db = useDb();
  const user = useCurrentUser()!;
  const reports = db.disciplinaryReports
    .filter((r) => {
      const employee = db.users.find((u) => u.id === r.employeeId);
      return employee && canSeeEmployee(user, employee);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Reportes disciplinarios y actas"
        subtitle="Se guardan en el expediente del empleado y se pueden imprimir para recabar firmas."
        actions={
          <ButtonLink to="/app/disciplinario/nuevo">
            <FilePlus2 className="h-4 w-4" /> Nuevo reporte
          </ButtonLink>
        }
      />
      <Card>
        {reports.length === 0 ? (
          <EmptyState>No hay reportes disciplinarios.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Empleado</th>
                <th className={th}>Sucursal</th>
                <th className={th}>Tipo de incidencia</th>
                <th className={th}>Elaboró</th>
                <th className={th}>Acta</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const act = db.acts.find((a) => a.reportId === r.id);
                return (
                  <tr key={r.id}>
                    <td className={`${td} whitespace-nowrap`}>{formatDate(r.createdAt)}</td>
                    <td className={td}>
                      <Link to={`/app/empleados/${r.employeeId}`} className="font-medium hover:text-accent-700">
                        {userName(db, r.employeeId)}
                      </Link>
                    </td>
                    <td className={td}>{branchName(db, r.branchId)}</td>
                    <td className={td}>{r.answers['d-type'] || '—'}</td>
                    <td className={td}>{userName(db, r.managerId)}</td>
                    <td className={td}>{act ? <Badge tone="accent">Con acta</Badge> : <span className="text-slate-400">—</span>}</td>
                    <td className={`${td} text-right`}>
                      <ButtonLink to={`/app/reportes/${r.id}`} variant="ghost">
                        Abrir
                      </ButtonLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

export function NewReportPage() {
  const db = useDb();
  const user = useCurrentUser()!;
  const update = useDemoStore((s) => s.update);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const employees = db.users.filter((u) => u.role === 'employee' && u.active && canSeeEmployee(user, u));
  const [employeeId, setEmployeeId] = useState(params.get('empleado') ?? employees[0]?.id ?? '');
  const [answers, setAnswers] = useState<Answers>({ 'd-datetime': nowIso().slice(0, 16) });
  const form = db.forms.find((f) => f.id === FORM_IDS.disciplinary)!;
  const version = latestVersion(form);
  const employee = employees.find((e) => e.id === employeeId);

  const save = () => {
    if (!employee) return;
    const id = `dr-${Date.now().toString(36)}`;
    const incident = String(answers['d-datetime'] || nowIso());
    update((d) => {
      d.disciplinaryReports.push({
        id,
        employeeId: employee.id,
        managerId: user.id,
        branchId: employee.branchId!,
        createdAt: nowIso(),
        period: periodOf(incident),
        formId: form.id,
        formVersion: version.version,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v)])),
      });
    });
    navigate(`/app/reportes/${id}`);
  };

  return (
    <>
      <PageHeader title="Nuevo reporte disciplinario" />
      <div className="mb-4">
        <ExampleTag>{FIELDS_TAG}</ExampleTag>
      </div>
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nombre del empleado" hint={user.role === 'manager' ? 'Solo aparecen tus empleados.' : undefined}>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sucursal">
            <input className={inputClass} disabled value={branchName(db, employee?.branchId)} />
          </Field>
          <Field label="Gerente que elabora">
            <input className={inputClass} disabled value={user.name} />
          </Field>
        </div>
        <div className="mt-6">
          <FormRenderer version={version} answers={answers} onChange={setAnswers} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button size="lg" onClick={save} disabled={!employee}>
            Guardar en el expediente
          </Button>
          <ButtonLink to="/app/disciplinario" variant="secondary" size="lg">
            Cancelar
          </ButtonLink>
        </div>
      </Card>
    </>
  );
}

function useReportAccess(db: MockDb, report: DisciplinaryReport | undefined) {
  const user = useCurrentUser()!;
  const employee = report && db.users.find((u) => u.id === report.employeeId);
  return { user, employee, allowed: !!employee && canSeeEmployee(user, employee) };
}

function SignatureLines({ names }: { names: { role: string; name: string }[] }) {
  return (
    <div className="mt-16 grid grid-cols-2 gap-x-10 gap-y-14 sm:grid-cols-3 print:grid-cols-3">
      {names.map((n, i) => (
        <div key={i} className="text-center text-sm">
          <div className="border-t border-slate-800 pt-2 font-medium text-slate-800">{n.name || ' '}</div>
          <div className="text-slate-500">{n.role}</div>
        </div>
      ))}
    </div>
  );
}

function PrintSheet({ title, children, tag }: { title: string; children: ReactNode; tag: string }) {
  return (
    <div className="print-sheet rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <LogoPlaceholder size="lg" />
          <div>
            <div className="font-semibold text-slate-900">Grupo Inolite S. de R.L. de C.V.</div>
            <div className="text-sm text-slate-500">Ferreisla · Ferretería La Gloria</div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">{tag}</div>
      </div>
      <h1 className="mt-6 text-center text-xl font-semibold uppercase tracking-wide text-slate-900">{title}</h1>
      {children}
      <p className="mt-10 text-center text-xs text-slate-400">Documento de ejemplo generado por el prototipo. Formato por definir con la empresa.</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 whitespace-pre-line text-slate-800">{value || '—'}</div>
    </div>
  );
}

function answerText(type: string, value: string | undefined) {
  if (!value) return '';
  return type === 'datetime' ? formatDateTime(value) : value;
}

export function ReportPage() {
  const { reportId } = useParams();
  const db = useDb();
  const report = db.disciplinaryReports.find((r) => r.id === reportId);
  const { user, employee, allowed } = useReportAccess(db, report);
  if (!report || !employee) return <p>No se encontró el reporte.</p>;
  if (!allowed) return <NoPermission />;
  const form = db.forms.find((f) => f.id === report.formId)!;
  const version = getVersion(form, report.formVersion);
  const acts = db.acts.filter((a) => a.reportId === report.id);

  return (
    <>
      <div className="no-print">
      <PageHeader
        title="Reporte disciplinario"
        subtitle={`${employee.name} · ${formatDate(report.createdAt)}`}
        actions={
          <>
            <ButtonLink to={user.role === 'employee' ? '/app/mi-expediente' : `/app/empleados/${employee.id}`} variant="secondary">
              Ver expediente
            </ButtonLink>
            {canCapture(user) && (
              <ButtonLink to={`/app/actas/nueva?reporte=${report.id}`} variant="secondary">
                <ScrollText className="h-4 w-4" /> Generar acta administrativa
              </ButtonLink>
            )}
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir / guardar como PDF
            </Button>
          </>
        }
      />
      </div>
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <ExampleTag>{FIELDS_TAG}</ExampleTag>
        {acts.map((a) => (
          <Link key={a.id} to={`/app/actas/${a.id}`}>
            <Badge tone="accent">
              <ScrollText className="h-3 w-3" /> Acta del {formatDate(a.createdAt)}
            </Badge>
          </Link>
        ))}
      </div>
      <PrintSheet title="Reporte disciplinario" tag={`Folio ${report.id.toUpperCase()} · ${versionLabel(db, form.id, version.version)}`}>
        <div className="mt-6 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
          <Detail label="Nombre del empleado" value={employee.name} />
          <Detail label="Sucursal" value={branchName(db, report.branchId)} />
          {version.questions.map((q) => (
            <div key={q.id} className={q.type === 'longtext' ? 'sm:col-span-2 print:col-span-2' : ''}>
              <Detail label={q.text} value={answerText(q.type, report.answers[q.id])} />
            </div>
          ))}
          <Detail label="Gerente que elabora" value={userName(db, report.managerId)} />
          <Detail label="Fecha de elaboración" value={formatDateTime(report.createdAt)} />
        </div>
        <SignatureLines
          names={[
            { role: 'Firma del empleado', name: employee.name },
            { role: 'Firma de quien elabora', name: userName(db, report.managerId) },
            { role: 'Testigo', name: '' },
          ]}
        />
      </PrintSheet>
    </>
  );
}

export function NewActPage() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const report = db.disciplinaryReports.find((r) => r.id === params.get('reporte'));
  const { user, employee, allowed } = useReportAccess(db, report);
  const form = db.forms.find((f) => f.id === FORM_IDS.act)!;
  const version = latestVersion(form);
  const [answers, setAnswers] = useState<Answers>(() => ({
    'act-place': report ? `Oficina de la gerencia, ${branchName(db, report.branchId)}` : '',
  }));

  if (!report || !employee) return <p>No se encontró el reporte para generar el acta.</p>;
  if (!allowed || !canCapture(user)) return <NoPermission />;

  const save = () => {
    const id = `aa-${Date.now().toString(36)}`;
    update((d) => {
      d.acts.push({
        id,
        reportId: report.id,
        createdAt: nowIso(),
        createdBy: user.id,
        formId: form.id,
        formVersion: version.version,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v)])),
      });
    });
    navigate(`/app/actas/${id}`);
  };

  return (
    <>
      <PageHeader title="Generar acta administrativa" subtitle={`A partir del reporte del ${formatDate(report.createdAt)} · ${employee.name}`} />
      <div className="mb-4">
        <ExampleTag>Formato de ejemplo; el definitivo sale del formato de la empresa</ExampleTag>
      </div>
      <Note className="mb-4">
        Los datos del reporte (empleado, sucursal, hechos y tipo de incidencia) se copian solos al acta.
      </Note>
      <Card>
        <FormRenderer version={version} answers={answers} onChange={setAnswers} />
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button size="lg" onClick={save}>
            Guardar acta en el expediente
          </Button>
          <ButtonLink to={`/app/reportes/${report.id}`} variant="secondary" size="lg">
            Cancelar
          </ButtonLink>
        </div>
      </Card>
    </>
  );
}

export function ActPage() {
  const { actId } = useParams();
  const db = useDb();
  const act = db.acts.find((a) => a.id === actId);
  const report = act && db.disciplinaryReports.find((r) => r.id === act.reportId);
  const { user, employee, allowed } = useReportAccess(db, report);
  if (!act || !report || !employee) return <p>No se encontró el acta.</p>;
  if (!allowed) return <NoPermission />;
  const form = db.forms.find((f) => f.id === act.formId)!;
  const version = getVersion(form, act.formVersion);
  const reportForm = db.forms.find((f) => f.id === report.formId)!;

  return (
    <>
      <div className="no-print">
      <PageHeader
        title="Acta administrativa"
        subtitle={`${employee.name} · ${formatDate(act.createdAt)}`}
        actions={
          <>
            <ButtonLink to={`/app/reportes/${report.id}`} variant="secondary">
              Ver reporte
            </ButtonLink>
            <ButtonLink to={user.role === 'employee' ? '/app/mi-expediente' : `/app/empleados/${employee.id}`} variant="secondary">
              Ver expediente
            </ButtonLink>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir / guardar como PDF
            </Button>
          </>
        }
      />
      </div>
      <div className="mb-4 no-print">
        <ExampleTag>Formato de ejemplo; el definitivo sale del formato de la empresa</ExampleTag>
      </div>
      <PrintSheet title="Acta administrativa" tag={`Folio ${act.id.toUpperCase()} · ${versionLabel(db, form.id, version.version)}`}>
        <p className="mt-6 text-slate-700">
          En {act.answers['act-place'] || '—'}, el {formatDate(act.createdAt)}, se levanta la presente acta administrativa a{' '}
          <strong>{employee.name}</strong>, de la sucursal {branchName(db, report.branchId)}, con relación a los hechos del reporte
          disciplinario folio {report.id.toUpperCase()}.
        </p>
        <div className="mt-4 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
          {getVersion(reportForm, report.formVersion).questions.map((q) => (
            <div key={q.id} className={q.type === 'longtext' ? 'sm:col-span-2 print:col-span-2' : ''}>
              <Detail label={q.text} value={answerText(q.type, report.answers[q.id])} />
            </div>
          ))}
          {version.questions
            .filter((q) => q.id !== 'act-place')
            .map((q) => (
              <div key={q.id} className={q.type === 'longtext' ? 'sm:col-span-2 print:col-span-2' : ''}>
                <Detail label={q.text} value={answerText(q.type, act.answers[q.id])} />
              </div>
            ))}
          <Detail label="Elaboró" value={userName(db, act.createdBy)} />
        </div>
        <SignatureLines
          names={[
            { role: 'Firma del empleado', name: employee.name },
            { role: 'Firma de quien elabora', name: userName(db, act.createdBy) },
            ...(act.answers['act-witnesses'] || 'Testigo')
              .split(/,| y /)
              .map((w) => w.trim())
              .filter(Boolean)
              .map((w) => ({ role: 'Testigo', name: w === 'Testigo' ? '' : w })),
          ]}
        />
      </PrintSheet>
    </>
  );
}
