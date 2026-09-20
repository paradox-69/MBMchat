'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, MessageSquare, Camera, Compass, Lock, ShoppingBag, 
  Calendar, Settings, Plus, Send, X, 
  UserPlus, LogOut, ArrowRight, SwitchCamera, User, LogIn
} from 'lucide-react';

export default function MBMChatWorkspace() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'chats' | 'snaps' | 'discover' | 'confessions' | 
    'market' | 'events' | 'settings' | 'profile'
  >('home');

  // Authentication State
  const [sessionActive, setSessionActive] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'details' | 'otp'>('details');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Registration & Login Fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('Mining Engineering');
  const [year, setYear] = useState('1st Year');
  const [otpCode, setOtpCode] = useState('');

  // Profile Customization
  const [studentBio, setStudentBio] = useState('Mining Engineering student at MBM University.');
  const [studentInterests, setStudentInterests] = useState<string[]>(['Mining', 'Fieldwork', 'Reading']);
  const [interestInput, setInterestInput] = useState('');

  // Camera & Visual Snaps
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedSnapUrl, setCapturedSnapUrl] = useState<string | null>(null);
  const [snapCaption, setSnapCaption] = useState('');
  const [publicSnaps, setPublicSnaps] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Live Database Stores
  const [chatPeers, setChatPeers] = useState<any[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');

  const [confessions, setConfessions] = useState<any[]>([]);
  const [confessionDraft, setConfessionDraft] = useState('');
  const [confessionTag, setConfessionTag] = useState('General');

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [marketTitle, setMarketTitle] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketTag, setMarketTag] = useState('Drafters');
  const [showMarketModal, setShowMarketModal] = useState(false);

  const [eventsList, setEventsList] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);

  // Synchronize Active User Session on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionActive(true);
        const meta = session.user.user_metadata;
        if (meta?.full_name) setStudentName(meta.full_name);
        if (meta?.roll_no) setRollNo(meta.roll_no);
        if (meta?.branch) setBranch(meta.branch);
        if (meta?.year) setYear(meta.year);
        if (meta?.bio) setStudentBio(meta.bio);
        if (meta?.interests) setStudentInterests(meta.interests);
      }
    });
  }, []);

  // Supabase Realtime Channels
  useEffect(() => {
    fetchInitialData();

    const messageSub = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    const confessionSub = supabase
      .channel('public:confessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confessions' }, payload => {
        setConfessions(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const marketSub = supabase
      .channel('public:market_items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_items' }, payload => {
        setMarketItems(prev => [payload.new, ...prev]);
      })
      .subscribe();

    const eventsSub = supabase
      .channel('public:events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEventsList(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
      supabase.removeChannel(confessionSub);
      supabase.removeChannel(marketSub);
      supabase.removeChannel(eventsSub);
    };
  }, []);

  const fetchInitialData = async () => {
    const { data: confData } = await supabase.from('confessions').select('*').order('created_at', { ascending: false });
    if (confData) setConfessions(confData);

    const { data: mktData } = await supabase.from('market_items').select('*').order('created_at', { ascending: false });
    if (mktData) setMarketItems(mktData);

    const { data: evData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (evData) setEventsList(evData);

    const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (msgData) setMessages(msgData);
  };

  // Student Direct Login (Email + Password)
  const handlePasswordLogin = async () => {
    if (!studentEmail.trim() || !studentPassword.trim()) {
      alert('Please enter your email address and password.');
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
      const meta = data.user?.user_metadata;
      if (meta?.full_name) setStudentName(meta.full_name);
      if (meta?.roll_no) setRollNo(meta.roll_no);
      if (meta?.branch) setBranch(meta.branch);
      if (meta?.year) setYear(meta.year);
    }
  };

  // Registration Dispatch: Trigger 6-Digit OTP Directly
  const handleRegisterOtpRequest = async () => {
    if (!studentEmail.trim() || !studentPassword.trim() || !studentName.trim() || !rollNo.trim()) {
      alert('All registration fields are mandatory.');
      return;
    }
    if (studentPassword.length < 6) {
      alert('Password must be at least 6 characters in length.');
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: studentEmail.trim(),
      options: {
        shouldCreateUser: true,
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
      setAuthStep('otp');
      alert(`A 6-digit confirmation code has been dispatched to ${studentEmail}.`);
    }
  };

  // Verification Token Validation & Password Assignment
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      alert('Please enter a valid 6-digit confirmation code.');
      return;
    }
    setAuthLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: studentEmail.trim(),
      token: otpCode.trim(),
      type: 'email'
    });

    if (error) {
      setAuthLoading(false);
      alert(error.message);
      return;
    }

    if (data.session) {
      if (studentPassword.trim()) {
        await supabase.auth.updateUser({
          password: studentPassword.trim()
        });
      }

      setSessionActive(true);
      const meta = data.user?.user_metadata;
      if (meta?.full_name) setStudentName(meta.full_name);
      if (meta?.roll_no) setRollNo(meta.roll_no);
      if (meta?.branch) setBranch(meta.branch);
      if (meta?.year) setYear(meta.year);
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionActive(false);
    setAuthStep('details');
    setOtpCode('');
    setStudentPassword('');
  };

  // Hardware Camera Controls
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
      setActiveTab('snaps');
    } catch {
      alert('Camera access denied or device unsupported.');
      setActiveTab('snaps');
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
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
    setActiveTab('discover');
  };

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

  const submitMarketItem = async () => {
    if (!marketTitle.trim()) return;
    await supabase.from('market_items').insert([
      {
        title: marketTitle.trim(),
        price: marketPrice.startsWith('₹') ? marketPrice.trim() : `₹${marketPrice.trim() || '0'}`,
        category: marketTag,
        seller: studentName
      }
    ]);
    setMarketTitle('');
    setMarketPrice('');
    setShowMarketModal(false);
  };

  const submitEvent = async () => {
    if (!eventTitle.trim()) return;
    await supabase.from('events').insert([
      {
        title: eventTitle.trim(),
        date: eventDate.trim() || 'Upcoming',
        venue: eventVenue.trim() || 'MBM Campus'
      }
    ]);
    setEventTitle('');
    setEventDate('');
    setEventVenue('');
    setShowEventModal(false);
  };

  const handleAddClassmate = () => {
    const name = prompt('Enter classmate name:');
    if (!name?.trim()) return;
    const newPeer = {
      id: `p_${Date.now()}`,
      name: name.trim(),
      initials: name.slice(0, 2).toUpperCase()
    };
    setChatPeers([newPeer, ...chatPeers]);
    setSelectedPeer(newPeer);
    setActiveTab('chats');
  };

  const addInterest = () => {
    if (interestInput.trim() && !studentInterests.includes(interestInput.trim())) {
      setStudentInterests([...studentInterests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (item: string) => {
    setStudentInterests(studentInterests.filter(i => i !== item));
  };

  // -------------------------------------------------------------
  // AUTHENTICATION SCREEN
  // -------------------------------------------------------------
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
                MBM University<br /><span className="text-indigo-400">Student Portal</span>
              </h2>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                Connect with classmates, share public moments, trade course supplies, and participate in discussions.
              </p>
            </div>
            
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 relative">
              <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80" alt="MBM Campus" className="w-full h-36 object-cover filter brightness-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                <span className="text-xs font-mono font-bold text-white tracking-wider">MBM UNIVERSITY JODHPUR</span>
                <span className="text-[11px] italic text-cyan-300">Departmental Network</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-8 flex flex-col justify-center bg-[#050811]">
            <div className="max-w-md mx-auto w-full space-y-5">
              
              {authStep === 'details' && (
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
              )}

              <div>
                <h3 className="text-xl font-black font-mono text-white">
                  {authStep === 'otp' 
                    ? 'Verify Security Code' 
                    : authMode === 'login' 
                      ? 'Student Sign In' 
                      : 'Create Student Account'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {authStep === 'otp' 
                    ? `Enter the 6-digit confirmation code sent to ${studentEmail}` 
                    : authMode === 'login' 
                      ? 'Enter your institutional email address and account password.' 
                      : 'Provide your academic details to receive a 6-digit verification code.'}
                </p>
              </div>

              {authStep === 'details' ? (
                <div className="space-y-3 font-mono text-xs">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="text-slate-400 text-[11px] mb-1 block">Full Name</label>
                        <input 
                          type="text" 
                          value={studentName}
                          onChange={e => setStudentName(e.target.value)}
                          placeholder="Vineet Kaler" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 text-[11px] mb-1 block">Roll Number</label>
                        <input 
                          type="text" 
                          value={rollNo}
                          onChange={e => setRollNo(e.target.value)}
                          placeholder="e.g. 21UME045" 
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-[11px] mb-1 block">Department</label>
                          <select 
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2.5 text-white outline-none focus:border-indigo-500"
                          >
                            <option value="Mining Engineering">Mining</option>
                            <option value="Computer Science">CSE</option>
                            <option value="Information Tech">IT</option>
                            <option value="Mechanical Engineering">Mechanical</option>
                            <option value="Civil Engineering">Civil</option>
                            <option value="Electrical Engineering">Electrical</option>
                            <option value="Electronics & Comm">ECE</option>
                            <option value="Chemical Engineering">Chemical</option>
                            <option value="Production Engineering">Production</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px] mb-1 block">Academic Year</label>
                          <select 
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2.5 text-white outline-none focus:border-indigo-500"
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                        </div>
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
                    onClick={authMode === 'login' ? handlePasswordLogin : handleRegisterOtpRequest}
                    disabled={authLoading}
                    className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <span>{authLoading ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Send Verification OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">6-Digit Code</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="123456" 
                      className="w-full text-center text-lg tracking-widest bg-black/50 border border-indigo-500 rounded-xl px-3.5 py-3 text-white outline-none font-bold"
                    />
                  </div>

                  <button 
                    onClick={handleVerifyOtp}
                    disabled={authLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <span>{authLoading ? 'Validating...' : 'Verify OTP & Enter Campus'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setAuthStep('details')}
                    className="w-full text-center text-slate-400 hover:text-white text-[11px]"
                  >
                    ← Edit Registration Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#03060c] text-slate-100 flex flex-col font-sans selection:bg-indigo-600">
      
      {/* Top Application Bar */}
      <header className="h-14 border-b border-white/5 bg-[#050811]/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-mono font-bold text-white shadow-md text-sm">M</span>
          <span className="font-mono font-black text-white text-base tracking-tight">MBM<span className="text-cyan-400">Chat</span></span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold ml-2">
            ● Network Online
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button 
            onClick={() => setActiveTab('profile')}
            className="px-3 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-bold">{studentName}</span>
          </button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 p-1" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Framework */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 pb-16 md:pb-0">
        
        {/* Navigation Sidebar */}
        <aside className="hidden md:flex md:col-span-3 border-r border-white/5 p-4 flex-col justify-between font-mono text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 px-3 py-1 font-bold">Main Menu</div>
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'chats', label: 'Classmate Chats', icon: MessageSquare, badge: chatPeers.length },
              { id: 'snaps', label: 'Campus Snaps', icon: Camera },
              { id: 'discover', label: 'Campus Wall', icon: Compass },
              { id: 'confessions', label: 'Confessions', icon: Lock },
              { id: 'market', label: 'Marketplace', icon: ShoppingBag },
              { id: 'events', label: 'Events Hub', icon: Calendar },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => item.id === 'snaps' ? startCamera() : setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] bg-cyan-400 text-black px-1.5 rounded-full font-bold">
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
              <div className="text-white font-bold truncate">{studentName}</div>
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
                <h2 className="text-lg font-black font-mono text-white">Welcome, {studentName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">{branch} • {year} • Roll No: {rollNo}</p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
                {[
                  { label: "Snap", icon: Camera, color: "text-amber-400", act: () => startCamera() },
                  { label: "Wall", icon: Compass, color: "text-cyan-400", act: () => setActiveTab('discover') },
                  { label: "Confess", icon: Lock, color: "text-purple-400", act: () => setActiveTab('confessions') },
                  { label: "Market", icon: ShoppingBag, color: "text-emerald-400", act: () => setActiveTab('market') },
                ].map((a, i) => (
                  <button key={i} onClick={a.act} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col items-center gap-1">
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                    <span className="text-slate-300">{a.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-5 rounded-3xl bg-[#070b14] border border-white/5 space-y-3 font-mono text-xs">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Academic Bio</div>
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

          {/* TAB: DISCOVER / CAMPUS WALL */}
          {activeTab === 'discover' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Campus Public Snaps</h2>
                  <p className="text-xs text-slate-400 font-mono">Real-time photos shared across MBM departments.</p>
                </div>
                <button onClick={() => startCamera()} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <Camera className="w-3.5 h-3.5" />
                  <span>New Snap</span>
                </button>
              </div>

              {publicSnaps.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <Camera className="w-10 h-10 text-amber-400/50 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No public snaps available</h4>
                  <p className="text-xs text-slate-500">Take a photo using the viewfinder to share with your peers.</p>
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

          {/* TAB: CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Student Discussions</h2>
                  <p className="text-xs text-slate-400 font-mono">Synchronized direct communication channels</p>
                </div>
                <button onClick={handleAddClassmate} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Peer</span>
                </button>
              </div>

              {chatPeers.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No active conversations</h4>
                  <p className="text-xs text-slate-500">Click "Add Peer" to initiate a direct channel.</p>
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
                    <div key={p.id} onClick={() => setSelectedPeer(p)} className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs">
                          {p.initials}
                        </div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">Open Thread →</span>
                    </div>
                  ))}
                </div>
              )}
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
                  <p className="text-xs text-slate-400 mt-0.5">Anonymous messages posted with no user linkage.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-white/10 space-y-2.5">
                <textarea 
                  rows={2} 
                  value={confessionDraft}
                  onChange={e => setConfessionDraft(e.target.value)}
                  placeholder="Share a campus thought or experience..." 
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
                    <option value="Sports">Sports</option>
                  </select>
                  <button onClick={submitConfession} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl shadow transition">
                    Post Anonymously
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {confessions.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Anonymous • {c.tag}
                      </span>
                      <span className="text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-200">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MARKET */}
          {activeTab === 'market' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Student Marketplace</h2>
                  <p className="text-xs text-slate-400 font-mono">Exchange instruments, textbooks, and equipment.</p>
                </div>
                <button onClick={() => setShowMarketModal(true)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-3.5 h-3.5" />
                  <span>List Asset</span>
                </button>
              </div>

              <div className="space-y-3">
                {marketItems.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{m.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-slate-400">{m.category}</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">Offered by: {m.seller}</p>
                    </div>
                    <span className="text-emerald-400 font-mono font-black text-sm">{m.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">University Events</h2>
                  <p className="text-xs text-slate-400 font-mono">Departmental conferences, fests, and competitions.</p>
                </div>
                <button onClick={() => setShowEventModal(true)} className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Event</span>
                </button>
              </div>

              <div className="space-y-3">
                {eventsList.map(e => (
                  <div key={e.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-cyan-400 font-bold">{e.title}</span>
                      <span className="text-slate-500 text-[10px]">{e.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">📍 {e.venue}</p>
                  </div>
                ))}
              </div>
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
                    <h3 className="text-base font-bold text-white">{studentName}</h3>
                    <p className="text-slate-400 text-xs">{rollNo} • {branch}</p>
                    <p className="text-cyan-400 text-[11px]">{year}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">Campus Bio</label>
                    <textarea 
                      rows={3} 
                      value={studentBio}
                      onChange={e => setStudentBio(e.target.value)}
                      placeholder="Write your campus bio..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] mb-1 block">Interests & Specializations</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={interestInput}
                        onChange={e => setInterestInput(e.target.value)}
                        placeholder="Add an interest (e.g. Geotechnical, Robotics)..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                      />
                      <button onClick={addInterest} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {studentInterests.map((interest, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 flex items-center gap-1.5">
                          <span>#{interest}</span>
                          <button onClick={() => removeInterest(interest)} className="hover:text-rose-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => alert('Profile updated successfully.')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-3 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 font-mono text-xs">
              <h2 className="text-base font-bold text-white">System Configuration</h2>
              <div className="p-5 rounded-3xl bg-[#070b14] border border-white/10 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <div className="text-white font-bold">Active Account</div>
                    <div className="text-slate-400 text-[11px]">{studentName} ({rollNo})</div>
                  </div>
                  <button onClick={handleLogout} className="px-3 py-1.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl">
                    Sign Out
                  </button>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div>
                    <div className="text-white font-bold">Institution</div>
                    <div className="text-slate-400 text-[11px]">MBM University, Jodhpur</div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px]">VERIFIED DOMAIN</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-white font-bold">Architecture</div>
                    <div className="text-slate-400 text-[11px]">Direct PostgreSQL Connection</div>
                  </div>
                  <span className="text-cyan-400 font-bold text-[10px]">OPERATIONAL</span>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Action Sidebar */}
        <aside className="hidden md:block md:col-span-3 border-l border-white/5 p-4 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Direct Actions</span>
            <button onClick={() => startCamera()} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow">
              <Camera className="w-4 h-4" />
              <span>Camera Snap</span>
            </button>
            <button onClick={handleAddClassmate} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>New Message</span>
            </button>
          </div>
        </aside>

      </div>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#03060c]/95 border-t border-white/5 backdrop-blur flex items-center justify-around z-40 font-mono text-[10px]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
        </button>
        <button onClick={() => startCamera()} className="w-10 h-10 -mt-4 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Camera className="w-5 h-5" />
        </button>
        <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center gap-1 ${activeTab === 'discover' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
          <Compass className="w-4 h-4" />
          <span>Wall</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Camera Modal */}
      {activeTab === 'snaps' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 font-sans">
          <div className="flex items-center justify-between z-10">
            <button onClick={() => { stopCamera(); setActiveTab('home'); }} className="p-2.5 rounded-full bg-black/60 text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-amber-400 font-bold px-3 py-1 bg-black/60 rounded-full border border-white/10">
              {cameraFacingMode === 'environment' ? 'BACK CAMERA' : 'FRONT CAMERA'}
            </span>
            <button 
              onClick={toggleCameraFacingMode} 
              className="p-2.5 rounded-full bg-black/60 text-white hover:text-cyan-400"
              title="Toggle Front/Back Camera"
            >
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
                    <span>Broadcast</span>
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

      {/* Market Modal */}
      {showMarketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#070b14] border border-white/10 rounded-3xl p-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-bold text-white uppercase">LIST ASSET</span>
              <button onClick={() => setShowMarketModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input 
              type="text" 
              value={marketTitle}
              onChange={e => setMarketTitle(e.target.value)}
              placeholder="Item name (e.g. Drafter, Notes)..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <input 
              type="text" 
              value={marketPrice}
              onChange={e => setMarketPrice(e.target.value)}
              placeholder="Price in ₹..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <select 
              value={marketTag}
              onChange={e => setMarketTag(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none"
            >
              <option value="Drafters">Drafters</option>
              <option value="Cycles">Cycles</option>
              <option value="Notes">Notes</option>
              <option value="Electronics">Electronics</option>
            </select>
            <button onClick={submitMarketItem} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition">
              Publish Listing
            </button>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#070b14] border border-white/10 rounded-3xl p-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-bold text-white uppercase">CREATE EVENT</span>
              <button onClick={() => setShowEventModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input 
              type="text" 
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="Event title..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <input 
              type="text" 
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              placeholder="Schedule..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <input 
              type="text" 
              value={eventVenue}
              onChange={e => setEventVenue(e.target.value)}
              placeholder="Venue or location..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <button onClick={submitEvent} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow transition">
              Publish Event
            </button>
          </div>
        </div>
      )}

    </div>
  );
}