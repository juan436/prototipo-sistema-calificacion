import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, HOME_BY_ROLE } from './components/AppLayout';
import { RequireRole } from './components/RequireRole';
import { EntryPage } from './features/access/EntryPage';
import { PrivacyNoticePage } from './features/access/PrivacyNoticePage';
import { RecoverAccountPage } from './features/access/RecoverAccountPage';
import { EmailsPage } from './features/admin/EmailsPage';
import { FormEditorPage, FormsListPage } from './features/admin/FormsPages';
import { SecurityPage } from './features/admin/SecurityPage';
import { TabletsPage } from './features/admin/TabletsPage';
import { UsersPage } from './features/admin/UsersPage';
import { EmployeeSurveyPage, SurveyAdminPage } from './features/anonymous-survey/SurveyPages';
import { CustomerFeedbackPage } from './features/customer-rating/CustomerFeedbackPage';
import { ActivationPage, CustomerFormPage, TabletEntry } from './features/customer-rating/TabletPages';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ActPage, DisciplinaryListPage, NewActPage, NewReportPage, ReportPage } from './features/disciplinary/DisciplinaryPages';
import { CapturePage } from './features/performance/CapturePage';
import { EmployeeFilePage, MyFilePage } from './features/performance/EmployeeFilePage';
import { EmployeesPage } from './features/performance/EmployeesPage';
import { EvaluationPage } from './features/performance/EvaluationPage';
import { useCurrentUser } from './store/useDemoStore';

const adminOnly = (el: ReactNode) => <RequireRole roles={['admin']}>{el}</RequireRole>;
const staff = (el: ReactNode) => <RequireRole roles={['admin', 'manager']}>{el}</RequireRole>;
const employeeOnly = (el: ReactNode) => <RequireRole roles={['employee']}>{el}</RequireRole>;

function AppHome() {
  const user = useCurrentUser();
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/recuperar-cuenta" element={<RecoverAccountPage />} />
      <Route path="/aviso-de-privacidad" element={<PrivacyNoticePage />} />

      {/* Independent tablet access: not linked from the normal entry. */}
      <Route path="/tableta" element={<TabletEntry />} />
      <Route path="/tableta/activar" element={<ActivationPage />} />
      <Route path="/tableta/calificar" element={<CustomerFormPage />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<AppHome />} />
        <Route path="panel" element={adminOnly(<DashboardPage />)} />
        <Route path="clientes" element={adminOnly(<CustomerFeedbackPage />)} />
        <Route path="encuesta" element={adminOnly(<SurveyAdminPage />)} />
        <Route path="encuesta-mensual" element={employeeOnly(<EmployeeSurveyPage />)} />
        <Route path="desempeno" element={staff(<EmployeesPage />)} />
        <Route path="desempeno/nueva" element={staff(<CapturePage />)} />
        <Route path="empleados/:employeeId" element={staff(<EmployeeFilePage />)} />
        <Route path="evaluaciones/:evaluationId" element={<EvaluationPage />} />
        <Route path="mi-expediente" element={employeeOnly(<MyFilePage />)} />
        <Route path="disciplinario" element={staff(<DisciplinaryListPage />)} />
        <Route path="disciplinario/nuevo" element={staff(<NewReportPage />)} />
        <Route path="reportes/:reportId" element={<ReportPage />} />
        <Route path="actas/nueva" element={staff(<NewActPage />)} />
        <Route path="actas/:actId" element={<ActPage />} />
        <Route path="formularios" element={adminOnly(<FormsListPage />)} />
        <Route path="formularios/:formId" element={adminOnly(<FormEditorPage />)} />
        <Route path="usuarios" element={adminOnly(<UsersPage />)} />
        <Route path="tabletas" element={adminOnly(<TabletsPage />)} />
        <Route path="correos" element={adminOnly(<EmailsPage />)} />
        <Route path="seguridad" element={adminOnly(<SecurityPage />)} />
        <Route path="*" element={<AppHome />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
