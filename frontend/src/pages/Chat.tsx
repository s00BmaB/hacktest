import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import Navbar from '@/components/Navbar';
import { BoltIcon, ChatIcon, SendIcon, TrashIcon, AlertIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Msg { role: 'user' | 'assistant'; content: string; timestamp: string; }

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) api.get('/chat/history/').then(r => setMessages(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const { data } = await api.post('/chat/send/', { message: text });
      setMessages(m => [...m, { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Błōnd połōnczynio. Sprōbuj jeszcze roz.', timestamp: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  const clearHistory = async () => {
    if (!confirm('Usunąć całą historię czatu?')) return;
    setClearing(true);
    await api.delete('/chat/clear/');
    setMessages([]);
    setClearing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    'Jako taryfa je nojlypszo dla mie?',
    'Jak mogã oszczyndować prōnd?',
    'Co to je taryfa G12?',
    'Mōj rachunyk je za wysoki',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ChatIcon size={24} className="text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Sznelk <span className="text-primary">—</span> Ślōnski Asystent
              </h1>
            </div>
            <p className="text-muted-foreground">
              Godej ze mnom po śląsku — pyto mie o prōnd, rachunki i jak oszczyndować!
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={clearing || messages.length === 0}
            className="gap-2 text-muted-foreground"
          >
            <TrashIcon size={16} />
            <span className="hidden sm:inline">{clearing ? 'Kasuje...' : 'Wyczyść'}</span>
          </Button>
        </motion.div>

        {/* Chat Window */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 glass glass-border rounded-xl overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl">
                    <BoltIcon size={40} className="text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-primary mb-2">Serwus! Jo je Sznelk!</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Twōj ślōnski asystent energetyczny od Tauron.<br />
                  Pyto mie o rachunki, taryfy i jak oszczyndować prōnd!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map(q => (
                    <Button key={q} variant="outline" size="sm" onClick={() => setInput(q)} className="text-sm">
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <BoltIcon size={16} className="text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary border border-border rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content.includes('Błōnd') && (
                        <AlertIcon size={14} className="inline mr-1.5 text-destructive" />
                      )}
                      {msg.content}
                    </p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <BoltIcon size={16} className="text-primary-foreground" />
                </div>
                <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 sm:p-6">
            <div className="flex gap-3 items-end">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Napisz wiadomość... (Enter = wyślij, Shift+Enter = nowa linia)"
                rows={2}
                disabled={loading}
                className="flex-1 resize-none bg-input border-border min-h-[52px]"
              />
              <Button
                onClick={send}
                disabled={loading || !input.trim()}
                size="lg"
                className="h-[52px] w-[52px] p-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SendIcon size={20} />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
