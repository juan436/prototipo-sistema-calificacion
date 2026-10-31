import { FlaskConical } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-sm font-medium text-amber-900 no-print">
      <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
      Prototipo con datos de ejemplo
    </div>
  );
}
