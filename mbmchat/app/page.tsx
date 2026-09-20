'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, MessageSquare, Camera, Compass, Lock, ShoppingBag, 
  Calendar, Settings, Plus, Send, X, 
  UserPlus, LogOut, ArrowRight, SwitchCamera, User, LogIn,
  Heart, MessageCircle, CheckCircle2, Flag, Trash2, ShieldAlert
} from 'lucide-react';

const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

export default function MBMChatWorkspace() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'feed' | 'chats' | 'wall' | 'confessions' | 
    'market' | 'events' | 'settings' | 'profile'
  >('home');

  // Authentication State
  const [sessionActive, setSessionActive] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Registration & Login Fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('Mining Engineering');
  const [year, setYear] = useState('1st Year');

  // Profile Customization & Persistence
  const [studentBio, setStudentBio] = useState('Mining Engineering student at MBM University.');
  const [studentInterests, setStudentInterests] = useState<string[]>(['Mining', 'Fieldwork', 'Reading']);
  const [interestInput, setInterestInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Camera & Visual Snaps
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedSnapUrl, setCapturedSnapUrl] = useState<string | null>(null);
  const [snapCaption, setSnapCaption] = useState('');
  const [publicSnaps, setPublicSnaps] = useState<any[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Live Database Stores
  const [chatPeers, setChatPeers] = useState<any[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');

  // Open Posts / Opinions
  const [posts, setPosts] = useState<any[]>([]);
  const [postDraft, setPostDraft] = useState('');

  // Confessions
  const [confessions, setConfessions] = useState<any[]>([]);
  const [confessionDraft, setConfessionDraft] = useState('');
  const [confessionTag, setConfessionTag] = useState('General');

  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<{ [key: string]: string }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);

  // Synchronize Active User Session & Bio on Mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSessionActive(true);
        setStudentEmail(session.user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setStudentName(profile.full_name || profile.name || '');
          setRollNo(profile.roll_no || '');
          setBranch(profile.branch || 'Mining Engineering');
          setYear(profile.year || '1st Year');
          if (profile.bio) setStudentBio(profile.bio);
          if (profile.interests) setStudentInterests(profile.interests);
        }
      }
    });
  }, []);

  // Supabase Realtime Channels
  useEffect(() => {
    fetchInitialData();

    const postSub = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    const confessionSub = supabase
      .channel('public:confessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => {
        fetchConfessions();
      })
      .subscribe();

    const commentSub = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        setComments(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postSub);
      supabase.removeChannel(confessionSub);
      supabase.removeChannel(commentSub);
    };
  }, []);

  const fetchInitialData = async () => {
    fetchPosts();
    fetchConfessions();
    fetchComments();

    const { data: mktData } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (mktData) setMarketItems(mktData);

    const { data: evData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (evData) setEventsList(evData);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchConfessions = async () => {
    const { data } = await supabase.from('confessions').select('*').order('created_at', { ascending: false });
    if (data) setConfessions(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  // Save Bio & Profile Permanently in DB
  const handleSaveBio = async () => {
    setSavingBio(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({
          bio: studentBio,
          interests: studentInterests
        })
        .eq('id', session.user.id);
      alert('Bio updated successfully in database!');
    }
    setSavingBio(false);
  };

  // Helper: Name with Admin Verification Badge
  const renderAuthorName = (authorName: string, authorEmail?: string) => {
    const isAdmin = (authorEmail && ADMIN_EMAILS.includes(authorEmail)) || authorName.includes('Vineet Kaler');
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="font-bold text-white">Vineet Kaler</span>
          <span className="text-[10px] opacity-60 text-slate-300 font-normal">(Admin)</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </span>
      );
    }
    return <span className="font-bold text-white">{authorName}</span>;
  };

  // Report Content or User
  const handleReport = async (contentType: 'post' | 'confession' | 'snap' | 'user', targetId: string) => {
    const reason = prompt(`Report this ${contentType}? Please provide reason (harassment, spam, abuse):`);
    if (!reason || !reason.trim()) return;

    const { error } = await supabase.from('moderation_reports').insert([
      {
        content_type: contentType,
        target_id: targetId,
        reason: reason.trim(),
        reported_by: `${studentName} (${rollNo || 'Student'})`
      }
    ]);

    if (error) {
      alert('Could not submit report: ' + error.message);
    } else {
      alert('Report submitted to Admin Desk. Our team will review and take action.');
    }
  };

  // Submit Open Post
  const submitPost = async () => {
    if (!postDraft.trim()) return;
    const content = postDraft.trim();
    setPostDraft('');

    await supabase.from('posts').insert([
      {
        author_name: studentName,
        author_email: studentEmail,
        branch,
        year,
        content,
        likes: 0
      }
    ]);
  };

  // Delete Own Post
  const handleDeletePost = async (postId: string, authorEmail: string) => {
    const isAdmin = ADMIN_EMAILS.includes(studentEmail);
    const isOwner = studentEmail === authorEmail;

    if (!isAdmin && !isOwner) {
      alert('You can only delete your own posts.');
      return;
    }

    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert('Delete failed: ' + error.message);
    }
  };

  // Like a Post
  const handleLikePost = async (postId: string, currentLikes: number) => {
    await supabase.from('posts').update({ likes: (currentLikes || 0) + 1 }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  // Submit Comment
  const handleSendComment = async (parentId: string, parentType: 'post' | 'confession') => {
    const draft = commentDrafts[parentId];
    if (!draft || !draft.trim()) return;

    await supabase.from('comments').insert([
      {
        parent_type: parentType,
        parent_id: parentId,
        author_name: parentType === 'confession' ? 'Anonymous Peer' : studentName,
        author_email: parentType === 'confession' ? null : studentEmail,
        comment_text: draft.trim()
      }
    ]);

    setCommentDrafts(prev => ({ ...prev, [parentId]: '' }));
  };

  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return <span key={idx} className="text-cyan-400 font-bold bg-cyan-950/40 px-1 py-0.5 rounded">{part}</span>;
      }
      return part;
    });
  };

  // Authentication
  const handlePasswordLogin = async () => {
    if (!studentEmail.trim() || !studentPassword.trim()) {
      alert('Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: studentEmail.trim(),
      password: studentPassword.trim()
    });
    setAuthLoading(false);

    if (error) {
      alert(error.message);
    } else if (data.session) {
      setSessionActive(true);
      window.location.reload();
    }
  };

  const handleRegisterInstant = async () => {
    if (!studentEmail.trim() || !studentPassword.trim() || !studentName.trim() || !rollNo.trim()) {
      alert('All registration fields are mandatory.');
      return;
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: studentEmail.trim(),
      password: studentPassword.trim(),
      options: {
        data: {
          full_name: studentName.trim(),
          roll_no: rollNo.trim(),
          branch,
          year,
          bio: studentBio,
          interests: studentInterests
        }
      }
    });
    setAuthLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setSessionActive(true);
      alert('Registration successful! Welcome to MBM Campus Portal.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionActive(false);
    window.location.reload();
  };

  // Camera Controls
  const startCamera = async (mode: 'user' | 'environment' = cameraFacingMode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraFacingMode(mode);
      setIsCameraOpen(true);
    } catch {
      alert('Camera access denied or device unsupported.');
    }
  };

  const toggleCameraFacingMode = () => {
    startCamera(cameraFacingMode === 'user' ? 'environment' : 'user');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedSnapUrl(canvas.toDataURL('image/jpeg', 0.85));
      stopCamera();
      setIsCameraOpen(true); // Keep modal for preview
    }
  };

  const broadcastPublicSnap = () => {
    if (!capturedSnapUrl) return;
    const newSnap = {
      id: `snap_${Date.now()}`,
      sender: studentName,
      branch,
      year,
      imageUrl: capturedSnapUrl,
      caption: snapCaption || 'Campus capture',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 0
    };
    setPublicSnaps(prev => [newSnap, ...prev]);
    setCapturedSnapUrl(null);
    setSnapCaption('');
    setIsCameraOpen(false);
    setActiveTab('wall');
  };

  const submitConfession = async () => {
    if (!confessionDraft.trim()) return;
    const contentToSend = confessionDraft.trim();
    setConfessionDraft('');
    await supabase.from('confessions').insert([
      {
        tag: confessionTag,
        content: contentToSend,
        likes: 0
      }
    ]);
  };

  // Auth Screen
  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-[#03060c] text-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 bg-[#070b14] shadow-2xl">
          <div className="md:col-span-5 p-8 flex flex-col justify-between bg-gradient-to-b from-[#0c1424] to-[#050811] border-r border-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-mono font-bold text-white shadow-lg">M</span>
                <h1 className="text-xl font-black font-mono tracking-tight text-white">MBM<span className="text-cyan-400">Chat</span></h1>
              </div>
              <h2 className="text-2xl font-black font-mono tracking-tight text-white leading-tight">
                MBM University<br /><span className="text-indigo-400">Student Network</span>
              </h2>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                Campus opinions, anonymous confessions, direct classmate chats, and student moderation.
              </p>
            </div>
          </div>

          <div className="md:col-span-7 p-8 flex flex-col justify-center bg-[#050811]">
            <div className="max-w-md mx-auto w-full space-y-5">
              <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-2xl font-mono text-xs">
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button 
                  onClick={() => setAuthMode('register')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${authMode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Registration</span>
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Full Name</label>
                      <input 
                        type="text" 
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="Your full name" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Roll Number</label>
                      <input 
                        type="text" 
                        value={rollNo}
                        onChange={e => setRollNo(e.target.value)}
                        placeholder="e.g. 25ufie2351" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-slate-400 text-[11px] mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    value={studentEmail}
                    onChange={e => setStudentEmail(e.target.value)}
                    placeholder="student@example.com" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] mb-1 block">Password</label>
                  <input 
                    type="password" 
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <button 
                  onClick={authMode === 'login' ? handlePasswordLogin : handleRegisterInstant}
                  disabled={authLoading}
                  className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <span>{authLoading ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Register Instant'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col font-sans selection:bg-indigo-600">
      
      {/* Top Application Bar */}
      <header className="h-14 border-b border-white/5 bg-[#050811]/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-mono font-bold text-white shadow-md text-sm">M</span>
          <span className="font-mono font-black text-white text-base tracking-tight">MBM<span className="text-cyan-400">Chat</span></span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {ADMIN_EMAILS.includes(studentEmail) && (
            <a
              href="/admin"
              className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 font-bold text-[10px] hover:bg-rose-900 transition"
            >
              Admin Desk
            </a>
          )}

          <button 
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition"
          >
            {renderAuthorName(studentName, studentEmail)}
          </button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 p-1" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 pb-16 md:pb-0">
        
        {/* Navigation Sidebar (Merged Wall & Snaps into 1 Tab) */}
        <aside className="hidden md:flex md:col-span-3 border-r border-white/5 p-4 flex-col justify-between font-mono text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 px-3 py-1 font-bold">Main Menu</div>
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'feed', label: 'Student Opinions', icon: MessageCircle },
              { id: 'confessions', label: 'Confessions', icon: Lock },
              { id: 'chats', label: 'Classmate Chats', icon: MessageSquare },
              { id: 'wall', label: 'Campus Wall & Snaps', icon: Camera }, // MERGED HERE
              { id: 'market', label: 'Marketplace', icon: ShoppingBag },
              { id: 'events', label: 'Events Hub', icon: Calendar },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white font-bold shadow-md' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div 
            onClick={() => setActiveTab('profile')}
            className="p-3 rounded-2xl bg-[#070b14] border border-white/5 hover:border-white/20 cursor-pointer flex items-center gap-3 transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs">
              {studentName ? studentName.slice(0, 2).toUpperCase() : 'MB'}
            </div>
            <div className="truncate">
              <div>{renderAuthorName(studentName, studentEmail)}</div>
              <div className="text-cyan-400 text-[10px]">{branch} • {year}</div>
            </div>
          </div>
        </aside>

        {/* Central Viewport */}
        <main className="col-span-1 md:col-span-6 p-4 sm:p-6 overflow-y-auto">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'home' && (
            <div className="space-y-5 font-sans">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-[#070b14] border border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black font-mono text-white">Welcome,</h2>
                  {renderAuthorName(studentName, studentEmail)}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">{branch} • {year} • Roll No: {rollNo}</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#070b14] border border-white/5 space-y-3 font-mono text-xs">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Campus Bio</div>
                <p className="text-slate-300 text-sm italic font-sans">"{studentBio}"</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {studentInterests.map((interest, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px]">
                      #{interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: STUDENT OPEN OPINIONS & POSTS */}
          {activeTab === 'feed' && (
            <div className="space-y-4 font-sans">
              {/* Create Post */}
              <div className="p-4 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Share Campus Opinion</span>
                </div>
                <textarea 
                  rows={3} 
                  value={postDraft}
                  onChange={e => setPostDraft(e.target.value)}
                  placeholder="What's your opinion on college labs, events, or mess?" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-end">
                  <button onClick={submitPost} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow transition flex items-center gap-1.5">
                    <span>Post Opinion</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feed List with Self-Delete & Report Buttons */}
              <div className="space-y-4">
                {posts.map(post => {
                  const postComments = comments.filter(c => c.parent_id === post.id);
                  const isAuthorOrAdmin = (post.author_email === studentEmail) || ADMIN_EMAILS.includes(studentEmail);

                  return (
                    <div key={post.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          {renderAuthorName(post.author_name, post.author_email)}
                          <div className="text-[10px] font-mono text-slate-500">{post.branch} • {post.year}</div>
                        </div>

                        {/* Top Action Icons: Self-Delete or Report */}
                        <div className="flex items-center gap-1.5">
                          {isAuthorOrAdmin && (
                            <button
                              onClick={() => handleDeletePost(post.id, post.author_email)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                              title="Delete this post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleReport('post', post.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-white/5 transition"
                            title="Report post to Admin Desk"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {/* Action Bar: Likes & Comments */}
                      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs font-mono text-slate-400">
                        <button 
                          onClick={() => handleLikePost(post.id, post.likes)} 
                          className="flex items-center gap-1.5 hover:text-rose-400 transition"
                        >
                          <Heart className={`w-4 h-4 ${post.likes > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                          <span>{post.likes || 0}</span>
                        </button>

                        <button 
                          onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)} 
                          className="flex items-center gap-1.5 hover:text-cyan-400 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{postComments.length} Comments</span>
                        </button>
                      </div>

                      {/* Comments Thread */}
                      {activeCommentBox === post.id && (
                        <div className="pt-3 space-y-2 border-t border-white/5">
                          {postComments.map(c => (
                            <div key={c.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {renderAuthorName(c.author_name, c.author_email)}
                                </div>
                                <p className="text-slate-300 font-sans text-xs">{renderCommentText(c.comment_text)}</p>
                              </div>
                              <button
                                onClick={() => handleReport('post', c.id)}
                                className="text-slate-600 hover:text-amber-400 p-1"
                                title="Report comment"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ''}
                              onChange={e => setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleSendComment(post.id, 'post')}
                              placeholder="Add a comment... (Type @name to tag a peer)"
                              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-sans"
                            />
                            <button 
                              onClick={() => handleSendComment(post.id, 'post')} 
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CONFESSIONS */}
          {activeTab === 'confessions' && (
            <div className="space-y-4 font-sans">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 to-black/40 border border-purple-800/30 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-900/60 border border-purple-600 text-purple-300 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-mono text-white">Campus Confessions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Anonymous messages. Comments can tag friends.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-white/10 space-y-2.5">
                <textarea 
                  rows={2} 
                  value={confessionDraft}
                  onChange={e => setConfessionDraft(e.target.value)}
                  placeholder="Share an anonymous confession or story..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <select 
                    value={confessionTag}
                    onChange={e => setConfessionTag(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg text-[10px] font-mono text-purple-300 px-2.5 py-1 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Academics">Academics</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Department">Department</option>
                  </select>
                  <button onClick={submitConfession} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl shadow transition">
                    Post Anonymously
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {confessions.map(c => {
                  const confComments = comments.filter(comm => comm.parent_id === c.id);
                  return (
                    <div key={c.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-purple-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Anonymous • {c.tag}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReport('confession', c.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Report Confession"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200">{c.content}</p>

                      <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                        <button 
                          onClick={() => setActiveCommentBox(activeCommentBox === c.id ? null : c.id)}
                          className="text-[11px] font-mono text-slate-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{confComments.length} Comments</span>
                        </button>
                      </div>

                      {activeCommentBox === c.id && (
                        <div className="pt-2 space-y-2 border-t border-white/5">
                          {confComments.map(com => (
                            <div key={com.id} className="p-2 rounded-xl bg-black/40 border border-white/5 text-xs">
                              <span className="text-[10px] text-purple-400 font-mono block">Peer:</span>
                              <p className="text-slate-300 font-sans text-xs">{renderCommentText(com.comment_text)}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={commentDrafts[c.id] || ''}
                              onChange={e => setCommentDrafts({ ...commentDrafts, [c.id]: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleSendComment(c.id, 'confession')}
                              placeholder="Comment anonymously... (Use @Name to mention)"
                              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-sans"
                            />
                            <button 
                              onClick={() => handleSendComment(c.id, 'confession')} 
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CAMPUS WALL & SNAPS (MERGED SINGLE TAB) */}
          {activeTab === 'wall' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Campus Wall & Snaps</h2>
                  <p className="text-xs text-slate-400 font-mono">Live departmental photo moments.</p>
                </div>
                <button 
                  onClick={() => startCamera()} 
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Snap</span>
                </button>
              </div>

              {publicSnaps.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <Camera className="w-10 h-10 text-amber-400/50 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No active snaps on wall</h4>
                  <p className="text-xs text-slate-500">Tap "Take Snap" above to share the first moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {publicSnaps.map(snap => (
                    <div key={snap.id} className="rounded-2xl overflow-hidden bg-[#070b14] border border-white/10 space-y-2 shadow-xl">
                      <div className="relative aspect-[3/4]">
                        <img src={snap.imageUrl} alt="Public Snap" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 font-mono text-[10px] text-white">
                          {snap.sender} • {snap.branch}
                        </div>
                        <button
                          onClick={() => handleReport('snap', snap.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-slate-300 hover:text-rose-400"
                          title="Report Snap"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 font-mono text-xs flex justify-between items-center">
                        <span className="text-slate-300">{snap.caption}</span>
                        <span className="text-[10px] text-slate-500">{snap.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="p-6 rounded-3xl bg-[#070b14] border border-white/10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-xl font-bold text-white shadow-xl">
                    {studentName ? studentName.slice(0, 2).toUpperCase() : 'MB'}
                  </div>
                  <div>
                    <div className="text-base">{renderAuthorName(studentName, studentEmail)}</div>
                    <p className="text-slate-400 text-xs">{rollNo} • {branch}</p>
                    <p className="text-cyan-400 text-[11px]">{year}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">Campus Bio (Persisted in DB)</label>
                    <textarea 
                      rows={3} 
                      value={studentBio}
                      onChange={e => setStudentBio(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button 
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-3 transition"
                  >
                    <span>{savingBio ? 'Saving...' : 'Save & Persist Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHATS */}
          {activeTab === 'chats' && (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl text-slate-500 font-mono text-xs">
              Direct discussions with classmates remain confidential.
            </div>
          )}

        </main>

        {/* Right Sidebar Quick Actions */}
        <aside className="hidden md:block md:col-span-3 border-l border-white/5 p-4 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Campus Shortcuts</span>
            <button onClick={() => setActiveTab('feed')} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow">
              <MessageCircle className="w-4 h-4" />
              <span>Post Opinion</span>
            </button>
            <button onClick={() => startCamera()} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow">
              <Camera className="w-4 h-4" />
              <span>Capture Snap</span>
            </button>
          </div>
        </aside>

      </div>

      {/* Camera Live Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 font-sans">
          <div className="flex items-center justify-between z-10">
            <button onClick={stopCamera} className="p-2.5 rounded-full bg-black/60 text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-amber-400 font-bold px-3 py-1 bg-black/60 rounded-full border border-white/10">
              {cameraFacingMode === 'environment' ? 'BACK CAMERA' : 'FRONT CAMERA'}
            </span>
            <button onClick={toggleCameraFacingMode} className="p-2.5 rounded-full bg-black/60 text-white">
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 my-4 rounded-3xl overflow-hidden bg-[#070b14] relative flex items-center justify-center border border-white/10">
            {capturedSnapUrl ? (
              <img src={capturedSnapUrl} alt="Snap" className="w-full h-full object-cover" />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`} 
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-3 py-2 font-mono text-xs">
            {capturedSnapUrl ? (
              <div className="w-full max-w-sm space-y-3">
                <input 
                  type="text" 
                  value={snapCaption}
                  onChange={e => setSnapCaption(e.target.value)}
                  placeholder="Add a caption..." 
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setCapturedSnapUrl(null); startCamera(); }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl">
                    Retake
                  </button>
                  <button onClick={broadcastPublicSnap} className="px-6 py-2.5 bg-amber-500 text-black font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
                    <span>Post to Wall</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 active:scale-95 transition">
                <div className="w-12 h-12 rounded-full bg-white"></div>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
