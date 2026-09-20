'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Trash2, Ban, CheckCircle, ArrowLeft, 
  Lock, AlertTriangle, Users, ShoppingBag, Calendar, Bell, Search, Check, XCircle
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

export default function AdminModerationPanel() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'reports' | 'confessions' | 'market' | 'events'>('students');

  const [reports, setReports] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    // 1. Registered Student Roster
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (profData) setUsers(profData);

    // 2. Moderation Reports
    const { data: repData } = await supabase
      .from('moderation_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (repData) setReports(repData);

    // 3. Campus Confessions
    const { data: confData } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (confData) setConfessions(confData);

    // 4. Marketplace Listings
    const { data: mktData } = await supabase
      .from('market_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (mktData) setMarketItems(mktData);

    // 5. Events Hub
    const { data: evData } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (evData) setEventsList(evData);
  };

  const subscribeToLiveReports = () => {
    supabase
      .channel('public:moderation_reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moderation_reports' }, payload => {
        setReports(prev => [payload.new, ...prev]);
        alert(`🚨 New Student Report Received: ${payload.new.reason}`);
      })
      .subscribe();
  };

  // Toggle College ID Verification Badge
  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', userId);

    if (error) {
      alert('Verification update failed: ' + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    }
  };

  // Toggle User Ban
  const handleToggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this student account?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId);

    if (error) {
      alert('Ban operation failed: ' + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
    }
  };

  // Purge Content Items
  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm(`Permanently remove item from ${table}?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (table === 'confessions') setConfessions(prev => prev.filter(c => c.id !== id));
      if (table === 'market_items') setMarketItems(prev => prev.filter(m => m.id !== id));
      if (table === 'events') setEventsList(prev => prev.filter(e => e.id !== id));
      alert('Item successfully removed from the network.');
    } else {
      alert('Delete failed: ' + error.message);
    }
  };

  // Filter students based on search query
  const filteredUsers = users.filter(u => {
    const displayName = u.full_name || u.name || '';
    const roll = u.roll_no || '';
    const email = u.email || '';
    const branch = u.branch || '';
    const q = searchQuery.toLowerCase();

    return (
      displayName.toLowerCase().includes(q) ||
      roll.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      branch.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060c] text-white flex items-center justify-center font-mono text-xs">
        Loading Admin Verification Suite...
      </div>
    );
  }

  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
    return (
      <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col items-center justify-center p-6 font-mono text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
        <h1 className="text-base font-bold text-white mb-1">Access Restricted</h1>
        <p className="text-xs text-slate-400 mb-5">Administrator credentials required to view this terminal.</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
          Back to Campus
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 font-mono text-xs flex flex-col selection:bg-indigo-600">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-white/10 bg-[#070b14]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-white text-sm">MBMChat College Verification & Safety Desk</div>
            <div className="text-[10px] text-slate-400">Admin: {currentUserEmail} • Realtime Student Auditing</div>
          </div>
        </div>

        <Link href="/" className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-slate-300 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to App</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#070b14] border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Verification ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'reports' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('confessions')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'confessions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Confessions ({confessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'market' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Marketplace ({marketItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'events' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({eventsList.length})</span>
          </button>
        </div>

        {/* TAB 1: STUDENT ROSTER & VERIFICATION DESK */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070b14] p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Registered Student Roster</h3>
                <p className="text-[11px] text-slate-400">Verify Roll Numbers, departments, and confirm legitimate MBM University students.</p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Roll No, Name, Branch..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl text-slate-500">
                No matching student records found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map(u => {
                  const studentDisplayName = u.full_name || u.name || 'Student';
                  return (
                    <div 
                      key={u.id} 
                      className={`p-4 rounded-2xl bg-[#070b14] border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        u.is_banned ? 'border-rose-900/50 bg-rose-950/10' : u.is_verified ? 'border-emerald-500/30' : 'border-white/10'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-white font-bold text-sm">{studentDisplayName}</span>
                          
                          {/* Roll Number */}
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700 text-indigo-300 font-bold text-[10px]">
                            Roll No: {u.roll_no || 'Pending'}
                          </span>

                          {/* Verification Status */}
                          {u.is_verified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> MBM VERIFIED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-[10px] font-bold">
                              UNVERIFIED
                            </span>
                          )}

                          {u.is_banned && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 text-[10px] font-bold">
                              BANNED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>📧 {u.email}</span>
                          <span>🏛️ {u.branch || 'Department N/A'}</span>
                          <span>🎓 {u.year || 'Academic Year N/A'}</span>
                          <span>🕒 Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Verify / Revoke */}
                        <button
                          onClick={() => handleToggleVerify(u.id, u.is_verified)}
                          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                            u.is_verified
                              ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                          }`}
                        >
                          {u.is_verified ? <XCircle className="w-3.5 h-3.5 text-slate-400" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span>{u.is_verified ? 'Revoke Badge' : 'Verify Student'}</span>
                        </button>

                        {/* Ban / Unban */}
                        <button
                          onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                          className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                            u.is_banned
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                              : 'bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300'
                          }`}
                        >
                          {u.is_banned ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          <span>{u.is_banned ? 'Unban' : 'Ban / Fake'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No active student complaints filed.
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#070b14] border border-rose-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold uppercase text-[9px]">
                      {r.content_type}
                    </span>
                    <p className="text-sm font-bold text-white">{r.reason}</p>
                    <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      await supabase.from('moderation_reports').delete().eq('id', r.id);
                      setReports(prev => prev.filter(item => item.id !== r.id));
                    }} 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl"
                  >
                    Dismiss Report
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CONFESSIONS */}
        {activeTab === 'confessions' && (
          <div className="space-y-3">
            {confessions.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No active confessions posted.
              </div>
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

        {/* TAB 4: MARKETPLACE */}
        {activeTab === 'market' && (
          <div className="space-y-3">
            {marketItems.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No marketplace assets listed.
              </div>
            ) : (
              marketItems.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{m.title} — <span className="text-emerald-400">{m.price}</span></div>
                    <div className="text-slate-400 text-[10px]">Category: {m.category} • Offered by: {m.seller}</div>
                  </div>
                  <button onClick={() => handleDeleteItem('market_items', m.id)} className="p-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsList.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No university events scheduled.
              </div>
            ) : (
              eventsList.map(e => (
                <div key={e.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">{e.title}</div>
                    <div className="text-slate-400 text-[10px]">Schedule: {e.date} • Location: {e.venue}</div>
                  </div>
                  <button onClick={() => handleDeleteItem('events', e.id)} className="p-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}