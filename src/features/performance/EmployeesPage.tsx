import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Paperclip } from 'lucide-react';
import { BranchSelect } from '../../components/filters';
import { Badge, ButtonLink, Card, GradeBadge, PageHeader, Table, td, th } from '../../components/ui';
import { formatMonth } from '../../lib/dates';
import { branchName } from '../../lib/lookup';
import { canSeeEmployee } from '../../lib/permissions';
import { annexesFor, evaluationsOf, hasAnnexes, historicalAverage, type BranchFilter } from '../../lib/stats';
import { useCurrentUser, useDb } from '../../store/useDemoStore';

export function EmployeesPage() {
  const db = useDb();
  const user = useCurrentUser()!;
  const [branch, setBranch] = useState<BranchFilter>('all');
  const employees = db.users
    .filter((u) => u.role === 'employee' && canSeeEmployee(user, u))
    .filter((u) => branch === 'all' || u.branchId === branch);

  return (
    <>
      <PageHeader
        title={user.role === 'manager' ? 'Mis empleados' : 'Desempeño de empleados'}
        subtitle={
          user.role === 'manager'
            ? `Solo ves al personal de ${branchName(db, user.branchId)}.`
            : 'Calificación oficial mensual: se calcula solo con el formulario de desempeño del gerente.'
        }
        actions={
          <ButtonLink to="/app/desempeno/nueva">
            <ClipboardCheck className="h-4 w-4" /> Evaluar desempeño
          </ButtonLink>
        }
      />
      <Card>
        {user.role === 'admin' && (
          <div className="mb-4 max-w-xs">
            <BranchSelect value={branch} onChange={setBranch} />
          </div>
        )}
        <Table>
          <thead>
            <tr>
              <th className={th}>Empleado</th>
              <th className={th}>Sucursal</th>
              <th className={th}>Última calificación</th>
              <th className={th}>Promedio histórico</th>
              <th className={th}>Anexos</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const evals = evaluationsOf(db, e.id);
              const last = evals[evals.length - 1];
              const annexes = annexesFor(db, e.id);
              return (
                <tr key={e.id}>
                  <td className={td}>
                    <Link to={`/app/empleados/${e.id}`} className="font-medium text-slate-900 hover:text-accent-700">
                      {e.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {e.position} · ID {e.id.toUpperCase()}
                      {!e.active && ' · desactivado'}
                    </div>
                  </td>
                  <td className={td}>
                    {branchName(db, e.branchId)}
                    {e.branchHistory.length > 1 && (
                      <div>
                        <Badge tone="amber">Trasladado</Badge>
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    <GradeBadge grade={last?.grade} />
                    {last && <span className="ml-2 text-xs text-slate-500">{formatMonth(last.period)}</span>}
                  </td>
                  <td className={td}>
                    <GradeBadge grade={historicalAverage(db, e.id)} />
                  </td>
                  <td className={td}>
                    {hasAnnexes(annexes) && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Paperclip className="h-3.5 w-3.5" />
                        {annexes.praises.length} felic. · {annexes.complaints.length} quejas · {annexes.reports.length} rep.
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    <ButtonLink to={`/app/empleados/${e.id}`} variant="ghost">
                      Ver expediente
                    </ButtonLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
