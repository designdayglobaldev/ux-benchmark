import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { io, Socket } from "socket.io-client";
import { Send, Sparkles, X, MessageSquare, Plus } from "lucide-react";
import revolutImg from "@/assets/Revolut.png";
import canvasImg from "@/assets/Canvas.png";
import authImg from "@/assets/auth.png";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ScreenActionOverlay } from "@/components/ScreenActionOverlay";

interface ScreenCardItem {
  id: string;
  name: string;
  appName: string;
  imageUrl: string;
  appLogo?: string;
}

interface TagPerson {
  id: string;
  name: string;
  tag: string;
  initial: string;
  bg: string;
}

const formatMemberName = (email?: string) => {
  if (!email) return "Member";
  const knownNames: Record<string, string> = {
    'satyajitpujapanda9@gmail.com': 'Satyajit Pujapanda',
    'pujapandasatyajit@gmail.com': 'Satyajit Pujapanda',
    'shyamsundarpujapanda998@gmail.com': 'Shyam Sundar',
    'sanand@designday.net': 'Sanand',
    'harshadachapre1@gmail.com': 'Harshada Chapre',
    'sriramganji1@gmail.com': 'Sriram Ganji',
    'jayakiruthika01@gmail.com': 'Jaya Kiruthika',
    'admin@designday.io': 'DesignDay Admin'
  };
  const lower = email.toLowerCase().trim();
  if (knownNames[lower]) return knownNames[lower];

  const username = lower.split('@')[0];
  const cleaned = username
    .replace(/[0-9]/g, '')
    .split(/[._-]/)
    .filter(Boolean)
    .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
  return cleaned || username;
};

export function SharedBoard() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Comments sidebar toggle (open by default if requested or toggled)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Chat & Socket States
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tagging Popup Menu State
  const [showTagMenu, setShowTagMenu] = useState(false);

  // Real Collaborators for Tagging (derived dynamically from board workspace & team)
  const tagPeople: TagPerson[] = useMemo(() => {
    const avatarColors = [
      "bg-[#D95B96] text-black",
      "bg-[#D87D60] text-black",
      "bg-[#4D67E8] text-black",
      "bg-[#10B981] text-black",
      "bg-[#F59E0B] text-black",
      "bg-[#8B5CF6] text-black"
    ];

    const workspaceMembers: any[] = board?.workspace?.members || [];
    const memberItems = workspaceMembers
      .map((m: any) => ({
        id: m.id || m.userId,
        email: m.user?.email || ""
      }))
      .filter((m: any) => m.email);

    let targetList = memberItems.filter((m: any) => m.email.toLowerCase() !== user?.email?.toLowerCase());

    // Fallback: Real registered team members from database (excluding logged-in user)
    if (targetList.length === 0) {
      targetList = [
        { id: 'u1', email: 'satyajitpujapanda9@gmail.com' },
        { id: 'u2', email: 'shyamsundarpujapanda998@gmail.com' },
        { id: 'u3', email: 'sanand@designday.net' },
        { id: 'u4', email: 'harshadachapre1@gmail.com' }
      ].filter((m: any) => m.email.toLowerCase() !== user?.email?.toLowerCase());
    }

    return targetList.slice(0, 3).map((m: any, idx: number) => {
      const fullName = formatMemberName(m.email);
      const firstName = fullName.split(' ')[0] || "User";
      return {
        id: m.id || String(idx),
        name: fullName,
        tag: `@${firstName}`,
        initial: fullName.charAt(0).toUpperCase(),
        bg: avatarColors[idx % avatarColors.length]
      };
    });
  }, [board, user]);

  // Real app logos lookup helper
  const KNOWN_APP_LOGOS: Record<string, string> = {
    'apple wallet': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/i4wo3nxjyv_1788262651909.png',
    'cash app': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/vfndfu484p_1788242865874.png',
    'arc search': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/66igs2o3dg8_1786002742119.png',
    'revolut': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/pyqa9pu2u_1784804766435.png',
    'spotify': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/ru1sb2knryi_1785910356620.png',
    'paypal': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/uvahlzu9d8_1787635182927.png',
    'duolingo': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/u9kv4fuitrd_1785833521466.png',
    'linear': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/1glgk4cbk6w_1790745911146.png',
    'airtable': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/y7wu4bm2muo_1791783507995.webp',
    'brex': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/5iez00nzfzs_1791195525381.webp',
    'coinbase wallet': 'https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/2xx4j1q8zkb_1787840983555.png'
  };

  const resolveAppLogo = (app: any) => {
    if (!app) return undefined;
    const nameKey = (app.name || "").trim().toLowerCase();
    const slugKey = (app.slug || "").trim().toLowerCase();
    
    let logo = app.appLogo || app.appThumbnail || app.logoUrl || KNOWN_APP_LOGOS[nameKey] || KNOWN_APP_LOGOS[slugKey];
    if (logo && !logo.startsWith('http') && !logo.startsWith('data:')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      logo = `${apiUrl}${logo.startsWith('/') ? '' : '/'}${logo}`;
    }
    return logo;
  };

  // Helper to extract a Date object from a message
  const getMessageDate = (msg: any): Date | null => {
    if (msg.createdAt) {
      const d = new Date(msg.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (msg.id && !isNaN(Number(msg.id)) && Number(msg.id) > 1000000000000) {
      const d = new Date(Number(msg.id));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // WhatsApp-style date badge formatter
  const formatWhatsAppDate = (date: Date): string => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, now)) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return "Yesterday";

    // Within last 6 days: show weekday name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }

    // Older: format like "14 October 2026" or "14 Oct 2026"
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Sample screens matching real app logos
  const defaultScreens: ScreenCardItem[] = [
    {
      id: "s1",
      name: "Searching & Finding",
      appName: "Apple Wallet",
      imageUrl: revolutImg,
      appLogo: KNOWN_APP_LOGOS['apple wallet']
    },
    {
      id: "s2",
      name: "Pre-Onboarding 1",
      appName: "Cash App",
      imageUrl: canvasImg,
      appLogo: KNOWN_APP_LOGOS['cash app']
    },
    {
      id: "s3",
      name: "Welcome Screen",
      appName: "Arc Search",
      imageUrl: authImg,
      appLogo: KNOWN_APP_LOGOS['arc search']
    },
    {
      id: "s4",
      name: "Home Dashboard",
      appName: "Revolut",
      imageUrl: canvasImg,
      appLogo: KNOWN_APP_LOGOS['revolut']
    },
    {
      id: "s5",
      name: "Issue Tracker",
      appName: "Linear",
      imageUrl: revolutImg,
      appLogo: KNOWN_APP_LOGOS['linear']
    }
  ];

  // Default demo messages with real team members
  const initialDemoMessages = [
    {
      id: "d1",
      content: "Hi",
      user: { email: user?.email || "You" },
      time: "9:00 AM",
      isMe: true
    },
    {
      id: "d2",
      content: "Hello!",
      user: { email: "satyajitpujapanda9@gmail.com" },
      time: "9:00 AM",
      isMe: false
    },
    {
      id: "d3",
      content: "what do you think bout the box-box club dashboard",
      user: { email: user?.email || "You" },
      time: "9:00 AM",
      isMe: true
    },
    {
      id: "d4",
      content: "@ai analyse the box box club dashboard for me.",
      user: { email: "satyajitpujapanda9@gmail.com" },
      time: "9:00 AM",
      isMe: false
    }
  ];

  const fetchBoard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/boards/${boardId}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
        if (data.canvasState && Array.isArray(data.canvasState)) {
          const savedMessages = data.canvasState
            .filter((msg: any) => msg && msg.content && msg.user && !msg.content.includes("Box Box Club dashboard highlights live telemetry"))
            .map((msg: any) => {
              let formattedTime = msg.time;
              if (!formattedTime && msg.createdAt) {
                try {
                  const d = new Date(msg.createdAt);
                  if (!isNaN(d.getTime())) {
                    formattedTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  }
                } catch {
                  formattedTime = undefined;
                }
              }
              return {
                ...msg,
                time: formattedTime
              };
            });
          if (savedMessages.length > 0) {
            setMessages(savedMessages);
          } else {
            setMessages(initialDemoMessages);
          }
        } else {
          setMessages(initialDemoMessages);
        }
      } else {
        // Fallback demo board
        setBoard({
          id: boardId || "dashboards",
          name: "Dashboards",
          screens: []
        });
        setMessages(initialDemoMessages);
      }
    } catch {
      setBoard({
        id: boardId || "dashboards",
        name: "Dashboards",
        screens: []
      });
      setMessages(initialDemoMessages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const socket = io(apiUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-board', boardId);
    });

    socket.on('chat-message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      if (msg.user?.email === 'Baselyn AI') {
        setIsAiTyping(false);
      }
    });

    socket.on('ai-typing', () => {
      setIsAiTyping(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [boardId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const text = messageInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isAiMention = text.toLowerCase().includes('@ai');

    const newMessage = {
      id: Date.now().toString(),
      content: text,
      user: { email: user?.email || "You" },
      time: timeStr,
      isMe: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");
    setShowTagMenu(false);

    if (isAiMention) {
      setIsAiTyping(true);
      // Failsafe timeout to hide typing indicator if server doesn't respond
      setTimeout(() => {
        setIsAiTyping(false);
      }, 25000);
    }

    if (socketRef.current) {
      socketRef.current.emit('chat-message', { boardId, message: newMessage });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    // Show menu ONLY when actively typing a mention (e.g. '@' or '@name' without a space after it)
    const isTypingMention = /(?:^|\s)@([a-zA-Z0-9_]*)$/.test(val);
    setShowTagMenu(isTypingMention);
  };

  const selectMention = (tag: string) => {
    // Replace the trailing '@...' query with tag + space
    const atIdx = messageInput.lastIndexOf('@');
    let nextVal = '';
    if (atIdx !== -1) {
      nextVal = messageInput.substring(0, atIdx) + tag + ' ';
    } else {
      nextVal = messageInput + tag + ' ';
    }
    setMessageInput(nextVal);
    setShowTagMenu(false);
    
    // Focus the input back without triggering reopen
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !board?.workspaceId) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/workspaces/${board.workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.ok) {
        setIsInviteOpen(false);
        setInviteEmail("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Build screens list: use real saved screens or fallback to the screenshot screens
  const displayedScreens: ScreenCardItem[] = (board?.screens && board.screens.length > 0)
    ? board.screens.map((item: any) => ({
        id: item.id,
        name: item.screen?.name || "Screen",
        appName: item.screen?.app?.name || "App",
        imageUrl: item.screen?.imageUrl?.startsWith('http')
          ? item.screen.imageUrl
          : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${item.screen?.imageUrl?.startsWith('/') ? '' : '/'}${item.screen?.imageUrl}`,
        appLogo: resolveAppLogo(item.screen?.app)
      }))
    : defaultScreens;

  const totalItemsCount = displayedScreens.length;

  return (
    <div className="flex-1 w-full bg-[#0A0A0A] text-white flex min-h-[calc(100vh-64px)] relative">
      
      {/* Left Column (Header + Grid): Dynamically pushes when Comments opens */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        
        {/* Top Header Section - Pushes with grid */}
        <div className="w-full px-6 sm:px-10 lg:px-14 pt-8 pb-6 border-b border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 transition-all duration-300">
          <div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 sm:h-9 w-48 bg-[#1A1A1A] rounded-lg" />
                <Skeleton className="h-3.5 w-20 bg-[#141414] rounded" />
              </div>
            ) : (
              <>
                <h1 className="text-[28px] sm:text-[32px] font-semibold text-white tracking-tight">
                  {board?.name || "Dashboards"}
                </h1>
                <p className="text-[#888888] text-[13px] mt-1 font-normal">
                  {totalItemsCount} items
                </p>
              </>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3.5 self-start sm:self-auto">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  <Skeleton className="w-7 h-7 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A]" />
                  <Skeleton className="w-7 h-7 rounded-full bg-[#222222] border-2 border-[#0A0A0A]" />
                </div>
                <Skeleton className="h-3.5 w-24 bg-[#141414] rounded hidden sm:inline-block" />
              </div>
            ) : (
              /* Collaborator Avatars */
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  {tagPeople.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[11px] font-semibold",
                        p.bg
                      )}
                      title={p.name}
                    >
                      {p.initial}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-[#888888] font-normal hidden sm:inline">
                  {tagPeople.length + 1} Collaborators
                </span>
              </div>
            )}

            {/* + Invite People Button */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={loading}
                  className="bg-white hover:bg-neutral-200 text-black text-[13px] font-medium px-3.5 py-1.5 h-[34px] rounded-[8px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite People</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-[#141414] border border-[#2A2A2A] text-white rounded-2xl p-6 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-white">Invite to Collection</DialogTitle>
                  <DialogDescription className="text-xs text-[#888888] mt-1">
                    Invite teammates to collaborate, review, and leave comments on this board.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="bg-[#222222] border-[#333333] text-white rounded-lg h-[42px] px-3.5 text-sm focus:border-[#555] focus:outline-none"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleInvite}
                    className="bg-white text-black hover:bg-neutral-200 text-xs font-medium h-[38px] px-4 rounded-lg"
                  >
                    Send Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Comments Sidebar Toggle Button with Red 9+ Badge (Shown when sidebar is closed) */}
            {!isCommentsOpen && (
              <button
                type="button"
                onClick={() => setIsCommentsOpen(true)}
                aria-label="Open Comments"
                className="w-9 h-9 rounded-full border bg-[#161616] border-[#2A2A2A] text-[#888888] hover:text-white hover:border-[#444] flex items-center justify-center transition-all cursor-pointer relative"
              >
                <MessageSquare className="w-4 h-4" />
                {/* 9+ Badge */}
                <span className="absolute -top-1 -right-1 bg-[#E53E3E] text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-black leading-none">
                  9+
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Left Screen Grid Area */}
        <div className="flex-1 px-6 sm:px-10 lg:px-14 py-8 transition-all duration-300 ease-in-out">
          {loading ? (
            <div className={cn(
              "grid gap-4 lg:gap-5 w-full transition-all duration-300",
              isCommentsOpen 
                ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            )}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="aspect-[9/19.5] w-full bg-[#121212] rounded-[24px] sm:rounded-[28px] border-[3px] border-[#202020] p-4 flex flex-col">
                    <Skeleton className="flex-1 w-full rounded-2xl bg-[#1A1A1A]" />
                  </div>
                  <div className="mt-3 flex items-center gap-2.5 px-1">
                    <Skeleton className="w-6 h-6 rounded-[6px] bg-[#1A1A1A] shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-28 bg-[#1A1A1A] rounded" />
                      <Skeleton className="h-2.5 w-16 bg-[#141414] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "grid gap-4 lg:gap-5 w-full transition-all duration-300 ease-in-out",
              isCommentsOpen 
                ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            )}>
              {displayedScreens.map((screen) => (
                <div key={screen.id} className="flex flex-col group cursor-pointer">
                  {/* Phone Device Frame - Clean screenshot with top-right action overlay on hover */}
                  <div className="relative aspect-[9/19.5] w-full bg-black rounded-[24px] sm:rounded-[28px] border-[3px] border-[#202020] shadow-[0_12px_36px_rgba(0,0,0,0.85)] overflow-hidden group-hover:border-[#383838] transition-all">
                    <img 
                      src={screen.imageUrl} 
                      alt={screen.name} 
                      className="w-full h-full object-cover object-top select-none transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Top-Right Hover Action Overlay (Bookmark/Collections & Copy) */}
                    <ScreenActionOverlay 
                      screenId={screen.id}
                      imageUrl={screen.imageUrl}
                      screenName={screen.name}
                      appName={screen.appName}
                    />
                  </div>

                  {/* Below Card Details */}
                  <div className="mt-3 flex items-center gap-2.5 px-1">
                    {/* Real App Logo */}
                    <div className="w-6 h-6 rounded-[6px] bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {screen.appLogo ? (
                        <img 
                          src={screen.appLogo} 
                          alt={screen.appName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center text-[10px] font-bold text-white">
                          {screen.appName[0]}
                        </div>
                      )}
                    </div>

                    {/* Screen Title & App Name */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white text-[13px] font-medium leading-tight truncate group-hover:text-neutral-200 transition-colors">
                        {screen.name}
                      </h4>
                      <p className="text-[#888888] text-[11px] leading-tight truncate mt-0.5 font-normal">
                        {screen.appName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Comments Sidebar - Sticky to viewport below Navbar */}
      {isCommentsOpen && (
        <aside className="w-[330px] sm:w-[370px] bg-[#121212] border-l border-[#202020] flex flex-col shrink-0 sticky top-[64px] h-[calc(100vh-64px)] shadow-2xl z-30 transition-all duration-300">
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#202020] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#E53E3E] text-white text-[10px] font-bold flex items-center justify-center">
                9+
              </div>
              <h3 className="text-white font-medium text-[14px]">
                Comments
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCommentsOpen(false)}
              className="text-[#888888] hover:text-white transition-colors p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => {
              const isMe = msg.isMe ?? (msg.user?.email === user?.email);
              const isAI = msg.isAI || msg.user?.email === 'Baselyn AI';
              const senderName = isMe ? "You" : (msg.user?.email ? formatMemberName(msg.user.email) : "Teammate");
              
              const currentDate = getMessageDate(msg);
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const prevDate = prevMsg ? getMessageDate(prevMsg) : null;

              // Check if we should render a WhatsApp-style date badge
              let showDateSeparator = false;
              if (currentDate) {
                if (!prevDate) {
                  showDateSeparator = true;
                } else {
                  showDateSeparator =
                    currentDate.getFullYear() !== prevDate.getFullYear() ||
                    currentDate.getMonth() !== prevDate.getMonth() ||
                    currentDate.getDate() !== prevDate.getDate();
                }
              }

              let timeText = msg.time;
              if (!timeText && currentDate) {
                timeText = currentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              }
              if (!timeText) {
                timeText = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              }

              return (
                <div key={msg.id || idx} className="space-y-3">
                  {/* WhatsApp-style Date Separator Badge */}
                  {showDateSeparator && currentDate && (
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-[#1C1C1C] text-[#8E8E93] border border-[#2E2E2E] text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-xs select-none uppercase tracking-wide">
                        {formatWhatsAppDate(currentDate)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-3.5 py-2.5 text-[13px] leading-relaxed max-w-[85%] shadow-sm",
                      isMe 
                        ? "bg-[#7a3b1a] text-white rounded-2xl rounded-tr-sm" 
                        : isAI 
                          ? "bg-[#1E1624] text-purple-200 border border-purple-500/30 rounded-2xl rounded-tl-sm"
                          : "bg-white text-black rounded-2xl rounded-tl-sm"
                    )}>
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="attached" 
                          className="rounded-xl max-h-48 w-full object-cover mb-2 border border-white/10" 
                        />
                      )}
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    </div>

                    {/* Sender and Timestamp Label */}
                    <span className="text-[10px] text-[#777777] mt-1 px-1">
                      {senderName} • {timeText}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI Agent Running Indicator */}
            {isAiTyping && (
              <div className="flex items-center gap-1.5 pt-1 text-[#d670c5]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[12px] italic">Agent running...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar at Bottom */}
          <div className="p-4 border-t border-[#202020] bg-[#121212] relative">
            {/* Tagging / Copilot Popup Menu */}
            {showTagMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowTagMenu(false)} 
                />
                <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-[#212121] border border-[#303030] rounded-3xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {/* Copilot */}
                <button
                  type="button"
                  onClick={() => selectMention("@ai")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#2C2C2C] rounded-2xl text-left transition-colors cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-white shrink-0" />
                  <div className="flex items-center gap-2 text-[14px]">
                    <span className="text-white font-normal">Copilot</span>
                    <span className="text-[#777777] text-[13px]">Ask anything to ai</span>
                  </div>
                </button>

                {/* Divider */}
                <div className="border-t border-[#2E2E2E] my-2" />

                {/* Tag people Section */}
                <div className="text-[#777777] text-[13px] px-3 py-1 font-normal">
                  Tag people
                </div>

                <div className="space-y-0.5 mt-1">
                  {tagPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => selectMention(person.tag)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#2C2C2C] rounded-2xl text-left transition-colors cursor-pointer group"
                    >
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0", person.bg)}>
                        {person.initial}
                      </div>
                      <span className="text-white text-[14px]">{person.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

            <form 
              onSubmit={handleSendMessage}
              className="w-full bg-[#1A1A1A] border border-[#2B2B2B] rounded-full pl-4 pr-2.5 py-2 flex items-center justify-between gap-2 shadow-inner focus-within:border-[#444] transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onFocus={() => {
                  if (/(?:^|\s)@([a-zA-Z0-9_]*)$/.test(messageInput)) {
                    setShowTagMenu(true);
                  }
                }}
                placeholder="Type something.."
                className="bg-transparent text-[13px] text-white placeholder-[#666666] focus:outline-none flex-1 min-w-0"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-7 h-7 rounded-full bg-transparent hover:bg-white/10 text-[#888888] hover:text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </aside>
      )}
    </div>
  );
}
