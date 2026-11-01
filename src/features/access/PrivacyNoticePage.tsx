import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../../components/PublicLayout';
import { Button, ExampleTag } from '../../components/ui';

export function PrivacyNoticePage() {
  const navigate = useNavigate();
  return (
    <PublicLayout>
      <article className="mx-auto max-w-2xl">
        <ExampleTag>Texto de ejemplo; el aviso de privacidad real lo entrega la empresa</ExampleTag>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Aviso de privacidad</h1>
        <div className="mt-4 space-y-4 text-slate-700">
          <p>
            Grupo Inolite usa la información que se registra en este sistema para conocer la opinión de sus clientes, mejorar la
            atención en sus sucursales y dar seguimiento al desempeño de su personal.
          </p>
          <p>
            <strong>Clientes:</strong> calificar es anónimo. Solo se guarda tu teléfono si tú decides escribirlo en el formulario de
            queja, y se usa únicamente para contactarte sobre lo que reportaste.
          </p>
          <p>
            <strong>Personal:</strong> tus evaluaciones y tu expediente solo los ven tú, tu gerente y la administración. Las
            respuestas de la encuesta anónima no se relacionan con tu nombre.
          </p>
          <p>Puedes pedir información sobre el uso de tus datos con la administración de la empresa.</p>
        </div>
        <Button variant="secondary" className="mt-8" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </article>
    </PublicLayout>
  );
}
