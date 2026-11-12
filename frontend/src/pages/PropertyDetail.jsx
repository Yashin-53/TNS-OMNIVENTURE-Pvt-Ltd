import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bath, BedDouble, Check, MapPin, Pencil, Phone, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Gallery from '../components/Gallery';
import Reviews from '../components/Reviews';
import StarRating from '../components/StarRating';
import Loader from '../components/Loader';
import { cityState, formatDate, formatFull, getPriceBreakdown } from '../utils/format';
import { UNITS, convertArea, formatArea } from '../utils/units';
import { typeLabel } from '../data/constants';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [unit, setUnit] = useState('sqft');

  // resetUnit: show the unit the seller used when a property first opens
  const load = (resetUnit = false) =>
    api.get(`/properties/${id}`)
      .then((res) => {
        setProperty(res.data);
        if (resetUnit) setUnit(res.data.dimension.unit);
      })
      .catch(() => setNotFound(true));

  useEffect(() => {
    setProperty(null);
    setNotFound(false);
    load(true);
    window.scrollTo(0, 0);
  }, [id, user?._id]); // reload when login state changes so dealer contact appears

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Property not found</h1>
        <p className="mt-2 text-slate-600">It may have been removed by the owner.</p>
        <Link to="/" className="btn btn-primary mt-6">Back to listings</Link>
      </div>
    );
  }
  if (!property) return <Loader />;

  const p = property;
  const { lines, total } = getPriceBreakdown(p.price, p.taxes);
  const canManage = user && (user.role === 'admin' || user._id === p.owner._id);
  const isRent = p.listingType === 'rent';
  const area = convertArea(p.dimension.area, p.dimension.unit, unit);

  const handleDelete = async () => {
    if (!window.confirm('Delete this property permanently?')) return;
    try {
      await api.delete(`/properties/${p._id}`);
      toast.success('Property deleted');
      navigate('/');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------- main column ---------- */}
        <div className="min-w-0 space-y-6">
          <Gallery images={p.images} videos={p.videos} title={p.title} />

          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-river">{typeLabel(p.type)} · {isRent ? 'For rent' : 'For sale'}</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{p.title}</h1>
                <p className="mt-2 flex items-start gap-1.5 text-slate-600">
                  <MapPin size={18} className="mt-0.5 shrink-0" />
                  {p.location.address}, {cityState(p.location)}{p.location.pincode && ` - ${p.location.pincode}`}
                </p>
                {p.ratingCount > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <StarRating value={p.ratingAvg} /> <b>{p.ratingAvg}</b> <span className="text-slate-500">({p.ratingCount} reviews)</span>
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Link to={`/properties/${p._id}/edit`} className="btn btn-outline"><Pencil size={16} /> Edit</Link>
                  <button onClick={handleDelete} className="btn btn-outline text-red-600 hover:border-red-600 hover:text-red-600"><Trash2 size={16} /> Delete</button>
                </div>
              )}
            </div>
          </section>

          {/* key facts with unit switcher */}
          <section className="card grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
            <div className="col-span-2">
              <p className="text-sm text-slate-500">Dimension</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-xl font-bold">{formatArea(area)}</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input w-auto py-1.5" aria-label="Area unit">
                  {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              {unit !== p.dimension.unit && (
                <p className="mt-1 text-xs text-slate-500">Listed as {formatArea(p.dimension.area)} {UNITS.find((u) => u.value === p.dimension.unit).label}</p>
              )}
            </div>
            {p.bedrooms > 0 && (
              <div><p className="text-sm text-slate-500">Bedrooms</p><p className="mt-1 flex items-center gap-1.5 font-semibold"><BedDouble size={18} /> {p.bedrooms}</p></div>
            )}
            {p.bathrooms > 0 && (
              <div><p className="text-sm text-slate-500">Bathrooms</p><p className="mt-1 flex items-center gap-1.5 font-semibold"><Bath size={18} /> {p.bathrooms}</p></div>
            )}
            <div><p className="text-sm text-slate-500">Listed on</p><p className="mt-1 font-semibold">{formatDate(p.createdAt)}</p></div>
          </section>

          {p.highlights.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">Highlights</h2>
              <ul className="mt-3 space-y-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-marigold" /> {h}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-bold">About this property</h2>
            <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed text-slate-700">{p.description}</p>
          </section>

          {p.amenities.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">Amenities</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm"><Check size={16} className="text-river" /> {a}</li>
                ))}
              </ul>
            </section>
          )}

          <Reviews propertyId={p._id} ownerId={p.owner._id} onChange={() => load()} />
        </div>

        {/* ---------- sidebar ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-sm text-slate-500">{isRent ? 'Rent per month' : 'Price'}</p>
            <p className="font-display text-3xl font-bold">{formatFull(p.price)}</p>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              {lines.map((line) => (
                <div key={line.label} className="flex justify-between">
                  <dt className="text-slate-600">{line.label} ({line.percent}%)</dt>
                  <dd className="font-medium">{formatFull(line.amount)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-river-light px-4 py-3">
              <span className="font-semibold">Total amount</span>
              <span className="font-display text-xl font-bold text-river-dark">{formatFull(total)}</span>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-bold">{isRent ? 'Owner / dealer' : 'Seller / dealer'}</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-river text-lg font-bold text-ink">{p.owner.name.charAt(0)}</span>
              <div>
                <p className="font-semibold">{p.owner.name}</p>
                <p className="text-xs text-slate-500">{p.owner.location} · Member since {new Date(p.owner.createdAt).getFullYear()}</p>
              </div>
            </div>

            {p.owner.phone ? (
              <div className="mt-4 space-y-2">
                <a href={`tel:+91${p.owner.phone}`} className="btn btn-primary w-full"><Phone size={16} /> Call {p.owner.phone}</a>
                {p.owner.email && <a href={`mailto:${p.owner.email}`} className="btn btn-outline w-full"><Mail size={16} /> Email dealer</a>}
              </div>
            ) : (
              <Link to="/login" state={{ from: `/properties/${p._id}` }} className="btn btn-accent mt-4 w-full">Login to view contact details</Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
