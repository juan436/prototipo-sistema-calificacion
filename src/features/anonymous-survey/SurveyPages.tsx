import { useState } from 'react';
import { CheckCircle2, Lock, Mail, Plus } from 'lucide-react';
import { GradeLines, GroupedBars } from '../../components/charts';
import { EmailPreviewCard } from '../../components/EmailPreview';
import { BranchSelect } from '../../components/filters';
import { FormRenderer, type Answers } from '../../components/FormRenderer';
import { Badge, Button, Card, EmptyState, ExampleTag, Field, GradeBadge, inputClass, Modal, Note, PageHeader, StatCard, Table, td, th, ToDefine, Select } from '../../components/ui';
import { formatDate } from '../../lib/dates';
import { branchAt } from '../../lib/employees';
import { latestVersion } from '../../lib/forms';
import { BRANCH_COLORS } from '../../lib/lookup';
import { eligibleStaff, surveyResult, type BranchFilter } from '../../lib/stats';
import { FORM_IDS } from '../../mock/forms';
import { useCurrentUser, useDb, useDemoStore } from '../../store/useDemoStore';

const ANONYMITY_NOTE = 'Se sabe quién participó, pero no qué contestó cada persona.';

// ---------------- Employee ----------------

export function EmployeeSurveyPage() {
  const db = useDb();
  const user = useCurrentUser()!;
  const update = useDemoStore((s) => s.update);
  const [answers, setAnswers] = useState<Answers>({});
  const [comment, setComment] = useState('');
  const [justSent, setJustSent] = useState(false);

  const period = db.surveyPeriods.find((p) => p.status === 'open');
  const form = db.forms.find((f) => f.id === FORM_IDS.anonymous)!;
  const version = latestVersion(form);
  const participated = period && db.participation.some((p) => p.periodId === period.id && p.employeeId === user.id);

  const submit = () => {
    if (!period || participated) return;
    const branchId = branchAt(user, period.opensAt) ?? user.branchId!;
    const numeric = Object.fromEntries(Object.entries(answers).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
    update((d) => {
      // Two separate collections: who took part, and what was answered (with no data about the person).
      d.participation.push({ periodId: period.id, employeeId: user.id });
      d.anonymousResponses.push({
        id: `ar-${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
        periodId: period.id,
        branchId,
        formId: form.id,
        formVersion: version.version,
        answers: numeric,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
    });
    setJustSent(true);
  };

  if (!period) {
    return (
      <>
        <PageHeader title="Evaluación del mes" />
        <EmptyState>No hay ninguna evaluación disponible por ahora. Te avisaremos cuando se abra la siguiente.</EmptyState>
      </>
    );
  }

  if (participated) {
    return (
      <>
        <PageHeader title="Evaluación del mes" subtitle={period.name} />
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-900">
          <CheckCircle2 className="mx-auto h-12 w-12" />
          <h2 className="mt-3 text-xl font-semibold">{justSent ? '¡Gracias! Tu evaluación se envió' : 'Ya participaste'}</h2>
          <p className="mt-2">
            Ya enviaste tu evaluación de {period.name.toLowerCase()}. Tus respuestas son anónimas y no se pueden consultar, ni
            siquiera desde tu cuenta.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Evaluación del mes" subtitle={`${period.name} · abierta del ${formatDate(period.opensAt)} al ${formatDate(period.closesAt)}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <ExampleTag />
      </div>
      <Note className="mb-6">
        <strong>Es anónima.</strong> Se guarda que participaste, pero tus respuestas se guardan aparte y sin tu nombre. Solo puedes
        enviar una por periodo.
      </Note>
      <Card>
        <FormRenderer version={version} answers={answers} onChange={setAnswers} />
        {version.allowComments && (
          <div className="mt-6">
            <Field label="Comentarios anónimos" optional>
              <textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button size="lg" onClick={submit}>
            Enviar evaluación
          </Button>
          <span className="text-sm text-slate-500">
            Una vez enviada no se puede cambiar. <ToDefine>si contestar todas las preguntas es obligatorio</ToDefine>
          </span>
        </div>
      </Card>
    </>
  );
}

// ---------------- Admin ----------------

type Tab = 'periods' | 'participation' | 'results';

export function SurveyAdminPage() {
  const [tab, setTab] = useState<Tab>('results');
  const tabs: { id: Tab; label: string }[] = [
    { id: 'results', label: 'Resultados' },
    { id: 'participation', label: 'Participación' },
    { id: 'periods', label: 'Periodos' },
  ];
  return (
    <>
      <PageHeader title="Encuesta anónima" subtitle="Los empleados evalúan a la empresa. Una respuesta por persona y periodo." />
      <Note className="mb-6">
        <strong>{ANONYMITY_NOTE}</strong> La lista de participación y las respuestas se guardan por separado, y las respuestas no
        contienen ningún dato del empleado.
      </Note>
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'periods' && <PeriodsTab />}
      {tab === 'participation' && <ParticipationTab />}
      {tab === 'results' && <ResultsTab />}
    </>
  );
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const db = useDb();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">Periodo</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {[...db.surveyPeriods].reverse().map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.status === 'open' ? '(abierto)' : ''}
          </option>
        ))}
      </Select>
    </label>
  );
}

function PeriodsTab() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const queueEmail = useDemoStore((s) => s.queueEmail);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [name, setName] = useState('Noviembre 2026');
  const [opensAt, setOpensAt] = useState('2026-11-23');
  const [closesAt, setClosesAt] = useState('2026-12-04');
  const open = db.surveyPeriods.find((p) => p.status === 'open');

  return (
    <>
      <Card
        title="Periodos"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Crear periodo
          </Button>
        }
      >
        <Table>
          <thead>
            <tr>
              <th className={th}>Periodo</th>
              <th className={th}>Apertura</th>
              <th className={th}>Cierre</th>
              <th className={th}>Estado</th>
              <th className={th}>Participación</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {[...db.surveyPeriods].reverse().map((p) => {
              const r = surveyResult(db, p.id);
              const email = db.outbox.find((e) => e.kind === 'survey_results' && e.refId === p.id);
              return (
                <tr key={p.id}>
                  <td className={`${td} font-medium`}>{p.name}</td>
                  <td className={td}>{formatDate(p.opensAt)}</td>
                  <td className={td}>{formatDate(p.closesAt)}</td>
                  <td className={td}>{p.status === 'open' ? <Badge tone="green">Abierto</Badge> : <Badge>Cerrado</Badge>}</td>
                  <td className={`${td} tabular-nums`}>
                    {r.participants} de {r.eligible} ({r.participationPct}%)
                  </td>
                  <td className={`${td} text-right`}>
                    {p.status === 'open' ? (
                      <Button variant="secondary" onClick={() => setClosing(p.id)}>
                        Cerrar periodo
                      </Button>
                    ) : (
                      email && (
                        <Button variant="ghost" onClick={() => useDemoStore.getState().openEmail(email.id)}>
                          <Mail className="h-4 w-4" /> Correo
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div className="mt-3 flex flex-wrap gap-2">
          <ToDefine>duración del periodo</ToDefine>
          <ToDefine>día de apertura</ToDefine>
          <ToDefine>si el periodo se cierra solo en la fecha de cierre</ToDefine>
        </div>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Crear periodo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            {!open && (
              <Button
                disabled={!name.trim() || !opensAt || !closesAt || closesAt < opensAt}
                onClick={() => {
                  update((d) => {
                    d.surveyPeriods.push({ id: `sp-${Date.now().toString(36)}`, name: name.trim(), opensAt, closesAt, status: 'open' });
                  });
                  setCreating(false);
                }}
              >
                Crear y abrir
              </Button>
            )}
          </>
        }
      >
        {open ? (
          <Note tone="warning">Hay un periodo abierto ({open.name}). En el prototipo se cierra antes de crear otro.</Note>
        ) : (
          <div className="space-y-4">
            <Field label="Nombre">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha de apertura">
                <input type="date" className={inputClass} value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              </Field>
              <Field label="Fecha de cierre">
                <input type="date" className={inputClass} value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
              </Field>
            </div>
            <p className="text-sm text-slate-500">
              La duración y el día de apertura están <strong>por definir</strong>; aquí se capturan a mano.
            </p>
          </div>
        )}
      </Modal>

      <Modal open={!!closing} onClose={() => setClosing(null)} title="Cerrar periodo"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClosing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const id = closing!;
                update((d) => {
                  const p = d.surveyPeriods.find((x) => x.id === id);
                  if (p) p.status = 'closed';
                });
                queueEmail('survey_results', id, true);
                setClosing(null);
              }}
            >
              Cerrar y ver el correo
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Al cerrar, ya nadie puede enviar su evaluación de este periodo y se envía automáticamente el correo con los resultados a
          la administración.
        </p>
      </Modal>
    </>
  );
}

function ParticipationTab() {
  const db = useDb();
  const [periodId, setPeriodId] = useState(db.surveyPeriods.find((p) => p.status === 'open')?.id ?? db.surveyPeriods[db.surveyPeriods.length - 1].id);

  return (
    <>
      <div className="mb-4 max-w-xs">
        <PeriodSelect value={periodId} onChange={setPeriodId} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {db.branches.map((b) => {
          const staff = eligibleStaff(db, periodId, b.id);
          const done = new Set(db.participation.filter((p) => p.periodId === periodId).map((p) => p.employeeId));
          const count = staff.filter((s) => done.has(s.id)).length;
          return (
            <Card key={b.id} title={b.name} actions={<Badge tone="accent">{staff.length ? Math.round((count / staff.length) * 100) : 0}% de participación</Badge>}>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-accent-500" style={{ width: `${staff.length ? (count / staff.length) * 100 : 0}%` }} />
              </div>
              <ul className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{s.name}</span>
                    {done.has(s.id) ? <Badge tone="green">Ya evaluó</Badge> : <Badge tone="amber">Pendiente</Badge>}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <Lock className="h-4 w-4" /> Esta lista no permite saber qué contestó cada persona.
      </p>
    </>
  );
}

function ResultsTab() {
  const db = useDb();
  const closed = db.surveyPeriods.filter((p) => p.status === 'closed');
  const [periodId, setPeriodId] = useState(closed[closed.length - 1]?.id ?? db.surveyPeriods[0].id);
  const [branch, setBranch] = useState<BranchFilter>('all');
  const [preview, setPreview] = useState(false);
  const period = db.surveyPeriods.find((p) => p.id === periodId)!;
  const result = surveyResult(db, periodId, branch);

  const areaData = result.areas.map((a) => ({
    area: a.area,
    ...Object.fromEntries(db.branches.map((b) => [b.id, surveyResult(db, periodId, b.id).areas.find((x) => x.area === a.area)?.grade ?? null])),
  }));

  const history = db.surveyPeriods
    .filter((p) => p.opensAt <= period.opensAt)
    .map((p) => ({
      period: p.name.replace(' 2026', ''),
      all: surveyResult(db, p.id).average,
      ...Object.fromEntries(db.branches.map((b) => [b.id, surveyResult(db, p.id, b.id).average])),
    }));

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PeriodSelect value={periodId} onChange={setPeriodId} />
        <BranchSelect value={branch} onChange={setBranch} />
        <div className="flex items-end">
          <Button variant="secondary" onClick={() => setPreview(true)}>
            <Mail className="h-4 w-4" /> Vista previa del correo de cierre
          </Button>
        </div>
      </div>
      {period.status === 'open' && <Note tone="warning" className="mb-4">Este periodo sigue abierto: los resultados son parciales.</Note>}
      <div className="mb-4 flex flex-wrap gap-2">
        <ExampleTag>Puntos y reglas de cálculo de ejemplo</ExampleTag>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Participantes" value={result.participants} hint={`de ${result.eligible} empleados`} />
        <StatCard label="Participación" value={`${result.participationPct}%`} />
        <StatCard label="Promedio general" value={<GradeBadge grade={result.average} />} hint="Escala de 0 a 10 (ejemplo)" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Calificación por área y sucursal">
          <GroupedBars
            data={areaData}
            xKey="area"
            domain={[0, 10]}
            series={db.branches.filter((b) => branch === 'all' || b.id === branch).map((b) => ({ key: b.id, label: b.name, color: BRANCH_COLORS[b.id] }))}
          />
        </Card>
        <Card title="Comparación con meses anteriores">
          <GradeLines
            data={history}
            series={[
              ...(branch === 'all' ? [{ key: 'all', label: 'Ambas', color: '#334155' }] : []),
              ...db.branches.filter((b) => branch === 'all' || b.id === branch).map((b) => ({ key: b.id, label: b.name, color: BRANCH_COLORS[b.id] })),
            ]}
          />
        </Card>
      </div>
      <Card title="Comentarios anónimos" className="mt-4">
        {result.comments.length ? (
          <ul className="space-y-2">
            {result.comments.map((c, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                «{c}»
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Sin comentarios en este periodo.</p>
        )}
        <p className="mt-3 text-xs text-slate-500">{ANONYMITY_NOTE}</p>
      </Card>
      <Modal open={preview} onClose={() => setPreview(false)} title="Vista previa del correo de cierre" size="xl">
        <EmailPreviewCard email={{ kind: 'survey_results', refId: periodId }} />
      </Modal>
    </>
  );
}
