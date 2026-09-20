'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, MessageSquare, Camera, Compass, Lock, ShoppingBag, 
  Calendar, Settings, Plus, Send, X, 
  UserPlus, UserMinus, LogOut, ArrowRight, SwitchCamera, User, LogIn,
  Heart, MessageCircle, CheckCircle2, Flag, Trash2, ShieldAlert
} from 'lucide-react';

const ADMIN_EMAILS = ['kalervineet4@gmail.com'];

const MBM_BRANCHES = [
  'Electrical Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Electronics & Communication Engineering',
  'Petroleum Engineering',
  'Civil Engineering',
  'Computer Science & Engineering',
  'Production & Industrial Engineering',
  'Mining Engineering',
  'Bachelor of Planning',
  'Information Technology',
  'Artificial Intelligence and Data Science',
  'Electronics & Electrical Engineering',
  'Electronics & Computer Engineering',
  'Building and Construction Technology',
  'Bachelor of Architecture'
];

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
  const [branch, setBranch] = useState(MBM_BRANCHES[0]);
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

  // Live Database Stores & Classmate Contacts (Add/Remove peer)
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

  // Marketplace Stores & Form State
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [marketTitle, setMarketTitle] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketCategory, setMarketCategory] = useState('Drafters & Tools');
  const [marketContact, setMarketContact] = useState('');

  // Events Stores & Form State
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');

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
          setBranch(profile.branch || MBM_BRANCHES[0]);
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

    const marketSub = supabase
      .channel('public:market_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_items' }, () => {
        fetchMarketItems();
      })
      .subscribe();

    const eventSub = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    const msgSub = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postSub);
      supabase.removeChannel(confessionSub);
      supabase.removeChannel(commentSub);
      supabase.removeChannel(marketSub);
      supabase.removeChannel(eventSub);
      supabase.removeChannel(msgSub);
    };
  }, []);

  const fetchInitialData = async () => {
    fetchPosts();
    fetchConfessions();
    fetchComments();
    fetchMarketItems();
    fetchEvents();

    const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (msgData) setMessages(msgData);
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

  const fetchMarketItems = async () => {
    const { data } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (data) setMarketItems(data);
  };

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) setEventsList(data);
  };

  // Save Bio & Profile Permanently in DB
  const handleSaveBio = async () => {
    setSavingBio(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          bio: studentBio,
          interests: studentInterests
        });
      alert('Bio updated successfully in database!');
    }
    setSavingBio(false);
  };

  // Helper: Name with Admin Verification Badge
  const renderAuthorName = (authorName: string, authorEmail?: string) => {
    const isAdmin = (authorEmail && ADMIN_EMAILS.includes(authorEmail)) || authorName?.includes('Vineet Kaler');
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="font-bold text-white">Vineet Kaler</span>
          <span className="text-[10px] opacity-60 text-slate-300 font-normal">(Admin)</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
        </span>
      );
    }
    return <span className="font-bold text-white">{authorName || 'Student'}</span>;
  };

  // Classmate Contacts Management: Add & Remove Peers
  const handleAddClassmate = () => {
    const name = prompt('Enter classmate name to start chat:');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    if (chatPeers.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Classmate already in your conversation list.');
      return;
    }

    const newPeer = {
      id: `p_${Date.now()}`,
      name: trimmed,
      initials: trimmed.slice(0, 2).toUpperCase()
    };

    setChatPeers(prev => [newPeer, ...prev]);
    setSelectedPeer(newPeer);
    setActiveTab('chats');
  };

  const handleRemoveClassmate = (peerId: string, peerName: string) => {
    if (!confirm(`Remove ${peerName} from your classmate list?`)) return;
    setChatPeers(prev => prev.filter(p => p.id !== peerId));
    if (selectedPeer?.id === peerId) {
      setSelectedPeer(null);
    }
  };

  // Send Direct Message
  const sendMessage = async () => {
    if (!chatDraft.trim() || !selectedPeer) return;
    const textToSend = chatDraft.trim();
    setChatDraft('');

    await supabase.from('messages').insert([
      {
        sender_name: studentName,
        receiver_name: selectedPeer.name,
        text: textToSend,
        is_snap: false
      }
    ]);
  };

  // Report Content or User
  const handleReport = async (contentType: 'post' | 'confession' | 'snap' | 'market' | 'event' | 'user', targetId: string) => {
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

  // Create Marketplace Listing
  const handleCreateMarketItem = async () => {
    if (!marketTitle.trim() || !marketPrice.trim()) {
      alert('Item title and price are required.');
      return;
    }

    const { error } = await supabase.from('market_items').insert([
      {
        title: marketTitle.trim(),
        price: marketPrice.trim().startsWith('₹') ? marketPrice.trim() : `₹${marketPrice.trim()}`,
        category: marketCategory,
        seller: studentName || 'Student',
        contact: marketContact.trim() || studentEmail
      }
    ]);

    if (error) {
      alert('Failed to list item: ' + error.message);
    } else {
      setMarketTitle('');
      setMarketPrice('');
      setMarketContact('');
      setShowMarketModal(false);
      fetchMarketItems();
    }
  };

  // Create University Event
  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventVenue.trim() || !eventDate.trim()) {
      alert('Event title, date, and venue are required.');
      return;
    }

    const { error } = await supabase.from('events').insert([
      {
        title: eventTitle.trim(),
        date: eventDate.trim(),
        venue: eventVenue.trim(),
        organizer: studentName || 'Student Council'
      }
    ]);

    if (error) {
      alert('Failed to create event: ' + error.message);
    } else {
      setEventTitle('');
      setEventDate('');
      setEventVenue('');
      setShowEventModal(false);
      fetchEvents();
    }
  };

  // Authentication - Login
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

  // Direct Instant Registration (Fault-Tolerant, No Trigger Crash)
  const handleDirectRegister = async () => {
    if (!studentEmail.trim() || !studentPassword.trim() || !studentName.trim() || !rollNo.trim()) {
      alert('All registration fields are mandatory (Name, Roll No, Branch, Year, Email, Password).');
      return;
    }
    setAuthLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: studentEmail.trim(),
      password: studentPassword.trim()
    });

    if (authError) {
      setAuthLoading(false);
      alert('Registration Error: ' + authError.message);
      return;
    }

    if (authData?.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: studentEmail.trim(),
        full_name: studentName.trim(),
        name: studentName.trim(),
        roll_no: rollNo.trim(),
        branch: branch,
        year: year,
        bio: studentBio,
        interests: studentInterests
      });
    }

    setAuthLoading(false);
    alert('Registration Successful! Welcome to MBM Campus Portal.');
    setSessionActive(true);
    window.location.reload();
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
      setIsCameraOpen(true);
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
                {/* Direct Instant Registration Form */}
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Full Name</label>
                      <input 
                        type="text" 
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="e.g. Vineet Kaler" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Roll Number</label>
                      <input 
                        type="text" 
                        value={rollNo}
                        onChange={e => setRollNo(e.target.value)}
                        placeholder="e.g. 23UFIEXXXX" 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Department / Branch</label>
                      <select 
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        className="w-full bg-[#0c1424] border border-white/10 rounded-xl px-2.5 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                      >
                        {MBM_BRANCHES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">Academic Year</label>
                      <select 
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="w-full bg-[#0c1424] border border-white/10 rounded-xl px-2.5 py-2.5 text-white text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

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
                      onClick={handleDirectRegister}
                      disabled={authLoading}
                      className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <span>{authLoading ? 'Creating Account...' : 'Register Instant →'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Login Form */}
                {authMode === 'login' && (
                  <>
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
                      onClick={handlePasswordLogin}
                      disabled={authLoading}
                      className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <span>{authLoading ? 'Verifying...' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
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
        
        {/* Navigation Sidebar */}
        <aside className="hidden md:flex md:col-span-3 border-r border-white/5 p-4 flex-col justify-between font-mono text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 px-3 py-1 font-bold">Main Menu</div>
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'feed', label: 'Student Opinions', icon: MessageCircle },
              { id: 'confessions', label: 'Confessions', icon: Lock },
              { id: 'chats', label: 'Classmate Chats', icon: MessageSquare, badge: chatPeers.length },
              { id: 'wall', label: 'Campus Wall & Snaps', icon: Camera },
              { id: 'market', label: 'Marketplace', icon: ShoppingBag, badge: marketItems.length },
              { id: 'events', label: 'Events Hub', icon: Calendar, badge: eventsList.length },
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-md text-slate-300">
                    {item.badge}
                  </span>
                )}
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

              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
                {[
                  { label: "Opinion", icon: MessageCircle, color: "text-indigo-400", act: () => setActiveTab('feed') },
                  { label: "Confess", icon: Lock, color: "text-purple-400", act: () => setActiveTab('confessions') },
                  { label: "Market", icon: ShoppingBag, color: "text-emerald-400", act: () => setActiveTab('market') },
                  { label: "Events", icon: Calendar, color: "text-cyan-400", act: () => setActiveTab('events') },
                ].map((a, i) => (
                  <button key={i} onClick={a.act} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col items-center gap-1">
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                    <span className="text-slate-300">{a.label}</span>
                  </button>
                ))}
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

          {/* TAB: CHATS (ADD / REMOVE CLASSMATES) */}
          {activeTab === 'chats' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Classmate Discussions</h2>
                  <p className="text-xs text-slate-400 font-mono">Confidential direct messages with your peers.</p>
                </div>
                <button 
                  onClick={handleAddClassmate} 
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Classmate</span>
                </button>
              </div>

              {chatPeers.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No active classmates added</h4>
                  <p className="text-xs text-slate-500">Click "Add Classmate" above to add friends and begin messaging.</p>
                </div>
              ) : selectedPeer ? (
                <div className="h-[70vh] rounded-3xl bg-[#070b14] border border-white/10 flex flex-col justify-between overflow-hidden shadow-xl">
                  <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs border border-indigo-700">
                        {selectedPeer.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{selectedPeer.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">Direct Channel</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRemoveClassmate(selectedPeer.id, selectedPeer.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                        title="Remove classmate"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedPeer(null)} className="p-1 text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
                    {messages
                      .filter(m => (m.sender_name === studentName && m.receiver_name === selectedPeer.name) || (m.sender_name === selectedPeer.name && m.receiver_name === studentName))
                      .map(m => (
                        <div key={m.id} className={`flex ${m.sender_name === studentName ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[80%] ${m.sender_name === studentName ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#0f1523] border border-white/10 text-slate-200 rounded-tl-none'}`}>
                            <p>{m.text}</p>
                            <span className="text-[9px] font-mono opacity-60 block text-right mt-1">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="p-2.5 border-t border-white/5 flex items-center gap-2 bg-black/30">
                    <input 
                      type="text" 
                      value={chatDraft}
                      onChange={e => setChatDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder={`Send a message to ${selectedPeer.name}...`}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-sans"
                    />
                    <button onClick={sendMessage} className="p-2 bg-indigo-600 text-white rounded-xl">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatPeers.map(p => (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 flex items-center justify-between transition">
                      <div onClick={() => setSelectedPeer(p)} className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                          {p.initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Tap to open discussion</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleRemoveClassmate(p.id, p.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                          title="Remove classmate"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedPeer(p)} className="text-xs font-mono text-cyan-400 hover:underline">
                          Chat →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CAMPUS WALL & SNAPS */}
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

          {/* TAB: MARKETPLACE */}
          {activeTab === 'market' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">MBM Student Marketplace</h2>
                  <p className="text-xs text-slate-400 font-mono">Buy, sell, or rent drafters, lab aprons, books, and calculators.</p>
                </div>
                <button 
                  onClick={() => setShowMarketModal(true)} 
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>List Item</span>
                </button>
              </div>

              {marketItems.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <ShoppingBag className="w-10 h-10 text-emerald-500/50 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No items listed yet</h4>
                  <p className="text-xs text-slate-500">List an engineering drafter, scientific calculator, or notes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {marketItems.map(item => (
                    <div key={item.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-[9px] font-bold">
                            {item.category || 'Supplies'}
                          </span>
                          <span className="text-emerald-400 font-mono font-black text-sm">
                            {item.price}
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-sm mt-2">{item.title}</h4>
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                          Seller: {item.seller}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-cyan-400">📞 {item.contact || 'Chat in App'}</span>
                        <button 
                          onClick={() => handleReport('market', item.id)}
                          className="text-slate-500 hover:text-amber-400 p-1"
                          title="Report listing"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EVENTS HUB */}
          {activeTab === 'events' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">University Events Hub</h2>
                  <p className="text-xs text-slate-400 font-mono">Workshops, sports meets, cultural fests & departmental guest lectures.</p>
                </div>
                <button 
                  onClick={() => setShowEventModal(true)} 
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Event</span>
                </button>
              </div>

              {eventsList.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <Calendar className="w-10 h-10 text-cyan-500/50 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No scheduled events right now</h4>
                  <p className="text-xs text-slate-500">Be the first to announce a club meetup or departmental workshop.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventsList.map(ev => (
                    <div key={ev.id} className="p-4 rounded-2xl bg-[#070b14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="text-white font-bold text-sm">{ev.title}</h4>
                        <div className="text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>📅 {ev.date}</span>
                          <span>📍 {ev.venue}</span>
                          {ev.organizer && <span>🏛️ By: {ev.organizer}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleReport('event', ev.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-white/5 transition"
                          title="Report event"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
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

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="text-base font-bold text-white">Account & Preferences</h2>
              <div className="p-5 rounded-3xl bg-[#070b14] border border-white/10 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <div className="text-white font-bold">{studentName}</div>
                    <div className="text-slate-400 text-[11px]">{studentEmail} • {rollNo}</div>
                  </div>
                  <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl">
                    Sign Out
                  </button>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-white font-bold">MBM University Network</div>
                    <div className="text-slate-400 text-[11px]">{branch} • {year}</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px]">CONNECTED</span>
                </div>
              </div>
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
            <button onClick={() => setShowMarketModal(true)} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow">
              <ShoppingBag className="w-4 h-4" />
              <span>Sell Item</span>
            </button>
            <button onClick={() => startCamera()} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow">
              <Camera className="w-4 h-4" />
              <span>Capture Snap</span>
            </button>
          </div>
        </aside>

      </div>

      {/* Modal: List Marketplace Item */}
      {showMarketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full rounded-3xl bg-[#070b14] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>List an Item for Sale / Exchange</span>
              </h3>
              <button onClick={() => setShowMarketModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Item Title</label>
                <input
                  type="text"
                  value={marketTitle}
                  onChange={e => setMarketTitle(e.target.value)}
                  placeholder="e.g. Mini Drafter, Casio FX-991EX, Surveying Notes"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[11px] mb-1 block">Price</label>
                  <input
                    type="text"
                    value={marketPrice}
                    onChange={e => setMarketPrice(e.target.value)}
                    placeholder="₹250 or Free"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] mb-1 block">Category</label>
                  <select
                    value={marketCategory}
                    onChange={e => setMarketCategory(e.target.value)}
                    className="w-full bg-[#0c1424] border border-white/10 rounded-xl px-2 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="Drafters & Tools">Drafters & Tools</option>
                    <option value="Calculators">Calculators</option>
                    <option value="Books & Notes">Books & Notes</option>
                    <option value="Lab Coats / Aprons">Lab Aprons</option>
                    <option value="Hostel Essentials">Hostel Essentials</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Contact Number / WhatsApp / Room No</label>
                <input
                  type="text"
                  value={marketContact}
                  onChange={e => setMarketContact(e.target.value)}
                  placeholder="e.g. WhatsApp: 9876543210 or Room 42"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleCreateMarketItem}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-2 transition"
              >
                Post Listing to Marketplace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Post Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full rounded-3xl bg-[#070b14] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Post University Event</span>
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="e.g. Robotics Club Hackathon, Mining Guest Lecture"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Date & Timing</label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  placeholder="e.g. 24 Sept, 4:00 PM onwards"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Venue / Location</label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={e => setEventVenue(e.target.value)}
                  placeholder="e.g. Auditorium, Mining Dept Seminar Hall, Ground"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCreateEvent}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl mt-2 transition"
              >
                Announce Event
              </button>
            </div>
          </div>
        </div>
      )}

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