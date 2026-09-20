'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, Trash2, Ban, CheckCircle, ArrowLeft, 
  MessageSquare, Lock, AlertTriangle, Users 
} from 'lucide-react';
import Link from 'next/link';

// Yahan apna admin email set karein
const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

export default function AdminModerationPanel() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'confessions' | 'messages' | 'users'>('confessions');

  const [confessions, setConfessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
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
    }
    setLoading(false);
  };

  const loadModerationData = async () => {
    // 1. Confessions load
    const { data: confData } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (confData) setConfessions(confData);

    // 2. Messages load
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (msgData) setMessages(msgData);

    // 3. Profiles load
    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (profData) setUsers(profData || []);
  };

  // Delete Inappropriate Confession
  const handleDeleteConfession = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this confession?')) return;
    const { error } = await supabase.from('confessions').delete().eq('id', id);
    if (error) {
      alert('Failed: ' + error.message);
    } else {
      setConfessions(prev => prev.filter(c => c.id !== id));
    }
  };

  // Delete Inappropriate Message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      alert('Failed: ' + error.message);
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  // Toggle Ban/Block User
  const handleToggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this student?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId);

    if (error) {
      alert('Action failed: ' + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
      alert(`User has been ${action}ned successfully.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060c] text-white flex items-center justify-center font-mono text-sm">
        Checking Admin Authorization...
      </div>
    );
  }

  // Unauthorized Access Screen
  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
    return (
      <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col items-center justify-center p-6 font-mono text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          This portal is restricted to MBM University administrators. Please log in with an authorized email account.
        </p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition">
          Return to Campus Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 font-mono text-xs flex flex-col">
      {/* Admin Header */}
      <header className="h-16 border-b border-white/10 bg-[#070b14]/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-white shadow-lg">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-white text-sm">MBMChat Moderation & Safety Desk</div>
            <div className="text-[10px] text-slate-400">Logged in as: {currentUserEmail}</div>
          </div>
        </div>

        <Link href="/" className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-slate-300">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to App</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-[#070b14] border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('confessions')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'confessions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Confessions ({confessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'messages' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Messages ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({users.length})</span>
          </button>
        </div>

        {/* Tab 1: Confessions Moderation */}
        {activeTab === 'confessions' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">
              Scan and purge anonymous confessions violating university conduct guidelines.
            </div>

            {confessions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No active confessions to moderate.
              </div>
            ) : (
              confessions.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                        Tag: {c.tag}
                      </span>
                      <span className="text-slate-500">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 font-sans">{c.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteConfession(c.id)}
                    className="p-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition"
                    title="Delete Confession"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Messages Moderation */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">
              Recent communications across channels for policy and harassment auditing.
            </div>

            {messages.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No active messages recorded.
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-cyan-400">
                      <span className="font-bold">{m.sender_name}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-bold text-indigo-400">{m.receiver_name}</span>
                      <span className="text-slate-500 ml-2">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 font-sans">{m.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(m.id)}
                    className="p-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: User Suspension & Ban */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="text-slate-400 text-[11px]">
              Suspend or unblock student accounts engaging in spam or misconduct.
            </div>

            {users.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                No user profiles registered in moderation table.
              </div>
            ) : (
              users.map(u => (
                <div key={u.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <span>{u.full_name}</span>
                      <span className="text-xs text-slate-400 font-normal">({u.roll_no})</span>
                      {u.is_banned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-400 font-bold">
                          BANNED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{u.email} • {u.branch}</div>
                  </div>

                  <button
                    onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
                      u.is_banned
                        ? 'bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900'
                    }`}
                  >
                    {u.is_banned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    <span>{u.is_banned ? 'Unblock Student' : 'Ban Student'}</span>
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