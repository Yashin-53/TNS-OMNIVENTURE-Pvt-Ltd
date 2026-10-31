import Logo from './Logo';

// Two-column layout shared by Login and Register
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-river lg:block">
        {/* bridge illustration */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 500 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <circle cx="365" cy="120" r="46" fill="#F5A524" />
          <path d="M40 380C40 230 140 160 250 160S460 230 460 380" fill="none" stroke="#fff" strokeWidth="6" opacity="0.9" />
          <path d="M110 380C110 280 170 230 250 230S390 280 390 380" fill="none" stroke="#fff" strokeWidth="4" opacity="0.5" />
          <path d="M0 380H500" stroke="#fff" strokeWidth="6" opacity="0.9" />
          <path d="M0 400H500M0 418H500" stroke="#fff" strokeWidth="2" opacity="0.25" />
        </svg>
        <div className="relative p-10 text-white">
          <Logo light />
          <h2 className="mt-12 max-w-sm text-3xl xl:text-4xl font-bold leading-tight">Where owners and buyers meet halfway.</h2>
          <p className="mt-4 max-w-sm text-white/80">List a property, find your next home and talk directly to the person on the other side.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
