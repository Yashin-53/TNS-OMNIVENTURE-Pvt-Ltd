import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, Eye, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import Loader from '../components/Loader';
import { cityState, formatDate, formatPrice } from '../utils/format';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);

  const loadStats = () => api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {});
  useEffect(() => { loadStats(); }, []);

  const cards = stats && [
    ['Buyers', stats.buyers],
    ['Sellers', stats.sellers],
    ['Properties', stats.properties],
    ['Deactivated users', stats.inactiveUsers],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards?.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="font-display text-3xl font-bold text-river">{value}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-1 border-b border-line">
        {[['users', 'Users'], ['properties', 'Properties']].map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === value ? 'border-river text-river' : 'border-transparent text-slate-600 hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'users' ? <UsersTable onChange={loadStats} /> : <PropertiesTable onChange={loadStats} />}
      </div>
    </div>
  );
}

function UsersTable({ onChange }) {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');

  const load = (search = '') =>
    api.get('/admin/users', { params: { q: search } }).then((res) => setUsers(res.data)).catch((err) => toast.error(errMsg(err)));

  useEffect(() => { load(); }, []);

  const toggle = async (u) => {
    try {
      const { data } = await api.patch(`/admin/users/${u._id}/status`);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? data : x)));
      toast.success(data.isActive ? 'User activated' : 'User deactivated');
      onChange();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name} with all their properties and reviews?`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      toast.success('User deleted');
      onChange();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, phone, email, location" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primary">Search</button>
      </form>

      {!users ? <Loader /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-slate-600">
              <tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Location</th><th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-3"><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.phone}{u.email && ` · ${u.email}`}</p></td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">{u.location}</td>
                  <td className="p-3">{formatDate(u.createdAt)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="p-3">
                    {u.role !== 'admin' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggle(u)} className="btn btn-outline px-3 py-1.5">
                          {u.isActive ? <><Ban size={14} /> Deactivate</> : <><CheckCircle2 size={14} /> Activate</>}
                        </button>
                        <button onClick={() => remove(u)} aria-label="Delete user" className="btn btn-outline px-3 py-1.5 text-red-600 hover:border-red-600 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PropertiesTable({ onChange }) {
  const [properties, setProperties] = useState(null);

  useEffect(() => {
    api.get('/admin/properties').then((res) => setProperties(res.data)).catch((err) => toast.error(errMsg(err)));
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}”?`)) return;
    try {
      await api.delete(`/properties/${p._id}`);
      setProperties((prev) => prev.filter((x) => x._id !== p._id));
      toast.success('Property deleted');
      onChange();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (!properties) return <Loader />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-mist text-slate-600">
          <tr><th className="p-3">Property</th><th className="p-3">Owner</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {properties.map((p) => (
            <tr key={p._id}>
              <td className="p-3"><p className="font-semibold">{p.title}</p><p className="text-xs text-slate-500">{cityState(p.location)}</p></td>
              <td className="p-3">{p.owner?.name || '-'}</td>
              <td className="p-3">{formatPrice(p.price)}{p.listingType === 'rent' && '/mo'}</td>
              <td className="p-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{p.isActive ? 'Visible' : 'Hidden'}</span>
              </td>
              <td className="p-3">
                <div className="flex justify-end gap-2">
                  <Link to={`/properties/${p._id}`} className="btn btn-outline px-3 py-1.5" aria-label="View"><Eye size={14} /></Link>
                  <button onClick={() => remove(p)} aria-label="Delete property" className="btn btn-outline px-3 py-1.5 text-red-600 hover:border-red-600 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
          {properties.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No properties yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
