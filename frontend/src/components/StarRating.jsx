import { Star } from 'lucide-react';

// Read-only when onChange is not passed, clickable when it is
export default function StarRating({ value = 0, onChange, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Star size={size} className={n <= Math.round(value) ? 'fill-marigold text-marigold' : 'text-slate-300'} />
        );
        return onChange ? (
          <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
