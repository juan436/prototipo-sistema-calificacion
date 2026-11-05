import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { BranchSelect } from '../../components/filters';
import { Badge, Button, Card, Field, inputClass, Modal, Note, PageHeader, Table, td, th, Select } from '../../components/ui';
import { formatDate, todayIso } from '../../lib/dates';
import { branchName, roleLabel } from '../../lib/lookup';
import type { BranchFilter } from '../../lib/stats';
import type { BranchId, Position } from '../../mock/types';
import { useCurrentUser, useDb, useDemoStore } from '../../store/useDemoStore';

export function UsersPage() {
  const db = useDb();
  const me = useCurrentUser()!;
  const update = useDemoStore((s) => s.update);
  const [branch, setBranch] = useState<BranchFilter>('all');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState<Position>('Ventas');
  const [newBranch, setNewBranch] = useState<BranchId>('ferreisla');
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState<BranchId>('lagloria');

  const users = db.users.filter((u) => branch === 'all' || u.branchId === branch || u.role === 'admin');
  const target = db.users.find((u) => u.id === (deactivating ?? moving));

  const add = () => {
    const next = Math.max(...db.users.filter((u) => /^e\d+$/.test(u.id)).map((u) => Number(u.id.slice(1)))) + 1;
    const id = `e${String(next).padStart(2, '0')}`;
    update((d) => {
      d.users.push({
        id,
        name: name.trim(),
        email: email.trim(),
        role: 'employee',
        position,
        branchId: newBranch,
        active: true,
        branchHistory: [{ branchId: newBranch, from: todayIso() }],
      });
    });
    setAdding(false);
    setName('');
    setEmail('');
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Empleados, gerentes y administración."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus className="h-4 w-4" /> Agregar empleado
          </Button>
        }
      />
      <Note className="mb-6">
        Cada empleado tiene un <strong>identificador único</strong> que une sus evaluaciones, promedio, felicitaciones, reportes e
        historial. No se pierde al cambiar de gerente ni de sucursal, y un usuario desactivado conserva todo su historial.
      </Note>
      <Card>
        <div className="mb-4 max-w-xs">
          <BranchSelect value={branch} onChange={setBranch} />
        </div>
        <Table>
          <thead>
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Nombre</th>
              <th className={th}>Rol</th>
              <th className={th}>Sucursal</th>
              <th className={th}>Correo</th>
              <th className={th}>Estado</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? '' : 'text-slate-400'}>
                <td className={`${td} font-mono text-xs`}>{u.id.toUpperCase()}</td>
                <td className={td}>
                  {u.role === 'employee' ? (
                    <Link to={`/app/empleados/${u.id}`} className="font-medium text-slate-900 hover:text-accent-700">
                      {u.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900">{u.name}</span>
                  )}
                  <div className="text-xs text-slate-500">{u.position}</div>
                </td>
                <td className={td}>{roleLabel(u)}</td>
                <td className={td}>
                  {u.branchId ? branchName(db, u.branchId) : 'Ambas'}
                  {u.branchHistory.length > 1 && (
                    <div className="text-xs text-slate-500">
                      Antes: {u.branchHistory.slice(0, -1).map((h) => branchName(db, h.branchId)).join(', ')} · desde{' '}
                      {formatDate(u.branchHistory[u.branchHistory.length - 1].from)}
                    </div>
                  )}
                </td>
                <td className={`${td} text-xs`}>{u.email}</td>
                <td className={td}>{u.active ? <Badge tone="green">Activo</Badge> : <Badge>Desactivado</Badge>}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {u.role === 'employee' && u.active && (
                    <Button variant="ghost" onClick={() => { setMoving(u.id); setMoveTo(u.branchId === 'ferreisla' ? 'lagloria' : 'ferreisla'); }}>
                      Cambiar de sucursal
                    </Button>
                  )}
                  {u.active && u.id !== me.id && (
                    <Button variant="danger" onClick={() => setDeactivating(u.id)}>
                      Desactivar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Agregar empleado"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={add} disabled={!name.trim() || !email.trim()}>
              Agregar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nombre completo">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre ficticio" />
          </Field>
          <Field label="Correo">
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Puesto">
              <Select value={position} onChange={(e) => setPosition(e.target.value as Position)}>
                <option value="Ventas">Ventas</option>
                <option value="Caja">Caja</option>
                <option value="Administrativo">Administrativo</option>
              </Select>
            </Field>
            <Field label="Sucursal">
              <Select value={newBranch} onChange={(e) => setNewBranch(e.target.value as BranchId)}>
                {db.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal open={!!deactivating} onClose={() => setDeactivating(null)} title="Desactivar usuario"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeactivating(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                update((d) => {
                  const u = d.users.find((x) => x.id === deactivating);
                  if (u) u.active = false;
                });
                setDeactivating(null);
              }}
            >
              Desactivar
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          {target?.name} ya no podrá entrar al sistema. Su historial (evaluaciones, felicitaciones, reportes) se conserva completo.
        </p>
      </Modal>

      <Modal open={!!moving} onClose={() => setMoving(null)} title="Cambiar de sucursal"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoving(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                update((d) => {
                  const u = d.users.find((x) => x.id === moving);
                  if (u) {
                    u.branchId = moveTo;
                    u.branchHistory.push({ branchId: moveTo, from: todayIso() });
                  }
                });
                setMoving(null);
              }}
            >
              Cambiar
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          {target?.name} pasa a la nueva sucursal y a su gerente. Conserva su identificador y todo su historial.
        </p>
        <div className="mt-4">
          <Field label="Nueva sucursal">
            <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value as BranchId)}>
              {db.branches
                .filter((b) => b.id !== target?.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  );
}
