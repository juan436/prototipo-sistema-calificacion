import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireRole } from './components/RequireRole';
import { EntryPage } from './features/access/EntryPage';
import { PrivacyNoticePage } from './features/access/PrivacyNoticePage';
import { RecoverAccountPage } from './features/access/RecoverAccountPage';
import { TabletsPage } from './features/admin/TabletsPage';
import { CustomerFeedbackPage } from './features/customer-rating/CustomerFeedbackPage';
import { ActivationPage, CustomerFormPage, TabletEntry } from './features/customer-rating/TabletPages';

const adminOnly = (el: React.ReactNode) => <RequireRole roles={['admin']}>{el}</RequireRole>;

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
        <Route path="tabletas" element={adminOnly(<TabletsPage />)} />
        <Route path="*" element={<p className="text-slate-500">Pantalla en construcción.</p>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
