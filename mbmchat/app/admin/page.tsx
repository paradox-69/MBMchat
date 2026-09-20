'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Trash2, Ban, CheckCircle, ArrowLeft, 
  Lock, AlertTriangle, Users, Camera, ShoppingBag, Calendar, Bell
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

export default function AdminModerationPanel() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'confessions' | 'snaps' | 'market' | 'events' | 'users'>('reports');

  // Moderation stores
  const [reports, setReports] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || null;
    setCurrentUserEmail(email);

    if (email && ADMIN_EMAILS.includes(email)) {
      await loadModerationData();
      subscribeToLiveReports();
    }
    setLoading(false);
  };

  const loadModerationData = async () => {
    // Reports
    const { data: repData } = await supabase
      .from('moderation_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (repData) setReports(repData);

    // Confessions
    const { data: confData } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (confData) setConfessions(confData);

    // Market Items
    const { data: mktData } = await supabase
      .from('market_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (mktData) setMarketItems(mktData);

    // Events
    const { data: evData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (evData) setEventsList(evData);

    // Profiles
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (profData) setUsers(profData);
  };

  // Realtime report alerts
  const subscribeToLiveReports = () => {
    supabase
      .channel('public:moderation_reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moderation_reports' }, payload => {
        setReports(prev => [payload.new, ...prev]);
        alert(`🚨 New Student Report Logged: ${payload.new.reason}`);
      })
      .subscribe();
  };

  // Content deletion actions
  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm(`Are you sure you want to purge this item from ${table}?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Failed: ' + error.message);
    } else {
      if (table === 'confessions') setConfessions(prev => prev.filter(c => c.id !== id));
      if (table === 'market_items') setMarketItems(prev => prev.filter(m => m.id !== id));
      if (table === 'events') setEventsList(prev => prev.filter(e => e.id !== id));
      alert('Content removed successfully.');
    }
  };

  // Resolve report
  const handleResolveReport = async (id: string) => {
    const { error } = await supabase.from('moderation_reports').delete().eq('id', id);
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  // Toggle user ban
  const handleToggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this student account?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId);

    if (error) {
      alert('Action failed: ' + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060c] text-white flex items-center justify-center font-mono text-xs">
        Auditing Admin Privilege...
      </div>
    );
  }

  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
    return (
      <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col items-center justify-center p-6 font-mono text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h1 className="text-base font-bold text-white mb-1">Unauthorized Access</h1>
        <p className="text-xs text-slate-400 mb-5">Administrator credentials required.</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">Back</Link>
      </div>
    );
  }

  const pendingReportsCount = reports.length;

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 font-mono text-xs flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-[#070b14]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-600/30">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-white text-sm">MBMChat Safety & Moderation Desk</div>
            <div className="text-[10px] text-slate-400">Admin: {currentUserEmail} • P2P Chats Protected</div>
          </div>
        </div>

        <Link href="/" className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-slate-300">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to App</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#070b14] border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'reports' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reports ({pendingReportsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('confessions')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'confessions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Confessions ({confessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'market' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Marketplace ({marketItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'events' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({eventsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({users.length})</span>
          </button>
        </div>

        {/* Tab 1: Live Student Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">Real-time flags submitted by students for harassment or toxic behavior.</div>
            {reports.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No active complaints. Campus safety index normal.
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#0b101c] border border-rose-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold uppercase text-[9px]">
                        {r.content_type}
                      </span>
                      <span className="text-slate-400 text-[10px]">Reported by {r.reported_by}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{r.reason}</p>
                    <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => handleResolveReport(r.id)} 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl"
                  >
                    Dismiss / Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Confessions */}
        {activeTab === 'confessions' && (
          <div className="space-y-3">
            {confessions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">No active confessions.</div>
            ) : (
              confessions.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px]">#{c.tag}</span>
                    <p className="text-sm text-slate-200 font-sans pt-1">{c.content}</p>
                  </div>
                  <button onClick={() => handleDeleteItem('confessions', c.id)} className="p-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Marketplace */}
        {activeTab === 'market' && (
          <div className="space-y-3">
            {marketItems.map(m => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">{m.title} — <span className="text-emerald-400">{m.price}</span></div>
                  <div className="text-slate-400 text-[10px]">Category: {m.category} • Listed by: {m.seller}</div>
                </div>
                <button onClick={() => handleDeleteItem('market_items', m.id)} className="p-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Events */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsList.map(e => (
              <div key={e.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">{e.title}</div>
                  <div className="text-slate-400 text-[10px]">Schedule: {e.date} • Venue: {e.venue}</div>
                </div>
                <button onClick={() => handleDeleteItem('events', e.id)} className="p-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: User Suspension */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span>{u.full_name}</span>
                    <span className="text-xs text-slate-400">({u.roll_no})</span>
                    {u.is_banned ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400">BANNED</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">ACTIVE</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{u.email} • {u.branch}</div>
                </div>
                <button
                  onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 ${
                    u.is_banned ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {u.is_banned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>{u.is_banned ? 'Unban' : 'Ban Student'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}