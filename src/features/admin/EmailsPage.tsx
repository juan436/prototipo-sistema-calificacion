import { useState } from 'react';
import { Mail } from 'lucide-react';
import { EMAIL_KIND_LABEL, emailContent } from '../../components/EmailPreview';
import { Button, Card, Field, inputClass, Note, PageHeader, Table, td, th, ToDefine } from '../../components/ui';
import { formatDateTime } from '../../lib/dates';
import { useDb, useDemoStore } from '../../store/useDemoStore';

const EVENTS = [
  { event: 'Queja de cliente', to: 'Administrador', when: 'Inmediato' },
  { event: 'Calificación «Muy mal»', to: 'Administrador', when: 'Inmediato' },
  { event: 'Resumen de satisfacción', to: 'Administración', when: 'Mensual' },
  { event: 'Resultados de empleados a empresa', to: 'Administración', when: 'Al cerrar el periodo' },
  { event: 'Evaluación de desempeño', to: 'Empleado evaluado', when: 'Al confirmar la evaluación' },
  { event: 'Modificación de evaluación', to: 'Empleado evaluado', when: 'Al confirmar el cambio' },
];

export function EmailsPage() {
  const db = useDb();
  const update = useDemoStore((s) => s.update);
  const openEmail = useDemoStore((s) => s.openEmail);
  const [adminEmail, setAdminEmail] = useState(db.settings.adminEmail);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Correos" subtitle="Correos automáticos del sistema. En el prototipo no se envía nada: se muestra una vista previa." />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Eventos que envían correo">
          <Table>
            <thead>
              <tr>
                <th className={th}>Evento</th>
                <th className={th}>Destinatario</th>
                <th className={th}>Momento</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e) => (
                <tr key={e.event}>
                  <td className={`${td} font-medium`}>{e.event}</td>
                  <td className={td}>{e.to}</td>
                  <td className={td}>{e.when}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-3 flex flex-wrap gap-2">
            <ToDefine>destinatario real de cada correo</ToDefine>
            <ToDefine>cuántas personas reciben cada correo</ToDefine>
          </div>
        </Card>

        <Card title="Destinatario de los correos administrativos">
          <Field label="Correo" hint="Se usa para alertas, resúmenes y resultados.">
            <input
              type="email"
              className={inputClass}
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value);
                setSaved(false);
              }}
            />
          </Field>
          <Button
            className="mt-3"
            disabled={!adminEmail.trim()}
            onClick={() => {
              update((d) => {
                d.settings.adminEmail = adminEmail.trim();
              });
              setSaved(true);
            }}
          >
            Guardar
          </Button>
          {saved && <p className="mt-2 text-sm text-emerald-700">Guardado. Los correos nuevos usan este destinatario.</p>}
        </Card>
      </div>

      <Card title="Bandeja de correos simulados" className="mt-6">
        <Note className="mb-4">Aquí aparece cada correo que el sistema real enviaría. Ábrelo para ver la vista previa.</Note>
        <Table>
          <thead>
            <tr>
              <th className={th}>Fecha</th>
              <th className={th}>Tipo</th>
              <th className={th}>Para</th>
              <th className={th}>Asunto</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {db.outbox.map((e) => {
              const content = emailContent(db, e);
              if (!content) return null;
              return (
                <tr key={e.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(e.createdAt)}</td>
                  <td className={td}>{EMAIL_KIND_LABEL[e.kind]}</td>
                  <td className={`${td} text-xs`}>{content.to}</td>
                  <td className={td}>{content.subject}</td>
                  <td className={`${td} text-right`}>
                    <Button variant="ghost" onClick={() => openEmail(e.id)}>
                      <Mail className="h-4 w-4" /> Ver
                    </Button>
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
