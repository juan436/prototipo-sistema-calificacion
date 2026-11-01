import { Link } from 'react-router-dom';
import { Archive, DatabaseBackup, FileClock, KeyRound, LockKeyhole, ScrollText, UsersRound } from 'lucide-react';
import { Card, Note, PageHeader, ToDefine } from '../../components/ui';

const ITEMS = [
  { icon: LockKeyhole, title: 'Inicio de sesión seguro', text: 'Cada persona entra con su propio usuario y contraseña.' },
  {
    icon: UsersRound,
    title: 'Permisos por tipo de usuario',
    text: 'Administrador, gerente, empleado y tableta de clientes ven solo lo que les corresponde.',
  },
  { icon: DatabaseBackup, title: 'Copias de seguridad automáticas', text: 'La información se respalda sola.', toDefine: 'frecuencia de los respaldos' },
  {
    icon: FileClock,
    title: 'Registro de modificaciones',
    text: 'Cada cambio a una evaluación guarda la calificación original, la nueva, la fecha y hora, el usuario y el motivo.',
  },
  { icon: KeyRound, title: 'Recuperación de cuentas', text: 'Quien olvide su acceso puede recuperarlo.', link: { to: '/recuperar-cuenta', label: 'Ver pantalla' } },
  { icon: Archive, title: 'Conservación del historial', text: 'El historial de cada empleado se conserva aunque cambie de sucursal o se desactive.', toDefine: 'tiempo de conservación de la información' },
  { icon: ScrollText, title: 'Aviso de privacidad', text: 'Visible en el formulario del cliente y en el acceso del personal.', link: { to: '/aviso-de-privacidad', label: 'Ver aviso' } },
];

export function SecurityPage() {
  return (
    <>
      <PageHeader title="Seguridad y conservación" subtitle="Lo que incluirá el sistema real." />
      <Note className="mb-6">Pantalla informativa: en el prototipo nada de esto funciona de verdad (no hay servidor ni base de datos).</Note>
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <div className="flex gap-3">
              <item.icon className="h-6 w-6 shrink-0 text-accent-600" />
              <div>
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                {item.toDefine && (
                  <div className="mt-2">
                    <ToDefine>{item.toDefine}</ToDefine>
                  </div>
                )}
                {item.link && (
                  <Link to={item.link.to} className="mt-2 inline-block text-sm font-medium text-accent-700 hover:underline">
                    {item.link.label}
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
