import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import {
  BoltIcon, TrophyIcon, MegaphoneIcon, PhotoIcon,
  ShoppingBagIcon, ArrowRightIcon, ShieldCheckIcon,
  SparklesIcon, CheckCircleIcon, ChartBarIcon,
  AcademicCapIcon, FireIcon, ArrowPathIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const bentoFeatures = [
  {
    title: 'On-Chain Activity Engine',
    tagline: 'Instant Proof of Attendance',
    desc: 'Attend workshops, hackathons, and seminars. Admins verify your attendance on-chain, enabling instant CRT token claims.',
    icon: BoltIcon,
    badge: 'Live Attendance',
    accent: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    span: 'lg:col-span-2',
    interactiveType: 'activityFeed',
  },
  {
    title: 'Soulbound Achievement Medals',
    tagline: 'Permanent Web3 Resume',
    desc: 'Every completed activity mints a unique non-transferable ERC-721 NFT badge directly to your wallet.',
    icon: PhotoIcon,
    badge: 'Soulbound NFT',
    accent: 'from-cyan-500/20 via-blue-500/10 to-transparent border-cyan-500/30',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    span: 'lg:col-span-1',
    interactiveType: 'nftBadge',
  },
  {
    title: 'Campus Perk Marketplace',
    tagline: 'Real Value for Effort',
    desc: 'Redeem CRT tokens for coffee vouchers, priority library access, university hoodies, and tech equipment.',
    icon: ShoppingBagIcon,
    badge: 'Utility Token',
    accent: 'from-purple-500/20 via-indigo-500/10 to-transparent border-purple-500/30',
    iconBg: 'bg-purple-500/20 text-purple-400',
    span: 'lg:col-span-1',
    interactiveType: 'storePills',
  },
  {
    title: 'Decentralized Student Voice',
    tagline: 'Transparent Governance',
    desc: 'Hold 1+ CRT to create and vote on real university improvement polls. On-chain tallying guarantees zero tampering.',
    icon: MegaphoneIcon,
    badge: 'On-Chain Voting',
    accent: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-400',
    span: 'lg:col-span-2',
    interactiveType: 'governanceMeter',
  },
];

const featuredActivities = [
  {
    title: 'Web3 & AI Student Hackathon 2026',
    category: 'Workshop & Build',
    reward: '150 CRT',
    badge: 'Legendary Badge',
    time: 'Happening Now',
    icon: FireIcon,
  },
  {
    title: 'Ethereum Smart Contract Security Masterclass',
    category: 'Technical Seminar',
    reward: '100 CRT',
    badge: 'Mastery NFT',
    time: 'Tomorrow, 14:00',
    icon: AcademicCapIcon,
  },
  {
    title: 'Campus Sustainability & Tech Panel',
    category: 'Community Poll & Discussion',
    reward: '50 CRT',
    badge: 'Eco Badge',
    time: 'This Friday',
    icon: SparklesIcon,
  },
];

const comparisonData = [
  {
    feature: 'Attendance Verification',
    traditional: 'Paper sign-in sheets prone to loss and proxy sign-ins',
    urs: 'Cryptographic admin confirmation backed by Ethereum Sepolia logs',
  },
  {
    feature: 'Student Achievements',
    traditional: 'Static paper certificates easily misplaced or forgotten',
    urs: 'Soulbound ERC-721 NFTs tied permanently to student Web3 wallets',
  },
  {
    feature: 'Campus Perk Redemptions',
    traditional: 'Manual paper vouchers or fragmented loyalty cards',
    urs: 'Instant smart contract burn & redemption with zero middleman',
  },
  {
    feature: 'Student Governance',
    traditional: 'Opaque paper polls tallied behind closed doors',
    urs: '100% transparent on-chain voter verification & public tallying',
  },
];

export default function Landing() {
  const { account, connect, connecting } = useWallet();
  const navigate = useNavigate();
  const [walletError, setWalletError] = useState('');

  // Interactive Simulator state
  const [simTab, setSimTab] = useState('claim'); // 'claim' | 'nft' | 'vote'
  const [simCrtBalance, setSimCrtBalance] = useState(120);
  const [simClaimed, setSimClaimed] = useState(false);
  const [simClaiming, setSimClaiming] = useState(false);
  const [simVote, setSimVote] = useState(null); // 'yes' | 'no'
  const [simVoteCounts, setSimVoteCounts] = useState({ yes: 142, no: 28 });
  const [activeCompTab, setActiveCompTab] = useState('urs'); // 'urs' | 'traditional'

  const handleSimClaim = () => {
    if (simClaimed || simClaiming) return;
    setSimClaiming(true);
    setTimeout(() => {
      setSimCrtBalance((prev) => prev + 50);
      setSimClaimed(true);
      setSimClaiming(false);
    }, 900);
  };

  const handleSimVote = (option) => {
    if (simVote === option) return;
    const oldVote = simVote;
    setSimVote(option);
    setSimVoteCounts((prev) => {
      const next = { ...prev };
      if (oldVote) next[oldVote] = Math.max(0, next[oldVote] - 1);
      next[option] = next[option] + 1;
      return next;
    });
  };

  const handleCTA = async () => {
    if (account) {
      navigate('/activities');
      return;
    }
    setWalletError('');
    try {
      await connect();
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        navigate('/activities');
      } else {
        setWalletError('Connection cancelled. Please approve MetaMask to continue.');
      }
    } catch (err) {
      const msg =
        err?.code === 4001
          ? 'Connection cancelled. Please approve MetaMask to continue.'
          : err?.message ?? 'Failed to connect wallet. Please try again.';
      setWalletError(msg);
    }
  };

  return (
    <div className="space-y-20 pb-12 animate-fade-in">
      {/* Dynamic Hero Section */}
      <section className="relative pt-6 pb-12 md:py-16 overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[400px] h-[280px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25">
              <ShieldCheckIcon className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-brand-300">
                Ethereum Sepolia Testnet · Smart Contracts Verified
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Campus Life, <br />
              <span className="text-gradient">Upgraded On-Chain.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
              Earn <strong className="text-brand-300 font-semibold">CRT tokens</strong> for verified event attendance,
              collect permanent <strong className="text-cyan-300 font-semibold">Soulbound NFT badges</strong>, redeem campus perks,
              and shape university governance transparently.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleCTA}
                disabled={connecting}
                className="btn-primary px-7 py-3.5 text-base glow-brand shadow-lg"
              >
                {connecting ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Connecting…
                  </>
                ) : account ? (
                  <>
                    Explore Activities
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Connect Wallet to Start
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('interactive-demo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-secondary px-6 py-3.5 text-base"
              >
                <SparklesIcon className="w-5 h-5 text-amber-400" />
                Try Interactive Demo
              </button>
            </div>

            {/* Wallet Error Alert */}
            {walletError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm max-w-md">
                <span className="flex-1">{walletError}</span>
                <button
                  onClick={() => setWalletError('')}
                  className="text-red-400/60 hover:text-red-400 text-lg leading-none"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] max-w-lg">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-white/40 font-medium">On-Chain Proof</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-brand-400">ERC-721</div>
                <div className="text-xs text-white/40 font-medium">Soulbound Badges</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-cyan-400">Instant</div>
                <div className="text-xs text-white/40 font-medium">Perk Redemptions</div>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Interactive DApp Simulator Widget */}
          <div id="interactive-demo" className="lg:col-span-5">
            <div className="glass-card p-6 border-white/10 bg-dark-800/80 backdrop-blur-xl shadow-2xl relative">
              {/* Top Bar / Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono text-white/70 font-semibold uppercase tracking-wider">
                    Interactive DApp Playground
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[11px] font-mono text-brand-300">
                  Simulated State
                </div>
              </div>

              {/* Playground Nav Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-white/[0.04] p-1 rounded-xl mb-5">
                <button
                  onClick={() => setSimTab('claim')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    simTab === 'claim'
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  ⚡ Claim CRT
                </button>
                <button
                  onClick={() => setSimTab('nft')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    simTab === 'nft'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  🥇 NFT Badge
                </button>
                <button
                  onClick={() => setSimTab('vote')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    simTab === 'vote'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  🗳️ Vote Poll
                </button>
              </div>

              {/* Tab 1: Claim CRT Simulator */}
              {simTab === 'claim' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white/40 block">Simulated Balance</span>
                      <span className="text-2xl font-extrabold text-white flex items-center gap-1.5">
                        {simCrtBalance} <span className="text-xs font-semibold text-brand-400">CRT</span>
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
                      <BoltIcon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Web3 Student Summit 2026</h4>
                        <p className="text-xs text-white/50">Attendance Confirmed by Admin</p>
                      </div>
                      <span className="text-xs font-bold text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full border border-brand-500/30">
                        +50 CRT
                      </span>
                    </div>

                    <button
                      onClick={handleSimClaim}
                      disabled={simClaimed || simClaiming}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        simClaimed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-brand-gradient text-white hover:opacity-90 active:scale-95 glow-brand'
                      }`}
                    >
                      {simClaiming ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Minting to Sepolia…
                        </>
                      ) : simClaimed ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                          Claimed +50 CRT & Badge Minted!
                        </>
                      ) : (
                        'Click to Test Claim ()'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Soulbound NFT Badge 3D Interactive Card */}
              {simTab === 'nft' && (
                <div className="space-y-3 animate-fade-in text-center">
                  <div className="group relative p-5 rounded-2xl bg-gradient-to-b from-cyan-500/10 via-dark-900 to-dark-900 border border-cyan-500/30 shadow-xl transition-all duration-300 hover:border-cyan-400">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <TrophyIcon className="w-8 h-8 text-dark-900" />
                    </div>
                    <h4 className="text-base font-bold text-white">Blockchain Pioneer 2026</h4>
                    <p className="text-xs text-cyan-300 font-mono mt-0.5">Soulbound NFT · ID #0042</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                      <div className="p-2 rounded-lg bg-white/[0.04] text-[11px]">
                        <span className="text-white/40 block">Type</span>
                        <span className="text-white font-medium">Achievement</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.04] text-[11px]">
                        <span className="text-white/40 block">Transferable</span>
                        <span className="text-red-400 font-medium">No (Soulbound)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40">
                    Non-transferable ERC-721 token proof stored directly in your wallet.
                  </p>
                </div>
              )}

              {/* Tab 3: Governance Poll Simulator */}
              {simTab === 'vote' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">
                      Active Student Poll #04
                    </span>
                    <h4 className="text-xs font-semibold text-white leading-snug">
                      Fund 24/7 Student Hardware & AI Research Lab?
                    </h4>
                  </div>

                  {/* Vote Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimVote('yes')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        simVote === 'yes'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>👍 In Favor</span>
                      <span className="text-[10px] opacity-60">{simVoteCounts.yes} Votes</span>
                    </button>

                    <button
                      onClick={() => handleSimVote('no')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        simVote === 'no'
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>👎 Oppose</span>
                      <span className="text-[10px] opacity-60">{simVoteCounts.no} Votes</span>
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-white/50">
                      <span>Approval Rate</span>
                      <span className="font-mono font-semibold text-amber-400">
                        {Math.round((simVoteCounts.yes / (simVoteCounts.yes + simVoteCounts.no)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                      <div
                        className="bg-emerald-400 transition-all duration-300"
                        style={{
                          width: `${(simVoteCounts.yes / (simVoteCounts.yes + simVoteCounts.no)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-red-400 transition-all duration-300"
                        style={{
                          width: `${(simVoteCounts.no / (simVoteCounts.yes + simVoteCounts.no)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Box Features */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">
            Built Different
          </h2>
          <h3 className="text-3xl font-extrabold text-white">
            Four Core Pillars of the On-Chain Campus
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {bentoFeatures.map((feat) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.title}
                className={`glass-card-hover p-8 bg-gradient-to-br ${feat.accent} ${feat.span} flex flex-col justify-between group relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feat.iconBg}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="badge-pill bg-white/10 text-white/80 border border-white/15">
                      {feat.badge}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-white/40 block mb-1">{feat.tagline}</span>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed">{feat.desc}</p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-white/50 group-hover:text-white transition-colors">
                  <span>Explore Feature</span>
                  <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive System Comparison: Legacy vs URS Web3 */}
      <section className="glass-card p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
              Why Upgrade?
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">
              Paper Systems vs. URS Smart Contracts
            </h3>
          </div>

          <div className="flex bg-white/[0.05] p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveCompTab('urs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCompTab === 'urs'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              ⚡ URS Web3
            </button>
            <button
              onClick={() => setActiveCompTab('traditional')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCompTab === 'traditional'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              📄 Traditional
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {comparisonData.map((row) => (
            <div
              key={row.feature}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                activeCompTab === 'urs'
                  ? 'bg-emerald-500/[0.04] border-emerald-500/25 hover:border-emerald-500/40'
                  : 'bg-red-500/[0.04] border-red-500/25 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-white/50">{row.feature}</span>
                {activeCompTab === 'urs' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckIcon className="w-3.5 h-3.5" /> Web3 On-Chain
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                    Legacy Paper
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white leading-relaxed">
                {activeCompTab === 'urs' ? row.urs : row.traditional}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Featured Activities Teaser */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Upcoming Campus Activities</h3>
            <p className="text-xs text-white/50">Attend and claim CRT rewards + Soulbound NFT badges</p>
          </div>
          <button
            onClick={() => navigate('/activities')}
            className="btn-secondary text-xs py-2 px-4"
          >
            View All Activities →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {featuredActivities.map((act) => {
            const IconComp = act.icon;
            return (
              <div
                key={act.title}
                className="glass-card-hover p-6 flex flex-col justify-between space-y-4 border-white/[0.08]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {act.category}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <StarIcon className="w-3.5 h-3.5" />
                      {act.reward}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">{act.title}</h4>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-white/40">{act.time}</span>
                  <button
                    onClick={() => navigate('/activities')}
                    className="font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                  >
                    Claim CRT
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* High Impact Bottom CTA Banner */}
      <section className="relative rounded-3xl p-10 md:p-14 overflow-hidden border border-brand-500/30 bg-gradient-to-r from-brand-950/80 via-dark-900 to-cyan-950/80 shadow-2xl text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-500/15 blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gradient flex items-center justify-center glow-brand text-dark-900 shadow-xl">
            <AcademicCapIcon className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Experience the On-Chain Campus?
          </h3>

          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Connect your MetaMask wallet on Ethereum Sepolia to claim tokens, collect soulbound achievement badges, and participate in student governance today.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleCTA}
              disabled={connecting}
              className="btn-primary px-8 py-3.5 text-base glow-brand"
            >
              {connecting ? 'Connecting Wallet…' : account ? 'Go to Activities' : 'Connect Wallet Now'}
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/store')}
              className="btn-secondary px-6 py-3.5 text-base"
            >
              <ShoppingBagIcon className="w-5 h-5 text-emerald-400" />
              Visit Reward Store
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
