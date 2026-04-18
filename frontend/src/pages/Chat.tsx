import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

interface Msg { role: 'user' | 'assistant'; content: string; timestamp: string; }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/chat/history/').then(r => setMessages(r.data)).catch(() => {});
  }, []);

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
      const botMsg: Msg = { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
      setMessages(m => [...m, botMsg]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: '⚠️ Błōnd połōnczynio. Sprōbuj jeszcze roz.', timestamp: new Date().toISOString() }]);
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

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🗣️ Sznelk — Ślōnski Asystent Tauron</h1>
          <p style={s.sub}>Godej ze mnom po śląsku — pyto mie o prōnd, rachunki i jak oszczyndować!</p>
        </div>
        <button onClick={clearHistory} disabled={clearing} style={s.clearBtn}>
          {clearing ? 'Kasuje...' : '🗑️ Wyczyść'}
        </button>
      </div>

      <div style={s.chatWindow}>
        {messages.length === 0 && (
          <div style={s.welcome}>
            <div style={{ fontSize: 56 }}>⚡</div>
            <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: 18 }}>Serwus! Jo je Sznelk!</p>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Twōj ślōnski asystent energetyczny od Tauron.<br />Pyto mie o rachunki, taryfy i jak oszczyndować prōnd!</p>
            <div style={s.suggestions}>
              {['Jako taryfa je nojlypszo dla mie?', 'Jak mogã oszczyndować prōnd?', 'Co to je taryfa G12?', 'Mōj rachunyk je za wysoki'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} style={s.suggBtn}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ ...s.msgRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && <div style={s.avatar}>⚡</div>}
            <div style={msg.role === 'user' ? s.userBubble : s.botBubble}>
              <div style={s.bubbleText}>{msg.content}</div>
              <div style={s.timestamp}>{new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
            <div style={s.avatar}>⚡</div>
            <div style={s.botBubble}><div style={s.typing}><span/><span/><span/></div></div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <textarea
          style={s.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Napisz wiadomość... (Enter = wyślij, Shift+Enter = nowa linia)"
          rows={2}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={s.sendBtn}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        div[data-typing] span { display:inline-block; width:6px; height:6px; background:#64748b; border-radius:50%; margin:0 2px; animation:bounce 1.4s infinite ease-in-out; }
        div[data-typing] span:nth-child(2){animation-delay:.16s}
        div[data-typing] span:nth-child(3){animation-delay:.32s}
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 },
  sub: { color: '#64748b', fontSize: 13, marginTop: 4 },
  clearBtn: { background: 'none', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  chatWindow: { flex: 1, overflowY: 'auto', background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  welcome: { textAlign: 'center', padding: '40px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
  suggBtn: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  avatar: { width: 32, height: 32, background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 },
  userBubble: { background: '#1d4ed8', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', maxWidth: '75%' },
  botBubble: { background: '#1e293b', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', maxWidth: '75%', border: '1px solid #334155' },
  bubbleText: { color: '#f1f5f9', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  timestamp: { color: '#475569', fontSize: 11, marginTop: 4, textAlign: 'right' },
  typing: { display: 'flex', gap: 4, alignItems: 'center', height: 20 },
  inputRow: { display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-end' },
  textarea: { flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit' },
  sendBtn: { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 10, width: 44, height: 44, fontSize: 18, cursor: 'pointer', fontWeight: 700, flexShrink: 0 },
};
