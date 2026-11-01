import { Link } from 'react-router-dom';
import { FileText, Frown, Heart, ScrollText } from 'lucide-react';
import { Note } from '../../components/ui';
import { formatDate, formatDateTime } from '../../lib/dates';
import { branchName, ratingLabel } from '../../lib/lookup';
import type { Annexes } from '../../lib/stats';
import { useDb } from '../../store/useDemoStore';

export function AnnexesPanel({ annexes, showNote = true }: { annexes: Annexes; showNote?: boolean }) {
  const db = useDb();
  const empty = annexes.praises.length + annexes.complaints.length + annexes.reports.length === 0;
  return (
    <div className="space-y-4">
      {showNote && (
        <Note>
          Los anexos son <strong>informativos</strong>: no suman ni restan a la calificación oficial, que se calcula solo con el
          formulario de desempeño del gerente.
        </Note>
      )}
      {empty && <p className="text-sm text-slate-500">Sin anexos en este periodo.</p>}

      {annexes.praises.length + annexes.complaints.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Atención al cliente</h3>
          <ul className="space-y-2 text-sm">
            {annexes.praises.map((f) => (
              <li key={f.id} className="flex gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                <Heart className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <strong>Felicitación de cliente</strong> · {branchName(db, f.branchId)} · {formatDateTime(f.createdAt)}
                  {f.comment && <div>«{f.comment}»</div>}
                </div>
              </li>
            ))}
            {annexes.complaints.map((f) => (
              <li key={f.id} className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-900">
                <Frown className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <strong>Queja de cliente</strong> · {ratingLabel(f.rating)} · {branchName(db, f.branchId)} · {formatDateTime(f.createdAt)}
                  <div>«{f.complaint?.whatHappened || 'Sin descripción'}»</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {annexes.reports.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Disciplinario</h3>
          <ul className="space-y-2 text-sm">
            {annexes.reports.map((r) => (
              <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <Link to={`/app/reportes/${r.id}`} className="flex gap-2 hover:text-accent-700">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Reporte disciplinario</strong> · {r.answers['d-type']} · {formatDate(r.createdAt)}
                  </span>
                </Link>
                {annexes.acts
                  .filter((a) => a.reportId === r.id)
                  .map((a) => (
                    <Link key={a.id} to={`/app/actas/${a.id}`} className="ml-6 mt-1 flex gap-2 text-slate-600 hover:text-accent-700">
                      <ScrollText className="mt-0.5 h-4 w-4 shrink-0" /> Acta administrativa · {formatDate(a.createdAt)}
                    </Link>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
