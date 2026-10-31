import type { FormVersion, Question } from '../mock/types';
import { inputClass } from './ui';

export type Answers = Record<string, number | string>;

interface Props {
  version: FormVersion;
  answers: Answers;
  onChange?: (answers: Answers) => void;
  readOnly?: boolean;
  /** Shows the points of each option (admin and manager views). */
  showPoints?: boolean;
  /** Question ids to skip. */
  skip?: string[];
}

export function FormRenderer({ version, answers, onChange, readOnly, showPoints, skip = [] }: Props) {
  const set = (id: string, value: number | string) => onChange?.({ ...answers, [id]: value });
  const questions = version.questions.filter((q) => !skip.includes(q.id));
  let lastArea: string | undefined;

  return (
    <div className="space-y-5">
      {questions.map((q, index) => {
        const showArea = q.type === 'scored' && q.area && q.area !== lastArea;
        if (q.type === 'scored') lastArea = q.area;
        return (
          <div key={q.id}>
            {showArea && <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-700">{q.area}</div>}
            <QuestionField q={q} index={index} value={answers[q.id]} onChange={(v) => set(q.id, v)} readOnly={readOnly} showPoints={showPoints} />
          </div>
        );
      })}
    </div>
  );
}

function QuestionField({
  q,
  index,
  value,
  onChange,
  readOnly,
  showPoints,
}: {
  q: Question;
  index: number;
  value: number | string | undefined;
  onChange: (v: number | string) => void;
  readOnly?: boolean;
  showPoints?: boolean;
}) {
  const label = (
    <div className="mb-2 font-medium text-slate-800">
      {index + 1}. {q.text}
      {showPoints && q.type === 'scored' && <span className="ml-2 text-xs font-normal text-slate-400">peso {q.weight ?? 1}</span>}
    </div>
  );

  if (q.type === 'scored') {
    return (
      <fieldset>
        <legend className="w-full">{label}</legend>
        <div className="flex flex-wrap gap-2">
          {q.options?.map((o, i) => {
            const on = value === i;
            return (
              <button
                key={i}
                type="button"
                disabled={readOnly}
                aria-pressed={on}
                onClick={() => onChange(i)}
                className={`rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  on
                    ? 'border-accent-600 bg-accent-50 font-medium text-accent-800'
                    : readOnly
                      ? 'border-slate-100 text-slate-400'
                      : 'border-slate-300 text-slate-700 hover:border-slate-400'
                } ${readOnly ? 'cursor-default' : ''}`}
              >
                {o.label}
                {showPoints && <span className="ml-1.5 text-xs text-slate-400">({o.points > 0 ? `+${o.points}` : o.points})</span>}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (q.type === 'select') {
    return (
      <label className="block">
        {label}
        <select className={inputClass} disabled={readOnly} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Elige una opción</option>
          {q.options?.map((o) => (
            <option key={o.label} value={o.label}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (q.type === 'longtext') {
    return (
      <label className="block">
        {label}
        <textarea className={inputClass} rows={3} disabled={readOnly} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  return (
    <label className="block">
      {label}
      <input
        type={q.type === 'datetime' ? 'datetime-local' : 'text'}
        className={inputClass}
        disabled={readOnly}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function allScoredAnswered(version: FormVersion, answers: Answers): boolean {
  return version.questions.filter((q) => q.type === 'scored').every((q) => typeof answers[q.id] === 'number');
}
