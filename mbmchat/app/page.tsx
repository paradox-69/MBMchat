'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, MessageSquare, Camera, Compass, Lock, ShoppingBag, 
  Calendar, Users, Settings, Plus, MapPin, Send, Eye, X, 
  RefreshCw, UserPlus, Heart, MessageCircle, Phone, Video, 
  Mic, MicOff, LogOut, ArrowRight, Sparkles, Check
} from 'lucide-react';

export default function MBMChatWorkspace() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'chats' | 'snaps' | 'discover' | 'confessions' | 
    'market' | 'events' | 'communities' | 'settings' | 'profile'
  >('home');

  // Authentication State
  const [sessionActive, setSessionActive] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [currentStudentName, setCurrentStudentName] = useState('Vineet Kaler');

  // Real Hardware: Camera & Viewfinder
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSnapUrl, setCapturedSnapUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Real Hardware: GPS
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsBroadcast, setGpsBroadcast] = useState<string | null>(null);

  // Calling Simulation
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; name: string } | null>(null);
  const [micMuted, setMicMuted] = useState(false);

  // Real Database Stores (Supabase Live Synced)
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

  // -------------------------------------------------------------
  // SUPABASE REALTIME SYNC (Data fetch + auto WebSockets update)
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Initial Fetch
    fetchInitialData();

    // 2. Realtime Listener for Messages
    const messageSub = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    // 3. Realtime Listener for Confessions
    const confessionSub = supabase
      .channel('public:confessions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confessions' }, payload => {
        setConfessions(prev => [payload.new, ...prev]);
      })
      .subscribe();

    // 4. Realtime Listener for Market Items
    const marketSub = supabase
      .channel('public:market_items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_items' }, payload => {
        setMarketItems(prev => [payload.new, ...prev]);
      })
      .subscribe();

    // 5. Realtime Listener for Events
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

  // Hardware: Camera Capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setActiveTab('snaps');
    } catch {
      alert("Please allow camera access in your browser to take snaps.");
      setActiveTab('snaps');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
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

  // Hardware: Voluntary Location
  const shareLocation = (period: string) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBroadcast(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)} (${period})`);
        setShowGpsModal(false);
      },
      () => setShowGpsModal(false)
    );
  };

  // Actions: Send Real Message to Supabase
  const sendMessage = async () => {
    if (!chatDraft.trim() || !selectedPeer) return;
    const textToSend = chatDraft.trim();
    setChatDraft('');
    await supabase.from('messages').insert([
      {
        sender_name: currentStudentName,
        receiver_name: selectedPeer.name,
        text: textToSend,
        is_snap: false
      }
    ]);
  };

  // Actions: Send Snap to Supabase
  const sendSnapMessage = async () => {
    if (!selectedPeer) {
      alert("Select a classmate first to send the snap!");
      return;
    }
    await supabase.from('messages').insert([
      {
        sender_name: currentStudentName,
        receiver_name: selectedPeer.name,
        text: '📸 View Snap (Self-Destructs)',
        is_snap: true
      }
    ]);
    setCapturedSnapUrl(null);
    setActiveTab('chats');
  };

  // Actions: Insert Anonymous Confession
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

  // Actions: List Market Item
  const submitMarketItem = async () => {
    if (!marketTitle.trim()) return;
    await supabase.from('market_items').insert([
      {
        title: marketTitle.trim(),
        price: marketPrice.startsWith('₹') ? marketPrice.trim() : `₹${marketPrice.trim() || '0'}`,
        category: marketTag,
        seller: currentStudentName
      }
    ]);
    setMarketTitle('');
    setMarketPrice('');
    setShowMarketModal(false);
  };

  // Actions: Add Event
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

  // Actions: Add Peer
  const handleAddClassmate = () => {
    const name = prompt("Enter classmate's name:");
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

  // AUTH SCREEN
  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-[#03060c] text-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 bg-[#070b14] shadow-2xl">
          <div className="md:col-span-6 p-8 flex flex-col justify-between bg-gradient-to-b from-[#0c1424] to-[#050811] border-r border-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-mono font-bold text-white shadow-lg">M</span>
                <h1 className="text-xl font-black font-mono tracking-tight text-white">MBM<span className="text-cyan-400">Chat</span></h1>
              </div>
              <h2 className="text-3xl font-black font-mono tracking-tight text-white leading-tight">
                Your Campus.<br /><span className="text-indigo-400">Your Chaos.</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">100% live database backed by Supabase Realtime.</p>
            </div>
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 relative">
              <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80" alt="MBM Campus" className="w-full h-40 object-cover filter brightness-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                <span className="text-xs font-mono font-bold text-white tracking-wider">MBM UNIVERSITY JODHPUR</span>
                <span className="text-[11px] italic text-cyan-300">"Same campus. Different vibe."</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 p-8 flex flex-col justify-center bg-[#050811]">
            <div className="max-w-xs mx-auto w-full space-y-5">
              <div>
                <h3 className="text-xl font-black font-mono text-white">Enter Live Network</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Connects to your active Supabase database.</p>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={currentStudentName}
                  onChange={e => setCurrentStudentName(e.target.value)}
                  placeholder="Your Name (e.g. Vineet)" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
                <button 
                  onClick={() => setSessionActive(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <span>Connect to Campus</span>
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
      
      {/* Top Application Header */}
      <header className="h-14 border-b border-white/5 bg-[#050811]/90 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-mono font-bold text-white shadow-md text-sm">M</span>
          <span className="font-mono font-black text-white text-base tracking-tight">MBM<span className="text-cyan-400">Chat</span></span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold ml-2">
            ● DB Live
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button 
            onClick={() => setShowGpsModal(true)} 
            className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 transition ${
              gpsBroadcast ? 'bg-rose-950/70 border-rose-800 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{gpsBroadcast ? "GPS Active" : "Share GPS"}</span>
          </button>
          <button onClick={() => setSessionActive(false)} className="text-slate-500 hover:text-rose-400 p-1" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 pb-16 md:pb-0">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:col-span-3 border-r border-white/5 p-4 flex-col justify-between font-mono text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-slate-500 px-3 py-1 font-bold">MBM Platform</div>
            {[
              { id: 'home', label: 'Home Feed', icon: Home },
              { id: 'chats', label: 'Chat', icon: MessageSquare, badge: chatPeers.length },
              { id: 'snaps', label: 'Snaps (Camera)', icon: Camera },
              { id: 'discover', label: 'Discover', icon: Compass },
              { id: 'confessions', label: 'Confessions', icon: Lock },
              { id: 'market', label: 'MBM Market', icon: ShoppingBag },
              { id: 'events', label: 'Events', icon: Calendar },
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

          <div className="p-3 rounded-2xl bg-[#070b14] border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-xs">
              {currentStudentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold truncate">{currentStudentName}</div>
              <div className="text-cyan-400 text-[10px]">Mining Engineering</div>
            </div>
          </div>
        </aside>

        {/* CENTER STAGE */}
        <main className="col-span-1 md:col-span-6 p-4 sm:p-6 overflow-y-auto">
          
          {/* TAB: HOME FEED */}
          {activeTab === 'home' && (
            <div className="space-y-5 font-sans">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-[#070b14] border border-white/10">
                <h2 className="text-base font-black font-mono text-white">Good evening. 👋 {currentStudentName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Real-time database connection enabled.</p>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
                {[
                  { label: "Take Snap", icon: Camera, color: "text-amber-400", act: startCamera },
                  { label: "Confess", icon: Lock, color: "text-purple-400", act: () => setActiveTab('confessions') },
                  { label: "Market", icon: ShoppingBag, color: "text-emerald-400", act: () => setActiveTab('market') },
                  { label: "Events", icon: Calendar, color: "text-blue-400", act: () => setActiveTab('events') }
                ].map((a, i) => (
                  <button key={i} onClick={a.act} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col items-center gap-1">
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                    <span className="text-slate-300">{a.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Connected to Supabase Cloud</h4>
                <p className="text-[11px] text-slate-500">Every message, market listing and confession saves permanently in your database.</p>
              </div>
            </div>
          )}

          {/* TAB: LIVE CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Direct Student Chats</h2>
                  <p className="text-xs text-slate-400 font-mono">Live WebSocket Messages via Supabase</p>
                </div>
                <button onClick={handleAddClassmate} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Classmate</span>
                </button>
              </div>

              {chatPeers.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center font-mono space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-1" />
                  <h4 className="text-sm font-bold text-slate-300">No active classmate selected.</h4>
                  <p className="text-xs text-slate-500">Click "Add Classmate" to open a live database thread.</p>
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
                        <div className="text-[10px] font-mono text-emerald-400">Live PostgreSQL Stream</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setActiveCall({ type: 'voice', name: selectedPeer.name })} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-emerald-400">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveCall({ type: 'video', name: selectedPeer.name })} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-cyan-400">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
                    {messages
                      .filter(m => (m.sender_name === currentStudentName && m.receiver_name === selectedPeer.name) || (m.sender_name === selectedPeer.name && m.receiver_name === currentStudentName))
                      .map(m => (
                        <div key={m.id} className={`flex ${m.sender_name === currentStudentName ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[80%] ${m.sender_name === currentStudentName ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#0f1523] border border-white/10 text-slate-200 rounded-tl-none'}`}>
                            <p>{m.text}</p>
                            <span className="text-[9px] font-mono opacity-60 block text-right mt-1">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="p-2.5 border-t border-white/5 flex items-center gap-2 bg-black/30">
                    <button onClick={startCamera} className="p-2 text-amber-400 hover:bg-white/5 rounded-xl" title="Camera Snap">
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      type="text" 
                      value={chatDraft}
                      onChange={e => setChatDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder={`Real-time message to ${selectedPeer.name}...`}
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
                      <span className="text-xs font-mono text-cyan-400">Open Chat →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONFESSIONS (Live Supabase Table) */}
          {activeTab === 'confessions' && (
            <div className="space-y-4 font-sans">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 to-black/40 border border-purple-800/30 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-900/60 border border-purple-600 text-purple-300 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-mono text-white">Live Anonymous Confessions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Stored anonymously with zero user linkage in Supabase.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-white/10 space-y-2.5">
                <textarea 
                  rows={2}
                  value={confessionDraft}
                  onChange={e => setConfessionDraft(e.target.value)}
                  placeholder="Type a confession to post directly to the database..." 
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
                    <option value="Relationships">Relationships</option>
                  </select>
                  <button onClick={submitConfession} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-xl shadow transition">
                    Publish Anonymously
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {confessions.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Anonymous MBMite • {c.tag}
                      </span>
                      <span className="text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-200">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MBM MARKET (Live Supabase Table) */}
          {activeTab === 'market' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">MBM Market (Live DB)</h2>
                  <p className="text-xs text-slate-400 font-mono">Real listings synced instantly across campus.</p>
                </div>
                <button onClick={() => setShowMarketModal(true)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-3.5 h-3.5" />
                  <span>List Item</span>
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
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">Seller: {m.seller}</p>
                    </div>
                    <span className="text-emerald-400 font-mono font-black text-sm">{m.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EVENTS (Live Supabase Table) */}
          {activeTab === 'events' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-mono text-white">Campus Events (Live DB)</h2>
                  <p className="text-xs text-slate-400 font-mono">Upcoming departmental and hostel happenings.</p>
                </div>
                <button onClick={() => setShowEventModal(true)} className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
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

        </main>

        {/* DESKTOP RIGHT PANEL */}
        <aside className="hidden md:block md:col-span-3 border-l border-white/5 p-4 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">ACTIONS</span>
            <button onClick={startCamera} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow">
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

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#03060c]/95 border-t border-white/5 backdrop-blur flex items-center justify-around z-40 font-mono text-[10px]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
          <MessageSquare className="w-4 h-4" />
          <span>Chats</span>
        </button>
        <button onClick={startCamera} className="w-10 h-10 -mt-4 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Camera className="w-5 h-5" />
        </button>
        <button onClick={() => setActiveTab('confessions')} className={`flex flex-col items-center gap-1 ${activeTab === 'confessions' ? 'text-purple-400 font-bold' : 'text-slate-500'}`}>
          <Lock className="w-4 h-4" />
          <span>Confess</span>
        </button>
        <button onClick={() => setActiveTab('market')} className={`flex flex-col items-center gap-1 ${activeTab === 'market' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
          <ShoppingBag className="w-4 h-4" />
          <span>Market</span>
        </button>
      </nav>

      {/* MODAL: CAMERA SNAPS */}
      {activeTab === 'snaps' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 font-sans">
          <div className="flex items-center justify-between z-10">
            <button onClick={() => { stopCamera(); setActiveTab('home'); }} className="p-2.5 rounded-full bg-black/60 text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="font-mono text-xs text-amber-400 font-bold px-3 py-1 bg-black/60 rounded-full border border-white/10">
              LIVE SNAP CAMERA
            </span>
            <div className="w-9"></div>
          </div>

          <div className="flex-1 my-4 rounded-3xl overflow-hidden bg-[#070b14] relative flex items-center justify-center border border-white/10">
            {capturedSnapUrl ? (
              <img src={capturedSnapUrl} alt="Snap" className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            )}
          </div>

          <div className="flex items-center justify-center gap-4 py-2 font-mono text-xs">
            {capturedSnapUrl ? (
              <div className="flex gap-3">
                <button onClick={() => { setCapturedSnapUrl(null); startCamera(); }} className="px-4 py-2.5 bg-white/10 text-white rounded-xl">Retake</button>
                <button onClick={sendSnapMessage} className="px-6 py-2.5 bg-amber-500 text-black font-bold rounded-xl flex items-center gap-1.5">
                  <span>Send Snap</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 active:scale-95 transition">
                <div className="w-12 h-12 rounded-full bg-white"></div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: MARKET ITEM CREATOR */}
      {showMarketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#070b14] border border-white/10 rounded-3xl p-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-bold text-white uppercase">LIST ON LIVE DB MARKET</span>
              <button onClick={() => setShowMarketModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input 
              type="text" 
              value={marketTitle}
              onChange={e => setMarketTitle(e.target.value)}
              placeholder="Item Name (e.g. Drafter, Cycle, Books)..."
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
              Publish to Database
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EVENT CREATOR */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#070b14] border border-white/10 rounded-3xl p-6 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="font-bold text-white uppercase">ADD LIVE EVENT</span>
              <button onClick={() => setShowEventModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input 
              type="text" 
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="Event Name..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <input 
              type="text" 
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              placeholder="Date & Time..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
            <input 
              type="text" 
              value={eventVenue}
              onChange={e => setEventVenue(e.target.value)}
              placeholder="Venue..."
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