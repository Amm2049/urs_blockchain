import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import {
  BoltIcon, TrophyIcon, MegaphoneIcon, PhotoIcon,
  ShoppingBagIcon, ArrowRightIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    Icon: BoltIcon,
    title: 'Earn CRT',
    desc: 'Join university activities and claim Campus Reward Tokens upon confirmed attendance.',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    Icon: ShoppingBagIcon,
    title: 'Redeem Rewards',
    desc: 'Spend your CRT on real campus rewards — coffee, library extensions, hoodies and more.',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    Icon: MegaphoneIcon,
    title: 'Vote on Polls',
    desc: 'Hold at least 1 CRT and vote on campus improvement polls. Your voice, on-chain.',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    Icon: PhotoIcon,
    title: 'NFT Badges',
    desc: 'Every activity you claim earns you a soulbound achievement badge — permanently on-chain.',
    color: 'from-accent-500/20 to-cyan-500/10 border-accent-500/20',
    iconColor: 'text-accent-400',
  },
];

export default function Landing() {
  const { account, connect, connecting } = useWallet();
  const navigate = useNavigate();
  const [walletError, setWalletError] = useState('');

  const handleCTA = async () => {
    if (account) {
      navigate('/activities');
      return;
    }
    setWalletError('');
    try {
      await connect();
      // Only navigate if the wallet was actually connected (user didn't cancel)
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        navigate('/activities');
      } else {
        setWalletError('Connection cancelled. Please approve MetaMask to continue.');
      }
    } catch (err) {
      const msg = err?.code === 4001
        ? 'Connection cancelled. Please approve MetaMask to continue.'
        : (err?.message ?? 'Failed to connect wallet. Please try again.');
      setWalletError(msg);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative text-center py-20 md:py-28 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-500/8 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-[300px] h-[200px] rounded-full bg-accent-500/8 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <ShieldCheckIcon className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-medium text-brand-400">Live on Ethereum Sepolia</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-gradient">University</span>
            <br />
            <span className="text-white">Reward System</span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            A transparent, blockchain-powered reward platform where students earn tokens,
            collect NFT badges, redeem campus perks, and vote on what matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleCTA}
              disabled={connecting}
              className="btn-primary px-8 py-3.5 text-base glow-brand"
            >
              {connecting ? 'Connecting…' : account ? 'Explore Activities' : 'Connect Wallet'}
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            {account && (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-8 py-3.5 text-base"
              >
                <TrophyIcon className="w-5 h-5" />
                My Dashboard
              </button>
            )}
          </div>

          {/* Wallet error message */}
          {walletError && (
            <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm max-w-md mx-auto">
              <span className="flex-1">{walletError}</span>
              <button
                onClick={() => setWalletError('')}
                className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-center text-sm font-semibold text-white/30 uppercase tracking-widest mb-10">
          What you can do
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ Icon, title, desc, color, iconColor }) => (
            <div key={title} className={`glass-card-hover p-6 bg-gradient-to-br ${color}`}>
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-xl font-bold text-white mb-8 text-center">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Join an Activity', desc: 'Sign up for workshops, seminars, or events created by the admin.' },
              { step: '02', title: 'Get Confirmed', desc: 'After attending, admin marks your attendance on-chain.' },
              { step: '03', title: 'Claim CRT + Badge', desc: 'Call claim() to receive your CRT reward and a soulbound NFT badge.' },
              { step: '04', title: 'Spend & Vote', desc: 'Redeem CRT for campus rewards and vote on future improvements.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-2">
                <span className="text-4xl font-black text-gradient opacity-60">{step}</span>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
