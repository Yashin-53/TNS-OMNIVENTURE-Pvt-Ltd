import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import siteConfig from '../data/siteConfig';

export default function Login() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const goTo = location.state?.from || '/';

  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = (data) => {
    saveSession(data);
    toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
    navigate(goTo, { replace: true });
  };

  const loginWithPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      finish(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!identifier.trim()) return toast.error('Enter your phone number or email first');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/send-otp', { identifier });
      setOtpSent(true);
      setDevOtp(data.devOtp || ''); // only returned by the API in development
      toast.success('OTP sent');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const loginWithOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp });
      finish(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Login to post properties, review listings and contact dealers.">
      <div className="mb-5 flex rounded-lg border border-line bg-white p-1">
        {[['password', 'Password'], ['otp', 'OTP']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === value ? 'bg-river text-ink' : 'hover:text-river'}`}
          >
            Login with {label}
          </button>
        ))}
      </div>

      <form onSubmit={mode === 'password' ? loginWithPassword : loginWithOtp} className="space-y-4">
        <div>
          <label className="label" htmlFor="identifier">Phone number or email</label>
          <input id="identifier" className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="9876543210 or you@example.com" required />
        </div>

        {mode === 'password' ? (
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        ) : otpSent ? (
          <div>
            <label className="label" htmlFor="otp">Enter the 6-digit OTP</label>
            <input id="otp" className="input tracking-[0.4em]" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} inputMode="numeric" required />
            {devOtp && <p className="mt-1 text-xs text-slate-500">Development mode OTP: <b>{devOtp}</b></p>}
            <button type="button" onClick={sendOtp} className="mt-2 text-sm font-semibold text-river hover:underline" disabled={busy}>Resend OTP</button>
          </div>
        ) : null}

        {mode === 'otp' && !otpSent ? (
          <button type="button" onClick={sendOtp} disabled={busy} className="btn btn-primary w-full">{busy ? 'Sending…' : 'Send OTP'}</button>
        ) : (
          <button disabled={busy} className="btn btn-primary w-full">{busy ? 'Please wait…' : 'Login'}</button>
        )}
      </form>

      <p className="mt-6 text-sm text-slate-600">
        New to {siteConfig.name}? <Link to="/register" className="font-semibold text-river hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
