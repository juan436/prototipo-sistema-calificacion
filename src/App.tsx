import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EmailPreviewModal } from './components/EmailPreview';
import { AppRoutes } from './routes';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <AppRoutes />
      <EmailPreviewModal />
    </>
  );
}
