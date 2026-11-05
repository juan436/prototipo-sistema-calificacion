import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useDemoStore } from '../../store/useDemoStore';
import { flushPending, isOnline, RETRY_SECONDS } from './saveFeedback';

/**
 * Retries pending ratings every few seconds until they can be sent, and shows a discreet notice
 * while there is no connection or something is waiting.
 */
export function ConnectionStatus() {
  const pending = useDemoStore((s) => s.pendingFeedback.length);
  const simulateOffline = useDemoStore((s) => s.simulateOffline);
  const [online, setOnline] = useState(isOnline());
  const [seconds, setSeconds] = useState(RETRY_SECONDS);

  useEffect(() => {
    const refresh = () => setOnline(isOnline());
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    refresh();
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
    };
  }, [simulateOffline]);

  useEffect(() => {
    if (!pending) {
      setSeconds(RETRY_SECONDS);
      return;
    }
    const t = window.setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        flushPending();
        setOnline(isOnline());
        return RETRY_SECONDS;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [pending]);

  if (online && !pending) return null;
  return (
    <div
      role="status"
      className="fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-500 shadow-sm"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      {online ? 'Conexión de vuelta' : 'Sin conexión'}
      {pending > 0 && (
        <>
          {' '}
          · {pending} en espera · reintento en {seconds} s
        </>
      )}
    </div>
  );
}

/** Demo-only switch to show what happens when the internet goes down. */
export function OfflineToggle() {
  const simulateOffline = useDemoStore((s) => s.simulateOffline);
  const setSimulateOffline = useDemoStore((s) => s.setSimulateOffline);
  return (
    <button type="button" className="hover:underline" onClick={() => setSimulateOffline(!simulateOffline)}>
      {simulateOffline ? 'Volver a tener internet (demo)' : 'Simular que se cae el internet (demo)'}
    </button>
  );
}
