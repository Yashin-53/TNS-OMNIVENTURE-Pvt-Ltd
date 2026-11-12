import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';
import StarRating from './StarRating';

export default function Reviews({ propertyId, ownerId, onChange }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 0, pros: '', cons: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get(`/properties/${propertyId}/reviews`).then((res) => setReviews(res.data)).catch(() => {});

  useEffect(() => { load(); }, [propertyId]);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const myReview = user && reviews.find((r) => r.user?._id === user._id);
  const isOwner = user && user._id === ownerId;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error('Please select a star rating');
    setBusy(true);
    try {
      await api.post(`/properties/${propertyId}/reviews`, form);
      setForm({ rating: 0, pros: '', cons: '' });
      toast.success('Thanks for your review');
      await load();
      onChange?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      await load();
      onChange?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Resident reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold">{average.toFixed(1)}</span>
            <div>
              <StarRating value={average} />
              <p className="text-xs text-slate-500">{reviews.length} review{reviews.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* review form */}
      <div className="mt-5 rounded-xl bg-mist p-4">
        {!user ? (
          <p className="text-sm">
            <Link to="/login" state={{ from: `/properties/${propertyId}` }} className="font-semibold text-river hover:underline">Login</Link> to share your experience with this property.
          </p>
        ) : isOwner ? (
          <p className="text-sm text-slate-600">You can’t review your own property.</p>
        ) : myReview ? (
          <p className="text-sm text-slate-600">You have already reviewed this property. You can delete your review below and write a new one.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <p className="label">Your rating</p>
              <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} size={26} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="pros">Pros</label>
                <textarea id="pros" rows={3} maxLength={500} className="input" placeholder="What did you like?" value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="cons">Cons</label>
                <textarea id="cons" rows={3} maxLength={500} className="input" placeholder="What could be better?" value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} />
              </div>
            </div>
            <button disabled={busy} className="btn btn-primary">{busy ? 'Posting…' : 'Post review'}</button>
          </form>
        )}
      </div>

      {/* review list */}
      <div className="mt-5 divide-y divide-line">
        {reviews.length === 0 && <p className="py-4 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>}
        {reviews.map((r) => (
          <article key={r._id} className="py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-river-light font-bold text-river-dark">{r.user?.name?.charAt(0) || '?'}</span>
                <div>
                  <p className="font-semibold">{r.user?.name || 'Former user'}</p>
                  <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StarRating value={r.rating} size={15} />
                {user && (user.role === 'admin' || user._id === r.user?._id) && (
                  <button onClick={() => remove(r._id)} aria-label="Delete review" className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {r.pros && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-700"><ThumbsUp size={14} /> Pros</p>
                  <p className="whitespace-pre-line">{r.pros}</p>
                </div>
              )}
              {r.cons && (
                <div className="rounded-lg bg-red-50 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-red-700"><ThumbsDown size={14} /> Cons</p>
                  <p className="whitespace-pre-line">{r.cons}</p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
