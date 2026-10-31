import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, X } from 'lucide-react';
import api, { errMsg } from '../api/axios';
import HeroSlider from '../components/HeroSlider';
import PropertyCard from '../components/PropertyCard';
import Loader from '../components/Loader';
import { PROPERTY_TYPES } from '../data/constants';
import toast from 'react-hot-toast';

const LIST_TYPES = [
  { value: '', label: 'All' },
  { value: 'sale', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const listingType = params.get('listingType') || '';
  const sort = params.get('sort') || 'newest';

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // load page 1 whenever filters change
  useEffect(() => {
    setLoading(true);
    api.get('/properties', { params: { q, type, listingType, sort, page: 1, limit: 8 } })
      .then((res) => {
        setProperties(res.data.properties);
        setTotal(res.data.total);
        setPage(1);
        setPages(res.data.pages);
      })
      .catch((err) => toast.error(errMsg(err)))
      .finally(() => setLoading(false));
  }, [q, type, listingType, sort]);

  // scroll to the list when arriving from a search or a banner link
  useEffect(() => {
    if (window.location.hash === '#listings') {
      document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [q, type, listingType]);

  const loadMore = async () => {
    try {
      const res = await api.get('/properties', { params: { q, type, listingType, sort, page: page + 1, limit: 8 } });
      setProperties((prev) => [...prev, ...res.data.properties]);
      setPage(page + 1);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <HeroSlider />

      <section id="listings" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{q ? `Results for “${q}”` : 'Fresh listings'}</h2>
            <p className="mt-1 text-sm text-slate-600">{loading ? 'Loading…' : `${total} propert${total === 1 ? 'y' : 'ies'} found`}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-line bg-white p-1">
              {LIST_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilter('listingType', t.value)}
                  className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${listingType === t.value ? 'bg-river text-white' : 'hover:text-river'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <select value={type} onChange={(e) => setFilter('type', e.target.value)} className="input w-auto" aria-label="Property type">
              <option value="">All types</option>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setFilter('sort', e.target.value === 'newest' ? '' : e.target.value)} className="input w-auto" aria-label="Sort">
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
            {(q || type || listingType) && (
              <button onClick={() => setParams({}, { replace: true })} className="btn btn-outline"><X size={16} /> Clear</button>
            )}
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : properties.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
            <SearchX size={40} className="text-river" />
            <h3 className="mt-3 text-xl font-semibold">No properties match your search</h3>
            <p className="mt-1 text-sm text-slate-600">Try a different city or clear the filters.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
            {page < pages && (
              <div className="mt-8 text-center">
                <button onClick={loadMore} className="btn btn-outline px-8">Show more properties</button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
