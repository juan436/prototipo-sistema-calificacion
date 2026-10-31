import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireRole } from './components/RequireRole';
import { EntryPage } from './features/access/EntryPage';
import { PrivacyNoticePage } from './features/access/PrivacyNoticePage';
import { RecoverAccountPage } from './features/access/RecoverAccountPage';
import { FormEditorPage, FormsListPage } from './features/admin/FormsPages';
import { EmployeeSurveyPage, SurveyAdminPage } from './features/anonymous-survey/SurveyPages';
import { CapturePage } from './features/performance/CapturePage';
import { EmployeeFilePage, MyFilePage } from './features/performance/EmployeeFilePage';
import { EmployeesPage } from './features/performance/EmployeesPage';
import { EvaluationPage } from './features/performance/EvaluationPage';
import { ActPage, DisciplinaryListPage, NewActPage, NewReportPage, ReportPage } from './features/disciplinary/DisciplinaryPages';
import { TabletsPage } from './features/admin/TabletsPage';
import { CustomerFeedbackPage } from './features/customer-rating/CustomerFeedbackPage';
import { ActivationPage, CustomerFormPage, TabletEntry } from './features/customer-rating/TabletPages';

const adminOnly = (el: ReactNode) => <RequireRole roles={['admin']}>{el}</RequireRole>;

const staff = (el: ReactNode) => <RequireRole roles={['admin', 'manager']}>{el}</RequireRole>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/recuperar-cuenta" element={<RecoverAccountPage />} />
      <Route path="/aviso-de-privacidad" element={<PrivacyNoticePage />} />

      <Route path="/tableta" element={<TabletEntry />} />
      <Route path="/tableta/activar" element={<ActivationPage />} />
      <Route path="/tableta/calificar" element={<CustomerFormPage />} />

      <Route path="/app" element={<AppLayout />}>
        <Route path="clientes" element={adminOnly(<CustomerFeedbackPage />)} />
        <Route path="encuesta" element={adminOnly(<SurveyAdminPage />)} />
        <Route path="encuesta-mensual" element={<RequireRole roles={['employee']}><EmployeeSurveyPage /></RequireRole>} />
        <Route path="desempeno" element={staff(<EmployeesPage />)} />
        <Route path="desempeno/nueva" element={staff(<CapturePage />)} />
        <Route path="empleados/:employeeId" element={staff(<EmployeeFilePage />)} />
        <Route path="evaluaciones/:evaluationId" element={<EvaluationPage />} />
        <Route path="mi-expediente" element={<RequireRole roles={['employee']}><MyFilePage /></RequireRole>} />
        <Route path="disciplinario" element={staff(<DisciplinaryListPage />)} />
        <Route path="disciplinario/nuevo" element={staff(<NewReportPage />)} />
        <Route path="reportes/:reportId" element={<ReportPage />} />
        <Route path="actas/nueva" element={staff(<NewActPage />)} />
        <Route path="actas/:actId" element={<ActPage />} />
        <Route path="formularios" element={adminOnly(<FormsListPage />)} />
        <Route path="formularios/:formId" element={adminOnly(<FormEditorPage />)} />
        <Route path="tabletas" element={adminOnly(<TabletsPage />)} />
        <Route path="*" element={<p className="text-slate-500">Pantalla en construcción.</p>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
