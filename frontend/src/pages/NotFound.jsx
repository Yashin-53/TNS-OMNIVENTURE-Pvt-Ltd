import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-river">404</p>
      <h1 className="mt-2 text-2xl font-bold">This page doesn’t exist</h1>
      <p className="mt-2 text-slate-600">The link may be broken or the page was moved.</p>
      <Link to="/" className="btn btn-primary mt-6">Back to home</Link>
    </div>
  );
}
