import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { io, Socket } from "socket.io-client";
import { Send, UserPlus, Sparkles, Reply, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SharedBoard() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchBoard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBoard(data);
      // Load historical messages from the DB (stored in canvasState)
      let savedMessages: any[] = [];
      if (data.canvasState && Array.isArray(data.canvasState)) {
        // Filter out legacy Excalidraw elements, only keep actual messages
        savedMessages = data.canvasState.filter((msg: any) => msg && msg.content && msg.user);
      }
      setMessages(savedMessages);
    } catch (error) {
      console.error(error);
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
      console.log('Socket connected, joining board:', boardId);
      socket.emit('join-board', boardId);
    });

    if (socket.connected) {
      console.log('Socket already connected, joining board:', boardId);
      socket.emit('join-board', boardId);
    }

    socket.on('chat-message', (msg: any) => {
      console.log('Received chat message:', msg);
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
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionName: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = messageInput.slice(0, cursorPosition);
    const textAfterCursor = messageInput.slice(cursorPosition);
    
    const words = textBeforeCursor.split(/\s+/);
    words.pop(); // remove the partial @mention
    
    const newTextBefore = (words.length > 0 ? words.join(' ') + ' ' : '') + `@${mentionName} `;
    
    setMessageInput(newTextBefore + textAfterCursor);
    setShowMentions(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newTextBefore.length, newTextBefore.length);
      }
    }, 0);
  };

  const getMentionOptions = () => {
    const members = board?.workspace?.members?.map((m: any) => m.user.email.split('@')[0]) || [];
    const options = ['ai', ...members];
    return options.filter(opt => opt.toLowerCase().includes(mentionFilter));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content: messageInput,
      user: { email: user?.email || "Unknown" },
      createdAt: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        userEmail: replyingTo.user?.email || "Unknown",
        content: replyingTo.content
      } : null
    };
    
    // Add locally for instant UI update
    setMessages(prev => [...prev, newMessage]);
    
    if (messageInput.toLowerCase().includes('@ai')) {
      setIsAiTyping(true);
    }
    
    // Send over socket
    if (socketRef.current) {
      socketRef.current.emit('chat-message', { boardId, message: newMessage });
    }
    
    setMessageInput("");
    setReplyingTo(null);
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
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to invite user");
      } else {
        alert("User invited successfully!");
        setIsInviteOpen(false);
        setInviteEmail("");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to invite user");
    }
  };

  if (loading) {
    return <div className="flex-1 w-full bg-[#0a0a0a] flex items-center justify-center"><Skeleton className="w-16 h-16 rounded-full opacity-20" /></div>;
  }

  if (!board) {
    return <div className="flex-1 w-full bg-[#0a0a0a] text-white p-10 flex items-center justify-center text-gray-500">Workspace not found.</div>;
  }

  return (
    <div className="flex-1 w-full h-[calc(100vh-73px)] bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#222] flex items-center justify-between shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md relative z-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#EAEAEA] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {board.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1">AI-Powered Team Workspace</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#333] text-white bg-transparent hover:bg-white/5 transition-all">
              <UserPlus className="w-4 h-4 mr-2" /> Invite Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#161616] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Invite to Workspace</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter their email address to invite them to this workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="bg-[#0a0a0a] border-[#333] text-white focus-visible:ring-purple-500"
              />
            </div>
            <DialogFooter>
              <Button 
                className="bg-white text-black hover:bg-gray-200"
                onClick={handleInvite}
              >
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Area - Saved Screens */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-200">Saved Screens</h2>
            <span className="text-sm text-gray-500">{board.screens?.length || 0} screens</span>
          </div>
          
          {board.screens && board.screens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {board.screens.map((item: any) => (
                <div key={item.id} className="group relative rounded-xl overflow-hidden border border-[#222] bg-[#111] hover:border-[#444] transition-colors">
                  <div className="aspect-[9/19] w-full bg-black relative">
                    <img 
                      src={item.screen.imageUrl.startsWith('http') ? item.screen.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${item.screen.imageUrl}`}
                      alt={item.screen.name || "Screen"}
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="p-3 border-t border-[#222]">
                    <p className="text-sm font-medium text-gray-300 truncate">{item.screen.name || "Untitled Screen"}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.screen.app?.name || "App"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-2xl">+</span>
              </div>
              <p className="text-lg">No screens saved yet</p>
              <p className="text-sm mt-1">Browse the library and save screens to this workspace</p>
            </div>
          )}
        </div>

        {/* Right Area - Chat */}
        <div className="w-[350px] lg:w-[400px] flex flex-col border-l border-[#222] bg-[#0d0d0d] relative shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Sparkles className="w-12 h-12 mb-4 text-purple-400" />
            <p className="text-lg">Welcome to the workspace!</p>
            <p className="text-sm">Start chatting with your team or tag <span className="text-purple-400 font-semibold">@ai</span> for AI assistance.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const email = msg?.user?.email || "Unknown";
            const isMe = email === user?.email;
            const isAI = email === "Baselyn AI";
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {isAI ? (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3 h-3" /> Baselyn AI
                      </span>
                    ) : (
                      email.split('@')[0]
                    )}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="relative group flex items-start gap-2">
                  {isMe && (
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#333] rounded-full transition-all mt-1"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl max-w-xs md:max-w-md lg:max-w-lg shadow-sm ${
                      isAI 
                        ? 'bg-purple-900/20 border border-purple-500/30 text-purple-50 rounded-tl-sm'
                        : isMe 
                          ? 'bg-[#2a2a2a] text-gray-100 rounded-tr-sm border border-[#333]' 
                          : 'bg-[#1a1a1a] text-gray-200 rounded-tl-sm border border-[#222]'
                    }`}
                  >
                    {msg.replyTo && (
                      <div className="mb-2 pl-3 border-l-2 border-purple-500/50 bg-black/20 p-2 rounded-r-md text-xs">
                        <div className="text-purple-400 font-medium mb-1">
                          {(msg.replyTo.userEmail || "Unknown").split('@')[0]}
                        </div>
                        <div className="text-gray-400 line-clamp-2">
                          {msg.replyTo.content}
                        </div>
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:leading-snug prose-sm max-w-none">
                      <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => {
                          if (props.href?.startsWith('mention:')) {
                            return <span className="text-blue-400 font-medium bg-blue-500/10 px-1 py-0.5 rounded-md">{props.children}</span>;
                          }
                          return <a {...props} className="text-blue-400 hover:underline" />;
                        }
                      }}
                    >
                      {(msg.content || "").replace(/@([a-zA-Z0-9_.-]+)/g, '[@$1](mention:$1)')}
                    </ReactMarkdown>
                  </div>
                </div>
                {!isMe && (
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#333] rounded-full transition-all mt-1"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                )}
                </div>
              </div>
            );
          })
        )}
        
        {isAiTyping && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1 text-purple-400">
                <Sparkles className="w-3 h-3" /> Baselyn AI
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-purple-50 rounded-tl-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#222] shrink-0 relative">
        {replyingTo && (
          <div className="max-w-4xl mx-auto mb-2 relative">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-t-xl p-3 flex items-start justify-between">
              <div className="flex flex-col gap-1 pr-4 border-l-2 border-purple-500 pl-3">
                <span className="text-xs font-semibold text-purple-400">
                  Replying to {replyingTo.user?.email?.split('@')[0] || 'Unknown'}
                </span>
                <span className="text-sm text-gray-300 line-clamp-1">{replyingTo.content}</span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-gray-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {showMentions && getMentionOptions().length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#111]">
              Mentions
            </div>
            <div className="max-h-48 overflow-y-auto">
              {getMentionOptions().map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertMention(opt)}
                  className="w-full text-left px-4 py-2.5 hover:bg-purple-500/20 hover:text-purple-300 text-gray-200 transition-colors flex items-center gap-2"
                >
                  {opt === 'ai' ? <Sparkles className="w-3.5 h-3.5 text-purple-400" /> : <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">{opt.charAt(0).toUpperCase()}</div>}
                  <span className="font-medium">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Sparkles className="h-5 w-5 text-gray-500" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message or tag @ai to ask the AI..."
            className="w-full bg-[#161616] border-[#333] text-white pl-10 pr-12 py-6 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500 shadow-inner"
          />
          <Button 
            type="submit" 
            size="icon"
            className="absolute inset-y-1.5 right-1.5 h-auto bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            disabled={!messageInput.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
        </div>
      </div>
    </div>
  );
}
