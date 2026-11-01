import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EmailPreviewModal } from './components/EmailPreview';
import { AppRoutes } from './routes';
import { emailOpenedAt, useDemoStore } from './store/useDemoStore';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Close an email preview left open when the user navigates away (e.g. browser back),
    // but keep the one that was opened as part of the navigation itself.
    if (Date.now() - emailOpenedAt() > 300) useDemoStore.getState().openEmail(null);
  }, [pathname]);

  return (
    <>
      <AppRoutes />
      <EmailPreviewModal />
    </>
  );
}
