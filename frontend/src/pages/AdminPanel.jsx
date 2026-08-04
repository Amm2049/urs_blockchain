import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  WrenchScrewdriverIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <h2 className="font-semibold text-white">{title}</h2>
        {open ? <ChevronUpIcon className="w-4 h-4 text-white/40" /> : <ChevronDownIcon className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-white/[0.06] pt-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const { account, isAdmin, contracts } = useWallet();

  // ── Create Activity ──
  const [actTitle, setActTitle]   = useState('');
  const [actReward, setActReward] = useState('');

  // ── Confirm Attendance ──
  const [confActId, setConfActId]     = useState('');
  const [confStudent, setConfStudent] = useState('');

  // ── Close Activity ──
  const [closeActId, setCloseActId] = useState('');

  // ── Create Reward ──
  const [rewTitle, setRewTitle] = useState('');
  const [rewCost, setRewCost]   = useState('');

  // ── Toggle Reward ──
  const [togRewId, setTogRewId]   = useState('');
  const [togActive, setTogActive] = useState(true);

  // ── Create Poll ──
  const [pollQuestion, setPollQuestion]   = useState('');
  const [pollOptions, setPollOptions]     = useState(['', '']);
  const [pollEndDate, setPollEndDate]     = useState('');

  // ── Redemptions ──
  const [redemptions, setRedemptions]   = useState([]);
  const [redemLoading, setRedemLoading] = useState(false);

  // ── Activities list ──
  const [activities, setActivities] = useState([]);

  // ── Confirm Dialog state ──
  const [dialog, setDialog] = useState({ open: false, title: '', message: '', variant: 'danger', onConfirm: null });

  const openDialog = ({ title, message, variant = 'danger', onConfirm }) => {
    setDialog({ open: true, title, message, variant, onConfirm });
  };
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  useEffect(() => {
    if (!isAdmin || !contracts) return;
    loadActivities();
    loadRedemptions();
  }, [isAdmin, contracts]); // eslint-disable-line

  const loadActivities = async () => {
    try {
      const c = contracts.Activity();
      const count = await c.activityCount();
      const total = count.toNumber();
      const items = await Promise.all(
        Array.from({ length: total }, async (_, i) => {
          const id = i + 1;
          const [[aid, title, rewardAmount, status], eligible, confirmed] = await Promise.all([
            c.getActivity(id),
            c.getEligibleStudents(id),
            c.getConfirmedStudents(id),
          ]);
          return { id: aid, title, rewardAmount, status, eligible, confirmed };
        })
      );
      setActivities(items.reverse());
    } catch (err) { console.error(err); }
  };

  const loadRedemptions = async () => {
    setRedemLoading(true);
    try {
      const rc = contracts.Reward();
      const count = await rc.redemptionCount();
      const items = [];
      for (let i = 1; i <= count.toNumber(); i++) {
        const [id, rewardId, student, cost, timestamp] = await rc.getRedemption(i);
        const [,title] = await rc.getReward(rewardId);
        items.push({ id, title, student, cost, timestamp });
      }
      setRedemptions(items.reverse());
    } catch (err) { console.error(err); }
    setRedemLoading(false);
  };

  if (!account) {
    return (
      <div className="glass-card p-16 text-center">
        <WrenchScrewdriverIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
        <p className="text-white/50">Connect your wallet to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="glass-card p-16 text-center">
        <WrenchScrewdriverIcon className="w-14 h-14 mx-auto mb-4 text-red-400/40" />
        <p className="text-white/50">Access denied. Admin wallet only.</p>
        <p className="text-white/25 text-sm mt-2">Switch to the admin wallet in MetaMask.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">

      {/* Beautiful Confirm Dialog */}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel="Yes, proceed"
        cancelLabel="Cancel"
        onConfirm={() => { closeDialog(); dialog.onConfirm?.(); }}
        onCancel={closeDialog}
      />

      <div className="mb-6">
        <h1 className="section-title">Admin Panel</h1>
        <p className="section-subtitle">Manage activities, rewards, and polls.</p>
      </div>

      {/* Create Activity */}
      <Section title="Create Activity" defaultOpen={true}>
        <Field label="Activity Title">
          <input className="input-field" placeholder="e.g. AI Workshop" value={actTitle} onChange={e => setActTitle(e.target.value)} />
        </Field>
        <Field label="CRT Reward Amount">
          <input className="input-field" type="number" placeholder="e.g. 20" value={actReward} onChange={e => setActReward(e.target.value)} />
        </Field>
        <TxButton
          label="Create Activity"
          loadingLabel="Creating…"
          onClick={async () => {
            const tx = await contracts.Activityw().createActivity(actTitle, ethers.utils.parseEther(actReward || '0'));
            await tx.wait();
            setActTitle(''); setActReward('');
            await loadActivities();
          }}
          disabled={!actTitle || !actReward}
        />
      </Section>

      {/* Activities overview */}
      <Section title={`Activities Overview (${activities.length})`}>
        {activities.length === 0 ? (
          <p className="text-white/30 text-sm">No activities yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id.toString()} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-sm">{act.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">{ethers.utils.formatEther(act.rewardAmount)} CRT</span>
                <span className={`badge-pill text-xs ${act.status === 0 ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                      {act.status === 0 ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-white/30">
                  {act.eligible.length} registered · {act.confirmed.length} confirmed
                </div>
                {act.eligible.length > 0 && (
                  <div className="text-xs text-white/25 font-mono break-all">
                    {act.eligible.map(a => `${a.slice(0,6)}…${a.slice(-4)}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Confirm Attendance */}
      <Section title="Confirm Attendance">
        <Field label="Activity ID">
          <input className="input-field" type="number" placeholder="e.g. 1" value={confActId} onChange={e => setConfActId(e.target.value)} />
        </Field>
        <Field label="Student Wallet Address">
          <input className="input-field font-mono" placeholder="0x…" value={confStudent} onChange={e => setConfStudent(e.target.value)} />
        </Field>
        <TxButton
          label="Confirm Attendance"
          loadingLabel="Confirming…"
          onClick={async () => {
            const tx = await contracts.Activityw().confirmAttendance(confActId, confStudent);
            await tx.wait();
            setConfActId(''); setConfStudent('');
          }}
          disabled={!confActId || !confStudent}
          variant="success"
        />
      </Section>

      {/* Close Activity */}
      <Section title="Close Activity">
        <Field label="Activity ID">
          <input className="input-field" type="number" placeholder="e.g. 1" value={closeActId} onChange={e => setCloseActId(e.target.value)} />
        </Field>
        <TxButton
          label="Close Activity"
          loadingLabel="Closing…"
          onClick={() => new Promise((resolve, reject) => {
            openDialog({
              title: 'Close Activity',
              message: `Are you sure you want to close Activity #${closeActId}? Students will no longer be able to join. This cannot be undone.`,
              variant: 'danger',
              onConfirm: async () => {
                try {
                  const tx = await contracts.Activityw().closeActivity(closeActId);
                  await tx.wait();
                  setCloseActId('');
                  await loadActivities();
                  resolve();
                } catch (err) { reject(err); }
              },
            });
            // Resolve immediately — TxButton success toast fires after onConfirm
          })}
          disabled={!closeActId}
          variant="danger"
        />
      </Section>

      {/* Create Reward */}
      <Section title="Create Reward">
        <Field label="Reward Title">
          <input className="input-field" placeholder="e.g. Coffee Coupon" value={rewTitle} onChange={e => setRewTitle(e.target.value)} />
        </Field>
        <Field label="CRT Cost">
          <input className="input-field" type="number" placeholder="e.g. 100" value={rewCost} onChange={e => setRewCost(e.target.value)} />
        </Field>
        <TxButton
          label="Create Reward"
          loadingLabel="Creating…"
          onClick={async () => {
            const tx = await contracts.Rewardw().createReward(rewTitle, ethers.utils.parseEther(rewCost || '0'));
            await tx.wait();
            setRewTitle(''); setRewCost('');
          }}
          disabled={!rewTitle || !rewCost}
        />
      </Section>

      {/* Toggle Reward Active/Inactive — Redesigned */}
      <Section title="Toggle Reward Availability">
        <Field label="Reward ID">
          <input
            className="input-field"
            type="number"
            placeholder="e.g. 1"
            value={togRewId}
            onChange={e => setTogRewId(e.target.value)}
          />
        </Field>

        <Field label="Set Status">
          <div className="flex gap-3">
            {/* Active option */}
            <button
              type="button"
              onClick={() => setTogActive(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                togActive
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              Active
            </button>

            {/* Inactive option */}
            <button
              type="button"
              onClick={() => setTogActive(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                !togActive
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
              }`}
            >
              <XCircleIcon className="w-4 h-4" />
              Inactive
            </button>
          </div>

          {/* Status description */}
          <p className={`text-xs mt-2 ${togActive ? 'text-brand-400/70' : 'text-red-400/70'}`}>
            {togActive
              ? '✓ Reward will be visible and redeemable by students.'
              : '✗ Reward will be hidden and cannot be redeemed.'}
          </p>
        </Field>

        <TxButton
          label={togActive ? '✓ Set Active' : '✗ Set Inactive'}
          loadingLabel="Updating…"
          onClick={() => new Promise((resolve, reject) => {
            if (!togActive) {
              openDialog({
                title: 'Disable Reward',
                message: `Set Reward #${togRewId} to Inactive? Students will no longer be able to redeem it until re-enabled.`,
                variant: 'warning',
                onConfirm: async () => {
                  try {
                    const tx = await contracts.Rewardw().setRewardActive(togRewId, false);
                    await tx.wait();
                    setTogRewId('');
                    resolve();
                  } catch (err) { reject(err); }
                },
              });
            } else {
              contracts.Rewardw().setRewardActive(togRewId, true)
                .then(tx => tx.wait())
                .then(() => { setTogRewId(''); resolve(); })
                .catch(reject);
            }
          })}
          disabled={!togRewId}
          variant={togActive ? 'success' : 'danger'}
        />
      </Section>

      {/* Create Poll */}
      <Section title="Create Poll">
        <Field label="Question">
          <input className="input-field" placeholder="What should we offer next semester?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
        </Field>
        <Field label="Options">
          {pollOptions.map((opt, i) => (
            <input
              key={i}
              className="input-field mb-1"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => {
                const updated = [...pollOptions];
                updated[i] = e.target.value;
                setPollOptions(updated);
              }}
            />
          ))}
          <button
            onClick={() => setPollOptions(o => [...o, ''])}
            className="btn-secondary text-xs py-1.5 mt-1 self-start"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add Option
          </button>
        </Field>
        <Field label="End Date & Time">
          <input className="input-field" type="datetime-local" value={pollEndDate} onChange={e => setPollEndDate(e.target.value)} />
          <p className="text-xs text-white/30">
            Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            {pollEndDate && (
              <> UTC equivalent: <span className="text-white/50 font-mono">{new Date(pollEndDate).toUTCString()}</span></>
            )}
          </p>
        </Field>
        <TxButton
          label="Create Poll"
          loadingLabel="Creating…"
          onClick={async () => {
            const endTimestamp = Math.floor(new Date(pollEndDate).getTime() / 1000);
            const validOptions = pollOptions.filter(o => o.trim());
            const tx = await contracts.Votingw().createPoll(pollQuestion, validOptions, endTimestamp);
            await tx.wait();
            setPollQuestion(''); setPollOptions(['', '']); setPollEndDate('');
          }}
          disabled={!pollQuestion || pollOptions.filter(o => o.trim()).length < 2 || !pollEndDate}
        />
      </Section>

      {/* Pending Redemptions */}
      <Section title={`All Redemptions (${redemptions.length})`}>
        {redemLoading ? (
          <div className="py-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : redemptions.length === 0 ? (
          <p className="text-white/30 text-sm">No redemptions yet.</p>
        ) : (
          <div className="space-y-2">
            {redemptions.map(({ id, title, student, cost, timestamp }) => (
              <div key={id.toString()} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium">{title}</p>
                  <p className="text-xs text-white/30 font-mono">{student.slice(0, 10)}…{student.slice(-6)}</p>
                  <p className="text-xs text-white/20">{new Date(timestamp.toNumber() * 1000).toLocaleString()}</p>
                </div>
                <span className="text-amber-400 text-sm font-semibold flex-shrink-0">
                  {ethers.utils.formatEther(cost)} CRT
                </span>
              </div>
            ))}
          </div>
        )}
        <button onClick={loadRedemptions} className="btn-secondary text-xs py-1.5">Refresh</button>
      </Section>
    </div>
  );
}
