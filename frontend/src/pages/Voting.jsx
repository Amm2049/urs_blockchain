import { useEffect, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import { MegaphoneIcon, ClockIcon, CheckCircleIcon, BoltIcon, ChartBarIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/outline';

function PollCard({ poll, account, isAdmin, contracts, crtBalance, onVoteCompleted }) {
  const [options, setOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [voted, setVoted] = useState(false);
  const [votedIdx, setVotedIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOpt, setSelected] = useState(null);
  const [, setTick] = useState(0);

  // Refresh isOpen status periodically
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const endTimeNum = poll?.endTime ? (poll.endTime.toNumber ? poll.endTime.toNumber() : Number(poll.endTime)) : 0;
  const isOpen = Boolean(poll?.open) && endTimeNum > now;
  const endDate = new Date(endTimeNum * 1000).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const hasEnoughCRT = crtBalance && crtBalance.gte && crtBalance.gte(ethers.utils.parseEther("1"));

  useEffect(() => {
    const load = async () => {
      try {
        const vc = contracts.Voting();
        if (!vc) return;
        const [opts, res] = await Promise.all([
          vc.getOptions(poll.id),
          vc.getResults(poll.id),
        ]);
        setOptions(opts);
        setResults(res.map(r => r.toNumber()));

        if (account && !isAdmin) {
          const hv = await vc.hasVoted(poll.id, account);
          setVoted(hv);
          if (hv) {
            const vi = await vc.getVotedOption(poll.id, account);
            setVotedIdx(vi.toNumber());
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [poll.id, account, isAdmin, contracts]);

  const handleVote = async () => {
    if (selectedOpt === null || isAdmin) return;
    const tx = await contracts.Votingw().vote(poll.id, selectedOpt);
    await tx.wait();
    setVoted(true);
    setVotedIdx(selectedOpt);

    // Refresh results
    const vc = contracts.Voting();
    const res = await vc.getResults(poll.id);
    setResults(res.map(r => r.toNumber()));
    if (onVoteCompleted) onVoteCompleted(poll.id);
  };

  const totalVotes = results.reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card p-5 animate-slide-up flex flex-col justify-between transition-all hover:border-white/[0.12] space-y-4">
      {/* Top Bar: Title & Badges */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40">
              #{poll.id.toString()}
            </span>
            <h3 className="font-semibold text-white text-base leading-snug">{poll.question}</h3>
          </div>
          <span className={`badge-pill flex-shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${isOpen
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
            {isOpen ? 'Active' : 'Closed'}
          </span>
        </div>

        {/* Meta Bar */}
        <div className="flex items-center justify-between text-xs text-white/40 pt-1 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-white/40" />
            <span>{isOpen ? `Ends ${endDate}` : `Ended ${endDate}`}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChartBarIcon className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-medium text-white/70">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Body Options */}
      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const count = results[idx] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isVoted = voted && votedIdx === idx;
            const isSelected = selectedOpt === idx;
            const canSelect = isOpen && !voted && account && !isAdmin && hasEnoughCRT;

            if (canSelect) {
              return (
                <button
                  key={idx}
                  onClick={() => setSelected(isSelected ? null : idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between border ${isSelected
                    ? 'bg-brand-500/20 border-brand-500/60 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-white/[0.03] border-white/[0.07] text-white/80 hover:bg-white/[0.07] hover:border-white/[0.14]'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-brand-400 bg-brand-500/30' : 'border-white/30'
                      }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                    </span>
                    <span>{opt}</span>
                  </span>
                  {isSelected && <span className="text-xs font-semibold text-brand-400">Selected</span>}
                </button>
              );
            }

            // Results / Read-only state
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${isVoted
                  ? 'border-brand-500/40 bg-brand-500/10'
                  : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-white/90 flex items-center gap-1.5">
                    {isVoted && <CheckCircleIcon className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                    {opt}
                  </span>
                  <span className="font-semibold text-white/50">{count} vote{count !== 1 ? 's' : ''} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Footer Actions & Status */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
        {isAdmin ? (
          <p className="text-xs text-white/40">Admins manage polls in Admin Panel.</p>
        ) : voted ? (
          <div className="flex items-center gap-1.5 text-xs text-brand-400 font-medium">
            <CheckCircleIcon className="w-4 h-4" />
            Voted
          </div>
        ) : !account ? (
          <p className="text-xs text-white/40">Connect wallet to vote.</p>
        ) : !hasEnoughCRT ? (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            Needs ≥ 1 CRT to vote
          </p>
        ) : isOpen ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-white/40">
              {selectedOpt !== null ? `Option ${selectedOpt + 1} chosen` : 'Select an option'}
            </span>
            <TxButton
              label="Submit Vote"
              loadingLabel="Submitting…"
              onClick={handleVote}
              disabled={selectedOpt === null}
              className="px-4 py-1.5 text-xs"
            />
          </div>
        ) : (
          <p className="text-xs text-white/40">Poll finished</p>
        )}
      </div>
    </div>
  );
}

export default function Voting() {
  const { account, isAdmin, contracts } = useWallet();
  const [polls, setPolls] = useState([]);
  const [crtBal, setCrtBal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'closed' | 'voted'
  const [votedPollIds, setVotedPollIds] = useState([]);

  const load = async () => {
    try {
      const vc = contracts.Voting();
      if (!vc) return;
      const count = await vc.pollCount();
      const total = count.toNumber();

      const items = await Promise.all(
        Array.from({ length: total }, (_, i) => vc.getPoll(i + 1))
      );
      setPolls(items.reverse());

      if (account) {
        // Fetch student CRT balance
        const crt = contracts.CRT();
        if (crt) {
          const bal = await crt.balanceOf(account);
          setCrtBal(bal);
        }

        // Fetch voted poll IDs
        if (!isAdmin) {
          const vIds = await vc.getStudentVotedPollIds(account);
          setVotedPollIds(vIds.map(id => id.toNumber()));
        }
      }
    } catch (err) {
      console.error('Error loading voting data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [account, contracts, isAdmin]); // eslint-disable-line

  const now = Math.floor(Date.now() / 1000);

  const getPollEndTime = (p) => (p?.endTime ? (p.endTime.toNumber ? p.endTime.toNumber() : Number(p.endTime)) : 0);
  const isPollOpen = (p, currentNow) => Boolean(p?.open) && getPollEndTime(p) > currentNow;

  const stats = useMemo(() => {
    const active = polls.filter(p => isPollOpen(p, now));
    const closed = polls.filter(p => !isPollOpen(p, now));
    return {
      total: polls.length,
      activeCount: active.length,
      closedCount: closed.length,
      votedCount: votedPollIds.length,
    };
  }, [polls, votedPollIds, now]);

  const filteredPolls = useMemo(() => {
    return polls.filter(p => {
      const openStatus = isPollOpen(p, now);
      if (filterTab === 'active') return openStatus;
      if (filterTab === 'closed') return !openStatus;
      if (filterTab === 'voted') {
        const pollIdNum = p.id?.toNumber ? p.id.toNumber() : Number(p.id);
        return votedPollIds.includes(pollIdNum);
      }
      return true;
    });
  }, [polls, filterTab, votedPollIds, now]);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
      {/* Header section with Stats bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Campus Governance & Voting</h1>
          <p className="section-subtitle mb-0">
            {isAdmin
              ? "View live and completed campus polls. Admins create polls in the Admin Panel."
              : "Participate in university decision-making. 1 vote per student (requires min 1 CRT)."}
          </p>
        </div>

        {/* Compact CRT & Stats Pill */}
        {account && !isAdmin && crtBal && (
          <div className="glass-card px-4 py-2.5 flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5">
              <BoltIcon className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">
                {parseFloat(ethers.utils.formatEther(crtBal)).toFixed(2)}
              </span>
              <span className="text-white/40 text-xs font-medium">CRT</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-xs text-brand-400 font-medium">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>{stats.votedCount} Voted</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/[0.08]">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterTab === 'all'
            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
            : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
          All Polls
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{stats.total}</span>
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterTab === 'active'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
          <FireIcon className="w-3.5 h-3.5 text-emerald-400" />
          Active
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{stats.activeCount}</span>
        </button>

        <button
          onClick={() => setFilterTab('closed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterTab === 'closed'
            ? 'bg-white/10 text-white border border-white/20'
            : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
          Closed
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{stats.closedCount}</span>
        </button>

        {account && !isAdmin && (
          <button
            onClick={() => setFilterTab('voted')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterTab === 'voted'
              ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
              : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
          >
            My Votes
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{stats.votedCount}</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/40">
          <MegaphoneIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No polls found for this filter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPolls.map(p => (
            <PollCard
              key={p.id.toString()}
              poll={p}
              account={account}
              isAdmin={isAdmin}
              contracts={contracts}
              crtBalance={crtBal}
              onVoteCompleted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
