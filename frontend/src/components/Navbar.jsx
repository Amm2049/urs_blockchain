import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import {
  HomeIcon, BoltIcon, Squares2X2Icon, ShoppingBagIcon,
  MegaphoneIcon, PhotoIcon, WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/',           label: 'Home',        Icon: HomeIcon },
  { to: '/activities', label: 'Activities',  Icon: BoltIcon },
  { to: '/dashboard',  label: 'Dashboard',   Icon: Squares2X2Icon },
  { to: '/store',      label: 'Reward Store',Icon: ShoppingBagIcon },
  { to: '/voting',     label: 'Voting',      Icon: MegaphoneIcon },
  { to: '/gallery',    label: 'NFT Gallery', Icon: PhotoIcon },
];

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export default function Navbar() {
  const { account, isAdmin, connecting, connect, disconnect, isWrongNetwork } = useWallet();
  const navigate = useNavigate();

  const items = isAdmin
    ? [...navItems, { to: '/admin', label: 'Admin', Icon: WrenchScrewdriverIcon }]
    : navItems;

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 via-emerald-500 to-cyan-500 flex items-center justify-center glow-brand shadow-lg transition-transform duration-200 group-hover:scale-105">
            <svg className="w-4 h-4 text-dark-900" viewBox="0 0 512 512" fill="none">
              <path d="M160 160 V280 C160 340, 200 376, 256 376 C312 376, 352 340, 352 280 V160 H304 V276 C304 310, 284 328, 256 328 C228 328, 208 310, 208 276 V160 H160 Z" fill="currentColor" />
              <path d="M256 120 L267 142 L291 146 L274 163 L278 187 L256 176 L234 187 L238 163 L221 146 L245 142 Z" fill="#f59e0b" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm hidden sm:block tracking-wide">
            URS <span className="text-brand-400/80 font-mono text-xs ml-1 px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">Sepolia</span>
          </span>
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Wallet button */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="hidden sm:flex badge-pill bg-brand-500/15 text-brand-400 border border-brand-500/25">
              Admin
            </span>
          )}
          {account ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-mono text-white/70">{shortAddr(account)}</span>
              </div>
              <button
                onClick={disconnect}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="btn-primary text-xs py-1.5"
            >
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 no-scrollbar">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </div>
    </header>

    {/* Wrong Network Banner */}
    {isWrongNetwork && (
      <div className="sticky top-16 z-40 w-full bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        ⚠ Wrong Network — Please switch MetaMask to <strong className="ml-1">Ethereum Sepolia</strong> to use this app.
      </div>
    )}
    </>
  );
}
