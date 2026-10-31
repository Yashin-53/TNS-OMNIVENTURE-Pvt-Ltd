import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { PLACEHOLDER_IMG } from '../utils/format';

// Main viewer + thumbnail strip. Handles both images and videos.
export default function Gallery({ images = [], videos = [], title }) {
  const media = [
    ...images.map((m) => ({ ...m, kind: 'image' })),
    ...videos.map((m) => ({ ...m, kind: 'video' })),
  ];
  const [index, setIndex] = useState(0);
  if (media.length === 0) return <img src={PLACEHOLDER_IMG} alt={title} className="aspect-[16/10] w-full rounded-2xl object-cover" />;

  const current = media[index];
  const go = (step) => setIndex((index + step + media.length) % media.length);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink">
        {current.kind === 'image' ? (
          <img src={current.url} alt={title} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
        ) : (
          <video key={current.url} src={current.url} controls className="h-full w-full bg-black object-contain" />
        )}

        {media.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"><ChevronLeft size={20} /></button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"><ChevronRight size={20} /></button>
            <span className="absolute bottom-3 right-3 rounded-md bg-ink/70 px-2 py-1 text-xs text-white">{index + 1} / {media.length}</span>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m._id || m.url}
              onClick={() => setIndex(i)}
              aria-label={`Show ${m.kind} ${i + 1}`}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-ink ${i === index ? 'border-river' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              {m.kind === 'image' ? (
                <img src={m.url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-white"><Play size={22} /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
