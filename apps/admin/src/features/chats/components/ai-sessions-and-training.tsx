import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Bot, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1`;

export function AiSessionsAndTraining() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/ai/admin/chats`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) {
          setSelectedSession(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching AI chat sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDataset = async () => {
    try {
      setExporting(true);
      const res = await fetch(`${API_URL}/ai/training/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ux_ai_training_dataset_${Date.now()}.jsonl`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Error exporting dataset:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <h1 className="text-lg font-semibold">AI Sessions & Model Training</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button 
            onClick={handleExportDataset}
            disabled={exporting}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Exporting...' : 'Export Training Dataset (.jsonl)'}</span>
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="flex h-full gap-6">
          {/* Sessions List */}
          <div className="w-1/3 flex flex-col gap-4 border-r pr-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">User Chat Sessions</h2>
              <p className="text-xs text-muted-foreground">
                Continuous sessions saved in Supabase & cached via Redis.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-sm text-muted-foreground py-6 text-center">Loading live sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No AI sessions recorded yet.</div>
              ) : (
                sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                        isSelected ? 'bg-accent border-purple-500/50' : 'hover:bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="truncate">{session.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {session.messages?.length || 0} msgs
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{session.user?.email || 'Anonymous'}</span>
                        <span>{session.totalTokens} tokens</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Conversation Inspection & Feedback */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {selectedSession ? (
              <div className="flex-1 flex flex-col h-full">
                <div className="pb-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{selectedSession.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      User: {selectedSession.user?.email} • Model: {selectedSession.model} • Total Tokens: {selectedSession.totalTokens}
                    </p>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Fine-Tuning Ready
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {selectedSession.messages?.map((msg: any) => {
                    const isUser = msg.role === 'USER';
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg border ${
                          isUser ? 'bg-muted/30 ml-8 border-border' : 'bg-card mr-8 border-purple-900/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className={isUser ? 'text-blue-400' : 'text-purple-400'}>
                            {isUser ? 'USER PROMPT' : 'ASSISTANT (CLAUDE)'}
                          </span>
                          <span className="text-muted-foreground font-normal">
                            {msg.totalTokens} tokens
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

                        {/* Designer Feedback Pill */}
                        {msg.feedbacks && msg.feedbacks.length > 0 && (
                          <div className="mt-3 pt-2 border-t flex items-center gap-2 text-xs">
                            {msg.feedbacks[0].rating === 1 ? (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> Designer Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3" /> Correction: {msg.feedbacks[0].correctionText}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a session from the left to inspect conversation turns and training tags.
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  );
}

