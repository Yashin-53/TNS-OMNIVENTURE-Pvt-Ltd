import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const ROLES = [
  { value: 'buyer', title: 'I want to buy / rent', icon: Search },
  { value: 'seller', title: 'I want to sell / rent out', icon: Home },
];

export default function Register() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', password: '', role: 'buyer' });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', form);
      saveSession(data);
      toast.success('Account created');
      navigate(form.role === 'seller' ? '/post-property' : '/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, title, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setForm({ ...form, role: value })}
              className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${form.role === value ? 'border-river bg-river-light' : 'border-line bg-white hover:border-river'}`}
            >
              <Icon size={20} className="text-river" /> {title}
            </button>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" className="input" value={form.name} onChange={handleChange} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" className="input" value={form.phone} onChange={handleChange} inputMode="numeric" maxLength={10} placeholder="10 digits" required />
          </div>
          <div>
            <label className="label" htmlFor="email">Email <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="location">Location / address</label>
          <input id="location" name="location" className="input" value={form.location} onChange={handleChange} placeholder="City, State" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" value={form.password} onChange={handleChange} minLength={6} placeholder="At least 6 characters" required />
        </div>

        <button disabled={busy} className="btn btn-primary w-full">{busy ? 'Creating account…' : 'Create account'}</button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-semibold text-river hover:underline">Login</Link>
      </p>
    </AuthShell>
  );
}
