import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PublicLayout } from '../../components/PublicLayout';
import { Button, Field, inputClass, Note } from '../../components/ui';

export function RecoverAccountPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Recuperar cuenta</h1>
        {sent ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <CheckCircle2 className="h-8 w-8" />
            <p className="mt-3 font-medium">Listo. Si el correo está registrado, te llegarán las instrucciones para entrar de nuevo.</p>
            <p className="mt-2 text-sm">En este prototipo no se envía ningún correo.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-slate-600">Escribe el correo con el que entras al sistema y te enviaremos los pasos para recuperar tu acceso.</p>
            <Field label="Correo">
              <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@ejemplo.com" />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Enviar instrucciones
            </Button>
            <Note>Simulado: no se manda ningún correo real. El procedimiento real de recuperación está por definir.</Note>
          </form>
        )}
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent-700 hover:underline">
          Volver a la entrada
        </Link>
      </div>
    </PublicLayout>
  );
}
