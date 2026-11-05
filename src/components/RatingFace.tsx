import type { Rating } from '../mock/types';

/** Outline color of each face: dark green, light green, yellow, orange, red. */
const FACE_COLOR: Record<Rating, string> = {
  excelente: '#15803d',
  bien: '#5fb54f',
  regular: '#eab308',
  mal: '#f97316',
  muy_mal: '#dc2626',
};

const INK = '#1e293b';

/** Line-art face for each rating: colored circle with simple features, on a white background. */
export function RatingFace({ rating, className = '' }: { rating: Rating; className?: string }) {
  const dotEyes = (
    <>
      <circle cx="36" cy="42" r="4.5" fill={INK} />
      <circle cx="64" cy="42" r="4.5" fill={INK} />
    </>
  );
  const line = { fill: 'none', stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="44" fill="#ffffff" stroke={FACE_COLOR[rating]} strokeWidth="6" />
      {rating === 'excelente' && (
        <>
          <path d="M28 44 Q36 34 44 44" {...line} />
          <path d="M56 44 Q64 34 72 44" {...line} />
          <path d="M28 58 Q50 84 72 58 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </>
      )}
      {rating === 'bien' && (
        <>
          {dotEyes}
          <path d="M32 61 Q50 76 68 61" {...line} />
        </>
      )}
      {rating === 'regular' && (
        <>
          {dotEyes}
          <path d="M35 66 L65 66" {...line} />
        </>
      )}
      {rating === 'mal' && (
        <>
          {dotEyes}
          <path d="M32 72 Q50 57 68 72" {...line} />
        </>
      )}
      {rating === 'muy_mal' && (
        <>
          <path d="M28 35 L40 42 L28 49" {...line} />
          <path d="M72 35 L60 42 L72 49" {...line} />
          <path d="M30 70 Q36 63 42 70 Q48 77 54 70 Q60 63 66 70" {...line} />
        </>
      )}
    </svg>
  );
}
