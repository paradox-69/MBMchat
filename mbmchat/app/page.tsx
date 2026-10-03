'use client';



import React, { useState, useRef, useEffect } from 'react';

import { supabase } from '@/lib/supabase';

import { 

  Home, MessageSquare, Camera, Compass, Lock, ShoppingBag, 

  Calendar, Settings, Plus, Send, X, 

  UserPlus, UserMinus, LogOut, ArrowRight, SwitchCamera, User, LogIn,

  Heart, MessageCircle, CheckCircle2, Flag, Trash2, Bell, Check, ShieldAlert, Sparkles, Flame, Menu, Image as ImageIcon

} from 'lucide-react';



const MBM_CSS = `

@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&family=Yatra+One&display=swap');

.mbm{--bg:#EDF1F7;--surface:#fff;--sunk:#E6ECF5;--line:#D2DAE8;--ink:#16213E;--mute:#5A6685;--neel:#2547A6;--neel-wash:#DCE5F7;--marigold:#E9A100;--danger:#B3261E;

font-family:'Mukta','Noto Sans Devanagari',system-ui,sans-serif;font-size:15px;color:var(--ink)}

.mbm .font-sans{font-family:inherit}

.mbm h1,.mbm h2,.mbm h3,.mbm .brand{font-family:'Yatra One','Mukta',serif;font-weight:400;letter-spacing:0}

.mbm .btn-neel{background:var(--neel);color:#fff}

.mbm .btn-neel:hover{background:#1D3A8C}

.mbm .on-neel,.mbm .on-neel *{color:#fff}

.mbm .on-neel .btn-neel{background:#fff;color:var(--neel)}

.mbm .on-neel [class*="neel-wash"]{background:rgba(255,255,255,.16)}

.mbm :focus-visible{outline:2px solid var(--neel);outline-offset:2px}

.mbm input,.mbm textarea,.mbm select{color:var(--ink)}

@media (prefers-reduced-motion:reduce){.mbm *{transition:none!important;animation:none!important}}

`;



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

    'market' | 'events' | 'notifications' | 'settings' | 'profile'

  >('home');



  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



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

  const [branch, setBranch] = useState(MBM_BRANCHES[0]);

  const [year, setYear] = useState('1st Year');

  const [otpCode, setOtpCode] = useState('');



  // Profile Customization

  const [studentBio, setStudentBio] = useState('Student at MBM University.');

  const [savingBio, setSavingBio] = useState(false);



  // Native Mobile Camera Snaps State

  const [capturedSnapUrl, setCapturedSnapUrl] = useState<string | null>(null);

  const [snapCaption, setSnapCaption] = useState('');

  const [publicSnaps, setPublicSnaps] = useState<any[]>([]);

  const snapFileInputRef = useRef<HTMLInputElement | null>(null);



  // Friends, Requests & P2P Chat State

  const [chatPeers, setChatPeers] = useState<any[]>([]);

  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);

  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);

  const [messages, setMessages] = useState<any[]>([]);

  const [chatDraft, setChatDraft] = useState('');



  // Open Posts / Opinions with Media Attachment

  const [posts, setPosts] = useState<any[]>([]);

  const [postDraft, setPostDraft] = useState('');

  const [postMediaUrl, setPostMediaUrl] = useState<string | null>(null);

  const postMediaInputRef = useRef<HTMLInputElement | null>(null);



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



  // Synchronize Active User Session & Exact Profile on Mount

  useEffect(() => {

    supabase.auth.getSession().then(async ({ data: { session } }) => {

      if (session?.user) {

        setSessionActive(true);

        const userEmail = session.user.email || '';

        setStudentEmail(userEmail);



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

        }



        fetchAppData(userEmail);

      }

    });

  }, []);



  // Supabase Realtime Channels

  useEffect(() => {

    const postSub = supabase.channel('public:posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe();

    const confessionSub = supabase.channel('public:confessions').on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => fetchConfessions()).subscribe();

    const commentSub = supabase.channel('public:comments').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => setComments(prev => [...prev, payload.new])).subscribe();

    const marketSub = supabase.channel('public:market_items').on('postgres_changes', { event: '*', schema: 'public', table: 'market_items' }, () => fetchMarketItems()).subscribe();

    const eventSub = supabase.channel('public:events').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents()).subscribe();

    const msgSub = supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => setMessages(prev => [...prev, payload.new])).subscribe();

    const reqSub = supabase.channel('public:friend_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {

      if (studentEmail) fetchFriendRequests(studentEmail);

    }).subscribe();



    return () => {

      supabase.removeChannel(postSub);

      supabase.removeChannel(confessionSub);

      supabase.removeChannel(commentSub);

      supabase.removeChannel(marketSub);

      supabase.removeChannel(eventSub);

      supabase.removeChannel(msgSub);

      supabase.removeChannel(reqSub);

    };

  }, [studentEmail]);



  const fetchAppData = (email: string) => {

    fetchPosts();

    fetchConfessions();

    fetchComments();

    fetchMarketItems();

    fetchEvents();

    fetchRegisteredUsers(email);

    fetchFriendRequests(email);

    fetchAcceptedFriends(email);

    supabase.from('messages').select('*').order('created_at', { ascending: true }).then(({ data }) => { if (data) setMessages(data); });

  };



  const fetchRegisteredUsers = async (email: string) => {

    const { data } = await supabase.from('profiles').select('*');

    if (data) {

      setAllRegisteredUsers(data.filter(u => u.email !== email));

    }

  };



  const fetchFriendRequests = async (email: string) => {

    const { data } = await supabase.from('friend_requests').select('*').eq('receiver_email', email).eq('status', 'pending');

    if (data) setFriendRequests(data);

  };



  const fetchAcceptedFriends = async (email: string) => {

    const { data } = await supabase.from('friend_requests').select('*').eq('status', 'accepted').or(`sender_email.eq.${email},receiver_email.eq.${email}`);

    if (data) {

      const friendsList = data.map(req => {

        const friendEmail = req.sender_email === email ? req.receiver_email : req.sender_email;

        const friendName = req.sender_email === email ? req.receiver_name : req.sender_name;

        return {

          id: req.id,

          email: friendEmail,

          name: friendName,

          initials: friendName.slice(0, 2).toUpperCase()

        };

      });

      setChatPeers(friendsList);

    }

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

          branch,

          year

        });

      alert('Bio & profile updated successfully!');

    }

    setSavingBio(false);

  };



  // Helper: Name with Admin Verification Badge

  const renderAuthorName = (authorName: string, authorEmail?: string) => {

    const isAdmin = (authorEmail && ADMIN_EMAILS.includes(authorEmail)) || authorName?.includes('Vineet Kaler');

    if (isAdmin) {

      return (

        <span className="inline-flex items-center gap-1">

          <span className="font-bold text-[var(--ink)] tracking-wide">Vineet Kaler</span>

          <span className="text-[12px] opacity-60 text-[var(--ink)] font-normal">(Admin)</span>

          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--neel)] fill-[var(--neel)]" />

        </span>

      );

    }

    return <span className="font-bold text-[var(--ink)] tracking-wide">{authorName || 'Student'}</span>;

  };



  const broadcastPublicSnap = () => {

    if (!capturedSnapUrl) return;

    const newSnap = {

      id: `snap_${Date.now()}`,

      sender: studentName,

      branch,

      year,

      imageUrl: capturedSnapUrl,

      caption: snapCaption || 'Campus moment ✨',

      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),

      likes: 0

    };

    setPublicSnaps(prev => [newSnap, ...prev]);

    setCapturedSnapUrl(null);

    setSnapCaption('');

    setActiveTab('wall');

  };



  // Send Friend Request

  const handleSendFriendRequest = async (targetUser: any) => {

    const targetEmail = targetUser.email;

    const targetName = targetUser.full_name || targetUser.name || 'Student';



    if (targetEmail === studentEmail) {

      alert('Aap khud ko friend request nahi bhej sakte.');

      return;

    }



    const { error } = await supabase.from('friend_requests').insert([

      {

        sender_email: studentEmail,

        sender_name: studentName || 'Student',

        receiver_email: targetEmail,

        receiver_name: targetName,

        status: 'pending'

      }

    ]);



    if (error) {

      alert('Request already sent or error: ' + error.message);

    } else {

      alert(`✨ Friend request successfully sent to ${targetName}!`);

      setShowAddFriendModal(false);

    }

  };



  // Accept Friend Request

  const handleAcceptRequest = async (reqId: string) => {

    const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);

    if (!error) {

      alert('🔥 Friend request accepted! Chat is now unlocked.');

      fetchFriendRequests(studentEmail);

      fetchAcceptedFriends(studentEmail);

    } else {

      alert('Failed to accept: ' + error.message);

    }

  };



  const handleRemoveFriend = async (friendEmail: string, friendName: string) => {

    if (!confirm(`Remove ${friendName} from chats?`)) return;

    await supabase.from('friend_requests').delete().or(`and(sender_email.eq.${studentEmail},receiver_email.eq.${friendEmail}),and(sender_email.eq.${friendEmail},receiver_email.eq.${studentEmail})`);

    setChatPeers(prev => prev.filter(p => p.email !== friendEmail));

    if (selectedPeer?.email === friendEmail) setSelectedPeer(null);

  };



  // Send P2P Message

  const sendP2PMessage = async () => {

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

    const reason = prompt(`Report this ${contentType}? Please provide reason:`);

    if (!reason || !reason.trim()) return;



    await supabase.from('moderation_reports').insert([

      {

        content_type: contentType,

        target_id: targetId,

        reason: reason.trim(),

        reported_by: `${studentName} (${rollNo || 'Student'})`

      }

    ]);

    alert('Report submitted to Admin Desk.');

  };



  // Submit Open Post with Media Attachment

  const handlePostMediaSelected = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;



    const reader = new FileReader();

    reader.onload = (event) => {

      setPostMediaUrl(event.target?.result as string);

    };

    reader.readAsDataURL(file);

  };



  const submitPost = async () => {

    if (!postDraft.trim() && !postMediaUrl) return;

    const content = postDraft.trim();

    const media = postMediaUrl;

    setPostDraft('');

    setPostMediaUrl(null);



    await supabase.from('posts').insert([

      {

        author_name: studentName,

        author_email: studentEmail,

        branch,

        year,

        content: media ? `${content}\n[MEDIA:${media}]` : content,

        likes: 0

      }

    ]);

  };



  // Submit Confession

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



  // Delete Own Post

  const handleDeletePost = async (postId: string, authorEmail: string) => {

    const isAdmin = ADMIN_EMAILS.includes(studentEmail);

    const isOwner = studentEmail === authorEmail;



    if (!isAdmin && !isOwner) {

      alert('You can only delete your own posts.');

      return;

    }



    if (!confirm('Are you sure you want to delete this post?')) return;

    await supabase.from('posts').delete().eq('id', postId);

    setPosts(prev => prev.filter(p => p.id !== postId));

  };



  const handleLikePost = async (postId: string, currentLikes: number) => {

    await supabase.from('posts').update({ likes: (currentLikes || 0) + 1 }).eq('id', postId);

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));

  };



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



    if (!error) {

      setMarketTitle('');

      setMarketPrice('');

      setMarketContact('');

      setShowMarketModal(false);

      fetchMarketItems();

    }

  };



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



    if (!error) {

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



  // Secure OTP Step 1

  const handleSendRegistrationOtp = async () => {

    if (!studentEmail.trim() || !studentPassword.trim() || !studentName.trim() || !rollNo.trim()) {

      alert('All registration fields are mandatory.');

      return;

    }

    setAuthLoading(true);



    const { error: otpErr } = await supabase.auth.signInWithOtp({

      email: studentEmail.trim(),

      options: {

        shouldCreateUser: true,

        data: {

          full_name: studentName.trim(),

          roll_no: rollNo.trim(),

          branch,

          year,

          bio: `Student in ${branch} (${year}) at MBM University.`

        }

      }

    });



    setAuthLoading(false);



    if (otpErr) {

      alert('OTP Sending Error: ' + otpErr.message);

    } else {

      alert(`✨ 6-digit verification code sent to (${studentEmail}). Check Inbox/Spam!`);

      setAuthStep('otp');

    }

  };



  // Secure OTP Step 2

  const handleVerifyOtp = async () => {

    if (!otpCode.trim()) {

      alert('Please enter the 6-digit OTP.');

      return;

    }

    setAuthLoading(true);



    const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({

      email: studentEmail.trim(),

      token: otpCode.trim(),

      type: 'email'

    });



    if (verifyErr) {

      setAuthLoading(false);

      alert('Invalid or Expired OTP: ' + verifyErr.message);

      return;

    }



    if (studentPassword.trim()) {

      await supabase.auth.updateUser({ password: studentPassword.trim() });

    }



    if (verifyData?.user) {

      await supabase.from('profiles').upsert({

        id: verifyData.user.id,

        email: studentEmail.trim(),

        full_name: studentName.trim(),

        name: studentName.trim(),

        roll_no: rollNo.trim(),

        branch,

        year,

        bio: `Student in ${branch} (${year}) at MBM University.`

      });

    }



    setAuthLoading(false);

    alert('🔥 Email Verified! Welcome to MBM Chat.');

    setSessionActive(true);

    window.location.reload();

  };



  const handleLogout = async () => {

    await supabase.auth.signOut();

    setSessionActive(false);

    window.location.reload();

  };



  // Auth Screen (Clean Professional Vibe)

  if (!sessionActive) {

    return (

      <div className="mbm min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col items-center justify-between p-4 sm:p-8 font-sans selection:bg-[var(--neel)] selection:text-white">

<style dangerouslySetInnerHTML={{ __html: MBM_CSS }} />

        <div className="w-full flex-1 flex items-center justify-center">

          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 rounded-[14px] overflow-hidden border border-[var(--line)] bg-[var(--surface)]  backdrop-blur-xl">

            <div className="md:col-span-5 p-8 flex flex-col justify-between on-neel btn-neel border-r border-[var(--line)]">

              <div className="space-y-4">

                <div className="flex items-center gap-2.5">

                  <span className="w-9 h-9 rounded-[10px] btn-neel flex items-center justify-center brand text-[var(--ink)]   text-base">M</span>

                  <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">MBM<span>Chat</span></h1>

                </div>

                <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)] leading-tight">

                  MBM University<br />Student Network

                </h2>

                <p className="text-[14px] text-[var(--mute)] leading-relaxed font-sans">

                  Anonymous confessions, secure P2P chats, live campus snaps, and exclusive student network.

                </p>

              </div>

              <div className="hidden md:block pt-6">

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--neel-wash)] border border-[var(--line)] text-[var(--neel)] text-[12px] font-semibold">

                  <Sparkles className="w-3 h-3 " /> Verified MBM Students Only

                </span>

              </div>

            </div>



            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-[var(--surface)]">

              <div className="max-w-md mx-auto w-full space-y-5">

                <div className="grid grid-cols-2 p-1 bg-[var(--sunk)] border border-[var(--line)] rounded-[10px] text-[14px] font-semibold">

                  <button 

                    onClick={() => { setAuthMode('login'); setAuthStep('details'); }}

                    className={`py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${authMode === 'login' ? 'btn-neel text-[var(--ink)]  ' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}

                  >

                    <LogIn className="w-3.5 h-3.5" />

                    <span>Sign In</span>

                  </button>

                  <button 

                    onClick={() => { setAuthMode('register'); setAuthStep('details'); }}

                    className={`py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${authMode === 'register' ? 'btn-neel text-[var(--ink)]  ' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}

                  >

                    <UserPlus className="w-3.5 h-3.5" />

                    <span>Registration</span>

                  </button>

                </div>



                <div className="space-y-3 text-[14px]">

                  {authMode === 'register' && authStep === 'details' && (

                    <>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Full Name</label>

                        <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Vineet Kaler" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Roll Number</label>

                        <input type="text" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g. 23UFIEXXXX" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                        <div>

                          <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Department / Branch</label>

                          <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3 py-3 text-[var(--ink)] text-[14px] outline-none focus:border-[var(--line)] transition font-sans">

                            {MBM_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}

                          </select>

                        </div>

                        <div>

                          <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Academic Year</label>

                          <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3 py-3 text-[var(--ink)] text-[14px] outline-none focus:border-[var(--line)] transition font-sans">

                            <option value="1st Year">1st Year</option>

                            <option value="2nd Year">2nd Year</option>

                            <option value="3rd Year">3rd Year</option>

                            <option value="4th Year">4th Year</option>

                          </select>

                        </div>

                      </div>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Email Address</label>

                        <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@example.com" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Password</label>

                        <input type="password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <button onClick={handleSendRegistrationOtp} disabled={authLoading} className="w-full py-3.5 mt-2 btn-neel hover:opacity-90 text-[var(--ink)] font-bold text-[14px] rounded-lg   flex items-center justify-center gap-2 transition active:scale-[0.98]">

                        <span>{authLoading ? 'Sending Code...' : 'Send 6-Digit OTP'}</span>

                        <ArrowRight className="w-4 h-4" />

                      </button>

                    </>

                  )}



                  {authMode === 'register' && authStep === 'otp' && (

                    <div className="space-y-4 py-4">

                      <div className="p-4 bg-[var(--neel-wash)] border border-[var(--line)] rounded-[10px] text-center space-y-1">

                        <p className="text-[14px] text-[var(--neel)]">OTP code sent to your email:</p>

                        <p className="font-bold text-[var(--ink)] text-[14px]">{studentEmail}</p>

                      </div>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block text-center font-medium">Enter 6-Digit Email OTP</label>

                        <input type="text" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="••••••" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-[10px] px-4 py-3.5 text-center tracking-[0.5em] text-xl font-bold text-[var(--neel)] outline-none focus:border-[var(--line)] font-sans" />

                      </div>

                      <button onClick={handleVerifyOtp} disabled={authLoading} className="w-full py-3.5 btn-neel hover:opacity-90 text-[var(--ink)] font-bold text-[14px] rounded-lg   flex items-center justify-center gap-2 transition">

                        <span>{authLoading ? 'Verifying...' : 'Verify OTP & Enter MBM Chat'}</span>

                      </button>

                      <button onClick={() => setAuthStep('details')} className="w-full text-center text-[12.5px] text-[var(--mute)] hover:text-[var(--ink)] pt-2">

                        Back to Details / Change Email

                      </button>

                    </div>

                  )}



                  {authMode === 'login' && (

                    <>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Email Address</label>

                        <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@example.com" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <div>

                        <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Password</label>

                        <input type="password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[var(--ink)] outline-none focus:border-[var(--line)] transition font-sans" />

                      </div>

                      <button onClick={handlePasswordLogin} disabled={authLoading} className="w-full py-3.5 mt-2 btn-neel hover:opacity-90 text-[var(--ink)] font-bold text-[14px] rounded-lg   flex items-center justify-center gap-2 transition active:scale-[0.98]">

                        <span>{authLoading ? 'Signing In...' : 'Sign In'}</span>

                        <ArrowRight className="w-4 h-4" />

                      </button>

                    </>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>



        <footer className="w-full py-4 text-center text-[12.5px] text-[var(--mute)] border-t border-[var(--line)] space-y-1 mt-6">

          <p>© 2026 MBM Students only. All rights reserved. T&C Applied.</p>

          <p className="text-[var(--neel)] font-bold">Developed by Vineet Kaler</p>

        </footer>

      </div>

    );

  }



  return (

    <div className="mbm min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between font-sans selection:bg-[var(--neel)] selection:text-white">

<style dangerouslySetInnerHTML={{ __html: MBM_CSS }} />

      <div>

        {/* Top Header Bar */}

        <header className="h-16 border-b border-[var(--line)] bg-[var(--surface)] backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between ">

          <div className="flex items-center gap-3">

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg bg-[var(--sunk)] text-[var(--ink)]">

              <Menu className="w-5 h-5" />

            </button>

            <div className="flex items-center gap-2.5">

              <span className="w-8 h-8 rounded-lg btn-neel flex items-center justify-center brand text-[var(--ink)] text-[16px] ">M</span>

              <span className="font-bold text-[var(--ink)] text-base tracking-tight">MBM<span>Chat</span></span>

            </div>

          </div>



          <div className="flex items-center gap-3 text-[14px] font-medium">

            {ADMIN_EMAILS.includes(studentEmail) && (

              <a href="/admin" className="px-3 py-1.5 rounded-lg bg-[var(--neel-wash)] border border-[var(--line)] text-[var(--danger)] font-bold text-[12px] hover:opacity-90 transition ">

                Admin Desk

              </a>

            )}



            <button onClick={() => setActiveTab('notifications')} className="relative p-2 rounded-lg bg-[var(--sunk)] hover:bg-[var(--neel-wash)] text-[var(--ink)] transition" title="Friend Requests">

              <Bell className="w-4 h-4" />

              {friendRequests.length > 0 && (

                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--marigold)] text-[#16213E] rounded-full text-[9px] font-bold flex items-center justify-center ">

                  {friendRequests.length}

                </span>

              )}

            </button>



            <button onClick={() => setActiveTab('profile')} className="hidden sm:flex px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--sunk)] hover:bg-[var(--neel-wash)] items-center gap-2 transition">

              {renderAuthorName(studentName, studentEmail)}

            </button>

            <button onClick={handleLogout} className="text-[var(--mute)] hover:text-[var(--danger)] p-2 rounded-lg bg-[var(--sunk)] hover:bg-[var(--neel-wash)] transition" title="Sign out">

              <LogOut className="w-4 h-4" />

            </button>

          </div>

        </header>



        {/* Mobile Dropdown Menu */}

        {mobileMenuOpen && (

          <div className="md:hidden fixed inset-x-0 top-16 bg-[var(--surface)] backdrop-blur-2xl border-b border-[var(--line)] p-4 z-40 space-y-1 text-[14px] font-semibold">

            {[

              { id: 'home', label: 'Dashboard', icon: Home },

              { id: 'feed', label: 'Student Opinions', icon: MessageCircle },

              { id: 'confessions', label: 'Confessions', icon: Lock },

              { id: 'chats', label: 'Classmate Chats', icon: MessageSquare, badge: chatPeers.length },

              { id: 'notifications', label: 'Friend Requests', icon: Bell, badge: friendRequests.length },

              { id: 'wall', label: 'Campus Wall & Snaps', icon: Camera },

              { id: 'market', label: 'Marketplace', icon: ShoppingBag, badge: marketItems.length },

              { id: 'events', label: 'Events Hub', icon: Calendar, badge: eventsList.length },

              { id: 'settings', label: 'Settings', icon: Settings },

            ].map(item => (

              <button

                key={item.id}

                onClick={() => { setActiveTab(item.id as any); setMobileMenuOpen(false); }}

                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${

                  activeTab === item.id ? 'btn-neel text-[var(--ink)] font-bold' : 'text-[var(--ink)] hover:bg-[var(--sunk)]'

                }`}

              >

                <div className="flex items-center gap-3">

                  <item.icon className="w-4 h-4" />

                  <span>{item.label}</span>

                </div>

                {item.badge !== undefined && item.badge > 0 && (

                  <span className="bg-[var(--marigold)] text-[#16213E] px-2 py-0.5 rounded-full text-[12px] font-bold">

                    {item.badge}

                  </span>

                )}

              </button>

            ))}

          </div>

        )}



        {/* Main Grid Layout */}

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 py-4 px-2 sm:px-4">

          

          {/* Desktop Navigation Sidebar */}

          <aside className="hidden md:flex md:col-span-3 border-r border-[var(--line)] p-4 flex-col justify-between text-[14px] font-semibold">

            <div className="space-y-1.5">

              <div className="text-[12px]  text-[var(--mute)] px-3 py-1 font-bold tracking-wider">Main Menu</div>

              {[

                { id: 'home', label: 'Dashboard', icon: Home },

                { id: 'feed', label: 'Student Opinions', icon: MessageCircle },

                { id: 'confessions', label: 'Confessions', icon: Lock },

                { id: 'chats', label: 'Classmate Chats', icon: MessageSquare, badge: chatPeers.length },

                { id: 'notifications', label: 'Friend Requests', icon: Bell, badge: friendRequests.length },

                { id: 'wall', label: 'Campus Wall & Snaps', icon: Camera },

                { id: 'market', label: 'Marketplace', icon: ShoppingBag, badge: marketItems.length },

                { id: 'events', label: 'Events Hub', icon: Calendar, badge: eventsList.length },

                { id: 'settings', label: 'Settings', icon: Settings },

              ].map(item => (

                <button

                  key={item.id}

                  onClick={() => setActiveTab(item.id as any)}

                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] transition ${

                    activeTab === item.id 

                      ? 'btn-neel text-[var(--ink)] font-bold  ' 

                      : 'text-[var(--mute)] hover:bg-[var(--sunk)] hover:text-[var(--ink)]'

                  }`}

                >

                  <div className="flex items-center gap-3">

                    <item.icon className="w-4 h-4" />

                    <span>{item.label}</span>

                  </div>

                  {item.badge !== undefined && item.badge > 0 && (

                    <span className="bg-[var(--marigold)] text-[#16213E] px-2 py-0.5 rounded-full text-[12px] font-bold">

                      {item.badge}

                    </span>

                  )}

                </button>

              ))}

            </div>



            <div onClick={() => setActiveTab('profile')} className="p-3.5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line)]/40 cursor-pointer flex items-center gap-3 transition ">

              <div className="w-10 h-10 rounded-lg btn-neel flex items-center justify-center font-bold text-[var(--ink)] text-[14px] ">

                {studentName ? studentName.slice(0, 2).toUpperCase() : 'MB'}

              </div>

              <div className="truncate">

                <div>{renderAuthorName(studentName, studentEmail)}</div>

                <div className="text-[var(--neel)] text-[12px] truncate">{branch} • {year}</div>

              </div>

            </div>

          </aside>



          {/* Central Viewport */}

          <main className="col-span-1 md:col-span-6 p-2 sm:p-6 overflow-y-auto mb-20 md:mb-0">

            

            {/* TAB: DASHBOARD */}

            {activeTab === 'home' && (

              <div className="space-y-5">

                <div className="p-6 rounded-[14px] bg-[var(--neel-wash)] border border-[var(--line)]  relative overflow-hidden">

                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">

                    <Flame className="w-32 h-32 text-[var(--neel)]" />

                  </div>

                  <div className="flex items-center gap-2">

                    <h2 className="text-xl font-bold text-[var(--ink)]">Welcome back,</h2>

                    {renderAuthorName(studentName, studentEmail)}

                  </div>

                  <p className="text-[14px] text-[var(--mute)] mt-1 flex items-center gap-1 font-medium">

                    <span className="w-2 h-2 rounded-full bg-[#1E7F5C] "></span>

                    {branch} • {year} • Roll: {rollNo}

                  </p>

                </div>



                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-[14px] font-semibold">

                  {[

                    { label: "Opinion", icon: MessageCircle, color: "text-[var(--neel)]", bg: "", act: () => setActiveTab('feed') },

                    { label: "Confess", icon: Lock, color: "text-[var(--neel)]", bg: "", act: () => setActiveTab('confessions') },

                    { label: "Market", icon: ShoppingBag, color: "text-[#1E7F5C]", bg: "", act: () => setActiveTab('market') },

                    { label: "Events", icon: Calendar, color: "text-[var(--neel)]", bg: "", act: () => setActiveTab('events') },

                  ].map((a, i) => (

                    <button key={i} onClick={a.act} className={`p-4 rounded-[10px] ${a.bg} bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line)] transition flex flex-col items-center gap-2  group`}>

                      <div className="p-2.5 rounded-lg bg-[var(--sunk)]  transition">

                        <a.icon className={`w-5 h-5 ${a.color}`} />

                      </div>

                      <span className="text-[var(--ink)] font-bold">{a.label}</span>

                    </button>

                  ))}

                </div>



                <div className="p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 text-[14px]  font-medium">

                  <div className="text-[12px]  text-[var(--mute)] font-bold tracking-wider">Campus Bio</div>

                  <p className="text-[var(--ink)] text-[16px] italic">"{studentBio}"</p>

                </div>

              </div>

            )}



            {/* TAB: STUDENT OPINIONS */}

            {activeTab === 'feed' && (

              <div className="space-y-4">

                <div className="p-4 sm:p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 ">

                  <span className="text-[14px] font-bold text-[var(--mute)]">Share Campus Opinion (Text, Photo or Video)</span>

                  <textarea rows={3} value={postDraft} onChange={e => setPostDraft(e.target.value)} placeholder="What's your opinion on college labs, events, or mess?" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-[10px] p-3.5 text-[14px] text-[var(--ink)] placeholder-[#8793AE] outline-none focus:border-[var(--line)] resize-none transition font-sans" />

                  

                  {postMediaUrl && (

                    <div className="relative aspect-video rounded-[10px] overflow-hidden border border-[var(--line)] bg-black">

                      <img src={postMediaUrl} alt="Attached Media" className="w-full h-full object-cover" />

                      <button onClick={() => setPostMediaUrl(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-[var(--ink)] hover:bg-rose-600 transition">

                        <X className="w-4 h-4" />

                      </button>

                    </div>

                  )}



                  <div className="flex items-center justify-between pt-1">

                    <input type="file" accept="image/*,video/*" ref={postMediaInputRef} onChange={handlePostMediaSelected} className="hidden" />

                    <button onClick={() => postMediaInputRef.current?.click()} className="px-3.5 py-2 bg-[var(--sunk)] hover:bg-[var(--neel-wash)] text-[var(--neel)] text-[14px] font-semibold rounded-lg flex items-center gap-1.5 transition">

                      <ImageIcon className="w-4 h-4" />

                      <span>Add Photo/Video</span>

                    </button>



                    <button onClick={submitPost} className="px-5 py-2.5 btn-neel hover:opacity-90 text-[var(--ink)] text-[14px] font-bold rounded-lg  transition flex items-center gap-2">

                      <span>Post Opinion</span>

                      <Send className="w-3.5 h-3.5" />

                    </button>

                  </div>

                </div>



                <div className="space-y-4">

                  {posts.map(post => {

                    const postComments = comments.filter(c => c.parent_id === post.id);

                    const isAuthorOrAdmin = (post.author_email === studentEmail) || ADMIN_EMAILS.includes(studentEmail);



                    let displayContent = post.content || '';

                    let mediaAttachment = null;

                    if (displayContent.includes('[MEDIA:')) {

                      const parts = displayContent.split('[MEDIA:');

                      displayContent = parts[0];

                      mediaAttachment = parts[1].replace(']', '');

                    }



                    return (

                      <div key={post.id} className="p-4 sm:p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 ">

                        <div className="flex justify-between items-start">

                          <div>

                            {renderAuthorName(post.author_name, post.author_email)}

                            <div className="text-[12px] text-[var(--mute)] mt-0.5 font-medium">{post.branch} • {post.year}</div>

                          </div>

                          <div className="flex items-center gap-1.5">

                            {isAuthorOrAdmin && (

                              <button onClick={() => handleDeletePost(post.id, post.author_email)} className="p-2 text-[var(--mute)] hover:text-[var(--danger)] rounded-lg bg-[var(--sunk)]" title="Delete">

                                <Trash2 className="w-3.5 h-3.5" />

                              </button>

                            )}

                            <button onClick={() => handleReport('post', post.id)} className="p-2 text-[var(--mute)] hover:text-[var(--neel)] rounded-lg bg-[var(--sunk)]" title="Report">

                              <Flag className="w-3.5 h-3.5" />

                            </button>

                          </div>

                        </div>



                        {displayContent.trim() && (

                          <p className="text-[14px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap font-sans">{displayContent}</p>

                        )}



                        {mediaAttachment && (

                          <div className="rounded-[10px] overflow-hidden border border-[var(--line)] max-h-80 bg-black">

                            <img src={mediaAttachment} alt="Post Attachment" className="w-full h-full object-contain" />

                          </div>

                        )}



                        <div className="flex items-center gap-4 pt-3 border-t border-[var(--line)] text-[14px] font-semibold text-[var(--mute)]">

                          <button onClick={() => handleLikePost(post.id, post.likes)} className="flex items-center gap-1.5 hover:text-[var(--neel)] transition">

                            <Heart className={`w-4 h-4 ${post.likes > 0 ? 'text-[var(--neel)] fill-[var(--neel)]' : ''}`} />

                            <span>{post.likes || 0}</span>

                          </button>

                          <button onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)} className="flex items-center gap-1.5 hover:text-[var(--neel)] transition">

                            <MessageCircle className="w-4 h-4" />

                            <span>{postComments.length} Comments</span>

                          </button>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>

            )}



            {/* TAB: CONFESSIONS */}

            {activeTab === 'confessions' && (

              <div className="space-y-4">

                <div className="p-5 rounded-[14px] bg-[var(--neel-wash)] border border-[var(--line)] flex items-center gap-4 ">

                  <div className="w-12 h-12 rounded-[10px] bg-[var(--neel-wash)] border border-[var(--line)] text-[var(--neel)] flex items-center justify-center font-bold ">

                    <Lock className="w-6 h-6" />

                  </div>

                  <div>

                    <h3 className="text-[16px] font-bold text-[var(--ink)]">Campus Confessions</h3>

                    <p className="text-[14px] text-[var(--mute)] mt-0.5 font-medium">100% Anonymous student secrets & stories.</p>

                  </div>

                </div>



                <div className="p-4 sm:p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 ">

                  <textarea rows={2} value={confessionDraft} onChange={e => setConfessionDraft(e.target.value)} placeholder="Share an anonymous confession..." className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-[10px] p-3.5 text-[14px] text-[var(--ink)] placeholder-[#8793AE] outline-none focus:border-[var(--line)] resize-none transition font-sans" />

                  <div className="flex items-center justify-between">

                    <select value={confessionTag} onChange={e => setConfessionTag(e.target.value)} className="bg-[var(--sunk)] border border-[var(--line)] rounded-lg text-[14px] font-semibold text-[var(--neel)] px-3 py-2 outline-none">

                      <option value="General">General</option>

                      <option value="Academics">Academics</option>

                      <option value="Hostel">Hostel</option>

                      <option value="Crush">Crush</option>

                    </select>

                    <button onClick={submitConfession} className="px-4 py-2 btn-neel text-[var(--ink)] text-[14px] font-bold rounded-lg  transition">

                      Post Anonymously

                    </button>

                  </div>

                </div>



                <div className="space-y-3">

                  {confessions.map(c => (

                    <div key={c.id} className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-2 ">

                      <span className="text-[12px] text-[var(--neel)] font-bold block">Anonymous • {c.tag}</span>

                      <p className="text-[14px] text-[var(--ink)] font-sans">{c.content}</p>

                    </div>

                  ))}

                </div>

              </div>

            )}



            {/* TAB: CHATS */}

            {activeTab === 'chats' && (

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-base font-bold text-[var(--ink)]">Classmate Chats</h2>

                    <p className="text-[14px] text-[var(--mute)] font-medium">Secure P2P connections.</p>

                  </div>

                  <button onClick={() => setShowAddFriendModal(true)} className="px-4 py-2 btn-neel hover:opacity-90 text-[var(--ink)] text-[14px] font-bold rounded-lg flex items-center gap-2 ">

                    <UserPlus className="w-3.5 h-3.5" />

                    <span>Add Friends</span>

                  </button>

                </div>



                {chatPeers.length === 0 ? (

                  <div className="p-12 border border-dashed border-[var(--line)] rounded-[14px] text-center space-y-2 bg-[var(--surface)]">

                    <MessageSquare className="w-10 h-10 text-[var(--mute)] mx-auto mb-1" />

                    <h4 className="text-[16px] font-bold text-[var(--ink)]">No active chat connections</h4>

                    <p className="text-[14px] text-[var(--mute)]">Send friend requests via "Add Friends". Chat unlocks once accepted!</p>

                  </div>

                ) : selectedPeer ? (

                  <div className="h-[70vh] rounded-[14px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between overflow-hidden ">

                    <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--sunk)]">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-[var(--neel-wash)] text-[var(--neel)] flex items-center justify-center font-bold text-[14px] border border-[var(--line)] ">

                          {selectedPeer.initials}

                        </div>

                        <div>

                          <div className="text-[14px] font-bold text-[var(--ink)]">{selectedPeer.name}</div>

                          <div className="text-[12px] text-[#1E7F5C] font-medium">Connected P2P</div>

                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <button onClick={() => handleRemoveFriend(selectedPeer.email, selectedPeer.name)} className="p-2 text-[var(--mute)] hover:text-[var(--danger)] rounded-lg bg-[var(--sunk)]" title="Remove">

                          <UserMinus className="w-4 h-4" />

                        </button>

                        <button onClick={() => setSelectedPeer(null)} className="p-2 text-[var(--mute)] hover:text-[var(--ink)] rounded-lg bg-[var(--sunk)]">

                          <X className="w-4 h-4" />

                        </button>

                      </div>

                    </div>



                    <div className="p-4 flex-1 overflow-y-auto space-y-2.5 text-[14px]">

                      {messages

                        .filter(m => (m.sender_name === studentName && m.receiver_name === selectedPeer.name) || (m.sender_name === selectedPeer.name && m.receiver_name === studentName))

                        .map(m => (

                          <div key={m.id} className={`flex ${m.sender_name === studentName ? 'justify-end' : 'justify-start'}`}>

                            <div className={`p-3.5 rounded-[10px] max-w-[80%]  ${m.sender_name === studentName ? 'btn-neel text-[var(--ink)] rounded-tr-none' : 'bg-[#0e1424] border border-[var(--line)] text-[var(--ink)] rounded-tl-none'}`}>

                              <p className="font-sans">{m.text}</p>

                            </div>

                          </div>

                        ))}

                    </div>



                    <div className="p-3 border-t border-[var(--line)] flex items-center gap-2 bg-[var(--surface)]">

                      <input type="text" value={chatDraft} onChange={e => setChatDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendP2PMessage()} placeholder={`Message ${selectedPeer.name}...`} className="flex-1 bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-4 py-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--line)] font-sans" />

                      <button onClick={sendP2PMessage} className="p-3 btn-neel text-[var(--ink)] rounded-lg ">

                        <Send className="w-4 h-4" />

                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="space-y-2.5">

                    {chatPeers.map(p => (

                      <div key={p.email} className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line)] flex items-center justify-between transition ">

                        <div onClick={() => setSelectedPeer(p)} className="flex items-center gap-3.5 cursor-pointer flex-1">

                          <div className="w-10 h-10 rounded-lg bg-[var(--neel-wash)] text-[var(--neel)] flex items-center justify-center font-bold text-[14px] border border-[var(--line)]">

                            {p.initials}

                          </div>

                          <div>

                            <div className="text-[14px] font-bold text-[var(--ink)]">{p.name}</div>

                            <div className="text-[12px] text-[var(--mute)] font-medium">Tap to open chat</div>

                          </div>

                        </div>

                        <button onClick={() => setSelectedPeer(p)} className="text-[14px] text-[var(--neel)] hover:underline font-bold">

                          Chat

                        </button>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {/* TAB: NOTIFICATIONS */}

            {activeTab === 'notifications' && (

              <div className="space-y-4">

                <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">

                  <Bell className="w-4 h-4 text-[var(--neel)]" />

                  <span>Friend Requests ({friendRequests.length})</span>

                </h2>



                {friendRequests.length === 0 ? (

                  <div className="p-12 border border-dashed border-[var(--line)] rounded-[14px] text-center text-[var(--mute)] text-[14px] bg-[var(--surface)] font-medium">

                    No pending friend requests right now.

                  </div>

                ) : (

                  <div className="space-y-2.5 text-[14px] font-semibold">

                    {friendRequests.map(req => (

                      <div key={req.id} className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between ">

                        <div>

                          <div className="font-bold text-[var(--ink)] text-[16px]">{req.sender_name}</div>

                          <div className="text-[12px] text-[var(--mute)] mt-0.5 font-medium">Wants to connect with you</div>

                        </div>

                        <button onClick={() => handleAcceptRequest(req.id)} className="px-4 py-2.5 btn-neel hover:opacity-90 text-[var(--ink)] font-bold rounded-lg flex items-center gap-1.5 ">

                          <Check className="w-3.5 h-3.5" />

                          <span>Accept</span>

                        </button>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {/* TAB: WALL (100% Working Native Camera Capture) */}

            {activeTab === 'wall' && (

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <h2 className="text-base font-bold text-[var(--ink)]">Campus Wall</h2>

                  <input 

                    type="file" 

                    accept="image/*" 

                    capture="environment" 

                    ref={snapFileInputRef} 

                    onChange={(e) => {

                      const file = e.target.files?.[0];

                      if (file) {

                        const reader = new FileReader();

                        reader.onload = (event) => {

                          setCapturedSnapUrl(event.target?.result as string);

                        };

                        reader.readAsDataURL(file);

                      }

                    }} 

                    className="hidden" 

                  />

                  <button 

                    onClick={() => snapFileInputRef.current?.click()} 

                    className="px-4 py-2 btn-neel hover:opacity-90 text-black text-[14px] font-bold rounded-lg flex items-center gap-2 "

                  >

                    <Camera className="w-3.5 h-3.5" />

                    <span>Take Snap</span>

                  </button>

                </div>



                {capturedSnapUrl && (

                  <div className="p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 ">

                    <div className="relative aspect-[3/4] max-h-96 rounded-[10px] overflow-hidden bg-black mx-auto">

                      <img src={capturedSnapUrl} alt="Captured Snap" className="w-full h-full object-contain" />

                    </div>

                    <input 

                      type="text" 

                      value={snapCaption} 

                      onChange={e => setSnapCaption(e.target.value)} 

                      placeholder="Add a caption to your snap..." 

                      className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--neel)] font-sans" 

                    />

                    <div className="flex gap-2">

                      <button onClick={() => setCapturedSnapUrl(null)} className="flex-1 py-2.5 bg-[var(--sunk)] text-[var(--ink)] rounded-lg text-[14px] font-bold">Retake</button>

                      <button onClick={broadcastPublicSnap} className="flex-1 py-2.5 btn-neel text-black rounded-lg text-[14px] font-bold ">Post to Wall</button>

                    </div>

                  </div>

                )}



                {publicSnaps.length === 0 ? (

                  <div className="p-12 border border-dashed border-[var(--line)] rounded-[14px] text-center text-[var(--mute)] text-[14px] bg-[var(--surface)] font-medium">No active snaps on wall. Be the first!</div>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {publicSnaps.map(snap => (

                      <div key={snap.id} className="rounded-[14px] overflow-hidden bg-[var(--surface)] border border-[var(--line)] space-y-2 ">

                        <div className="relative aspect-[3/4]">

                          <img src={snap.imageUrl} alt="Snap" className="w-full h-full object-cover" />

                          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[12px] text-[var(--ink)] font-semibold">

                            {snap.sender} • {snap.branch}

                          </div>

                        </div>

                        <div className="p-3 text-[14px] flex justify-between text-[var(--ink)] font-medium">

                          <span>{snap.caption}</span>

                          <span className="text-[12px] text-[var(--mute)]">{snap.timestamp}</span>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {/* TAB: MARKETPLACE */}

            {activeTab === 'market' && (

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <h2 className="text-base font-bold text-[var(--ink)]">Student Marketplace</h2>

                  <button onClick={() => setShowMarketModal(true)} className="px-4 py-2 btn-neel hover:opacity-90 text-[var(--ink)] text-[14px] font-bold rounded-lg ">List Item</button>

                </div>

                {marketItems.length === 0 ? (

                  <div className="p-12 border border-dashed border-[var(--line)] rounded-[14px] text-center text-[var(--mute)] text-[14px] bg-[var(--surface)] font-medium">No items listed.</div>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {marketItems.map(item => (

                      <div key={item.id} className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between gap-3 ">

                        <div>

                          <span className="text-[#1E7F5C] font-bold text-[16px]">{item.price}</span>

                          <h4 className="text-[var(--ink)] font-bold text-[16px] mt-2">{item.title}</h4>

                          <div className="text-[12.5px] text-[var(--mute)] mt-1 font-medium">Seller: {item.seller}</div>

                        </div>

                        <div className="text-[12.5px] text-[var(--neel)] pt-2 border-t border-[var(--line)] font-semibold">{item.contact || 'Chat in App'}</div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {/* TAB: EVENTS */}

            {activeTab === 'events' && (

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <h2 className="text-base font-bold text-[var(--ink)]">Events Hub</h2>

                  <button onClick={() => setShowEventModal(true)} className="px-4 py-2 btn-neel hover:opacity-90 text-[var(--ink)] text-[14px] font-bold rounded-lg ">Post Event</button>

                </div>

                {eventsList.length === 0 ? (

                  <div className="p-12 border border-dashed border-[var(--line)] rounded-[14px] text-center text-[var(--mute)] text-[14px] bg-[var(--surface)] font-medium">No upcoming events.</div>

                ) : (

                  <div className="space-y-3">

                    {eventsList.map(ev => (

                      <div key={ev.id} className="p-4 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ">

                        <div className="space-y-1">

                          <h4 className="text-[var(--ink)] font-bold text-[16px]">{ev.title}</h4>

                          <div className="text-[12.5px] text-[var(--mute)] flex flex-wrap gap-x-4 gap-y-1 font-medium">

                            <span>{ev.date}</span>

                            <span>{ev.venue}</span>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}



            {/* TAB: PROFILE */}

            {activeTab === 'profile' && (

              <div className="space-y-5 text-[14px] font-semibold">

                <div className="p-6 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-4 ">

                  <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-[10px] btn-neel flex items-center justify-center text-xl font-bold text-[var(--ink)] ">

                      {studentName ? studentName.slice(0, 2).toUpperCase() : 'MB'}

                    </div>

                    <div>

                      <div className="text-base font-bold">{renderAuthorName(studentName, studentEmail)}</div>

                      <p className="text-[var(--mute)] text-[14px] mt-0.5 font-medium">{rollNo} • {branch}</p>

                      <p className="text-[var(--neel)] text-[12.5px] mt-0.5 font-bold">{year}</p>

                    </div>

                  </div>



                  <div className="space-y-3 pt-3 border-t border-[var(--line)]">

                    <div>

                      <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Campus Bio</label>

                      <textarea rows={3} value={studentBio} onChange={e => setStudentBio(e.target.value)} className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-[10px] p-3.5 text-[var(--ink)] text-[14px] outline-none focus:border-[var(--line)] font-sans" />

                    </div>

                    <button onClick={handleSaveBio} disabled={savingBio} className="w-full py-3 btn-neel hover:opacity-90 text-[var(--ink)] font-bold rounded-lg mt-3 transition ">

                      <span>{savingBio ? 'Saving...' : 'Save & Persist Changes'}</span>

                    </button>

                  </div>

                </div>

              </div>

            )}



            {/* TAB: SETTINGS */}

            {activeTab === 'settings' && (

              <div className="space-y-4 text-[14px] font-semibold">

                <h2 className="text-base font-bold text-[var(--ink)]">Account & Preferences</h2>

                <div className="p-5 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-4 ">

                  <div className="flex justify-between items-center py-2">

                    <div>

                      <div className="text-[var(--ink)] font-bold">{studentName}</div>

                      <div className="text-[var(--mute)] text-[12.5px] mt-0.5 font-medium">{studentEmail} • {rollNo}</div>

                    </div>

                    <button onClick={handleLogout} className="px-4 py-2 bg-[var(--neel-wash)] border border-[var(--line)] text-[var(--danger)] rounded-lg font-bold">Sign Out</button>

                  </div>

                </div>

              </div>

            )}



          </main>



          {/* Right Sidebar Quick Actions */}

          <aside className="hidden md:block md:col-span-3 border-l border-[var(--line)] p-4 space-y-4 text-[14px] font-semibold">

            <div className="p-4 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] space-y-3 ">

              <span className="text-[12px] font-bold text-[var(--neel)]  block">Campus Shortcuts</span>

              <button onClick={() => setActiveTab('feed')} className="w-full py-2.5 bg-[var(--sunk)] hover:bg-[var(--neel-wash)] text-[var(--ink)] font-bold rounded-lg flex items-center justify-center gap-2 transition">

                <MessageCircle className="w-4 h-4 text-[var(--neel)]" />

                <span>Post Opinion</span>

              </button>

              <button onClick={() => setShowMarketModal(true)} className="w-full py-2.5 bg-[var(--sunk)] hover:bg-[var(--neel-wash)] text-[var(--ink)] font-bold rounded-lg flex items-center justify-center gap-2 transition">

                <ShoppingBag className="w-4 h-4 text-[#1E7F5C]" />

                <span>Sell Item</span>

              </button>

              <button onClick={() => snapFileInputRef.current?.click()} className="w-full py-2.5 bg-[var(--sunk)] hover:bg-[var(--neel-wash)] text-[var(--ink)] font-bold rounded-lg flex items-center justify-center gap-2 transition">

                <Camera className="w-4 h-4 text-[var(--neel)]" />

                <span>Capture Snap</span>

              </button>

            </div>

          </aside>



        </div>

      </div>



      {/* Mobile Fixed Bottom Navigation Bar */}

      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[var(--surface)] backdrop-blur-2xl border-t border-[var(--line)] px-4 flex items-center justify-around z-40  font-semibold">

        {[

          { id: 'home', icon: Home, label: 'Home' },

          { id: 'feed', icon: MessageCircle, label: 'Feed' },

          { id: 'chats', icon: MessageSquare, label: 'Chats', badge: chatPeers.length },

          { id: 'wall', icon: Camera, label: 'Snaps' },

          { id: 'profile', icon: User, label: 'Profile' }

        ].map(tab => (

          <button

            key={tab.id}

            onClick={() => setActiveTab(tab.id as any)}

            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition ${

              activeTab === tab.id ? 'text-[var(--neel)] font-bold ' : 'text-[var(--mute)] hover:text-[var(--ink)]'

            }`}

          >

            <tab.icon className="w-5 h-5" />

            <span className="text-[12px] mt-0.5">{tab.label}</span>

            {tab.badge !== undefined && tab.badge > 0 && (

              <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-[var(--marigold)] text-[#16213E] rounded-full text-[8px] font-bold flex items-center justify-center">

                {tab.badge}

              </span>

            )}

          </button>

        ))}

      </nav>



      {/* Footer on Main Dashboard */}

      <footer className="w-full py-4 text-center text-[12.5px] text-[var(--mute)] border-t border-[var(--line)] space-y-1 mb-16 md:mb-0 font-medium">

        <p>© 2026 MBM Students only. All rights reserved. T&C Applied.</p>

        <p className="text-[var(--neel)] font-bold">Developed by Vineet Kaler</p>

      </footer>



      {/* Modal: Add Friends Directory */}

      {showAddFriendModal && (

        <div className="fixed inset-0 z-50 bg-[#16213E]/55 backdrop-blur-sm flex items-center justify-center p-4 font-sans">

          <div className="max-w-md w-full rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-6 space-y-4 ">

            <div className="flex items-center justify-between">

              <h3 className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-2">

                <UserPlus className="w-4 h-4 text-[var(--neel)]" />

                <span>Registered MBM Students Directory</span>

              </h3>

              <button onClick={() => setShowAddFriendModal(false)} className="text-[var(--mute)] hover:text-[var(--ink)]">

                <X className="w-4 h-4" />

              </button>

            </div>



            <p className="text-[14px] text-[var(--mute)] font-medium">Select a registered student to send friend request:</p>



            <div className="max-h-60 overflow-y-auto space-y-2 text-[14px] font-semibold">

              {allRegisteredUsers.length === 0 ? (

                <p className="text-[var(--mute)] text-center py-6">No other registered students found.</p>

              ) : (

                allRegisteredUsers.map(user => (

                  <div key={user.id} className="p-3 rounded-[10px] bg-[var(--sunk)] border border-[var(--line)] flex items-center justify-between">

                    <div>

                      <div className="font-bold text-[var(--ink)]">{user.full_name || user.name || 'Student'}</div>

                      <div className="text-[12px] text-[var(--neel)] font-medium">{user.branch} • {user.year}</div>

                    </div>

                    <button onClick={() => handleSendFriendRequest(user)} className="px-3.5 py-1.5 btn-neel text-[var(--ink)] rounded-lg text-[12px] font-bold ">

                      Send Request

                    </button>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      )}



      {/* Modal: List Marketplace Item */}

      {showMarketModal && (

        <div className="fixed inset-0 z-50 bg-[#16213E]/55 backdrop-blur-sm flex items-center justify-center p-4 font-sans">

          <div className="max-w-md w-full rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-6 space-y-4 ">

            <div className="flex items-center justify-between">

              <h3 className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-2">

                <ShoppingBag className="w-4 h-4 text-[#1E7F5C]" />

                <span>List an Item for Sale / Exchange</span>

              </h3>

              <button onClick={() => setShowMarketModal(false)} className="text-[var(--mute)] hover:text-[var(--ink)]">

                <X className="w-4 h-4" />

              </button>

            </div>



            <div className="space-y-3 text-[14px] font-semibold">

              <div>

                <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Item Title</label>

                <input type="text" value={marketTitle} onChange={e => setMarketTitle(e.target.value)} placeholder="e.g. Mini Drafter, Casio FX-991EX" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--neel)] font-sans" />

              </div>

              <div className="grid grid-cols-2 gap-2">

                <div>

                  <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Price</label>

                  <input type="text" value={marketPrice} onChange={e => setMarketPrice(e.target.value)} placeholder="₹250 or Free" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--neel)] font-sans" />

                </div>

                <div>

                  <label className="text-[var(--mute)] text-[12.5px] mb-1 block font-medium">Category</label>

                  <select value={marketCategory} onChange={e => setMarketCategory(e.target.value)} className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-2 py-2.5 text-[var(--ink)] text-[14px] outline-none font-sans">

                    <option value="Drafters & Tools">Drafters & Tools</option>

                    <option value="Calculators">Calculators</option>

                    <option value="Books & Notes">Books & Notes</option>

                    <option value="Lab Aprons">Lab Aprons</option>

                  </select>

                </div>

              </div>

              <button onClick={handleCreateMarketItem} className="w-full py-3 btn-neel text-[var(--ink)] font-bold rounded-lg mt-2 ">Post Listing</button>

            </div>

          </div>

        </div>

      )}



      {/* Modal: Post Event */}

      {showEventModal && (

        <div className="fixed inset-0 z-50 bg-[#16213E]/55 backdrop-blur-sm flex items-center justify-center p-4 font-sans">

          <div className="max-w-md w-full rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-6 space-y-4 ">

            <div className="flex items-center justify-between">

              <h3 className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-2">

                <Calendar className="w-4 h-4 text-[var(--neel)]" />

                <span>Post University Event</span>

              </h3>

              <button onClick={() => setShowEventModal(false)} className="text-[var(--mute)] hover:text-[var(--ink)]"><X className="w-4 h-4" /></button>

            </div>

            <div className="space-y-3 text-[14px] font-semibold">

              <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event Title" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[var(--ink)] outline-none font-sans" />

              <input type="text" value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="Date & Timing" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[var(--ink)] outline-none font-sans" />

              <input type="text" value={eventVenue} onChange={e => setEventVenue(e.target.value)} placeholder="Venue" className="w-full bg-[var(--sunk)] border border-[var(--line)] rounded-lg px-3.5 py-2.5 text-[var(--ink)] outline-none font-sans" />

              <button onClick={handleCreateEvent} className="w-full py-3 btn-neel text-[var(--ink)] font-bold rounded-lg mt-2 ">Announce Event</button>

            </div>

          </div>

        </div>

      )}



    </div>

  );

}

