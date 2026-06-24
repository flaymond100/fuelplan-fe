import { Link, NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useSession';
import { glass, buttonClass } from './ui';

type NavItem = { to: string; label: string; end?: boolean };

const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/plans', label: 'My plans', end: true },
  { to: '/app/profile', label: 'Profile' },
  { to: '/app/subscription', label: 'Subscription' },
  { to: '/app/settings', label: 'Settings' },
];

export default function AppLayout() {
  const { session } = useSession();
  const email = session?.user.email ?? '';
  const initial = (email || '?').charAt(0).toUpperCase();

  return (
    <div className="app-backdrop min-h-screen text-zinc-900 antialiased">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <header className={glass('flex items-center gap-3 px-3 py-2.5')}>
          <Link
            to="/app"
            className="flex shrink-0 items-center gap-2 pr-1 pl-1 text-base font-semibold tracking-tight text-zinc-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-linear-to-br from-brand-300 to-brand-600 text-zinc-950 shadow-md shadow-brand-500/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </span>
            <span className="hidden sm:block">Fuelplan</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavPill key={item.to} item={item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <div className="hidden sm:block">
              <Link to="/app/plans/new" className={buttonClass('primary')}>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14 M5 12h14" />
                </svg>
                New plan
              </Link>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/60 py-1 pr-1.5 pl-1 ring-1 ring-white/70">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-br from-brand-300 to-brand-600 text-sm font-semibold text-zinc-950">
                {initial}
              </span>
              <span className="hidden max-w-40 truncate text-sm text-zinc-700 md:block" title={email}>
                {email}
              </span>
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                title="Sign out"
                aria-label="Sign out"
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-white/70 hover:text-zinc-900"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile nav — scrollable pill row + a New-plan pill */}
        <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto lg:hidden">
          {NAV.map((item) => (
            <NavPill key={item.to} item={item} />
          ))}
          <NavLink
            to="/app/plans/new"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-brand-500/30 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14 M5 12h14" />
            </svg>
            New
          </NavLink>
        </nav>

        <main className="mt-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavPill({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-400 text-zinc-950 shadow-sm shadow-brand-500/30'
            : 'text-zinc-600 hover:bg-white/60'
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}
