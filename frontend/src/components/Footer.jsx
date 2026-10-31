import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            ZameenSetu is the bridge between people who own property and people looking for one.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Browse properties</Link></li>
            <li><Link to="/?listingType=rent#listings" className="hover:text-white">Rentals</Link></li>
            <li><Link to="/post-property" className="hover:text-white">Post a property</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail size={16} /> support@zameensetu.com</li>
            <li className="flex items-center gap-2"><Phone size={16} /> +91 90000 00000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} ZameenSetu. All rights reserved.
      </div>
    </footer>
  );
}
