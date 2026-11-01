import type { FormDefinition, QuestionOption } from './types';

// All questions, points and weights in this file are EXAMPLES.
// The real questions are delivered by the client.

const performanceScale: QuestionOption[] = [
  { label: 'Excelente', points: 4 },
  { label: 'Bueno', points: 3 },
  { label: 'Regular', points: 2 },
  { label: 'Deficiente', points: 1 },
  { label: 'Muy deficiente', points: 0 },
];

const agreementScale: QuestionOption[] = [
  { label: 'Totalmente de acuerdo', points: 2 },
  { label: 'De acuerdo', points: 1 },
  { label: 'Ni de acuerdo ni en desacuerdo', points: 0 },
  { label: 'En desacuerdo', points: -1 },
  { label: 'Totalmente en desacuerdo', points: -2 },
];

export const FORM_IDS = {
  customer: 'form-customer',
  anonymous: 'form-anonymous',
  performance: 'form-performance',
  disciplinary: 'form-disciplinary',
  act: 'form-act',
} as const;

export const INCIDENT_TYPES = [
  'Retardo',
  'Falta sin justificar',
  'Incumplimiento de un procedimiento',
  'Trato inadecuado a un cliente o compañero',
  'Otro',
];

export function createForms(): FormDefinition[] {
  return [
    {
      id: FORM_IDS.customer,
      type: 'customer',
      name: 'Calificación de clientes (tableta)',
      description:
        'La pregunta, las cinco opciones y lo que aparece según la respuesta los define el documento del cliente.',
      editable: false,
      versions: [
        {
          version: 1,
          createdAt: '2026-07-01T09:00:00',
          questions: [
            {
              id: 'c-rating',
              text: '¿Cómo fue tu experiencia en {sucursal}?',
              type: 'select',
              options: ['Excelente', 'Bien', 'Regular', 'Mal', 'Muy mal'].map((label) => ({ label, points: 0 })),
            },
          ],
        },
      ],
    },
    {
      id: FORM_IDS.anonymous,
      type: 'anonymous',
      name: 'Encuesta anónima: empleados evalúan a la empresa',
      description: 'Cada respuesta suma o resta puntos (reglas de ejemplo). Se promedia por área y por sucursal.',
      editable: true,
      versions: [
        {
          version: 1,
          createdAt: '2026-07-01T09:00:00',
          allowComments: true,
          questions: [
            { id: 'a-env-1', area: 'Ambiente laboral', type: 'scored', weight: 1, text: 'Me siento a gusto trabajando en mi sucursal.', options: agreementScale },
            { id: 'a-env-2', area: 'Ambiente laboral', type: 'scored', weight: 1, text: 'Mis compañeros me apoyan cuando lo necesito.', options: agreementScale },
            { id: 'a-lead-1', area: 'Liderazgo', type: 'scored', weight: 1, text: 'Mi gerente me trata con respeto.', options: agreementScale },
            { id: 'a-lead-2', area: 'Liderazgo', type: 'scored', weight: 1, text: 'Recibo indicaciones claras sobre mi trabajo.', options: agreementScale },
            { id: 'a-tools-1', area: 'Herramientas y recursos', type: 'scored', weight: 1, text: 'Cuento con lo necesario para hacer bien mi trabajo.', options: agreementScale },
            { id: 'a-train-1', area: 'Capacitación', type: 'scored', weight: 1, text: 'Recibo capacitación sobre los productos que vendemos.', options: agreementScale },
          ],
        },
      ],
    },
    {
      id: FORM_IDS.performance,
      type: 'performance',
      name: 'Evaluación de desempeño (gerente a empleado)',
      description:
        'La calificación oficial del mes se calcula solo con este formulario. Tiene dos versiones para mostrar el versionado.',
      editable: true,
      versions: [
        {
          version: 1,
          createdAt: '2026-07-01T09:00:00',
          questions: [
            { id: 'p-cust-1', area: 'Atención al cliente', type: 'scored', weight: 2, text: 'Saluda y atiende al cliente con amabilidad.', options: performanceScale },
            { id: 'p-cust-2', area: 'Atención al cliente', type: 'scored', weight: 1, text: 'Resuelve las dudas del cliente sobre los productos.', options: performanceScale },
            { id: 'p-punct-1', area: 'Puntualidad y asistencia', type: 'scored', weight: 2, text: 'Llega a tiempo y cumple su horario.', options: performanceScale },
            { id: 'p-team-1', area: 'Trabajo en equipo', type: 'scored', weight: 1, text: 'Colabora con sus compañeros.', options: performanceScale },
            { id: 'p-know-1', area: 'Conocimiento del producto', type: 'scored', weight: 1, text: 'Conoce los productos y dónde se encuentran.', options: performanceScale },
          ],
        },
        {
          version: 2,
          createdAt: '2026-09-01T09:00:00',
          questions: [
            { id: 'p-cust-1', area: 'Atención al cliente', type: 'scored', weight: 2, text: 'Saluda y atiende al cliente con amabilidad.', options: performanceScale },
            { id: 'p-cust-2', area: 'Atención al cliente', type: 'scored', weight: 2, text: 'Resuelve las dudas del cliente y le recomienda productos.', options: performanceScale },
            { id: 'p-punct-1', area: 'Puntualidad y asistencia', type: 'scored', weight: 2, text: 'Llega a tiempo y cumple su horario.', options: performanceScale },
            { id: 'p-team-1', area: 'Trabajo en equipo', type: 'scored', weight: 1, text: 'Colabora con sus compañeros.', options: performanceScale },
            { id: 'p-know-1', area: 'Conocimiento del producto', type: 'scored', weight: 1, text: 'Conoce los productos y dónde se encuentran.', options: performanceScale },
            { id: 'p-order-1', area: 'Orden y limpieza', type: 'scored', weight: 1, text: 'Mantiene su área de trabajo ordenada y limpia.', options: performanceScale },
          ],
        },
      ],
    },
    {
      id: FORM_IDS.disciplinary,
      type: 'disciplinary',
      name: 'Reporte disciplinario',
      description:
        'Nombre del empleado, sucursal y gerente se llenan solos. Los campos definitivos salen del formato de la empresa (campos de ejemplo).',
      editable: true,
      versions: [
        {
          version: 1,
          createdAt: '2026-07-01T09:00:00',
          questions: [
            { id: 'd-datetime', type: 'datetime', text: 'Fecha y hora del incidente' },
            { id: 'd-type', type: 'select', text: 'Tipo de incidencia', options: INCIDENT_TYPES.map((label) => ({ label, points: 0 })) },
            { id: 'd-facts', type: 'longtext', text: 'Descripción de los hechos' },
            { id: 'd-notes', type: 'longtext', text: 'Observaciones adicionales' },
          ],
        },
      ],
    },
    {
      id: FORM_IDS.act,
      type: 'act',
      name: 'Acta administrativa',
      description: 'Se genera a partir de un reporte disciplinario. Formato de ejemplo.',
      editable: true,
      versions: [
        {
          version: 1,
          createdAt: '2026-07-01T09:00:00',
          questions: [
            { id: 'act-place', type: 'text', text: 'Lugar donde se levanta el acta' },
            { id: 'act-statement', type: 'longtext', text: 'Declaración del empleado' },
            { id: 'act-witnesses', type: 'text', text: 'Testigos' },
            { id: 'act-agreements', type: 'longtext', text: 'Acuerdos o medidas' },
          ],
        },
      ],
    },
  ];
}
