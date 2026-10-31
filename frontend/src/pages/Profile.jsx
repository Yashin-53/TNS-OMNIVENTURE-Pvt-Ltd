import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { cityState, formatPrice, formatDate, PLACEHOLDER_IMG } from '../utils/format';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-river font-display text-2xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm capitalize text-slate-600">{user.role} · Joined {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {[['profile', 'My profile'], ['properties', 'My properties']].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === value ? 'border-river text-river' : 'border-transparent text-slate-600 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'profile' ? <ProfileTab user={user} setUser={setUser} logout={logout} navigate={navigate} /> : <MyProperties user={user} />}
      </div>
    </div>
  );
}

function ProfileTab({ user, setUser, logout, navigate }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone, email: user.email || '', location: user.location, role: user.role });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm('This permanently deletes your account, properties and reviews. Continue?')) return;
    try {
      await api.delete('/users/me', { data: { password: deletePassword } });
      logout();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Personal details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Full name</label><input name="name" className="input" value={form.name} onChange={handleChange} required /></div>
          <div><label className="label">Phone number</label><input name="phone" className="input" value={form.phone} onChange={handleChange} maxLength={10} required /></div>
          <div><label className="label">Email</label><input name="email" type="email" className="input" value={form.email} onChange={handleChange} /></div>
          <div><label className="label">Location / address</label><input name="location" className="input" value={form.location} onChange={handleChange} required /></div>
          {user.role !== 'admin' && (
            <div>
              <label className="label">Account type</label>
              <select name="role" className="input" value={form.role} onChange={handleChange}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller / dealer</option>
              </select>
            </div>
          )}
        </div>
        <button disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Current password</label><input type="password" className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></div>
          <div><label className="label">New password</label><input type="password" className="input" minLength={6} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required /></div>
        </div>
        <button className="btn btn-outline">Update password</button>
      </form>

      {user.role !== 'admin' && (
        <form onSubmit={deleteAccount} className="card space-y-3 border-red-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-red-700">Delete account</h2>
          <p className="text-sm text-slate-600">This removes your profile, all your properties and your reviews. It cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <input type="password" className="input max-w-xs" placeholder="Confirm with your password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
            <button className="btn btn-danger">Delete my account</button>
          </div>
        </form>
      )}
    </div>
  );
}

function MyProperties({ user }) {
  const [properties, setProperties] = useState(null);

  useEffect(() => {
    api.get('/properties/mine').then((res) => setProperties(res.data)).catch((err) => toast.error(errMsg(err)));
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}” permanently?`)) return;
    try {
      await api.delete(`/properties/${p._id}`);
      setProperties((prev) => prev.filter((x) => x._id !== p._id));
      toast.success('Property deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (!properties) return <Loader />;

  if (properties.length === 0) {
    return (
      <div className="card px-6 py-14 text-center">
        <h2 className="text-xl font-semibold">You haven’t posted any property yet</h2>
        <p className="mt-1 text-sm text-slate-600">
          {user.role === 'buyer' ? 'Switch to a seller account to start posting.' : 'Your listings will appear here.'}
        </p>
        <Link to="/post-property" className="btn btn-accent mt-5"><Plus size={16} /> Post property</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((p) => (
        <div key={p._id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
          <img src={p.images[0]?.url || PLACEHOLDER_IMG} alt="" className="h-32 w-full rounded-xl object-cover sm:h-20 sm:w-28" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.title}</p>
            <p className="truncate text-sm text-slate-600">{cityState(p.location)} · {formatPrice(p.price)}{p.listingType === 'rent' && '/month'}</p>
            {!p.isActive && <p className="mt-1 text-xs font-semibold text-red-600">Hidden (account deactivated)</p>}
          </div>
          <div className="flex gap-2">
            <Link to={`/properties/${p._id}`} className="btn btn-outline px-3" aria-label="View"><Eye size={16} /></Link>
            <Link to={`/properties/${p._id}/edit`} className="btn btn-outline px-3" aria-label="Edit"><Pencil size={16} /></Link>
            <button onClick={() => remove(p)} className="btn btn-outline px-3 text-red-600 hover:border-red-600 hover:text-red-600" aria-label="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
