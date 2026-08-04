import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import { MegaphoneIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function PollCard({ poll, account, contracts, crtBalance }) {
  const [options, setOptions]       = useState([]);
  const [results, setResults]       = useState([]);
  const [voted, setVoted]           = useState(false);
  const [votedIdx, setVotedIdx]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedOpt, setSelected]  = useState(null);
  const [tick, setTick]             = useState(0); // used to force re-render for isOpen update

  // Refresh isOpen status every 30s so expired polls move to Closed automatically
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const now     = Math.floor(Date.now() / 1000);
  const isOpen  = poll.open && poll.endTime.toNumber() > now;
  const endDate = new Date(poll.endTime.toNumber() * 1000).toLocaleString();

  const hasEnoughCRT = crtBalance && crtBalance.gt && crtBalance.gt(0);

  useEffect(() => {
    const load = async () => {
      try {
        const vc = contracts.Voting();
        const [opts, res] = await Promise.all([
          vc.getOptions(poll.id),
          vc.getResults(poll.id),
        ]);
        setOptions(opts);
        setResults(res.map(r => r.toNumber()));

        if (account) {
          const hv = await vc.hasVoted(poll.id, account);
          setVoted(hv);
          if (hv) {
            const vi = await vc.getVotedOption(poll.id, account);
            setVotedIdx(vi.toNumber());
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [poll.id, account, contracts]);

  const handleVote = async () => {
    if (selectedOpt === null) return;
    const tx = await contracts.Votingw().vote(poll.id, selectedOpt);
    await tx.wait();
    setVoted(true);
    setVotedIdx(selectedOpt);
    // refresh results
    const res = await contracts.Voting().getResults(poll.id);
    setResults(res.map(r => r.toNumber()));
  };

  const total = results.reduce((a, b) => a + b, 0);

  return (
    <div className="glass-card p-6 animate-slide-up space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-white text-base leading-snug">{poll.question}</h3>
        <span className={`badge-pill flex-shrink-0 ${
          isOpen
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-white/5 text-white/30 border border-white/10'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <ClockIcon className="w-3.5 h-3.5" />
        {isOpen ? `Closes: ${endDate}` : `Closed: ${endDate}`}
      </div>

      {loading ? (
        <div className="py-4 flex justify-center">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const count   = results[idx] || 0;
            const pct     = total > 0 ? Math.round((count / total) * 100) : 0;
            const isVoted = voted && votedIdx === idx;
            const isSelected = selectedOpt === idx;

            return (
              <div key={idx}>
                {/* Vote option button (when open and not yet voted) */}
                {isOpen && !voted && account && hasEnoughCRT && (
                  <button
                    onClick={() => setSelected(isSelected ? null : idx)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? 'bg-brand-500/30 border-brand-500/50 text-white'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.07]'
                    }`}
                  >
                    {opt}
                  </button>
                )}

                {/* Result bar (always shown after voting or poll closed) */}
                {(voted || !isOpen || !account) && (
                  <div className={`px-4 py-2.5 rounded-xl border ${
                    isVoted
                      ? 'border-brand-500/40 bg-brand-500/10'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/80 flex items-center gap-1.5">
                        {isVoted && <CheckCircleIcon className="w-4 h-4 text-brand-400" />}
                        {opt}
                      </span>
                      <span className="text-xs font-semibold text-white/50">{count} vote{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Show option text-only if open, not voted, no account or insufficient CRT */}
                {isOpen && !voted && (!account || !hasEnoughCRT) && (
                  <div className="px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white/50">
                    {opt}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vote submit */}
      {isOpen && !voted && account && hasEnoughCRT && (
        <TxButton
          label="Submit Vote"
          loadingLabel="Submitting…"
          onClick={handleVote}
          disabled={selectedOpt === null}
        />
      )}

      {/* Eligibility notices */}
      {isOpen && !voted && account && !hasEnoughCRT && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          You need at least 1 CRT to vote. Earn CRT by claiming activities.
        </p>
      )}
      {isOpen && !account && (
        <p className="text-xs text-white/30">Connect wallet to vote.</p>
      )}
      {voted && (
        <p className="text-xs text-brand-400">✓ Your vote has been recorded on-chain.</p>
      )}
    </div>
  );
}

export default function Voting() {
  const { account, contracts } = useWallet();
  const [polls, setPolls]       = useState([]);
  const [crtBal, setCrtBal]     = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const vc = contracts.Voting();
        if (!vc) return;
        const count = await vc.pollCount();
        const items = [];
        for (let i = 1; i <= count.toNumber(); i++) {
          const [id, question, endTime, optionCount, open] = await vc.getPoll(i);
          items.push({ id, question, endTime, optionCount, open });
        }
        setPolls(items.reverse());

        if (account) {
          const bal = await contracts.CRT().balanceOf(account);
          setCrtBal(bal);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account, contracts]);

  const now   = Math.floor(Date.now() / 1000);
  const open  = polls.filter(p => p.open && p.endTime.toNumber() > now);
  const closed = polls.filter(p => !p.open || p.endTime.toNumber() <= now);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title">Voting</h1>
        <p className="section-subtitle">Vote on campus polls. Requires at least 1 CRT. One vote per poll.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && polls.length === 0 && (
        <div className="glass-card p-12 text-center text-white/30">
          <MegaphoneIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No polls yet. Check back later.</p>
        </div>
      )}

      {open.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-4">
            Active Polls ({open.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {open.map(p => (
              <PollCard key={p.id.toString()} poll={p} account={account} contracts={contracts} crtBalance={crtBal} />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest mb-4">
            Past Polls ({closed.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {closed.map(p => (
              <PollCard key={p.id.toString()} poll={p} account={account} contracts={contracts} crtBalance={crtBal} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
