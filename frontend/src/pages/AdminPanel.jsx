import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import TxButton from '../components/TxButton';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  WrenchScrewdriverIcon, PlusIcon, CheckCircleIcon, XCircleIcon,
  BoltIcon, ShoppingBagIcon, MegaphoneIcon, ClipboardDocumentListIcon,
  UserGroupIcon, LockClosedIcon, SparklesIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function RegisteredStudentRow({ actId, studentAddr, isConfirmed, contracts, onConfirmed }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const tx = await contracts.Activityw().confirmAttendance(actId, studentAddr);
      await tx.wait();
      await onConfirmed();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-400/80 animate-pulse" />
        <span className="text-xs font-mono text-white/80">{studentAddr}</span>
      </div>
      {isConfirmed ? (
        <span className="badge-pill bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1 font-medium">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Confirmed
        </span>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-3.5 h-3.5" /> Confirm
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { account, isAdmin, contracts } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('activities'); // activities | rewards | polls | redemptions

  // ── Create Activity ──
  const [showCreateAct, setShowCreateAct] = useState(false);
  const [actTitle, setActTitle]           = useState('');
  const [actReward, setActReward]         = useState('');

  // ── Manual Confirm Attendance ──
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [confActId, setConfActId]                 = useState('');
  const [confStudent, setConfStudent]             = useState('');

  // ── Create Reward ──
  const [showCreateRew, setShowCreateRew] = useState(false);
  const [rewTitle, setRewTitle]           = useState('');
  const [rewCost, setRewCost]             = useState('');
  const [rewardItems, setRewardItems]     = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // ── Create Poll ──
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions]   = useState(['', '']);
  const [pollEndDate, setPollEndDate]   = useState('');
  const [pollsList, setPollsList]       = useState([]);

  // ── Redemptions ──
  const [redemptions, setRedemptions]   = useState([]);
  const [redemLoading, setRedemLoading] = useState(false);

  // ── Activities List ──
  const [activities, setActivities]       = useState([]);
  const [activitiesLoading, setActLoading] = useState(true);

  // ── Confirm Dialog state ──
  const [dialog, setDialog] = useState({ open: false, title: '', message: '', variant: 'danger', onConfirm: null });

  const openDialog = ({ title, message, variant = 'danger', onConfirm }) => {
    setDialog({ open: true, title, message, variant, onConfirm });
  };
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  useEffect(() => {
    if (!isAdmin || !contracts) return;
    loadActivities();
    loadRewards();
    loadPolls();
    loadRedemptions();
  }, [isAdmin, contracts]); // eslint-disable-line

  const loadActivities = async () => {
    setActLoading(true);
    try {
      const c = contracts.Activity();
      if (!c) return;
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
    finally { setActLoading(false); }
  };

  const loadRewards = async () => {
    setRewardsLoading(true);
    try {
      const rc = contracts.Reward();
      if (!rc) return;
      const count = await rc.rewardCount();
      const total = count.toNumber();
      const items = await Promise.all(
        Array.from({ length: total }, async (_, i) => {
          const id = i + 1;
          const [rid, title, cost, active] = await rc.getReward(id);
          return { id: rid, title, cost, active };
        })
      );
      setRewardItems(items);
    } catch (err) { console.error(err); }
    finally { setRewardsLoading(false); }
  };

  const loadPolls = async () => {
    try {
      const vc = contracts.Voting();
      if (!vc) return;
      const count = await vc.pollCount();
      const total = count.toNumber();
      const items = await Promise.all(
        Array.from({ length: total }, async (_, i) => {
          const id = i + 1;
          const [pid, question, endTime, optionCount, open] = await vc.getPoll(id);
          const [options, results] = await Promise.all([
            vc.getOptions(id),
            vc.getResults(id),
          ]);
          return { id: pid, question, endTime, optionCount, open, options, results: results.map(r => r.toNumber()) };
        })
      );
      setPollsList(items.reverse());
    } catch (err) { console.error(err); }
  };

  const loadRedemptions = async () => {
    setRedemLoading(true);
    try {
      const rc = contracts.Reward();
      if (!rc) return;
      const count = await rc.redemptionCount();
      const total = count.toNumber();
      const items = [];
      for (let i = 1; i <= total; i++) {
        const [id, rewardId, student, cost, timestamp] = await rc.getRedemption(i);
        const [,title] = await rc.getReward(rewardId);
        items.push({ id, title, student, cost, timestamp });
      }
      setRedemptions(items.reverse());
    } catch (err) { console.error(err); }
    finally { setRedemLoading(false); }
  };

  // Toggle Reward active/inactive directly on card
  const handleToggleReward = async (rewardId, currentActive) => {
    const newStatus = !currentActive;
    if (!newStatus) {
      openDialog({
        title: 'Disable Reward',
        message: `Deactivate Reward #${rewardId}? Students will not be able to redeem it until re-enabled.`,
        variant: 'warning',
        onConfirm: async () => {
          const tx = await contracts.Rewardw().setRewardActive(rewardId, false);
          await tx.wait();
          await loadRewards();
        },
      });
    } else {
      const tx = await contracts.Rewardw().setRewardActive(rewardId, true);
      await tx.wait();
      await loadRewards();
    }
  };

  // Close activity directly on card
  const handleCloseActivity = (actId, actTitle) => {
    openDialog({
      title: 'Close Activity',
      message: `Are you sure you want to close Activity #${actId} ("${actTitle}")? Students will no longer be able to join.`,
      variant: 'danger',
      onConfirm: async () => {
        const tx = await contracts.Activityw().closeActivity(actId);
        await tx.wait();
        await loadActivities();
      },
    });
  };

  if (!account) {
    return (
      <div className="glass-card p-16 text-center animate-fade-in flex flex-col items-center justify-center">
        <WrenchScrewdriverIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
        <p className="text-white/50 mb-6">Connect your wallet to access the admin command center.</p>
        <button onClick={() => navigate('/')} className="btn-secondary text-xs px-4 py-2">
          ← Back to Home
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="glass-card p-16 text-center animate-fade-in border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center">
        <WrenchScrewdriverIcon className="w-14 h-14 mx-auto mb-4 text-red-400/60" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-white/50 text-sm mb-6">This section is strictly reserved for the university administrator wallet.</p>
        <button onClick={() => navigate('/activities')} className="btn-primary text-xs px-4 py-2">
          Explore Student Activities →
        </button>
      </div>
    );
  }

  // Calculate summary metrics
  const totalOpenActivities   = activities.filter(a => a.status === 0).length;
  const totalConfirmedStudents = activities.reduce((acc, a) => acc + a.confirmed.length, 0);

  return (
    <div className="animate-fade-in space-y-6">

      {/* Confirmation Dialog */}
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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border-brand-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title text-2xl">Admin Command Center</h1>
            <span className="badge-pill bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-semibold">
              Administrator
            </span>
          </div>
          <p className="section-subtitle mt-1 text-sm">
            Manage activities, confirm student attendance, configure reward store items, and publish campus polls.
          </p>
        </div>
        <button
          onClick={() => { loadActivities(); loadRewards(); loadPolls(); loadRedemptions(); }}
          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 self-start md:self-center"
        >
          <ArrowPathIcon className="w-4 h-4 text-white/60" />
          Refresh Data
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <BoltIcon className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{activities.length}</p>
            <p className="text-xs text-white/40 mt-1">{totalOpenActivities} Open Activities</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <UserGroupIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{totalConfirmedStudents}</p>
            <p className="text-xs text-white/40 mt-1">Confirmed Student Claims</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <ShoppingBagIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{rewardItems.length}</p>
            <p className="text-xs text-white/40 mt-1">{rewardItems.filter(r => r.active).length} Active Rewards</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center flex-shrink-0">
            <MegaphoneIcon className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{pollsList.length}</p>
            <p className="text-xs text-white/40 mt-1">Campus Polls</p>
          </div>
        </div>
      </div>

      {/* Modern Pill Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'activities'
              ? 'bg-brand-gradient text-white shadow-lg glow-brand'
              : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <BoltIcon className="w-4 h-4" />
          Activities ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'rewards'
              ? 'bg-brand-gradient text-white shadow-lg glow-brand'
              : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <ShoppingBagIcon className="w-4 h-4" />
          Rewards Catalog ({rewardItems.length})
        </button>

        <button
          onClick={() => setActiveTab('polls')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'polls'
              ? 'bg-brand-gradient text-white shadow-lg glow-brand'
              : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <MegaphoneIcon className="w-4 h-4" />
          Campus Polls ({pollsList.length})
        </button>

        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'redemptions'
              ? 'bg-brand-gradient text-white shadow-lg glow-brand'
              : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          Redemptions Log ({redemptions.length})
        </button>
      </div>

      {/* ── TAB 1: ACTIVITIES MANAGEMENT ── */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-fade-in">

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Activities Management</h2>
              <p className="text-xs text-white/40">Create new campus activities and confirm registered student attendance.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowManualConfirm(o => !o)}
                className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <UserGroupIcon className="w-4 h-4 text-white/70" />
                {showManualConfirm ? 'Hide Manual Form' : 'Manual Address Entry'}
              </button>
              <button
                onClick={() => setShowCreateAct(o => !o)}
                className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-semibold flex items-center gap-1.5 glow-brand transition-all hover:opacity-90"
              >
                <PlusIcon className="w-4 h-4" />
                {showCreateAct ? 'Cancel' : 'Create New Activity'}
              </button>
            </div>
          </div>

          {/* Collapsible Create Activity Card */}
          {showCreateAct && (
            <div className="glass-card p-6 border-brand-500/30 animate-slide-up space-y-4 bg-brand-500/[0.02]">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-brand-400" />
                  Create Campus Activity
                </h3>
                <span className="text-xs text-white/40">Issued on-chain via ActivityManager</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Activity Title">
                  <input
                    className="input-field"
                    placeholder="e.g. AI & Web3 Innovation Workshop"
                    value={actTitle}
                    onChange={e => setActTitle(e.target.value)}
                  />
                </Field>
                <Field label="CRT Reward Amount">
                  <input
                    className="input-field"
                    type="number"
                    placeholder="e.g. 25"
                    value={actReward}
                    onChange={e => setActReward(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateAct(false)} className="btn-secondary text-xs px-4 py-2">
                  Cancel
                </button>
                <TxButton
                  label="Publish Activity"
                  loadingLabel="Publishing…"
                  onClick={async () => {
                    const tx = await contracts.Activityw().createActivity(actTitle, ethers.utils.parseEther(actReward || '0'));
                    await tx.wait();
                    setActTitle(''); setActReward(''); setShowCreateAct(false);
                    await loadActivities();
                  }}
                  disabled={!actTitle || !actReward}
                />
              </div>
            </div>
          )}

          {/* Manual Confirm Attendance Form */}
          {showManualConfirm && (
            <div className="glass-card p-6 border-white/10 animate-slide-up space-y-4">
              <h3 className="font-bold text-white text-sm">Manual Attendance Confirmation</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Activity ID">
                  <input className="input-field" type="number" placeholder="e.g. 1" value={confActId} onChange={e => setConfActId(e.target.value)} />
                </Field>
                <Field label="Student Wallet Address">
                  <input className="input-field font-mono" placeholder="0x…" value={confStudent} onChange={e => setConfStudent(e.target.value)} />
                </Field>
              </div>
              <TxButton
                label="Confirm Attendance Manually"
                loadingLabel="Confirming…"
                onClick={async () => {
                  const tx = await contracts.Activityw().confirmAttendance(confActId, confStudent);
                  await tx.wait();
                  setConfActId(''); setConfStudent('');
                  await loadActivities();
                }}
                disabled={!confActId || !confStudent}
                variant="success"
              />
            </div>
          )}

          {/* Activities List Cards */}
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/40">
              <BoltIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No campus activities created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(act => {
                const isOpen = act.status === 0;
                return (
                  <div key={act.id.toString()} className="glass-card p-6 space-y-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{act.title}</h3>
                          <span className="text-xs text-white/40 font-mono">#Activity {act.id.toString()}</span>
                        </div>
                        <p className="text-xs text-amber-400 font-semibold mt-0.5">
                          {ethers.utils.formatEther(act.rewardAmount)} CRT reward
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className={`badge-pill text-xs font-semibold ${
                          isOpen
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-white/30 border border-white/10'
                        }`}>
                          {isOpen ? 'Open for Joins' : 'Closed'}
                        </span>

                        {isOpen && (
                          <button
                            onClick={() => handleCloseActivity(act.id, act.title)}
                            className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all flex items-center gap-1"
                          >
                            <LockClosedIcon className="w-3.5 h-3.5" />
                            Close Activity
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Registrations & Confirmation List */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs text-white/50">
                        <span className="font-semibold uppercase tracking-wider">Registered Participants ({act.eligible.length})</span>
                        <span className="text-emerald-400 font-medium">{act.confirmed.length} Confirmed</span>
                      </div>

                      {act.eligible.length === 0 ? (
                        <div className="py-4 text-center text-xs text-white/30 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                          No students have registered for this activity yet.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {act.eligible.map((studentAddr) => {
                            const isConfirmed = act.confirmed.some(
                              (c) => c.toLowerCase() === studentAddr.toLowerCase()
                            );
                            return (
                              <RegisteredStudentRow
                                key={studentAddr}
                                actId={act.id}
                                studentAddr={studentAddr}
                                isConfirmed={isConfirmed}
                                contracts={contracts}
                                onConfirmed={loadActivities}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: REWARDS CATALOG MANAGEMENT ── */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Rewards Store Catalog</h2>
              <p className="text-xs text-white/40">Manage redeemable rewards and toggle availability instantly.</p>
            </div>
            <button
              onClick={() => setShowCreateRew(o => !o)}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-semibold flex items-center gap-1.5 glow-brand transition-all hover:opacity-90"
            >
              <PlusIcon className="w-4 h-4" />
              {showCreateRew ? 'Cancel' : 'Add Reward Item'}
            </button>
          </div>

          {showCreateRew && (
            <div className="glass-card p-6 border-brand-500/30 animate-slide-up space-y-4 bg-brand-500/[0.02]">
              <h3 className="font-bold text-white text-sm">Add New Redeemable Reward</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Reward Title">
                  <input
                    className="input-field"
                    placeholder="e.g. Campus Coffee Coupon"
                    value={rewTitle}
                    onChange={e => setRewTitle(e.target.value)}
                  />
                </Field>
                <Field label="CRT Cost">
                  <input
                    className="input-field"
                    type="number"
                    placeholder="e.g. 100"
                    value={rewCost}
                    onChange={e => setRewCost(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateRew(false)} className="btn-secondary text-xs px-4 py-2">
                  Cancel
                </button>
                <TxButton
                  label="Create Reward"
                  loadingLabel="Creating…"
                  onClick={async () => {
                    const tx = await contracts.Rewardw().createReward(rewTitle, ethers.utils.parseEther(rewCost || '0'));
                    await tx.wait();
                    setRewTitle(''); setRewCost(''); setShowCreateRew(false);
                    await loadRewards();
                  }}
                  disabled={!rewTitle || !rewCost}
                />
              </div>
            </div>
          )}

          {rewardsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rewardItems.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/40">
              <ShoppingBagIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No rewards created yet in catalog.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewardItems.map((r) => {
                const costEth = ethers.utils.formatEther(r.cost);
                return (
                  <div key={r.id.toString()} className="glass-card p-6 flex flex-col justify-between gap-4 animate-slide-up">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{r.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5">Item #{r.id.toString()}</p>
                      </div>
                      <span className={`badge-pill flex-shrink-0 text-xs ${
                        r.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <BoltIcon className="w-5 h-5 text-amber-400" />
                      <span className="text-2xl font-bold text-amber-400">{costEth}</span>
                      <span className="text-xs text-white/40">CRT</span>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-white/40">Availability</span>
                      <button
                        onClick={() => handleToggleReward(r.id, r.active)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                          r.active
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {r.active ? (
                          <>
                            <XCircleIcon className="w-4 h-4" /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4" /> Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: VOTING POLLS MANAGEMENT ── */}
      {activeTab === 'polls' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6 border-brand-500/20 space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Campus Poll</h2>
            <div className="space-y-4">
              <Field label="Poll Question">
                <input
                  className="input-field"
                  placeholder="What new course should the department offer next semester?"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                />
              </Field>

              <Field label="Voting Options">
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    className="input-field mb-2"
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
                  className="btn-secondary text-xs py-1.5 px-3 self-start flex items-center gap-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Add Option
                </button>
              </Field>

              <Field label="End Date & Time">
                <input
                  className="input-field"
                  type="datetime-local"
                  value={pollEndDate}
                  onChange={e => setPollEndDate(e.target.value)}
                />
                <p className="text-xs text-white/30 mt-1">
                  Polls close automatically on-chain when the block timestamp reaches the specified end date.
                </p>
              </Field>

              <TxButton
                label="Publish Poll"
                loadingLabel="Publishing…"
                onClick={async () => {
                  const endTimestamp = Math.floor(new Date(pollEndDate).getTime() / 1000);
                  const validOptions = pollOptions.filter(o => o.trim());
                  const tx = await contracts.Votingw().createPoll(pollQuestion, validOptions, endTimestamp);
                  await tx.wait();
                  setPollQuestion(''); setPollOptions(['', '']); setPollEndDate('');
                  await loadPolls();
                }}
                disabled={!pollQuestion || pollOptions.filter(o => o.trim()).length < 2 || !pollEndDate}
              />
            </div>
          </div>

          {/* Active Polls List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Polls Governance Overview ({pollsList.length})</h3>
            {pollsList.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/30 text-xs">
                No polls created yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pollsList.map(p => {
                  const now = Math.floor(Date.now() / 1000);
                  const isOpen = p.open && p.endTime.toNumber() > now;
                  const totalVotes = p.results.reduce((a, b) => a + b, 0);

                  return (
                    <div key={p.id.toString()} className="glass-card p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-white text-sm">{p.question}</h4>
                        <span className={`badge-pill text-xs flex-shrink-0 ${
                          isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'
                        }`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                        {p.options.map((opt, idx) => {
                          const count = p.results[idx] || 0;
                          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          return (
                            <div key={idx} className="text-xs space-y-1">
                              <div className="flex justify-between text-white/70">
                                <span>{opt}</span>
                                <span className="font-mono">{count} votes ({pct}%)</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: REDEMPTIONS AUDIT LOG ── */}
      {activeTab === 'redemptions' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Student CRT Redemptions Audit Log</h2>
              <p className="text-xs text-white/40">Real-time on-chain record of burned CRT tokens for physical reward pickups.</p>
            </div>
            <button onClick={loadRedemptions} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {redemLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : redemptions.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/30">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No student redemptions recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {redemptions.map(({ id, title, student, cost, timestamp }) => (
                <div key={id.toString()} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{title}</span>
                      <span className="text-xs text-white/30 font-mono">#Redemption {id.toString()}</span>
                    </div>
                    <p className="text-xs font-mono text-white/50 mt-0.5">Student: {student}</p>
                    <p className="text-xs text-white/30 mt-0.5">{new Date(timestamp.toNumber() * 1000).toLocaleString()}</p>
                  </div>
                  <div className="badge-pill bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold text-xs self-start sm:self-center">
                    -{ethers.utils.formatEther(cost)} CRT Burned
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
