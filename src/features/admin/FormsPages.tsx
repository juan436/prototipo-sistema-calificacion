import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, CheckCircle2, Lock, Plus, Trash2 } from 'lucide-react';
import { FormRenderer } from '../../components/FormRenderer';
import { Badge, Button, ButtonLink, Card, ExampleTag, Field, inputClass, Note, PageHeader } from '../../components/ui';
import { formatDate, nowIso } from '../../lib/dates';
import { getVersion, hasResponses, latestVersion, moveItem, saveFormChanges, versionLabel } from '../../lib/forms';
import type { FormDefinition, Question, QuestionType } from '../../mock/types';
import { useDb, useDemoStore } from '../../store/useDemoStore';

const TYPE_LABEL: Record<QuestionType, string> = {
  scored: 'Opción con puntos',
  select: 'Lista de opciones',
  text: 'Texto corto',
  longtext: 'Texto largo',
  datetime: 'Fecha y hora',
};

const DEFAULT_OPTIONS = [
  { label: 'Excelente', points: 4 },
  { label: 'Bueno', points: 3 },
  { label: 'Regular', points: 2 },
  { label: 'Deficiente', points: 1 },
  { label: 'Muy deficiente', points: 0 },
];

function allowedTypes(form: FormDefinition): QuestionType[] {
  if (form.type === 'anonymous' || form.type === 'performance') return ['scored', 'text', 'longtext'];
  return ['text', 'longtext', 'select', 'datetime'];
}

export function FormsListPage() {
  const db = useDb();
  return (
    <>
      <PageHeader
        title="Formularios"
        subtitle="Un formulario por tipo, sin departamentos. Se agregan, quitan y reordenan preguntas sin programador."
      />
      <Note className="mb-6">
        <strong>Versionado:</strong> un formulario que ya tiene respuestas no se edita. Al guardar cambios se crea una versión
        nueva y la anterior queda intacta. Cada evaluación guarda la versión con la que se hizo.
      </Note>
      <div className="grid gap-4 md:grid-cols-2">
        {db.forms.map((form) => (
          <Card key={form.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-900">{form.name}</h2>
              <Badge tone="accent">v{latestVersion(form).version}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">{form.description}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-500">
              {form.versions.map((v) => (
                <li key={v.version}>
                  {versionLabel(db, form.id, v.version)} · {v.questions.length} preguntas
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ButtonLink to={`/app/formularios/${form.id}`} variant={form.editable ? 'primary' : 'secondary'}>
                {form.editable ? 'Ver y editar' : 'Ver'}
              </ButtonLink>
              {!form.editable && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> Definido por el documento del cliente
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function FormEditorPage() {
  const { formId } = useParams();
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const form = db.forms.find((f) => f.id === formId);
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>(() => (form ? structuredClone(latestVersion(form).questions) : []));
  const [allowComments, setAllowComments] = useState(() => (form ? !!latestVersion(form).allowComments : false));
  const [saved, setSaved] = useState<string | null>(null);

  if (!form) return <p>No se encontró el formulario.</p>;
  const latest = latestVersion(form);
  const latestUsed = hasResponses(db, form.id, latest.version);
  const shown = viewVersion ? getVersion(form, viewVersion) : null;
  const scoredForm = form.type === 'anonymous' || form.type === 'performance';

  const change = (index: number, patch: Partial<Question>) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
    setSaved(null);
  };

  const addQuestion = () => {
    const type: QuestionType = scoredForm ? 'scored' : 'text';
    setQuestions((qs) => [
      ...qs,
      {
        id: `q-${Date.now().toString(36)}`,
        text: 'Nueva pregunta',
        type,
        ...(type === 'scored' ? { area: qs[qs.length - 1]?.area ?? 'General', weight: 1, options: structuredClone(DEFAULT_OPTIONS) } : {}),
      },
    ]);
    setSaved(null);
  };

  const save = () => {
    const result = saveFormChanges(form, questions, latestUsed, nowIso(), form.type === 'anonymous' ? allowComments : undefined);
    update((d) => {
      d.forms = d.forms.map((f) => (f.id === form.id ? result.form : f));
    });
    setSaved(
      result.createdNewVersion
        ? `Se creó la versión ${latest.version + 1}. La versión ${latest.version} queda intacta y lo que se contestó con ella se sigue viendo con sus preguntas y puntos.`
        : `Se actualizó la versión ${latest.version}, que todavía no tenía respuestas.`,
    );
  };

  return (
    <>
      <PageHeader
        title={form.name}
        subtitle={form.description}
        actions={<ButtonLink to="/app/formularios" variant="secondary">Volver a formularios</ButtonLink>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <ExampleTag />
        <ExampleTag>Puntos y ponderaciones de ejemplo</ExampleTag>
      </div>

      <Card title="Versiones" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {form.versions.map((v) => (
            <button
              key={v.version}
              type="button"
              onClick={() => setViewVersion(viewVersion === v.version ? null : v.version)}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${viewVersion === v.version ? 'border-accent-600 bg-accent-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="font-medium text-slate-800">{versionLabel(db, form.id, v.version)}</div>
              <div className="text-xs text-slate-500">Creada el {formatDate(v.createdAt)}</div>
            </button>
          ))}
        </div>
        {shown && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Lock className="h-4 w-4" /> {versionLabel(db, form.id, shown.version)} · solo lectura
            </div>
            <FormRenderer version={shown} answers={{}} readOnly showPoints />
          </div>
        )}
      </Card>

      {!form.editable ? (
        <Note>
          Este formulario no se edita en el prototipo: la pregunta, las cinco opciones y lo que aparece según la respuesta los
          define el documento del cliente. Si el cliente quiere poder cambiarlo, está por definir.
        </Note>
      ) : (
        <Card
          title={`Editar (a partir de la versión ${latest.version})`}
          actions={
            latestUsed ? (
              <Badge tone="amber">La versión {latest.version} ya tiene respuestas: al guardar se crea la versión {latest.version + 1}</Badge>
            ) : (
              <Badge tone="green">La versión {latest.version} no tiene respuestas: se actualiza</Badge>
            )
          }
        >
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="mt-2.5 w-6 text-sm font-semibold text-slate-400">{i + 1}.</span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <input className={inputClass} value={q.text} onChange={(e) => change(i, { text: e.target.value })} aria-label="Texto de la pregunta" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Tipo">
                        <select
                          className={inputClass}
                          value={q.type}
                          onChange={(e) => {
                            const type = e.target.value as QuestionType;
                            change(i, {
                              type,
                              options: type === 'scored' || type === 'select' ? q.options ?? structuredClone(DEFAULT_OPTIONS) : undefined,
                              area: type === 'scored' ? q.area ?? 'General' : undefined,
                              weight: type === 'scored' ? q.weight ?? 1 : undefined,
                            });
                          }}
                        >
                          {allowedTypes(form).map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {q.type === 'scored' && (
                        <>
                          <Field label="Área">
                            <input className={inputClass} value={q.area ?? ''} onChange={(e) => change(i, { area: e.target.value })} />
                          </Field>
                          <Field label="Peso">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className={inputClass}
                              value={q.weight ?? 1}
                              onChange={(e) => change(i, { weight: Number(e.target.value) })}
                            />
                          </Field>
                        </>
                      )}
                    </div>
                    {(q.type === 'scored' || q.type === 'select') && (
                      <div>
                        <div className="mb-1 text-sm font-medium text-slate-700">Opciones{q.type === 'scored' && ' y puntos (pueden ser negativos para restar)'}</div>
                        <div className="space-y-2">
                          {q.options?.map((o, oi) => (
                            <div key={oi} className="flex gap-2">
                              <input
                                className={inputClass}
                                value={o.label}
                                onChange={(e) => change(i, { options: q.options!.map((x, xi) => (xi === oi ? { ...x, label: e.target.value } : x)) })}
                                aria-label="Opción"
                              />
                              {q.type === 'scored' && (
                                <input
                                  type="number"
                                  className={`${inputClass} w-24`}
                                  value={o.points}
                                  onChange={(e) =>
                                    change(i, { options: q.options!.map((x, xi) => (xi === oi ? { ...x, points: Number(e.target.value) } : x)) })
                                  }
                                  aria-label="Puntos"
                                />
                              )}
                              <button
                                type="button"
                                className="rounded-lg px-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30"
                                disabled={(q.options?.length ?? 0) <= 2}
                                onClick={() => change(i, { options: q.options!.filter((_, xi) => xi !== oi) })}
                                aria-label="Quitar opción"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          className="mt-1"
                          onClick={() => change(i, { options: [...(q.options ?? []), { label: 'Nueva opción', points: 0 }] })}
                        >
                          <Plus className="h-4 w-4" /> Agregar opción
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 sm:flex-col">
                    <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={i === 0} onClick={() => setQuestions((qs) => moveItem(qs, i, -1))} aria-label="Subir">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={i === questions.length - 1} onClick={() => setQuestions((qs) => moveItem(qs, i, 1))} aria-label="Bajar">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => setQuestions((qs) => qs.filter((_, x) => x !== i))} aria-label="Quitar pregunta">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={addQuestion}>
              <Plus className="h-4 w-4" /> Agregar pregunta
            </Button>
            {form.type === 'anonymous' && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-accent-600" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
                Incluir campo de comentarios anónimos
              </label>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <Button size="lg" onClick={save} disabled={questions.length === 0}>
              {latestUsed ? `Guardar como versión ${latest.version + 1}` : 'Guardar cambios'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setQuestions(structuredClone(latestVersion(form).questions));
                setSaved(null);
              }}
            >
              Descartar cambios
            </Button>
          </div>
          {saved && (
            <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> {saved}
            </div>
          )}
        </Card>
      )}
      {form.type === 'performance' && <p className="mt-6 text-sm text-slate-500">
        ¿Quieres ver un histórico con su versión? Abre una evaluación de julio o agosto desde{' '}
        <Link to="/app/desempeno" className="text-accent-700 underline">
          Desempeño de empleados
        </Link>
        .
      </p>}
    </>
  );
}
