'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Trash2, Ban, CheckCircle, ArrowLeft, 
  Lock, AlertTriangle, Users, ShoppingBag, Calendar, Bell, 
  Search, Check, XCircle, MessageCircle, Camera, ExternalLink, Sparkles, Flame
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

const MBM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Caveat:wght@600&display=swap');
.admin-theme{--paper:#F1EEFB;--ink:#17141F;--mute:#5E5873;--line:#D8D2EC;--electric:#4B3DFF;--sun:#FFD43B;--pink:#FF86BE;--mint:#74E8B8;
font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:14px;color:var(--ink);background-color:var(--paper);
background-image:radial-gradient(rgba(23,20,31,.12) 1.1px,transparent 1.3px);background-size:24px 24px}
.admin-theme .nb-card{border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink);background:#fff}
.admin-theme .nb-btn{border:2px solid var(--ink);border-radius:10px;font-weight:700;box-shadow:3px 3px 0 var(--ink);transition:transform .1s,box-shadow .1s}
.admin-theme .nb-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--ink)}
.admin-theme .nb-btn:active{transform:translate(2px,2px);box-shadow:0 0 0 var(--ink)}
.admin-theme .nb-input{background:#fff;border:2px solid var(--ink);border-radius:10px;padding:10px 14px;outline:none}
.admin-theme .nb-input:focus{box-shadow:3px 3px 0 var(--electric)}
`;

export default function AdminModerationPanel() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'reports' | 'posts' | 'confessions' | 'market' | 'events'>('students');

  // Stores
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

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
    const { data: profData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (profData) setUsers(profData);

    const { data: repData } = await supabase.from('moderation_reports').select('*').order('created_at', { ascending: false });
    if (repData) setReports(repData);

    const { data: postData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (postData) setPosts(postData);

    const { data: confData } = await supabase.from('confessions').select('*').order('created_at', { ascending: false });
    if (confData) setConfessions(confData);

    const { data: mktData } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (mktData) setMarketItems(mktData);

    const { data: evData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (evData) setEventsList(evData);
  };

  const subscribeToLiveReports = () => {
    supabase
      .channel('public:admin_reports_alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moderation_reports' }, payload => {
        setReports(prev => [payload.new, ...prev]);
        alert(`🚨 New Report Filed by Student!\nReason: ${payload.new.reason}`);
      })
      .subscribe();
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    } else {
      alert('Verification update failed: ' + error.message);
    }
  };

  const handleToggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this student account?`)) return;

    const { error } = await supabase.from('profiles').update({ is_banned: !currentBanStatus }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
    } else {
      alert('Ban operation failed: ' + error.message);
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this record from ${table}?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if (table === 'posts') setPosts(prev => prev.filter(p => p.id !== id));
      if (table === 'confessions') setConfessions(prev => prev.filter(c => c.id !== id));
      if (table === 'market_items') setMarketItems(prev => prev.filter(m => m.id !== id));
      if (table === 'events') setEventsList(prev => prev.filter(e => e.id !== id));
      alert('Content successfully removed.');
    } else {
      alert('Delete failed: ' + error.message);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const { error } = await supabase.from('moderation_reports').delete().eq('id', reportId);
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  const filteredUsers = users.filter(u => {
    const displayName = u.full_name || u.name || '';
    const roll = u.roll_no || '';
    const email = u.email || '';
    const branch = u.branch || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = displayName.toLowerCase().includes(q) || roll.toLowerCase().includes(q) || email.toLowerCase().includes(q) || branch.toLowerCase().includes(q);
    const matchesBranch = branchFilter === 'ALL' || branch === branchFilter;

    return matchesSearch && matchesBranch;
  });

  if (loading) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center font-bold">
        Loading Admin Command Center...
      </div>
    );
  }

  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
    return (
      <div className="admin-theme min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-[#C1121F] mb-3" />
        <h1 className="text-xl font-bold mb-1">Access Restricted</h1>
        <p className="text-[var(--mute)] mb-6">Administrator credentials are required to access this desk.</p>
        <Link href="/" className="nb-btn px-5 py-2.5 bg-[var(--electric)] text-white">
          Return to Campus
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen flex flex-col selection:bg-[var(--electric)] selection:text-white">
      <style dangerouslySetInnerHTML={{ __html: MBM_CSS }} />
      
      {/* Top Header */}
      <header className="h-20 border-b-2 border-[var(--ink)] bg-white px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[var(--electric)] text-white flex items-center justify-center font-bold shadow-[3px_3px_0_var(--ink)] border-2 border-[var(--ink)]">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">MBMChat Administration Desk</h1>
            <p className="text-[12px] text-[var(--mute)] font-medium">Logged in as: {currentUserEmail}</p>
          </div>
        </div>

        <Link href="/" className="nb-btn px-4 py-2 bg-[var(--paper)] flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to App</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="nb-card p-4 rounded-[16px] flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--mute)] font-bold">Total Students</div>
              <div className="text-2xl font-extrabold mt-1">{users.length}</div>
            </div>
            <Users className="w-8 h-8 text-[var(--electric)]" />
          </div>
          <div className="nb-card p-4 rounded-[16px] flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--mute)] font-bold">Pending Reports</div>
              <div className="text-2xl font-extrabold mt-1 text-[#C1121F]">{reports.length}</div>
            </div>
            <Bell className="w-8 h-8 text-[#C1121F]" />
          </div>
          <div className="nb-card p-4 rounded-[16px] flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--mute)] font-bold">Active Opinions</div>
              <div className="text-2xl font-extrabold mt-1">{posts.length}</div>
            </div>
            <MessageCircle className="w-8 h-8 text-[#0E7C5A]" />
          </div>
          <div className="nb-card p-4 rounded-[16px] flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--mute)] font-bold">Confessions</div>
              <div className="text-2xl font-extrabold mt-1">{confessions.length}</div>
            </div>
            <Lock className="w-8 h-8 text-[#9A6700]" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 p-2 bg-white border-2 border-[var(--ink)] rounded-[16px] nb-card">
          {[
            { id: 'students', label: `Students (${users.length})`, icon: Users },
            { id: 'reports', label: `Reports (${reports.length})`, icon: Bell },
            { id: 'posts', label: `Opinions (${posts.length})`, icon: MessageCircle },
            { id: 'confessions', label: `Confessions (${confessions.length})`, icon: Lock },
            { id: 'market', label: `Marketplace (${marketItems.length})`, icon: ShoppingBag },
            { id: 'events', label: `Events (${eventsList.length})`, icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-[10px] font-bold text-sm flex items-center gap-2 transition ${
                activeTab === tab.id ? 'bg-[var(--electric)] text-white shadow-[3px_3px_0_var(--ink)] border-2 border-[var(--ink)]' : 'bg-[var(--paper)] hover:bg-slate-200 text-[var(--ink)] border-2 border-[var(--ink)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: STUDENTS DIRECTORY */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="nb-card p-5 rounded-[16px] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--mute)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, roll number, email..."
                  className="nb-input w-full pl-10 text-sm"
                />
              </div>

              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="nb-input w-full sm:w-auto text-sm"
              >
                <option value="ALL">All Branches</option>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Artificial Intelligence and Data Science">AI & Data Science</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div key={u.id} className="nb-card p-5 rounded-[16px] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-base">{u.full_name || u.name || 'Student'}</span>
                      <span className="px-2 py-0.5 rounded bg-[var(--paper)] border-2 border-[var(--ink)] text-[11px] font-bold">
                        Roll: {u.roll_no || 'N/A'}
                      </span>
                      {u.is_verified ? (
                        <span className="px-2 py-0.5 rounded bg-[#C6F4E0] border-2 border-[var(--ink)] text-[#0E7C5A] text-[11px] font-bold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#FFE9A0] border-2 border-[var(--ink)] text-[#9A6700] text-[11px] font-bold">
                          Unverified
                        </span>
                      )}
                      {u.is_banned && (
                        <span className="px-2 py-0.5 rounded bg-[#FFD3E8] border-2 border-[var(--ink)] text-[#C1121F] text-[11px] font-bold">
                          Banned
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] text-[var(--mute)] flex flex-wrap gap-x-4">
                      <span>Email: {u.email}</span>
                      <span>Branch: {u.branch}</span>
                      <span>Year: {u.year}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVerify(u.id, u.is_verified)}
                      className={`nb-btn px-3.5 py-2 text-xs ${u.is_verified ? 'bg-white' : 'bg-[#C6F4E0]'}`}
                    >
                      {u.is_verified ? 'Revoke Status' : 'Verify Student'}
                    </button>
                    <button
                      onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                      className={`nb-btn px-3.5 py-2 text-xs ${u.is_banned ? 'bg-[#C6F4E0]' : 'bg-[#FFD3E8] text-[#C1121F]'}`}
                    >
                      {u.is_banned ? 'Unban User' : 'Ban User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS AUDITING */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="nb-card p-12 text-center rounded-[16px] text-[var(--mute)]">
                No active complaints or flags reported. Campus safety is clear.
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="nb-card p-5 rounded-[16px] flex items-start justify-between gap-4 border-l-4 border-l-[#C1121F]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#FFD3E8] border border-[var(--ink)] text-[#C1121F] font-bold text-[10px] uppercase">
                        Target: {r.content_type}
                      </span>
                      <span className="text-xs text-[var(--mute)]">Reported by: {r.reported_by}</span>
                    </div>
                    <p className="text-sm font-bold pt-1">Reason: "{r.reason}"</p>
                    <div className="text-[11px] text-[var(--mute)]">Target ID: {r.target_id} • {new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleResolveReport(r.id)} className="nb-btn px-4 py-2 bg-[#C6F4E0] text-xs">
                    Dismiss / Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: OPINIONS / POSTS */}
        {activeTab === 'posts' && (
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="nb-card p-12 text-center rounded-[16px] text-[var(--mute)]">No opinions posted yet.</div>
            ) : (
              posts.map(p => (
                <div key={p.id} className="nb-card p-5 rounded-[16px] flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-bold">{p.author_name}</span>
                      <span className="text-[var(--mute)]">({p.branch} • {p.year})</span>
                    </div>
                    <p className="text-sm pt-1 whitespace-pre-wrap">{p.content}</p>
                    <div className="text-[11px] text-[var(--mute)] pt-2">❤️ {p.likes || 0} Likes</div>
                  </div>
                  <button onClick={() => handleDeleteItem('posts', p.id)} className="nb-btn p-2.5 bg-[#FFD3E8] text-[#C1121F]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: CONFESSIONS */}
        {activeTab === 'confessions' && (
          <div className="space-y-3">
            {confessions.length === 0 ? (
              <div className="nb-card p-12 text-center rounded-[16px] text-[var(--mute)]">No confessions found.</div>
            ) : (
              confessions.map(c => (
                <div key={c.id} className="nb-card p-5 rounded-[16px] flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="px-2 py-0.5 rounded bg-[#E3DEFF] border border-[var(--ink)] text-[var(--electric)] text-[11px] font-bold">#{c.tag}</span>
                    <p className="text-sm pt-2">{c.content}</p>
                    <div className="text-[11px] text-[var(--mute)] pt-1">{new Date(c.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleDeleteItem('confessions', c.id)} className="nb-btn p-2.5 bg-[#FFD3E8] text-[#C1121F]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: MARKETPLACE */}
        {activeTab === 'market' && (
          <div className="space-y-3">
            {marketItems.length === 0 ? (
              <div className="nb-card p-12 text-center rounded-[16px] text-[var(--mute)]">No marketplace listings.</div>
            ) : (
              marketItems.map(m => (
                <div key={m.id} className="nb-card p-5 rounded-[16px] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-base">{m.title} — <span className="text-[#0E7C5A]">{m.price}</span></div>
                    <div className="text-xs text-[var(--mute)] mt-0.5">Category: {m.category} • Seller: {m.seller}</div>
                  </div>
                  <button onClick={() => handleDeleteItem('market_items', m.id)} className="nb-btn p-2.5 bg-[#FFD3E8] text-[#C1121F]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsList.length === 0 ? (
              <div className="nb-card p-12 text-center rounded-[16px] text-[var(--mute)]">No upcoming events listed.</div>
            ) : (
              eventsList.map(e => (
                <div key={e.id} className="nb-card p-5 rounded-[16px] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-base">{e.title}</div>
                    <div className="text-xs text-[var(--mute)] mt-0.5">Date: {e.date} • Venue: {e.venue}</div>
                  </div>
                  <button onClick={() => handleDeleteItem('events', e.id)} className="nb-btn p-2.5 bg-[#FFD3E8] text-[#C1121F]">
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