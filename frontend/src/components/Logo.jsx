import { Link } from 'react-router-dom';
import siteConfig from '../data/siteConfig';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center" aria-label={`${siteConfig.name} home`}>
      <span className={light ? 'rounded-lg bg-white p-1' : ''}>
        <img src={siteConfig.logo} alt={siteConfig.name} className="h-11 w-auto object-contain" />
      </span>
    </Link>
  );
}
