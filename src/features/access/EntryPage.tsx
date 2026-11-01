import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ClipboardCheck, UserRound } from 'lucide-react';
import { HOME_BY_ROLE } from '../../components/AppLayout';
import { PublicLayout } from '../../components/PublicLayout';
import { Button, Note, Select } from '../../components/ui';
import { branchName } from '../../lib/lookup';
import type { User } from '../../mock/types';
import { useDb, useDemoStore } from '../../store/useDemoStore';

export function EntryPage() {
  const db = useDb();
  const login = useDemoStore((s) => s.login);
  const navigate = useNavigate();
  const employees = db.users.filter((u) => u.role === 'employee' && u.active);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '');

  const enter = (user: User) => {
    login(user.id);
    navigate(HOME_BY_ROLE[user.role]);
  };

  const admin = db.users.find((u) => u.role === 'admin')!;
  const managers = db.users.filter((u) => u.role === 'manager');

  return (
    <PublicLayout>
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Entrar como…</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        En el sistema real cada persona entra con su usuario y contraseña. En este prototipo eliges un tipo de usuario para ver
        lo que vería.
      </p>

      <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-slate-200 p-5">
          <Building2 className="h-8 w-8 text-accent-600" />
          <h2 className="mt-3 text-lg font-semibold">Administrador general</h2>
          <p className="mt-1 flex-1 text-sm text-slate-600">
            Ve todo, de ambas sucursales. Configura formularios, usuarios, tabletas y correos.
          </p>
          <Button size="lg" className="mt-4" onClick={() => enter(admin)}>
            Entrar como {admin.name}
          </Button>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 p-5">
          <ClipboardCheck className="h-8 w-8 text-accent-600" />
          <h2 className="mt-3 text-lg font-semibold">Gerente</h2>
          <p className="mt-1 flex-1 text-sm text-slate-600">
            Evalúa el desempeño, elabora reportes disciplinarios y consulta solo a sus empleados.
          </p>
          <div className="mt-4 space-y-2">
            {managers.map((m) => (
              <Button key={m.id} size="lg" variant="secondary" className="w-full" onClick={() => enter(m)}>
                {branchName(db, m.branchId)} · {m.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 p-5">
          <UserRound className="h-8 w-8 text-accent-600" />
          <h2 className="mt-3 text-lg font-semibold">Empleado</h2>
          <p className="mt-1 flex-1 text-sm text-slate-600">
            Ve sus evaluaciones y su historial, y contesta la encuesta anónima del mes.
          </p>
          <Select className="mt-4" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} aria-label="Empleado">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {branchName(db, e.branchId)}
              </option>
            ))}
          </Select>
          <Button
            size="lg"
            variant="secondary"
            className="mt-2"
            onClick={() => {
              const user = employees.find((e) => e.id === employeeId);
              if (user) enter(user);
            }}
          >
            Entrar como empleado
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/recuperar-cuenta" className="font-medium text-accent-700 hover:underline">
          ¿Olvidaste tu acceso? Recuperar cuenta
        </Link>
        <Link to="/aviso-de-privacidad" className="font-medium text-accent-700 hover:underline">
          Aviso de privacidad
        </Link>
      </div>

      <Note className="mt-8">
        La tableta donde califican los clientes tiene un acceso independiente que no aparece aquí. Se abre desde el panel del
        administrador, en <strong>Tabletas</strong>.
      </Note>
    </PublicLayout>
  );
}
