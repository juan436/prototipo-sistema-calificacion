import type { BranchFilter } from '../lib/stats';
import { useDb } from '../store/useDemoStore';
import { inputClass } from './ui';

export function BranchSelect({ value, onChange, allowAll = true }: { value: BranchFilter; onChange: (v: BranchFilter) => void; allowAll?: boolean }) {
  const db = useDb();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">Sucursal</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as BranchFilter)}>
        {allowAll && <option value="all">Ambas sucursales</option>}
        {db.branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input type="date" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
