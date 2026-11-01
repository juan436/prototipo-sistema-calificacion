export type BranchId = 'ferreisla' | 'lagloria';

export interface Branch {
  id: BranchId;
  name: string;
  /** Name used inside the customer question: «¿Cómo fue tu experiencia en …?» */
  questionName: string;
}

export type Role = 'admin' | 'manager' | 'employee';
export type Position = 'Ventas' | 'Caja' | 'Gerencia' | 'Administración';

export interface BranchAssignment {
  branchId: BranchId;
  /** ISO date (YYYY-MM-DD) from which the person works at this branch. */
  from: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: Position;
  /** Current branch. Admin has none (sees both). */
  branchId: BranchId | null;
  active: boolean;
  branchHistory: BranchAssignment[];
}

export type Rating = 'excelente' | 'bien' | 'regular' | 'mal' | 'muy_mal';

export interface Complaint {
  employeeId?: string;
  whatHappened?: string;
  phone?: string;
}

export interface CustomerFeedback {
  id: string;
  branchId: BranchId;
  tabletId: string;
  /** ISO date-time. */
  createdAt: string;
  rating: Rating;
  praisedEmployeeIds: string[];
  comment?: string;
  complaint?: Complaint;
}

export type FormType = 'customer' | 'anonymous' | 'performance' | 'disciplinary' | 'act';

export type QuestionType = 'scored' | 'text' | 'longtext' | 'select' | 'datetime';

export interface QuestionOption {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  /** Area used to group scores (only for scored questions). */
  area?: string;
  /** Weight of the question inside its form (only for scored questions). */
  weight?: number;
  options?: QuestionOption[];
}

export interface FormVersion {
  version: number;
  createdAt: string;
  questions: Question[];
  allowComments?: boolean;
}

export interface FormDefinition {
  id: string;
  type: FormType;
  name: string;
  description: string;
  editable: boolean;
  versions: FormVersion[];
}

export interface EvaluationChange {
  at: string;
  userId: string;
  reason: string;
  originalGrade: number;
  newGrade: number;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  managerId: string;
  branchId: BranchId;
  /** Evaluated period, YYYY-MM. */
  period: string;
  formId: string;
  formVersion: number;
  /** Scored question → option index. Text question → string. */
  answers: Record<string, number | string>;
  observations: string;
  comments: string;
  grade: number;
  createdAt: string;
  changes: EvaluationChange[];
}

export interface SurveyPeriod {
  id: string;
  name: string;
  opensAt: string;
  closesAt: string;
  status: 'open' | 'closed';
}

/** Who took part. Never linked to the answers. */
export interface Participation {
  periodId: string;
  employeeId: string;
}

/** What was answered. Contains no data about the employee. */
export interface AnonymousResponse {
  id: string;
  periodId: string;
  branchId: BranchId;
  formId: string;
  formVersion: number;
  answers: Record<string, number>;
  comment?: string;
}

export interface DisciplinaryReport {
  id: string;
  employeeId: string;
  managerId: string;
  branchId: BranchId;
  createdAt: string;
  /** Period the report belongs to, YYYY-MM. */
  period: string;
  formId: string;
  formVersion: number;
  answers: Record<string, string>;
}

export interface AdministrativeAct {
  id: string;
  reportId: string;
  createdAt: string;
  createdBy: string;
  formId: string;
  formVersion: number;
  answers: Record<string, string>;
}

export interface Tablet {
  id: string;
  name: string;
  branchId: BranchId;
  status: 'authorized' | 'revoked';
  createdAt: string;
}

export interface ActivationCode {
  code: string;
  branchId: BranchId;
  createdAt: string;
  usedAt?: string;
  tabletId?: string;
}

export type EmailKind =
  | 'customer_alert'
  | 'monthly_summary'
  | 'survey_results'
  | 'performance'
  | 'performance_updated';

export interface EmailMessage {
  id: string;
  kind: EmailKind;
  createdAt: string;
  /** Reference to the record the email is about. */
  refId: string;
}

export interface MockDb {
  branches: Branch[];
  users: User[];
  customerFeedback: CustomerFeedback[];
  forms: FormDefinition[];
  performance: PerformanceEvaluation[];
  surveyPeriods: SurveyPeriod[];
  participation: Participation[];
  anonymousResponses: AnonymousResponse[];
  disciplinaryReports: DisciplinaryReport[];
  acts: AdministrativeAct[];
  tablets: Tablet[];
  activationCodes: ActivationCode[];
  outbox: EmailMessage[];
  settings: {
    adminEmail: string;
  };
}
