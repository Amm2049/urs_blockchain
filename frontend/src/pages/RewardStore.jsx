import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import { ShoppingBagIcon, BoltIcon, XCircleIcon } from '@heroicons/react/24/outline';

function RewardCard({ reward, balance, account, isAdmin, contracts, onRedeemed }) {
  const cost      = ethers.utils.formatEther(reward.cost);
  const canAfford = account && balance && parseFloat(ethers.utils.formatEther(balance)) >= parseFloat(cost);

  const handleRedeem = async () => {
    if (isAdmin) return;
    const tx = await contracts.Rewardw().redeem(reward.id);
    await tx.wait();
    onRedeemed();
  };

  const gradients = [
    'from-amber-500/20 to-orange-500/10',
    'from-brand-500/20 to-teal-500/10',
    'from-accent-500/20 to-cyan-500/10',
    'from-blue-500/20 to-cyan-500/10',
    'from-rose-500/20 to-pink-500/10',
  ];
  const grad = gradients[reward.id.toNumber() % gradients.length];

  return (
    <div className={`glass-card-hover p-6 bg-gradient-to-br ${grad} animate-slide-up flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-white">{reward.title}</h3>
        {!reward.active && (
          <span className="badge-pill bg-white/5 text-white/30 border border-white/10">Inactive</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <BoltIcon className="w-5 h-5 text-amber-400" />
        <span className="text-2xl font-bold text-amber-400">{cost}</span>
        <span className="text-sm text-white/40">CRT</span>
      </div>

      {account ? (
        isAdmin ? (
          <p className="text-xs text-white/40 font-medium">Admins manage rewards from the Admin Panel.</p>
        ) : reward.active ? (
          canAfford ? (
            <TxButton
              label={`Redeem for ${cost} CRT`}
              loadingLabel="Redeeming…"
              onClick={handleRedeem}
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <XCircleIcon className="w-4 h-4" />
              Insufficient CRT balance
            </div>
          )
        ) : (
          <p className="text-xs text-white/30">This reward is currently unavailable.</p>
        )
      ) : (
        <p className="text-xs text-white/30">Connect wallet to redeem.</p>
      )}
    </div>
  );
}

export default function RewardStore() {
  const { account, isAdmin, contracts } = useWallet();
  const [rewards, setRewards]   = useState([]);
  const [balance, setBalance]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      const rc = contracts.Reward();
      if (!rc) return;
      const count = await rc.rewardCount();
      const items = [];
      for (let i = 1; i <= count.toNumber(); i++) {
        const [id, title, cost, active] = await rc.getReward(i);
        items.push({ id, title, cost, active });
      }
      setRewards(items);

      if (account && !isAdmin) {
        const bal = await contracts.CRT().balanceOf(account);
        setBalance(bal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [account, isAdmin, contracts]); // eslint-disable-line

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="section-title">Reward Store</h1>
          <p className="section-subtitle">
            {isAdmin 
              ? "View redeemable rewards catalog. Manage items and availability in the Admin Panel." 
              : "Spend your CRT on real campus rewards."}
          </p>
        </div>
        {account && !isAdmin && balance !== null && (
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <BoltIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold">{parseFloat(ethers.utils.formatEther(balance)).toFixed(2)}</span>
            <span className="text-white/40 text-sm">CRT</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && rewards.length === 0 && (
        <div className="glass-card p-12 text-center text-white/30">
          <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No rewards available yet.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <RewardCard
            key={r.id.toString()}
            reward={r}
            balance={balance}
            account={account}
            isAdmin={isAdmin}
            contracts={contracts}
            onRedeemed={load}
          />
        ))}
      </div>
    </div>
  );
}
