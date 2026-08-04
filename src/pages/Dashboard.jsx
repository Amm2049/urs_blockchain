import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import {
  BoltIcon, TrophyIcon, ShoppingBagIcon, MegaphoneIcon,
} from '@heroicons/react/24/outline';

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

export default function Dashboard() {
  const { account, contracts } = useWallet();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !contracts) return;
    const load = async () => {
      try {
        const [crt, nft, reward, voting, activity] = [
          contracts.CRT(), contracts.NFT(), contracts.Reward(),
          contracts.Voting(), contracts.Activity(),
        ];

        const [balance, nftBalance] = await Promise.all([
          crt.balanceOf(account),
          nft.balanceOf(account),
        ]);

        // Redemption history
        const redemptionIds = await reward.getStudentRedemptionIds(account);
        const redemptions = await Promise.all(
          redemptionIds.map(async (id) => {
            const [rid, rewardId, student, cost, timestamp] = await reward.getRedemption(id);
            const [,title] = await reward.getReward(rewardId);
            return { id: rid, title, cost, timestamp };
          })
        );

        // Voting history
        const votedPollIds = await voting.getStudentVotedPollIds(account);
        const votes = await Promise.all(
          votedPollIds.map(async (pollId) => {
            const [,question] = await voting.getPoll(pollId);
            const optionIndex = await voting.getVotedOption(pollId, account);
            const options = await voting.getOptions(pollId);
            return { pollId, question, votedOption: options[optionIndex.toNumber()] };
          })
        );

        // Claimed activities (from NFT badges)
        const tokenIds = await nft.tokensOf(account);
        const badges = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const [activityId, activityTitle] = await nft.badgeOf(tokenId);
            return { tokenId, activityId, activityTitle };
          })
        );

        setData({
          balance: ethers.utils.formatEther(balance),
          nftCount: nftBalance.toNumber(),
          redemptions: redemptions.reverse(),
          votes: votes.reverse(),
          badges,
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [account, contracts]);

  if (!account) {
    return (
      <div className="glass-card p-16 text-center animate-fade-in">
        <TrophyIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
        <p className="text-white/50 mb-4">Connect your wallet to view your dashboard.</p>
        <p className="text-white/30 text-sm">Your CRT balance, badges, redemptions, and voting history will appear here.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle font-mono text-white/30">{shortAddr(account)}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/15">
          <BoltIcon className="w-5 h-5 text-amber-400 mb-1" />
          <span className="stat-value text-amber-400">{parseFloat(data.balance).toFixed(2)}</span>
          <span className="stat-label">CRT Balance</span>
        </div>
        <div className="stat-card bg-gradient-to-br from-accent-500/10 to-cyan-500/5 border-accent-500/15">
          <TrophyIcon className="w-5 h-5 text-accent-400 mb-1" />
          <span className="stat-value text-accent-400">{data.nftCount}</span>
          <span className="stat-label">NFT Badges</span>
        </div>
        <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15">
          <ShoppingBagIcon className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="stat-value text-emerald-400">{data.redemptions.length}</span>
          <span className="stat-label">Redemptions</span>
        </div>
        <div className="stat-card bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/15">
          <MegaphoneIcon className="w-5 h-5 text-blue-400 mb-1" />
          <span className="stat-value text-blue-400">{data.votes.length}</span>
          <span className="stat-label">Polls Voted</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* NFT Badges */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">NFT Badges</h2>
            <button onClick={() => navigate('/gallery')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
          </div>
          {data.badges.length === 0 ? (
            <p className="text-sm text-white/30">No badges yet. Claim an activity to earn your first badge.</p>
          ) : (
            <div className="space-y-2">
              {data.badges.slice(0, 4).map(({ tokenId, activityId, activityTitle }) => (
                <div key={tokenId.toString()} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    #{activityId.toString()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{activityTitle}</p>
                    <p className="text-xs text-white/30">Token #{tokenId.toString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption History */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Redemption History</h2>
          {data.redemptions.length === 0 ? (
            <p className="text-sm text-white/30">No redemptions yet.</p>
          ) : (
            <div className="space-y-2">
              {data.redemptions.slice(0, 4).map(({ id, title, cost, timestamp }) => (
                <div key={id.toString()} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-sm text-white font-medium">{title}</p>
                    <p className="text-xs text-white/30">
                      {new Date(timestamp.toNumber() * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-amber-400 text-sm font-semibold">
                    -{ethers.utils.formatEther(cost)} CRT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voting History */}
        <div className="glass-card p-6 md:col-span-2">
          <h2 className="font-semibold text-white mb-4">Voting History</h2>
          {data.votes.length === 0 ? (
            <p className="text-sm text-white/30">You haven't voted on any polls yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {data.votes.map(({ pollId, question, votedOption }) => (
                <div key={pollId.toString()} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-sm text-white font-medium mb-1">{question}</p>
                  <p className="text-xs text-brand-400">Voted: <span className="text-white/70">{votedOption}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
