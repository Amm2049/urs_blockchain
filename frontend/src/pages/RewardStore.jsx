import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import ConfirmDialog from '../components/ConfirmDialog';
import { ShoppingBagIcon, BoltIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

function RewardCard({ reward, balance, account, isAdmin, onRequestRedeem }) {
  const cost      = ethers.utils.formatEther(reward.cost);
  const canAfford = account && balance && parseFloat(ethers.utils.formatEther(balance)) >= parseFloat(cost);

  const gradients = [
    'from-amber-500/15 to-orange-500/5 border-amber-500/20',
    'from-brand-500/15 to-teal-500/5 border-brand-500/20',
    'from-accent-500/15 to-cyan-500/5 border-accent-500/20',
    'from-blue-500/15 to-cyan-500/5 border-blue-500/20',
    'from-rose-500/15 to-pink-500/5 border-rose-500/20',
  ];
  const grad = gradients[reward.id.toNumber() % gradients.length];

  return (
    <div className={`glass-card p-4 bg-gradient-to-br ${grad} border animate-slide-up flex flex-col justify-between gap-3 hover:border-white/25 transition-all duration-200`}>
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/50">
            #{reward.id.toString()}
          </span>
          {!reward.active && (
            <span className="badge-pill bg-white/5 text-white/30 border border-white/10 text-[10px]">Inactive</span>
          )}
        </div>
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{reward.title}</h3>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <BoltIcon className="w-4 h-4 text-amber-400" />
          <span className="text-lg font-bold text-amber-400">{cost}</span>
          <span className="text-xs font-medium text-white/40">CRT</span>
        </div>

        {account ? (
          isAdmin ? (
            <span className="text-[11px] text-white/30 font-medium">Admin mode</span>
          ) : reward.active ? (
            canAfford ? (
              <button
                onClick={() => onRequestRedeem(reward)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-gradient text-white hover:opacity-90 transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.15)] flex-shrink-0"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5" />
                Redeem
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 flex-shrink-0">
                <XCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
                No CRT
              </div>
            )
          ) : (
            <span className="text-[11px] text-white/30">Unavailable</span>
          )
        ) : (
          <span className="text-[11px] text-white/30">Connect wallet</span>
        )}
      </div>
    </div>
  );
}

export default function RewardStore() {
  const { account, isAdmin, contracts } = useWallet();
  const [rewards, setRewards]         = useState([]);
  const [balance, setBalance]         = useState(null);
  const [loading, setLoading]         = useState(true);
  
  // Confirmation Modal State
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeeming, setRedeeming]           = useState(false);
  const [redeemError, setRedeemError]       = useState('');
  const [redeemSuccess, setRedeemSuccess]   = useState(false);

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

  const handleConfirmRedeem = async () => {
    if (!selectedReward || isAdmin) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const tx = await contracts.Rewardw().redeem(selectedReward.id);
      await tx.wait();
      setRedeemSuccess(true);
      setTimeout(() => {
        setRedeemSuccess(false);
        setSelectedReward(null);
      }, 1500);
      await load();
    } catch (err) {
      console.error('Redemption failed', err);
      const msg = err?.reason || err?.data?.message || err?.message || 'Transaction failed';
      setRedeemError(msg.length > 120 ? msg.slice(0, 120) + '…' : msg);
    } finally {
      setRedeeming(false);
    }
  };

  const formattedCost = selectedReward ? ethers.utils.formatEther(selectedReward.cost) : '0';
  const currentBalance = balance ? parseFloat(ethers.utils.formatEther(balance)).toFixed(2) : '0';

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="section-title">Reward Store</h1>
          <p className="section-subtitle mb-0">
            {isAdmin 
              ? "View redeemable rewards catalog. Manage items and availability in the Admin Panel." 
              : "Spend your CRT on real campus rewards."}
          </p>
        </div>
        {account && !isAdmin && balance !== null && (
          <div className="glass-card px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <BoltIcon className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold">{currentBalance}</span>
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

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {rewards.map((r) => (
          <RewardCard
            key={r.id.toString()}
            reward={r}
            balance={balance}
            account={account}
            isAdmin={isAdmin}
            onRequestRedeem={(reward) => {
              setRedeemError('');
              setRedeemSuccess(false);
              setSelectedReward(reward);
            }}
          />
        ))}
      </div>

      {/* Confirmation Box Modal */}
      <ConfirmDialog
        open={Boolean(selectedReward)}
        title="Confirm Reward Redemption"
        variant="brand"
        icon={ShoppingBagIcon}
        loading={redeeming}
        confirmLabel={redeeming ? "Processing..." : "Confirm & Redeem"}
        cancelLabel="Cancel"
        onCancel={() => {
          if (!redeeming) {
            setSelectedReward(null);
            setRedeemError('');
          }
        }}
        onConfirm={handleConfirmRedeem}
        message={
          selectedReward && (
            <div className="space-y-3 pt-1">
              <p>Are you sure you want to redeem this reward item?</p>
              
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-sm">{selectedReward.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">Reward ID: #{selectedReward.id.toString()}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                  <BoltIcon className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400 text-sm">
                    {formattedCost} CRT
                  </span>
                </div>
              </div>

              <div className="text-xs text-white/50 space-y-1">
                <div className="flex justify-between">
                  <span>Your Balance:</span>
                  <span className="font-medium text-white/80">{currentBalance} CRT</span>
                </div>
                <div className="flex justify-between">
                  <span>After Redemption:</span>
                  <span className="font-medium text-emerald-400">
                    {(parseFloat(currentBalance) - parseFloat(formattedCost)).toFixed(2)} CRT
                  </span>
                </div>
              </div>

              {redeemError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 break-words">
                  {redeemError}
                </div>
              )}

              {redeemSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Redemption successful! Updating balance…
                </div>
              )}
            </div>
          )
        }
      />
    </div>
  );
}
