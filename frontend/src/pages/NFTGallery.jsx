import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { PhotoIcon } from '@heroicons/react/24/outline';

// Generate a deterministic gradient from activityId
function badgeGradient(id) {
  const gradients = [
    ['#6366f1', '#8b5cf6'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#06b6d4'],
    ['#ec4899', '#8b5cf6'],
    ['#3b82f6', '#6366f1'],
    ['#f97316', '#eab308'],
    ['#14b8a6', '#10b981'],
    ['#a855f7', '#ec4899'],
  ];
  const pair = gradients[Number(id) % gradients.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function BadgeCard({ tokenId, activityId, activityTitle }) {
  return (
    <div className="glass-card-hover p-5 animate-slide-up flex flex-col gap-4">
      {/* Badge visual */}
      <div
        className="w-full h-32 rounded-xl flex items-center justify-center relative overflow-hidden"
        style={{ background: badgeGradient(activityId) }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 70%)',
        }} />
        <div className="text-center relative z-10">
          <div className="text-4xl mb-1">🏅</div>
          <div className="text-white/80 text-xs font-semibold tracking-wider uppercase">Achievement</div>
        </div>
      </div>

      {/* Badge info */}
      <div>
        <p className="font-semibold text-white text-sm leading-snug">{activityTitle}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-white/30">Token #{tokenId.toString()}</span>
          <span className="badge-pill bg-violet-500/15 text-violet-400 border border-violet-500/25 text-xs">
            Activity #{activityId.toString()}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/[0.06]">
        <span className="text-xs text-white/20">Soulbound · Non-transferable</span>
      </div>
    </div>
  );
}

export default function NFTGallery() {
  const { account, isAdmin, contracts } = useWallet();
  const [badges, setBadges]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const nc = contracts.NFT();
        if (!nc) return;

        const totalMinted = await nc.totalMinted();
        setTotal(totalMinted.toNumber());

        if (account && !isAdmin) {
          const tokenIds = await nc.tokensOf(account);
          const items = await Promise.all(
            tokenIds.map(async (tokenId) => {
              const [activityId, activityTitle] = await nc.badgeOf(tokenId);
              return { tokenId, activityId, activityTitle };
            })
          );
          setBadges(items.reverse());
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [account, isAdmin, contracts]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="section-title">NFT Gallery</h1>
          <p className="section-subtitle">
            {isAdmin 
              ? "Platform soulbound achievement badges issued to student participants." 
              : "Your soulbound achievement badges — earned, never transferred."}
          </p>
        </div>
        <div className="glass-card px-4 py-2 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-white/30 uppercase tracking-widest">Total Minted</p>
        </div>
      </div>

      {isAdmin && (
        <div className="glass-card p-12 text-center border-brand-500/20 bg-brand-500/5">
          <PhotoIcon className="w-14 h-14 mx-auto mb-4 text-brand-400 opacity-60" />
          <h3 className="text-lg font-semibold text-white mb-2">Student Achievement Gallery</h3>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Admins manage platform activities and do not earn or hold NFT achievement badges. Badges are soulbound rewards issued strictly to student participants upon activity completion.
          </p>
        </div>
      )}

      {!isAdmin && !account && (
        <div className="glass-card p-16 text-center">
          <PhotoIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-2">Connect your wallet to view your badges.</p>
          <p className="text-white/25 text-sm">Badges are awarded when you claim an activity reward.</p>
        </div>
      )}

      {!isAdmin && account && loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isAdmin && account && !loading && badges.length === 0 && (
        <div className="glass-card p-16 text-center">
          <PhotoIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-2">No badges yet.</p>
          <p className="text-white/25 text-sm">Join and claim activities to earn soulbound achievement badges.</p>
        </div>
      )}

      {!isAdmin && account && !loading && badges.length > 0 && (
        <>
          <div className="mb-4 text-sm text-white/40">
            You hold <span className="text-white font-semibold">{badges.length}</span> badge{badges.length !== 1 ? 's' : ''}
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map(({ tokenId, activityId, activityTitle }) => (
              <BadgeCard
                key={tokenId.toString()}
                tokenId={tokenId}
                activityId={activityId}
                activityTitle={activityTitle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
