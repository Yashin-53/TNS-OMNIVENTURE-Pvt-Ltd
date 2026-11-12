import { Link } from 'react-router-dom';
import { Bath, BedDouble, MapPin, Ruler, Star } from 'lucide-react';
import { cityState, formatPrice, getPriceBreakdown, PLACEHOLDER_IMG } from '../utils/format';
import { formatArea, unitLabel } from '../utils/units';
import { typeLabel } from '../data/constants';

export default function PropertyCard({ property: p }) {
  const { total } = getPriceBreakdown(p.price, p.taxes);
  const hasTaxes = total > p.price;

  return (
    <Link
      to={`/properties/${p._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-river xl:flex-row"
    >
      <div className="relative h-52 shrink-0 overflow-hidden bg-river-light xl:h-auto xl:min-h-[230px] xl:w-[40%]">
        <img
          src={p.images?.[0]?.url || PLACEHOLDER_IMG}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
        />
        <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${p.listingType === 'rent' ? 'bg-marigold text-ink' : 'bg-river text-ink'}`}>
          {p.listingType === 'rent' ? 'For rent' : 'For sale'}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-xs font-medium text-river">{typeLabel(p.type)}</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
          <MapPin size={14} className="shrink-0" /> <span className="truncate">{p.location.address}, {cityState(p.location)}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
          <span className="flex items-center gap-1"><Ruler size={15} /> {formatArea(p.dimension.area)} {unitLabel(p.dimension.unit)}</span>
          {p.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={15} /> {p.bedrooms} Beds</span>}
          {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={15} /> {p.bathrooms} Baths</span>}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="font-display text-2xl font-bold">
              {formatPrice(p.price)}
              {p.listingType === 'rent' && <span className="text-sm font-medium text-slate-500"> /month</span>}
            </p>
            {hasTaxes && <p className="text-xs text-slate-500">{formatPrice(total)} with taxes</p>}
          </div>
          <p className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium">
            {p.ratingCount > 0 ? (
              <><Star size={15} className="fill-marigold text-marigold" /> {p.ratingAvg} <span className="text-slate-500">({p.ratingCount})</span></>
            ) : (
              <span className="text-slate-500">No reviews yet</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
