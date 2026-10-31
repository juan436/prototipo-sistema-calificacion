import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { EntryPage } from './features/access/EntryPage';
import { PrivacyNoticePage } from './features/access/PrivacyNoticePage';
import { RecoverAccountPage } from './features/access/RecoverAccountPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/recuperar-cuenta" element={<RecoverAccountPage />} />
      <Route path="/aviso-de-privacidad" element={<PrivacyNoticePage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route path="*" element={<p className="text-slate-500">Pantalla en construcción.</p>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
