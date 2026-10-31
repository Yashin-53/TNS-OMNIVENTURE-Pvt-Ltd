import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, LogOut, Plus, Search, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // close the user menu when clicking elsewhere
  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}#listings` : '/#listings');
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="order-1"><Logo /></div>

        {/* search: full width row on mobile, centred on desktop */}
        <form onSubmit={handleSearch} className="order-3 flex w-full md:order-2 md:w-auto md:flex-1 md:max-w-xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, city, area or pincode"
              className="input rounded-r-none border-r-0 pl-10"
              aria-label="Search properties"
            />
          </div>
          <button className="btn btn-primary rounded-l-none">Search</button>
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <Link to="/post-property" className="btn btn-accent">
            <Plus size={16} /> <span className="hidden sm:inline">Post property</span><span className="sm:hidden">Post</span>
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-river text-sm font-bold text-white"
                aria-label="Account menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="text-xs capitalize text-slate-500">{user.role}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-mist">
                    <User size={16} /> My profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-mist">
                      <ShieldCheck size={16} /> Admin dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-mist">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline"><LogIn size={16} /> Login</Link>
              <Link to="/register" className="btn btn-primary hidden sm:inline-flex">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
