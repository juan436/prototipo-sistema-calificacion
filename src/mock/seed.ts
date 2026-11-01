import { branchAt, staffAt } from '../lib/employees';
import { computeScore } from '../lib/scoring';
import { BRANCHES } from './branches';
import { createForms, FORM_IDS } from './forms';
import { createRandom } from './random';
import type {
  ActivationCode,
  AdministrativeAct,
  AnonymousResponse,
  BranchId,
  CustomerFeedback,
  DisciplinaryReport,
  EmailMessage,
  MockDb,
  Participation,
  PerformanceEvaluation,
  Rating,
  SurveyPeriod,
  Tablet,
  User,
} from './types';
import {
  ADMIN_ID,
  ANNEX_EMPLOYEE_ID,
  createUsers,
  MANAGER_FERREISLA_ID,
  MANAGER_LAGLORIA_ID,
  MODIFIED_EMPLOYEE_ID,
} from './users';

export const DEMO_TODAY = '2026-10-31';
export const EXAMPLE_ACTIVATION_CODE = 'FI-73K9Q';

const pad = (n: number) => String(n).padStart(2, '0');

export function managerOf(branchId: BranchId): string {
  return branchId === 'ferreisla' ? MANAGER_FERREISLA_ID : MANAGER_LAGLORIA_ID;
}

const PRAISE_COMMENTS = [
  'Me atendieron muy rápido.',
  'Muy amables, me explicaron cómo usar la herramienta.',
  'Encontré todo lo que buscaba.',
  'Excelente servicio, volveré pronto.',
  'Me ayudaron a cargar el material hasta el auto.',
  'Buena atención y buenos precios.',
  'Muy ordenada la tienda.',
];

const PERFORMANCE_OBSERVATIONS = [
  'Buen mes en general.',
  'Mejoró en la atención en caja.',
  'Debe reforzar el conocimiento de la nueva línea de pinturas.',
  'Apoyó en el inventario del mes.',
  'Mantener la puntualidad.',
  'Muy buena disposición con los clientes.',
];

const PERFORMANCE_COMMENTS = [
  'Sigue así.',
  'Platicamos sobre las metas del próximo mes.',
  'Te propongo tomar el curso de productos eléctricos.',
  'Gracias por tu apoyo en temporada alta.',
  '',
];

const ANONYMOUS_COMMENTS = [
  'Me gustaría recibir más capacitación sobre productos nuevos.',
  'El ambiente con los compañeros es muy bueno.',
  'Hace falta otra persona en caja los sábados.',
  'Las indicaciones a veces llegan tarde.',
  'Me gustaría que el horario de comida fuera más fijo.',
  'Gracias por el apoyo en los días de inventario.',
  'Faltan escaleras en el área de bodega.',
];

function iso(date: string, hour: number, minute: number): string {
  return `${date}T${pad(hour)}:${pad(minute)}:00`;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function createTablets(): { tablets: Tablet[]; codes: ActivationCode[] } {
  const tablets: Tablet[] = [
    { id: 't1', name: 'Tableta de mostrador · Ferreisla', branchId: 'ferreisla', status: 'authorized', createdAt: '2026-07-20T10:00:00' },
    { id: 't2', name: 'Tableta de mostrador · La Gloria', branchId: 'lagloria', status: 'authorized', createdAt: '2026-07-20T11:00:00' },
    { id: 't3', name: 'Tableta de caja · Ferreisla', branchId: 'ferreisla', status: 'revoked', createdAt: '2026-07-21T09:30:00' },
  ];
  const codes: ActivationCode[] = [
    { code: 'FI-2M8XP', branchId: 'ferreisla', createdAt: '2026-07-20T09:55:00', usedAt: '2026-07-20T10:00:00', tabletId: 't1' },
    { code: 'LG-9QW4T', branchId: 'lagloria', createdAt: '2026-07-20T10:50:00', usedAt: '2026-07-20T11:00:00', tabletId: 't2' },
    { code: 'FI-5RT2H', branchId: 'ferreisla', createdAt: '2026-07-21T09:20:00', usedAt: '2026-07-21T09:30:00', tabletId: 't3' },
    { code: EXAMPLE_ACTIVATION_CODE, branchId: 'ferreisla', createdAt: '2026-10-30T16:00:00' },
  ];
  return { tablets, codes };
}

function createCustomerFeedback(users: User[]): CustomerFeedback[] {
  const rnd = createRandom(20260801);
  const records: Omit<CustomerFeedback, 'id'>[] = [];
  const start = '2026-08-01';
  const totalDays = 91; // August 1 to October 30

  for (const branch of BRANCHES) {
    for (let i = 0; i < 48; i++) {
      const date = addDays(start, rnd.int(0, totalDays - 1));
      const rating = rnd.weighted<Rating>([
        ['excelente', 40],
        ['bien', 30],
        ['regular', 18],
        ['mal', 12],
      ]);
      const tabletId =
        branch.id === 'lagloria' ? 't2' : date < '2026-09-30' && rnd.next() < 0.3 ? 't3' : 't1';
      const record: Omit<CustomerFeedback, 'id'> = {
        branchId: branch.id,
        tabletId,
        createdAt: iso(date, rnd.int(9, 18), rnd.int(0, 59)),
        rating,
        praisedEmployeeIds: [],
      };
      if (rating === 'excelente') {
        const staff = staffAt(users, branch.id, date).filter((u) => u.id !== ANNEX_EMPLOYEE_ID);
        if (rnd.next() < 0.6) {
          const first = rnd.pick(staff);
          record.praisedEmployeeIds.push(first.id);
          if (rnd.next() < 0.25) {
            const second = rnd.pick(staff.filter((s) => s.id !== first.id));
            record.praisedEmployeeIds.push(second.id);
          }
        }
        if (rnd.next() < 0.45) record.comment = rnd.pick(PRAISE_COMMENTS);
      }
      records.push(record);
    }
  }

  // Hand-written cases so the demo always shows the same alerts and annexes.
  records.push(
    {
      branchId: 'ferreisla',
      tabletId: 't1',
      createdAt: '2026-08-22T13:40:00',
      rating: 'muy_mal',
      praisedEmployeeIds: [],
      complaint: {
        employeeId: 'e06',
        whatHappened: 'Esperé mucho tiempo en la caja y al final no me entregaron mi ticket.',
        phone: '555 010 2233',
      },
    },
    {
      branchId: 'lagloria',
      tabletId: 't2',
      createdAt: '2026-10-12T17:05:00',
      rating: 'muy_mal',
      praisedEmployeeIds: [],
      complaint: { whatHappened: 'No había el producto que anunciaron y nadie me supo explicar por qué.' },
    },
    {
      branchId: 'ferreisla',
      tabletId: 't1',
      createdAt: '2026-09-08T11:15:00',
      rating: 'mal',
      praisedEmployeeIds: [],
      complaint: { employeeId: 'e04', whatHappened: 'Me cobraron un precio distinto al de la etiqueta.' },
    },
    {
      branchId: 'lagloria',
      tabletId: 't2',
      createdAt: '2026-09-19T16:30:00',
      rating: 'mal',
      praisedEmployeeIds: [],
      complaint: {
        employeeId: ANNEX_EMPLOYEE_ID,
        whatHappened: 'Me atendieron con prisa y no revisaron si la pieza era la correcta.',
        phone: '555 014 8890',
      },
    },
    {
      branchId: 'lagloria',
      tabletId: 't2',
      createdAt: '2026-10-03T10:20:00',
      rating: 'mal',
      praisedEmployeeIds: [],
      complaint: { whatHappened: 'El estacionamiento estaba bloqueado con mercancía.' },
    },
    {
      branchId: 'lagloria',
      tabletId: 't2',
      createdAt: '2026-09-05T12:10:00',
      rating: 'excelente',
      praisedEmployeeIds: [ANNEX_EMPLOYEE_ID],
      comment: 'Carlos me ayudó a encontrar justo lo que necesitaba.',
    },
  );

  return records
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r, i) => ({ ...r, id: `cf-${String(i + 1).padStart(3, '0')}` }));
}

const PERFORMANCE_PERIODS = ['2026-07', '2026-08', '2026-09'];

function createPerformance(users: User[], forms: ReturnType<typeof createForms>): PerformanceEvaluation[] {
  const rnd = createRandom(20260701);
  const form = forms.find((f) => f.id === FORM_IDS.performance)!;
  const evaluations: PerformanceEvaluation[] = [];
  const staff = users.filter((u) => u.role === 'employee');

  for (const employee of staff) {
    const skill = rnd.int(2, 4); // base level in points (0..4)
    for (const period of PERFORMANCE_PERIODS) {
      const version = period < '2026-09' ? form.versions[0] : form.versions[1];
      const branchId = branchAt(employee, `${period}-28`)!;
      const answers: Record<string, number> = {};
      for (const q of version.questions) {
        const points = Math.max(0, Math.min(4, skill + rnd.int(-1, 1)));
        answers[q.id] = 4 - points; // option index (0 = Excelente)
      }
      const [y, m] = period.split('-').map(Number);
      const createdDate = m === 12 ? `${y + 1}-01-03` : `${y}-${pad(m + 1)}-0${rnd.int(2, 6)}`;
      evaluations.push({
        id: `pe-${employee.id}-${period}`,
        employeeId: employee.id,
        managerId: managerOf(branchId),
        branchId,
        period,
        formId: form.id,
        formVersion: version.version,
        answers,
        observations: rnd.pick(PERFORMANCE_OBSERVATIONS),
        comments: rnd.pick(PERFORMANCE_COMMENTS),
        grade: computeScore(version, answers).grade ?? 0,
        createdAt: iso(createdDate, rnd.int(9, 17), rnd.int(0, 59)),
        changes: [],
      });
    }
  }

  // The modified evaluation: punctuality was first rated low and was later clarified.
  const modified = evaluations.find((e) => e.employeeId === MODIFIED_EMPLOYEE_ID && e.period === '2026-09')!;
  const v2 = form.versions[1];
  modified.answers['p-punct-1'] = 3; // Deficiente
  modified.answers['p-cust-1'] = 1;
  modified.grade = computeScore(v2, modified.answers).grade ?? 0;
  const originalGrade = modified.grade;
  modified.answers['p-punct-1'] = 1; // Bueno
  modified.grade = computeScore(v2, modified.answers).grade ?? 0;
  modified.changes.push({
    at: '2026-10-06T11:20:00',
    userId: MANAGER_FERREISLA_ID,
    reason:
      'Revisión con la empleada: los retardos del 12 y 13 de septiembre fueron por una comisión que le pidió la gerencia.',
    originalGrade,
    newGrade: modified.grade,
  });
  modified.observations = 'Buen mes. Se aclaró el tema de los retardos.';

  return evaluations;
}

function createSurvey(users: User[]): {
  periods: SurveyPeriod[];
  participation: Participation[];
  responses: AnonymousResponse[];
} {
  const rnd = createRandom(20260727);
  const periods: SurveyPeriod[] = [
    { id: 'sp-2026-07', name: 'Julio 2026', opensAt: '2026-07-27', closesAt: '2026-08-07', status: 'closed' },
    { id: 'sp-2026-08', name: 'Agosto 2026', opensAt: '2026-08-24', closesAt: '2026-09-04', status: 'closed' },
    { id: 'sp-2026-09', name: 'Septiembre 2026', opensAt: '2026-09-28', closesAt: '2026-10-09', status: 'closed' },
    { id: 'sp-2026-10', name: 'Octubre 2026', opensAt: '2026-10-26', closesAt: '2026-11-06', status: 'open' },
  ];
  // Different participation per branch and period (example data).
  const rates: Record<string, Record<BranchId, number>> = {
    'sp-2026-07': { ferreisla: 0.72, lagloria: 0.55 },
    'sp-2026-08': { ferreisla: 0.86, lagloria: 0.75 },
    'sp-2026-09': { ferreisla: 1, lagloria: 0.65 },
  };
  // Branch mood used to vary the example answers (0..4 index scale, lower = better).
  const mood: Record<BranchId, number> = { ferreisla: 1.2, lagloria: 1.6 };
  const participation: Participation[] = [];
  const pending: Omit<AnonymousResponse, 'id'>[] = [];

  const answer = (branchId: BranchId, trend: number) => {
    const answers: Record<string, number> = {};
    for (const qid of ['a-env-1', 'a-env-2', 'a-lead-1', 'a-lead-2', 'a-tools-1', 'a-train-1']) {
      const extra = qid === 'a-train-1' ? 0.8 : qid === 'a-tools-1' ? 0.4 : 0;
      const v = mood[branchId] + extra - trend + (rnd.next() * 2 - 1);
      answers[qid] = Math.max(0, Math.min(4, Math.round(v)));
    }
    return answers;
  };

  periods.forEach((period, index) => {
    for (const branch of BRANCHES) {
      const staff = staffAt(users, branch.id, period.opensAt);
      const count =
        period.status === 'open'
          ? Math.ceil(staff.length / 2)
          : Math.round(staff.length * rates[period.id][branch.id]);
      const shuffled = [...staff].sort(() => rnd.next() - 0.5).slice(0, count);
      for (const employee of shuffled) {
        participation.push({ periodId: period.id, employeeId: employee.id });
        pending.push({
          periodId: period.id,
          branchId: branch.id,
          formId: FORM_IDS.anonymous,
          formVersion: 1,
          answers: answer(branch.id, index * 0.2),
          comment: rnd.next() < 0.4 ? rnd.pick(ANONYMOUS_COMMENTS) : undefined,
        });
      }
    }
  });

  // Responses are shuffled and given random ids: their order says nothing about who answered.
  const responses = pending
    .map((r) => ({ r, k: rnd.next() }))
    .sort((a, b) => a.k - b.k)
    .map(({ r }) => ({ ...r, id: `ar-${Math.floor(rnd.next() * 0xffffff).toString(16).padStart(6, '0')}` }));

  return { periods, participation, responses };
}

function createDisciplinary(): { reports: DisciplinaryReport[]; acts: AdministrativeAct[] } {
  const reports: DisciplinaryReport[] = [
    {
      id: 'dr-001',
      employeeId: 'e06',
      managerId: MANAGER_FERREISLA_ID,
      branchId: 'ferreisla',
      createdAt: '2026-08-14T18:10:00',
      period: '2026-08',
      formId: FORM_IDS.disciplinary,
      formVersion: 1,
      answers: {
        'd-datetime': '2026-08-14T09:25',
        'd-type': 'Retardo',
        'd-facts': 'Llegó 55 minutos tarde sin avisar a la gerencia. Es el tercer retardo del mes.',
        'd-notes': 'Se le recordó el reglamento interno.',
      },
    },
    {
      id: 'dr-002',
      employeeId: ANNEX_EMPLOYEE_ID,
      managerId: MANAGER_LAGLORIA_ID,
      branchId: 'lagloria',
      createdAt: '2026-09-24T17:45:00',
      period: '2026-09',
      formId: FORM_IDS.disciplinary,
      formVersion: 1,
      answers: {
        'd-datetime': '2026-09-24T12:30',
        'd-type': 'Incumplimiento de un procedimiento',
        'd-facts': 'Entregó mercancía de bodega sin registrar la salida en el sistema de inventario.',
        'd-notes': 'Se revisó el procedimiento de salidas de bodega con el empleado.',
      },
    },
  ];
  const acts: AdministrativeAct[] = [
    {
      id: 'aa-001',
      reportId: 'dr-002',
      createdAt: '2026-09-26T10:00:00',
      createdBy: MANAGER_LAGLORIA_ID,
      formId: FORM_IDS.act,
      formVersion: 1,
      answers: {
        'act-place': 'Oficina de la gerencia, Ferretería La Gloria',
        'act-statement': 'El empleado reconoce que no registró la salida por atender a varios clientes al mismo tiempo.',
        'act-witnesses': 'Héctor Aguilar',
        'act-agreements': 'Registrar toda salida de bodega antes de entregar la mercancía. Repaso del procedimiento el 30 de septiembre.',
      },
    },
  ];
  return { reports, acts };
}

function createOutbox(feedback: CustomerFeedback[], evaluations: PerformanceEvaluation[]): EmailMessage[] {
  const outbox: EmailMessage[] = [];
  for (const f of feedback) {
    if (f.rating === 'muy_mal' || f.complaint) {
      outbox.push({ id: `em-${f.id}`, kind: 'customer_alert', createdAt: f.createdAt, refId: f.id });
    }
  }
  outbox.push(
    { id: 'em-sum-08', kind: 'monthly_summary', createdAt: '2026-09-01T08:00:00', refId: '2026-08' },
    { id: 'em-sum-09', kind: 'monthly_summary', createdAt: '2026-10-01T08:00:00', refId: '2026-09' },
    { id: 'em-sp-07', kind: 'survey_results', createdAt: '2026-08-07T23:59:00', refId: 'sp-2026-07' },
    { id: 'em-sp-08', kind: 'survey_results', createdAt: '2026-09-04T23:59:00', refId: 'sp-2026-08' },
    { id: 'em-sp-09', kind: 'survey_results', createdAt: '2026-10-09T23:59:00', refId: 'sp-2026-09' },
  );
  for (const e of evaluations.filter((ev) => ev.period === '2026-09')) {
    outbox.push({ id: `em-${e.id}`, kind: 'performance', createdAt: e.createdAt, refId: e.id });
    if (e.changes.length) {
      outbox.push({ id: `em-${e.id}-upd`, kind: 'performance_updated', createdAt: e.changes[0].at, refId: e.id });
    }
  }
  return outbox.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createSeed(): MockDb {
  const users = createUsers();
  const forms = createForms();
  const customerFeedback = createCustomerFeedback(users);
  const performance = createPerformance(users, forms);
  const { periods, participation, responses } = createSurvey(users);
  const { reports, acts } = createDisciplinary();
  const { tablets, codes } = createTablets();

  return {
    branches: BRANCHES,
    users,
    customerFeedback,
    forms,
    performance,
    surveyPeriods: periods,
    participation,
    anonymousResponses: responses,
    disciplinaryReports: reports,
    acts,
    tablets,
    activationCodes: codes,
    outbox: createOutbox(customerFeedback, performance),
    settings: { adminEmail: 'administracion@ejemplo.com' },
  };
}

export { ADMIN_ID };
