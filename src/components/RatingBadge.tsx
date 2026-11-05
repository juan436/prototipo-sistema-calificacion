import { ratingInfo } from '../lib/lookup';
import type { Rating } from '../mock/types';

/** Rating shown with its color everywhere in the panel. */
export function RatingBadge({ rating }: { rating: Rating }) {
  const r = ratingInfo(rating);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: r.soft, color: r.ink }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
      {r.label}
    </span>
  );
}
