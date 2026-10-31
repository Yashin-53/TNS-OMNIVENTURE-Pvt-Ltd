import { Link } from 'react-router-dom';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="ZameenSetu home">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#fff' : '#0F766E'} />
        <path d="M5 22h22M8 22c0-7 3.5-11 8-11s8 4 8 11" fill="none" stroke={light ? '#0F766E' : '#fff'} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="16" cy="8" r="2.4" fill="#F5A524" />
      </svg>
      <span className={`font-display text-xl font-bold ${light ? 'text-white' : 'text-ink'}`}>ZameenSetu</span>
    </Link>
  );
}
