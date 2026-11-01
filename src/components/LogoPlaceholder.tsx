export function LogoPlaceholder({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-16 w-16 text-xs' : 'h-10 w-10 text-[10px]';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-center font-medium leading-tight text-slate-400 ${box}`}
      title="Lugar reservado para el logo de Grupo Inolite"
    >
      Logo
    </div>
  );
}
