import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import { BoltIcon, CheckBadgeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function statusLabel(s) {
  return s === 0 ? 'Open' : 'Closed';
}

function ActivityCard({ activity, account, contracts }) {
  const [eligible, setEligible]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [claimed, setClaimed]     = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!account || !contracts) return;
    const load = async () => {
      try {
        const c = contracts.Activity();
        const [e, conf, cl] = await Promise.all([
          c.isEligible(activity.id, account),
          c.isConfirmed(activity.id, account),
          c.hasClaimed(activity.id, account),
        ]);
        setEligible(e);
        setConfirmed(conf);
        setClaimed(cl);
      } catch {}
      setLoading(false);
    };
    load();
  }, [activity.id, account, contracts]);

  const handleJoin = async () => {
    const tx = await contracts.Activityw().join(activity.id);
    await tx.wait();
    setEligible(true);
  };

  const handleClaim = async () => {
    const tx = await contracts.Activityw().claim(activity.id);
    await tx.wait();
    setClaimed(true);
  };

  const isOpen   = activity.status === 0;
  const reward   = ethers.utils.formatEther(activity.rewardAmount);

  return (
    <div className="glass-card-hover p-6 animate-slide-up flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-base">{activity.title}</h3>
          <p className="text-xs text-white/40 mt-0.5">Activity #{activity.id.toString()}</p>
        </div>
        <span className={`badge-pill flex-shrink-0 ${isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
          {statusLabel(activity.status)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <BoltIcon className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400 font-semibold">{reward} CRT</span>
        <span className="text-white/30 text-xs">reward</span>
      </div>

      {/* Status flags */}
      {!loading && account && (
        <div className="flex flex-wrap gap-2 text-xs">
          {eligible && (
            <span className="badge-pill bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckBadgeIcon className="w-3 h-3" /> Registered
            </span>
          )}
          {confirmed && (
            <span className="badge-pill bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <CheckBadgeIcon className="w-3 h-3" /> Confirmed
            </span>
          )}
          {claimed && (
            <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckBadgeIcon className="w-3 h-3" /> Claimed ✓
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {account && !loading && (
        <div className="flex gap-2 mt-auto pt-2 border-t border-white/[0.06]">
          {!eligible && isOpen && (
            <TxButton label="Join" loadingLabel="Joining…" onClick={handleJoin} />
          )}
          {confirmed && !claimed && (
            <TxButton label="Claim CRT + Badge" loadingLabel="Claiming…" onClick={handleClaim} variant="success" />
          )}
          {eligible && !confirmed && !claimed && (
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <LockClosedIcon className="w-3.5 h-3.5" /> Awaiting admin confirmation
            </div>
          )}
          {claimed && (
            <span className="text-xs text-white/30">Reward claimed · NFT badge minted</span>
          )}
        </div>
      )}

      {!account && (
        <p className="text-xs text-white/30 pt-2 border-t border-white/[0.06]">Connect wallet to join</p>
      )}
    </div>
  );
}

export default function Activities() {
  const { account, contracts } = useWallet();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const c = contracts.Activity();
        if (!c) return;
        const count = await c.activityCount();
        const total = count.toNumber();
        // Fetch all activities in parallel
        const items = await Promise.all(
          Array.from({ length: total }, (_, i) =>
            c.getActivity(i + 1).then(([id, title, rewardAmount, status]) =>
              ({ id, title, rewardAmount, status })
            )
          )
        );
        setActivities(items.reverse()); // newest first
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contracts]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">Activities</h1>
        <p className="section-subtitle">Join activities, get confirmed by admin, then claim your CRT + NFT badge.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && activities.length === 0 && (
        <div className="glass-card p-12 text-center text-white/30">
          <BoltIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No activities yet. Check back later.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((act) => (
          <ActivityCard key={act.id.toString()} activity={act} account={account} contracts={contracts} />
        ))}
      </div>
    </div>
  );
}
